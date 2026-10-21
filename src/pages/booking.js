import { formatPrice, formatDate } from "../data.js";
import { listTours, getTourById, isSellableTour } from "../tour-repository.js";
import { saveBooking, saveNotification, getSettings } from "../store.js";
import { syncNotificationBadge } from "../components/notification-bell.js";
import { imgFallback } from "../components/tour-card.js";
import { escapeHtml, isEmail, isName, isPhone } from "../validate.js";
import { getSession } from "../auth.js";
import {
  CHILD_PRICE_RATE,
  GROUP_MIN_PASSENGERS,
  MAX_PASSENGERS,
  bookingTotal,
  childPrice,
  futureDepartures,
  isFutureDeparture,
  normalizePassengers,
  seatLimit,
} from "../booking-rules.js";

/* Chỉ nhận lại các tham số cần giữ khi khách quay lại sau khi đăng nhập */
const RETURN_KEYS = ["tour", "date", "adults", "children", "people", "type"];

function returnNext(query) {
  const kept = new URLSearchParams();
  RETURN_KEYS.forEach((key) => {
    const value = query.get(key);
    if (value) kept.set(key, value);
  });
  const search = kept.toString();
  return search ? `booking?${search}` : "booking";
}

function LoginRequired(query) {
  const tour = getTourById(query.get("tour"));
  const nextQuery = encodeURIComponent(returnNext(query));

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Đặt chỗ</span>
      <h1>Đặt tour</h1>
      <p>Chỉ cần đăng nhập một lần, bạn có thể theo dõi trạng thái đơn đặt tour mọi lúc.</p>
    </div>
  </section>

  <section class="section container container-narrow">
    <div class="form-card login-card center">
      <div class="success-icon lock-icon">🔒</div>
      <h2>Vui lòng đăng nhập để đặt tour</h2>
      <p class="form-hint account-hint">
        ${
          tour
            ? `Bạn đang chọn <strong>${escapeHtml(tour.name)}</strong>. `
            : ""
        }
        Đăng nhập để lưu đơn vào tài khoản, theo dõi trạng thái xác nhận và thanh toán.
      </p>
      <ul class="track-benefits">
        <li>Theo dõi trạng thái đơn: chờ xác nhận, đã xác nhận, đã thanh toán.</li>
        <li>Hỗ trợ đặt tour cá nhân và tour theo đoàn linh hoạt cho doanh nghiệp, cơ quan.</li>
        <li>Lưu lịch sử đặt tour và thông tin hành khách trong một tài khoản.</li>
        <li>Nhận thông báo khi chuyên viên cập nhật đơn của bạn.</li>
      </ul>
      <div class="success-actions">
        <a class="btn btn-primary btn-lg" href="#/login?next=${nextQuery}">Đăng nhập</a>
        <a class="btn btn-outline btn-lg" href="#/register?next=${nextQuery}">Tạo tài khoản</a>
      </div>
      <p class="form-hint">Đăng nhập xong bạn sẽ được đưa lại đúng tour vừa chọn.</p>
    </div>
  </section>`;
}

function TourUnavailable(query) {
  const tour = getTourById(query.get("tour"));
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Đặt chỗ</span>
      <h1>Tour không còn nhận khách</h1>
      <p>Chuyến đi này đã ngừng bán nên không thể đặt thêm.</p>
    </div>
  </section>

  <section class="section container container-narrow">
    <div class="form-card center">
      <div class="success-icon">🚫</div>
      <h2>${escapeHtml(tour?.name || "Tour này")} đã ngừng bán</h2>
      <p class="form-hint">
        ${
          tour
            ? `Lịch trình vẫn còn ${tour.time} tại ${tour.location}. `
            : ""
        }
        Bạn có thể xem các tour đang mở bán khác hoặc liên hệ hotline để được tư vấn.
      </p>
      <div class="success-actions">
        <a class="btn btn-primary" href="#/tours">Xem tour đang bán</a>
        <a class="btn btn-outline" href="#/contact">Liên hệ tư vấn</a>
      </div>
    </div>
  </section>`;
}

export function Booking(path, params = {}, query = new URLSearchParams()) {
  const session = getSession();
  if (!session) return LoginRequired(query);

  const settings = getSettings();

  const requested = query.get("tour");
  if (requested) {
    const wanted = getTourById(requested);
    if (!wanted) return TourUnavailable(query);
    if (!isSellableTour(wanted)) return TourUnavailable(query);
  }

  /* Xác định hình thức đặt ban đầu từ query param */
  const initialType = query.get("type") === "group" ? "group" : "individual";
  const isGroup = initialType === "group";

  /* Chỉ mở form cho các tour còn nhận khách */
  const allTours = listTours().filter(isSellableTour);
  const tourOptions = allTours
    .map((tour) => `<option value="${tour.id}">${tour.name} - ${formatPrice(tour.price)}</option>`)
    .join("");

  const rawAdults = query.get("adults") ?? query.get("people");
  const rawChildren = query.get("children");

  let preselect;
  if (isGroup) {
    const adultsNum = Math.max(Number(rawAdults) || 12, 1);
    const childrenNum = Math.max(Number(rawChildren) || 0, 0);
    preselect = { adults: adultsNum, children: childrenNum, people: adultsNum + childrenNum };
  } else {
    preselect = normalizePassengers(rawAdults, rawChildren, MAX_PASSENGERS, "individual");
  }

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Đặt chỗ</span>
      <h1>Đặt tour</h1>
      <p>Chọn hình thức đặt cá nhân hoặc theo đoàn để nhận tư vấn phù hợp nhất.</p>
    </div>
  </section>

  <section class="section container booking-layout">
    <form class="form-card" id="booking-form" novalidate>
      <!-- Chọn hình thức đặt tour -->
      <div class="booking-type-selector">
        <label class="booking-type-heading">Hình thức đặt tour <span class="req">*</span></label>
        <div class="booking-type-grid" role="radiogroup" aria-label="Hình thức đặt tour">
          <label class="booking-type-option ${!isGroup ? "is-selected" : ""}" id="opt-individual">
            <input type="radio" name="bookingType" value="individual" ${!isGroup ? "checked" : ""}>
            <div class="booking-type-card-body">
              <span class="booking-type-badge">Tối đa 10 khách</span>
              <strong class="booking-type-title">👤 Đặt cá nhân / Gia đình</strong>
              <p class="booking-type-desc">Phù hợp cá nhân, gia đình, nhóm nhỏ. Giữ chỗ và nhận vé nhanh chóng.</p>
            </div>
          </label>

          <label class="booking-type-option ${isGroup ? "is-selected" : ""}" id="opt-group">
            <input type="radio" name="bookingType" value="group" ${isGroup ? "checked" : ""}>
            <div class="booking-type-card-body">
              <span class="booking-type-badge badge-group-highlight">Từ 11 khách trở lên</span>
              <strong class="booking-type-title">👥 Đặt theo đoàn / Doanh nghiệp</strong>
              <p class="booking-type-desc">Một đơn duy nhất cho cả đoàn. Chuyên viên sẽ liên hệ xác nhận số chỗ & báo giá ưu đãi.</p>
            </div>
          </label>
        </div>
      </div>

      <h2 id="bk-section-title">${isGroup ? "Thông tin người đại diện đoàn" : "Thông tin khách hàng"}</h2>

      <div class="field">
        <label for="bk-name"><span id="bk-name-label">${isGroup ? "Họ và tên người đại diện" : "Họ và tên"}</span> <span class="req">*</span></label>
        <input id="bk-name" name="name" type="text" placeholder="${isGroup ? "Nguyễn Văn A (Đại diện đoàn)" : "Nguyễn Văn A"}" value="${escapeHtml(session.name || "")}" required>
        <p class="error" data-error="name"></p>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="bk-phone"><span id="bk-phone-label">${isGroup ? "Số điện thoại đại diện" : "Số điện thoại"}</span> <span class="req">*</span></label>
          <input id="bk-phone" name="phone" type="tel" placeholder="0909 888 777" value="${escapeHtml(session.phone || "")}" required>
          <p class="error" data-error="phone"></p>
        </div>
        <div class="field">
          <label for="bk-email"><span id="bk-email-label">${isGroup ? "Email đại diện" : "Email"}</span></label>
          <input id="bk-email" name="email" type="email" placeholder="email@example.com" value="${escapeHtml(session.email || "")}">
          <p class="error" data-error="email"></p>
        </div>
      </div>

      <!-- Trường tên đoàn / doanh nghiệp chỉ hiện khi đặt theo đoàn -->
      <div class="field" id="field-group-name" style="${isGroup ? "" : "display:none;"}">
        <label for="bk-group-name">Tên đoàn / Cơ quan / Doanh nghiệp</label>
        <input id="bk-group-name" name="groupName" type="text" placeholder="Ví dụ: Công ty CP Công nghệ ABC, Đoàn cựu học sinh...">
        <p class="form-hint" style="margin-top:4px;">Giúp TravelGo chuẩn bị bảng tên đoàn, thủ tục bảo hiểm và xuất hoá đơn VAT khi cần.</p>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="bk-date">Ngày khởi hành <span class="req">*</span></label>
          <select id="bk-date" name="date" required></select>
          <p class="error" data-error="date"></p>
        </div>
        <div class="field">
          <label for="bk-tour">Chọn tour <span class="req">*</span></label>
          <select id="bk-tour" name="tour" required>${tourOptions}</select>
          <p class="error" data-error="tour"></p>
        </div>
      </div>

      <div class="passenger-box">
        <span class="passenger-title">Số lượng khách <span class="req">*</span></span>
        <div class="field-row">
          <div class="field">
            <label for="bk-adults">Người lớn (từ 12 tuổi)</label>
            <input id="bk-adults" name="adults" type="number" min="1" ${isGroup ? "" : `max="${MAX_PASSENGERS}"`} value="${preselect.adults}" required>
            <p class="error" data-error="adults"></p>
          </div>
          <div class="field">
            <label for="bk-children">Trẻ em (dưới 12 tuổi)</label>
            <input id="bk-children" name="children" type="number" min="0" ${isGroup ? "" : `max="${MAX_PASSENGERS}"`} value="${preselect.children}">
            <p class="error" data-error="children"></p>
          </div>
        </div>
        <p class="passenger-hint" id="passenger-hint-text">
          ${
            isGroup
              ? `Đoàn từ <strong>${GROUP_MIN_PASSENGERS} khách trở lên</strong>. Giá trên là giá tạm tính theo niêm yết, chuyên viên sẽ liên hệ tư vấn chính sách giá ưu đãi riêng cho đoàn.`
              : `Mỗi chuyến tối đa <strong>${MAX_PASSENGERS} khách</strong>. Giá trẻ em bằng <strong>${Math.round(
                  CHILD_PRICE_RATE * 100
                )}%</strong> giá người lớn.`
          }
        </p>
        <p class="error" data-error="people"></p>
      </div>

      <div class="field">
        <label for="bk-note"><span id="bk-note-label">${isGroup ? "Yêu cầu đặc biệt của đoàn" : "Ghi chú thêm"}</span></label>
        <textarea id="bk-note" name="note" rows="4" placeholder="${
          isGroup
            ? "Yêu cầu về phòng ngủ, xe đưa đón riêng, tổ chức teambuilding, gala dinner, xuất hoá đơn VAT..."
            : "Yêu cầu đặc biệt về phòng, bữa ăn, hành lý..."
        }"></textarea>
      </div>

      <!-- Phương thức thanh toán: Chỉ hiện khi Đặt cá nhân -->
      <fieldset class="field pay-method-box" id="section-pay-method" style="${isGroup ? "display:none;" : ""}">
        <legend>Hình thức thanh toán <span class="req">*</span></legend>
        <label class="pay-method-option">
          <input type="radio" name="payMethod" value="online" checked>
          <span>
            <strong>💳 Thanh toán trực tuyến ngay (MoMo / VietQR)</strong>
            <small>Quét mã QR hoặc thanh toán qua MoMo sau khi đặt để nhận vé lên xe ngay.</small>
          </span>
        </label>
        ${
          settings.allowCashToGuide
            ? `<label class="pay-method-option">
                <input type="radio" name="payMethod" value="cash">
                <span>
                  <strong>💵 Thanh toán trực tiếp cho Hướng dẫn viên trước giờ khởi hành</strong>
                  <small>Hệ thống giữ chỗ và cấp vé ngay, bạn không cần cọc. Bạn trả tiền mặt cho hướng dẫn viên phụ trách trước khi xe khởi hành; vé lên xe được kích hoạt sau khi đã thu đủ tiền.</small>
                </span>
              </label>`
            : ""
        }
      </fieldset>

      <!-- Thông báo quy trình xác nhận cho đơn theo đoàn: Chỉ hiện khi Đặt theo đoàn -->
      <div class="group-flow-notice" id="section-group-notice" style="${isGroup ? "" : "display:none;"}">
        <div class="group-flow-icon">ℹ️</div>
        <div class="group-flow-text">
          <strong>Quy trình tiếp nhận & xác nhận đơn đặt theo đoàn:</strong>
          <ul>
            <li>Đơn đoàn sẽ được lưu với trạng thái <strong>Chờ xác nhận</strong>.</li>
            <li>TravelGo <strong>không yêu cầu thanh toán ngay</strong> và <strong>không tự động cấp vé</strong> trước khi nhân viên xác nhận.</li>
            <li>Chuyên viên TravelGo sẽ gọi trực tiếp đến số điện thoại người đại diện trong vòng <strong>30 phút</strong> để xác nhận số chỗ, điều phối xe riêng và áp dụng <strong>mức giá ưu đãi cho đoàn</strong>.</li>
            <li>Sau khi thông tin đoàn và giá được chốt, bạn mới tiến hành thanh toán theo hướng dẫn.</li>
          </ul>
        </div>
      </div>

      <label class="checkbox">
        <input type="checkbox" name="agree" required>
        <span>Tôi đồng ý với <a href="#/contact">điều khoản</a> và chính sách bảo mật của TravelGo.</span>
      </label>
      <p class="error" data-error="agree"></p>

      <button class="btn btn-primary btn-lg btn-block" type="submit" id="bk-submit-btn">${
        isGroup ? "Gửi yêu cầu đặt tour theo đoàn" : "Xác nhận đặt tour"
      }</button>
      
      <p class="form-hint">
        Đơn sẽ được lưu vào tài khoản <strong>${escapeHtml(session.username)}</strong>.
        Bạn theo dõi được trạng thái tại <a href="#/my-bookings">Đơn của tôi</a>.
      </p>
      <p class="form-hint" id="bk-bottom-hint">
        ${
          isGroup
            ? "Chuyên viên tư vấn đoàn sẽ gọi điện để xác nhận số lượng chỗ và báo giá ưu đãi chính thức."
            : settings.allowCashToGuide
            ? "Bạn chọn trả cho hướng dẫn viên thì không cần thanh toán ngay — chúng tôi sẽ liên hệ để xác nhận và sắp xếp HDV."
            : "Bạn không cần thanh toán ngay. Chúng tôi sẽ liên hệ để xác nhận."
        }
      </p>
    </form>

    <aside class="summary-card" id="booking-summary">
      <h2>Tóm tắt đơn</h2>
      <div id="sum-type-badge-wrap" style="${isGroup ? "" : "display:none;"}; margin-bottom: 8px;">
        <span class="status-pill status-group" style="background:#e0e7ff;color:#3730a3;font-weight:700;display:inline-block;padding:3px 10px;border-radius:12px;">👥 Đặt theo đoàn</span>
      </div>
      <img class="summary-img" id="sum-img" src="" alt="" onerror="${imgFallback}">
      <h3 id="sum-name"></h3>
      <ul class="order-summary">
        <li><span>Hình thức</span><strong id="sum-booking-type">${isGroup ? "Theo đoàn" : "Cá nhân"}</strong></li>
        <li><span>Điểm đến</span><strong id="sum-location"></strong></li>
        <li><span>Thời lượng</span><strong id="sum-time"></strong></li>
        <li><span>Khởi hành</span><strong id="sum-date"></strong></li>
        <li><span>Người lớn</span><strong id="sum-adults"></strong></li>
        <li><span>Trẻ em</span><strong id="sum-children"></strong></li>
        <li><span>Tổng khách</span><strong id="sum-people"></strong></li>
        <li><span>Giá/người lớn</span><strong id="sum-price"></strong></li>
        <li><span>Giá/trẻ em</span><strong id="sum-child-price"></strong></li>
      </ul>
      <div class="summary-total">
        <span id="sum-total-label">${isGroup ? "Tổng tạm tính" : "Tổng cộng"}</span>
        <strong id="sum-total"></strong>
      </div>
      <p class="summary-note" id="sum-note">
        ${
          isGroup
            ? "Giá trên là tạm tính theo niêm yết. Chuyên viên sẽ áp dụng chiết khấu đoàn khi gọi xác nhận."
            : "Đặt tour được hoàn tiền nếu huỷ trước 7 ngày."
        }
      </p>
    </aside>
  </section>`;
}

function validate(form, tour) {
  const errors = {};
  const data = new FormData(form);
  const bookingType = data.get("bookingType") === "group" ? "group" : "individual";
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const email = String(data.get("email") || "").trim();
  const adults = Number(data.get("adults"));
  const children = Number(data.get("children") || 0);
  const date = String(data.get("date") || "").trim();
  const limit = seatLimit(tour?.seatsLeft, bookingType);

  if (!isName(name)) {
    errors.name = bookingType === "group"
      ? "Vui lòng nhập họ và tên người đại diện đoàn."
      : "Vui lòng nhập họ và tên.";
  }
  if (!isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
  if (email && !isEmail(email)) errors.email = "Email chưa hợp lệ.";
  if (!data.get("tour")) errors.tour = "Vui lòng chọn tour.";
  else if (!isSellableTour(tour)) errors.tour = "Tour này đã ngừng bán.";
  if (!date) errors.date = "Vui lòng chọn ngày khởi hành.";
  else if (!isFutureDeparture(date)) errors.date = "Chỉ được đặt tour cho ngày trong tương lai (sau hôm nay).";

  if (!Number.isInteger(adults) || adults < 1) errors.adults = "Cần ít nhất 1 người lớn.";
  if (!Number.isInteger(children) || children < 0) errors.children = "Số trẻ em không hợp lệ.";

  if (Number.isInteger(adults) && Number.isInteger(children)) {
    const totalPeople = adults + children;
    if (bookingType === "individual") {
      if (totalPeople > limit) {
        errors.people = `Đặt cá nhân mỗi chuyến chỉ nhận tối đa ${limit} khách. Nếu đi từ 11 khách trở lên, vui lòng chọn hình thức "Đặt theo đoàn".`;
      }
    } else {
      // Đặt theo đoàn
      if (totalPeople <= 10) {
        errors.people = `Đặt theo đoàn yêu cầu từ 11 khách trở lên (hiện có ${totalPeople} khách). Nếu đi từ 10 khách trở xuống, vui lòng chọn hình thức "Đặt cá nhân".`;
      }
    }
  }

  if (!data.get("agree")) errors.agree = "Bạn cần đồng ý điều khoản để tiếp tục.";

  return { errors, data, bookingType };
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "booking") return;
  const form = document.getElementById("booking-form");
  if (!form) return;
  const session = getSession();
  if (!session) return;

  const tourSelect = form.elements.tour;
  const dateSelect = form.elements.date;
  const adultsInput = form.elements.adults;
  const childrenInput = form.elements.children;
  const query = new URLSearchParams(detail.queryString || "");

  if (getTourById(query.get("tour"))) tourSelect.value = query.get("tour");

  function currentBookingType() {
    const checked = form.querySelector('input[name="bookingType"]:checked');
    return checked?.value === "group" ? "group" : "individual";
  }

  function setBookingTypeUi(type) {
    const isGroup = type === "group";
    const optIndividual = document.getElementById("opt-individual");
    const optGroup = document.getElementById("opt-group");
    const titleEl = document.getElementById("bk-section-title");
    const nameLabel = document.getElementById("bk-name-label");
    const phoneLabel = document.getElementById("bk-phone-label");
    const emailLabel = document.getElementById("bk-email-label");
    const noteLabel = document.getElementById("bk-note-label");
    const groupNameField = document.getElementById("field-group-name");
    const payMethodSection = document.getElementById("section-pay-method");
    const groupNoticeSection = document.getElementById("section-group-notice");
    const submitBtn = document.getElementById("bk-submit-btn");
    const bottomHint = document.getElementById("bk-bottom-hint");
    const passengerHint = document.getElementById("passenger-hint-text");
    const sumTypeBadge = document.getElementById("sum-type-badge-wrap");
    const sumBookingType = document.getElementById("sum-booking-type");
    const sumTotalLabel = document.getElementById("sum-total-label");
    const sumNote = document.getElementById("sum-note");

    if (optIndividual) optIndividual.classList.toggle("is-selected", !isGroup);
    if (optGroup) optGroup.classList.toggle("is-selected", isGroup);

    if (titleEl) titleEl.textContent = isGroup ? "Thông tin người đại diện đoàn" : "Thông tin khách hàng";
    if (nameLabel) nameLabel.textContent = isGroup ? "Họ và tên người đại diện" : "Họ và tên";
    if (phoneLabel) phoneLabel.textContent = isGroup ? "Số điện thoại đại diện" : "Số điện thoại";
    if (emailLabel) emailLabel.textContent = isGroup ? "Email đại diện" : "Email";
    if (noteLabel) noteLabel.textContent = isGroup ? "Yêu cầu đặc biệt của đoàn" : "Ghi chú thêm";

    if (groupNameField) groupNameField.style.display = isGroup ? "" : "none";
    if (payMethodSection) payMethodSection.style.display = isGroup ? "none" : "";
    if (groupNoticeSection) groupNoticeSection.style.display = isGroup ? "" : "none";

    if (submitBtn) submitBtn.textContent = isGroup ? "Gửi yêu cầu đặt tour theo đoàn" : "Xác nhận đặt tour";
    if (sumTypeBadge) sumTypeBadge.style.display = isGroup ? "" : "none";
    if (sumBookingType) sumBookingType.textContent = isGroup ? "Theo đoàn" : "Cá nhân";
    if (sumTotalLabel) sumTotalLabel.textContent = isGroup ? "Tổng tạm tính" : "Tổng cộng";

    if (sumNote) {
      sumNote.textContent = isGroup
        ? "Giá trên là tạm tính theo niêm yết. Chuyên viên sẽ áp dụng chiết khấu đoàn khi gọi xác nhận."
        : "Đặt tour được hoàn tiền nếu huỷ trước 7 ngày.";
    }

    if (bottomHint) {
      bottomHint.textContent = isGroup
        ? "Chuyên viên tư vấn đoàn sẽ gọi điện để xác nhận số lượng chỗ và báo giá ưu đãi chính thức."
        : "Bạn không cần thanh toán ngay. Chúng tôi sẽ liên hệ để xác nhận.";
    }

    const tour = getTourById(tourSelect.value);
    const limit = seatLimit(tour?.seatsLeft, type);

    if (isGroup) {
      adultsInput.removeAttribute("max");
      childrenInput.removeAttribute("max");
      if (passengerHint) {
        passengerHint.innerHTML = `Đoàn từ <strong>${GROUP_MIN_PASSENGERS} khách trở lên</strong>. Giá trên là giá tạm tính theo niêm yết, chuyên viên sẽ liên hệ tư vấn chính sách giá ưu đãi riêng cho đoàn.`;
      }
      // Nếu tổng số khách hiện tại <= 10, gợi ý tăng lên số khách đoàn (ví dụ 12)
      const currentTotal = (Number(adultsInput.value) || 0) + (Number(childrenInput.value) || 0);
      if (currentTotal <= 10) {
        adultsInput.value = "12";
      }
    } else {
      adultsInput.max = String(limit);
      childrenInput.max = String(limit);
      if (passengerHint) {
        passengerHint.innerHTML = `Mỗi chuyến tối đa <strong>${limit} khách</strong>. Giá trẻ em bằng <strong>${Math.round(
          CHILD_PRICE_RATE * 100
        )}%</strong> giá người lớn.`;
      }
      // Nếu tổng số khách hiện tại > limit, giảm xuống vừa limit
      const currentAdults = Number(adultsInput.value) || 1;
      const currentChildren = Number(childrenInput.value) || 0;
      if (currentAdults + currentChildren > limit) {
        const adjusted = normalizePassengers(currentAdults, currentChildren, limit, "individual");
        adultsInput.value = String(adjusted.adults);
        childrenInput.value = String(adjusted.children);
      }
    }

    refreshSummary();
  }

  function fillDates() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    const available = futureDepartures(tour.departures);
    dateSelect.innerHTML = available.length
      ? available.map((date) => `<option value="${date}">${formatDate(date)}</option>`).join("")
      : `<option value="">Chưa có ngày khởi hành trong tương lai</option>`;
    const preferred = query.get("date");
    if (available.includes(preferred)) dateSelect.value = preferred;

    const type = currentBookingType();
    if (type === "individual") {
      const limit = seatLimit(tour.seatsLeft, "individual");
      adultsInput.max = String(limit);
      childrenInput.max = String(limit);
    } else {
      adultsInput.removeAttribute("max");
      childrenInput.removeAttribute("max");
    }
  }

  function refreshSummary() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    const type = currentBookingType();
    const isGroup = type === "group";
    const limit = seatLimit(tour.seatsLeft, type);
    const counts = normalizePassengers(adultsInput.value, childrenInput.value, limit, type);

    const sumImg = document.getElementById("sum-img");
    if (sumImg) {
      sumImg.src = tour.image;
      sumImg.alt = tour.name;
    }
    const sumName = document.getElementById("sum-name");
    if (sumName) sumName.textContent = tour.name;
    const sumLocation = document.getElementById("sum-location");
    if (sumLocation) sumLocation.textContent = tour.location;
    const sumTime = document.getElementById("sum-time");
    if (sumTime) sumTime.textContent = tour.time;
    const sumDate = document.getElementById("sum-date");
    if (sumDate) sumDate.textContent = formatDate(dateSelect.value);
    const sumAdults = document.getElementById("sum-adults");
    if (sumAdults) sumAdults.textContent = `${counts.adults} khách`;
    const sumChildren = document.getElementById("sum-children");
    if (sumChildren) sumChildren.textContent = `${counts.children} khách`;

    const sumPeople = document.getElementById("sum-people");
    if (sumPeople) {
      sumPeople.textContent = isGroup ? `${counts.people} khách (Đoàn)` : `${counts.people}/${limit} khách`;
    }

    const sumPrice = document.getElementById("sum-price");
    if (sumPrice) sumPrice.textContent = formatPrice(tour.price);
    const sumChildPrice = document.getElementById("sum-child-price");
    if (sumChildPrice) sumChildPrice.textContent = formatPrice(childPrice(tour.price));

    const total = bookingTotal(tour.price, counts);
    const sumTotal = document.getElementById("sum-total");
    if (sumTotal) sumTotal.textContent = formatPrice(total);

    syncPassengerErrors(tour);
  }

  function setError(key, message) {
    const node = form.querySelector(`[data-error="${key}"]`);
    if (node) node.textContent = message || "";
    const fields =
      key === "people" ? [adultsInput, childrenInput] : [form.querySelector(`[name="${key}"]`)];
    fields.forEach((field) => field?.classList.toggle("invalid", Boolean(message)));
  }

  function showErrors(errors) {
    form
      .querySelectorAll("[data-error]")
      .forEach((node) => setError(node.dataset.error, errors[node.dataset.error]));
  }

  function syncPassengerErrors(tour) {
    const { errors } = validate(form, tour);
    ["adults", "children", "people"].forEach((key) => setError(key, errors[key]));
  }

  // Khởi tạo trạng thái ban đầu
  const initialTypeFromQuery = query.get("type") === "group" ? "group" : "individual";
  const typeRadios = form.querySelectorAll('input[name="bookingType"]');
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      setBookingTypeUi(radio.value);
    });
  });

  fillDates();
  setBookingTypeUi(initialTypeFromQuery);

  tourSelect.addEventListener("change", () => {
    setError("date", "");
    fillDates();
    refreshSummary();
  });
  dateSelect.addEventListener("change", () => {
    setError("date", "");
    refreshSummary();
  });
  adultsInput.addEventListener("input", refreshSummary);
  childrenInput.addEventListener("input", refreshSummary);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const tour = getTourById(form.elements.tour.value);
    const { errors, data, bookingType } = validate(form, tour);
    showErrors(errors);
    if (Object.keys(errors).length) {
      form.querySelector(".invalid")?.focus();
      return;
    }

    const isGroup = bookingType === "group";
    const limit = seatLimit(tour.seatsLeft, bookingType);
    const counts = normalizePassengers(data.get("adults"), data.get("children"), limit, bookingType);
    const payMethodChoice = data.get("payMethod");

    const record = saveBooking({
      name: String(data.get("name")).trim(),
      phone: String(data.get("phone")).trim(),
      email: String(data.get("email") || "").trim(),
      bookingType,
      groupName: isGroup ? String(data.get("groupName") || "").trim() : "",
      tourId: tour.id,
      tourName: tour.name,
      tourPrice: tour.price,
      tourLocation: tour.location,
      tourTime: tour.time,
      tourImage: tour.image,
      date: data.get("date"),
      accountUsername: session.username,
      adults: counts.adults,
      children: counts.children,
      people: counts.people,
      note: String(data.get("note") || "").trim(),
      total: bookingTotal(tour.price, counts),
      /* Với đoàn: không tự động chọn trả tiền mặt hay online ngay, chờ nhân viên xác nhận */
      paymentIntent: isGroup ? "" : (payMethodChoice === "cash" ? "cash" : ""),
    });

    if (isGroup) {
      saveNotification({
        type: "booking",
        title: `Đã tiếp nhận yêu cầu đặt đoàn ${record.code}`,
        body: `Yêu cầu đặt tour ${record.tourName} ngày ${formatDate(record.date)} cho đoàn ${record.people} khách (Người đại diện: ${record.name} - ${record.phone}). Chuyên viên TravelGo sẽ sớm liên hệ để tư vấn và báo giá ưu đãi chính thức.`,
        phone: record.phone,
        email: record.email,
        accountUsername: session.username,
      });
    } else {
      saveNotification({
        type: "booking",
        title: `Đã nhận đơn ${record.code}`,
        body: `Yêu cầu đặt ${record.tourName} ngày ${formatDate(record.date)} cho ${record.adults} người lớn${
          record.children ? ` và ${record.children} trẻ em` : ""
        }.${
          record.paymentIntent === "cash"
            ? ` Khách chọn thanh toán trực tiếp ${formatPrice(record.total)} cho hướng dẫn viên trước giờ khởi hành.`
            : ""
        } Chuyên viên sẽ gọi ${record.phone} để xác nhận.`,
        phone: record.phone,
        email: record.email,
        accountUsername: session.username,
      });
    }
    syncNotificationBadge();

    // Màn hình thành công: Phân tách rõ ràng giữa Cá nhân và Theo đoàn
    if (isGroup) {
      form.innerHTML = `
        <div class="form-success group-success-card">
          <div class="success-icon group-success-icon">👥</div>
          <span class="status-pill status-group" style="background:#e0e7ff;color:#3730a3;font-weight:700;display:inline-block;padding:4px 12px;border-radius:12px;margin-bottom:10px;">
            Yêu cầu đặt tour theo đoàn
          </span>
          <h2>Gửi yêu cầu đặt đoàn thành công!</h2>
          <p>
            Cảm ơn người đại diện <strong>${escapeHtml(record.name)}</strong>${
              record.groupName ? ` (<em>${escapeHtml(record.groupName)}</em>)` : ""
            }, TravelGo đã tiếp nhận yêu cầu đặt tour <strong>${escapeHtml(record.tourName)}</strong> của quý đoàn với mã đơn
            <strong class="code">${escapeHtml(record.code)}</strong>.
          </p>

          <ul class="success-list">
            <li>Hình thức: <strong>Đặt theo đoàn (>10 khách)</strong></li>
            <li>Ngày khởi hành: <strong>${formatDate(record.date)}</strong></li>
            <li>Tổng số khách đoàn: <strong>${record.people} khách</strong> (${record.adults} người lớn${
              record.children ? `, ${record.children} trẻ em` : ""
            })</li>
            <li>Giá tạm tính niêm yết: <strong>${formatPrice(record.total)}</strong></li>
            <li>Trạng thái đơn: <span class="status-pill status-pending">Chờ xác nhận số chỗ & giá</span></li>
          </ul>

          <div class="group-success-notice">
            <div class="notice-icon">📞</div>
            <div class="notice-body">
              <strong>Nhân viên TravelGo sẽ liên hệ trực tiếp trong 30 phút:</strong>
              <p>Chuyên viên phụ trách tour đoàn sẽ gọi đến số điện thoại <strong>${escapeHtml(
                record.phone
              )}</strong> để kiểm tra tình trạng chỗ thực tế của toàn đoàn, tư vấn điều chỉnh lịch trình riêng (nếu có yêu cầu) và áp dụng <strong>mức giá ưu đãi đoàn</strong> tốt nhất.</p>
              <small>📌 <em>Lưu ý: Để bảo đảm quyền lợi tối đa cho đoàn, đơn hàng chưa yêu cầu thanh toán ngay và chưa tự động cấp vé trước khi được nhân viên xác nhận.</em></small>
            </div>
          </div>

          <div class="success-actions" style="margin-top:24px;">
            <a class="btn btn-primary btn-lg" href="#/my-bookings">
              📋 Theo dõi đơn trong "Đơn của tôi"
            </a>
            <a class="btn btn-outline" href="#/tours">
              Xem thêm các tour khác
            </a>
            <a class="btn btn-light" href="#/contact">
              Cần hỗ trợ gấp? Liên hệ Hotline
            </a>
          </div>
        </div>`;
    } else {
      // Đặt cá nhân: Giữ nguyên luồng hiện tại
      const payGuideSuccess = record.paymentIntent === "cash";

      form.innerHTML = `
        <div class="form-success">
          <div class="success-icon">✓</div>
          <h2>Đặt tour thành công!</h2>
          <p>
            Cảm ơn <strong>${escapeHtml(record.name)}</strong>, chúng tôi đã nhận được yêu cầu đặt
            <strong>${escapeHtml(record.tourName)}</strong> với mã đơn
            <strong class="code">${escapeHtml(record.code)}</strong>.
          </p>
          <ul class="success-list">
            <li>Hình thức: <strong>Đặt cá nhân</strong></li>
            <li>Ngày khởi hành: ${formatDate(record.date)}</li>
            <li>Người lớn: ${record.adults}</li>
            <li>Trẻ em: ${record.children}</li>
            <li>Tổng khách: ${record.people}/${MAX_PASSENGERS}</li>
            <li>Tổng tiền tạm tính: ${formatPrice(record.total)}</li>
          </ul>
          ${
            payGuideSuccess
              ? `<p class="form-hint">
                   Bạn chọn <strong>thanh toán trực tiếp cho hướng dẫn viên</strong>. Vé giữ chỗ đã được cấp ngay với mã
                   <strong class="code">${escapeHtml(record.code)}</strong>. Vui lòng trả
                   <strong>${formatPrice(record.total)}</strong> tiền mặt cho hướng dẫn viên phụ trách trước giờ khởi hành.
                   Hướng dẫn viên sẽ được phân công và hiển thị trên vé trước ngày đi.
                 </p>`
              : `<p class="form-hint">Chuyên viên sẽ gọi ${escapeHtml(record.phone)} trong 30 phút để xác nhận.</p>`
          }
          <div class="success-actions booking-success-momo">
            ${
              payGuideSuccess
                ? `<a class="btn btn-primary btn-lg" href="#/ticket/${encodeURIComponent(record.code)}">
                     📄 Xem vé giữ chỗ (Thanh toán cho HDV)
                   </a>
                   <a class="btn btn-outline" href="#/payment?code=${encodeURIComponent(record.code)}">
                     Chuyển sang thanh toán online ngay
                   </a>
                   <a class="btn btn-light" href="#/tours">Xem thêm tour</a>`
                : `<a class="btn btn-primary btn-lg" href="#/ticket/${encodeURIComponent(record.code)}?mode=payment">
                     📄 Xem vé thanh toán trực tiếp (Có mã QR)
                   </a>
                   <a class="btn btn-momo btn-lg" href="#/payment?code=${encodeURIComponent(record.code)}">
                     <svg width="20" height="20" viewBox="0 0 40 40" fill="none" style="vertical-align:middle;margin-right:6px">
                       <rect width="40" height="40" rx="8" fill="#fff"/>
                       <path d="M12.5 14C10.567 14 9 15.567 9 17.5V26.5C9 28.433 10.567 30 12.5 30C14.433 30 16 28.433 16 26.5V17.5C16 15.567 14.433 14 12.5 14ZM12.5 26.5C11.6716 26.5 11 25.8284 11 25V19C11 18.1716 11.6716 17.5 12.5 17.5C13.3284 17.5 14 18.1716 14 19V25C14 25.8284 13.3284 26.5 12.5 26.5Z" fill="#A50064"/>
                       <path d="M27.5 14C25.567 14 24 15.567 24 17.5V26.5C24 28.433 25.567 30 27.5 30C29.433 30 31 28.433 31 26.5V17.5C31 15.567 29.433 14 27.5 14ZM27.5 26.5C26.6716 26.5 26 25.8284 26 25V19C26 18.1716 26.6716 17.5 27.5 17.5C28.3284 17.5 29 18.1716 29 19V25C29 25.8284 28.3284 26.5 27.5 26.5Z" fill="#A50064"/>
                       <circle cx="20" cy="19.5" r="3.5" fill="#A50064"/>
                     </svg>
                     Thanh toán online qua MoMo ngay
                   </a>
                   <a class="btn btn-outline" href="#/account">Để thanh toán sau</a>
                   <a class="btn btn-light" href="#/tours">Xem thêm tour</a>`
            }
          </div>
        </div>`;
    }
  });
});
