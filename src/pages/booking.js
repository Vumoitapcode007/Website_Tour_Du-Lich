import { formatPrice, formatDate } from "../data.js";
import { listTours, getTourById, isSellableTour } from "../tour-repository.js";
import { saveBooking, saveNotification } from "../store.js";
import { syncNotificationBadge } from "../components/notification-bell.js";
import { imgFallback } from "../components/tour-card.js";
import { escapeHtml, isEmail, isName, isPhone } from "../validate.js";
import { getSession } from "../auth.js";
import {
  CHILD_PRICE_RATE,
  MAX_PASSENGERS,
  bookingTotal,
  childPrice,
  normalizePassengers,
  seatLimit,
} from "../booking-rules.js";

/* Chỉ nhận lại các tham số cần giữ khi khách quay lại sau khi đăng nhập */
const RETURN_KEYS = ["tour", "date", "adults", "children", "people"];

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

  const requested = query.get("tour");
  if (requested) {
    const wanted = getTourById(requested);
    if (!wanted) return TourUnavailable(query);
    if (!isSellableTour(wanted)) return TourUnavailable(query);
  }

  /* Chỉ mở form cho các tour còn nhận khách */
  const allTours = listTours().filter(isSellableTour);
  const tourOptions = allTours
    .map((tour) => `<option value="${tour.id}">${tour.name} - ${formatPrice(tour.price)}</option>`)
    .join("");
  const preselect = normalizePassengers(
    query.get("adults") ?? query.get("people"),
    query.get("children"),
    MAX_PASSENGERS
  );

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Đặt chỗ</span>
      <h1>Đặt tour</h1>
      <p>Điền thông tin bên dưới, chúng tôi sẽ gọi xác nhận trong 30 phút.</p>
    </div>
  </section>

  <section class="section container booking-layout">
    <form class="form-card" id="booking-form" novalidate>
      <h2>Thông tin khách hàng</h2>

      <div class="field">
        <label for="bk-name">Họ và tên <span class="req">*</span></label>
        <input id="bk-name" name="name" type="text" placeholder="Nguyễn Văn A" value="${escapeHtml(session.name || "")}" required>
        <p class="error" data-error="name"></p>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="bk-phone">Số điện thoại <span class="req">*</span></label>
          <input id="bk-phone" name="phone" type="tel" placeholder="0909 888 777" value="${escapeHtml(session.phone || "")}" required>
          <p class="error" data-error="phone"></p>
        </div>
        <div class="field">
          <label for="bk-email">Email</label>
          <input id="bk-email" name="email" type="email" placeholder="email@example.com" value="${escapeHtml(session.email || "")}">
          <p class="error" data-error="email"></p>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="bk-date">Ngày khởi hành <span class="req">*</span></label>
          <select id="bk-date" name="date" required></select>
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
            <input id="bk-adults" name="adults" type="number" min="1" max="${MAX_PASSENGERS}" value="${preselect.adults}" required>
            <p class="error" data-error="adults"></p>
          </div>
          <div class="field">
            <label for="bk-children">Trẻ em (dưới 12 tuổi)</label>
            <input id="bk-children" name="children" type="number" min="0" max="${MAX_PASSENGERS}" value="${preselect.children}">
            <p class="error" data-error="children"></p>
          </div>
        </div>
        <p class="passenger-hint">
          Mỗi chuyến tối đa <strong>${MAX_PASSENGERS} khách</strong>.
          Giá trẻ em bằng <strong>${Math.round(CHILD_PRICE_RATE * 100)}%</strong> giá người lớn.
        </p>
        <p class="error" data-error="people"></p>
      </div>

      <div class="field">
        <label for="bk-note">Ghi chú thêm</label>
        <textarea id="bk-note" name="note" rows="4" placeholder="Yêu cầu đặc biệt về phòng, bữa ăn, hành lý..."></textarea>
      </div>

      <label class="checkbox">
        <input type="checkbox" name="agree" required>
        <span>Tôi đồng ý với <a href="#/contact">điều khoản</a> và chính sách bảo mật của TravelGo.</span>
      </label>
      <p class="error" data-error="agree"></p>

      <button class="btn btn-primary btn-lg btn-block" type="submit">Xác nhận đặt tour</button>
      <p class="form-hint">
        Đơn sẽ được lưu vào tài khoản <strong>${escapeHtml(session.username)}</strong>.
        Bạn theo dõi được trạng thái tại <a href="#/my-bookings">Đơn của tôi</a>.
      </p>
      <p class="form-hint">Bạn không cần thanh toán ngay. Chúng tôi sẽ liên hệ để xác nhận.</p>
    </form>

    <aside class="summary-card" id="booking-summary">
      <h2>Tóm tắt đơn</h2>
      <img class="summary-img" id="sum-img" src="" alt="" onerror="${imgFallback}">
      <h3 id="sum-name"></h3>
      <ul class="order-summary">
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
        <span>Tổng cộng</span>
        <strong id="sum-total"></strong>
      </div>
      <p class="summary-note">Đặt tour được hoàn tiền nếu huỷ trước 7 ngày.</p>
    </aside>
  </section>`;
}

function validate(form, tour) {
  const errors = {};
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const email = String(data.get("email") || "").trim();
  const adults = Number(data.get("adults"));
  const children = Number(data.get("children") || 0);
  const limit = seatLimit(tour?.seatsLeft);

  if (!isName(name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
  if (email && !isEmail(email)) errors.email = "Email chưa hợp lệ.";
  if (!data.get("tour")) errors.tour = "Vui lòng chọn tour.";
  else if (!isSellableTour(tour)) errors.tour = "Tour này đã ngừng bán.";
  if (!Number.isInteger(adults) || adults < 1) errors.adults = "Cần ít nhất 1 người lớn.";
  if (!Number.isInteger(children) || children < 0) errors.children = "Số trẻ em không hợp lệ.";
  if (Number.isInteger(adults) && Number.isInteger(children) && adults + children > limit)
    errors.people = `Mỗi chuyến chỉ nhận tối đa ${limit} khách.`;
  if (!data.get("agree")) errors.agree = "Bạn cần đồng ý điều khoản để tiếp tục.";

  return { errors, data };
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

  const wanted = normalizePassengers(
    query.get("adults") ?? query.get("people"),
    query.get("children"),
    MAX_PASSENGERS
  );
  adultsInput.value = String(wanted.adults);
  childrenInput.value = String(wanted.children);

  function fillDates() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    dateSelect.innerHTML = tour.departures
      .map((date) => `<option value="${date}">${formatDate(date)}</option>`)
      .join("");
    const preferred = query.get("date");
    if (tour.departures.includes(preferred)) dateSelect.value = preferred;
    const limit = seatLimit(tour.seatsLeft);
    adultsInput.max = String(limit);
    childrenInput.max = String(limit);
  }

  function refreshSummary() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    const limit = seatLimit(tour.seatsLeft);
    const counts = normalizePassengers(adultsInput.value, childrenInput.value, limit);
    document.getElementById("sum-img").src = tour.image;
    document.getElementById("sum-img").alt = tour.name;
    document.getElementById("sum-name").textContent = tour.name;
    document.getElementById("sum-location").textContent = tour.location;
    document.getElementById("sum-time").textContent = tour.time;
    document.getElementById("sum-date").textContent = formatDate(dateSelect.value);
    document.getElementById("sum-adults").textContent = `${counts.adults} khách`;
    document.getElementById("sum-children").textContent = `${counts.children} khách`;
    document.getElementById("sum-people").textContent = `${counts.people}/${limit} khách`;
    document.getElementById("sum-price").textContent = formatPrice(tour.price);
    document.getElementById("sum-child-price").textContent = formatPrice(childPrice(tour.price));
    document.getElementById("sum-total").textContent = formatPrice(bookingTotal(tour.price, counts));
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

  fillDates();
  refreshSummary();

  tourSelect.addEventListener("change", () => {
    fillDates();
    refreshSummary();
  });
  dateSelect.addEventListener("change", refreshSummary);
  adultsInput.addEventListener("input", refreshSummary);
  childrenInput.addEventListener("input", refreshSummary);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const tour = getTourById(form.elements.tour.value);
    const { errors, data } = validate(form, tour);
    showErrors(errors);
    if (Object.keys(errors).length) {
      form.querySelector(".invalid")?.focus();
      return;
    }

    const counts = normalizePassengers(data.get("adults"), data.get("children"), tour.seatsLeft);
    const record = saveBooking({
      name: String(data.get("name")).trim(),
      phone: String(data.get("phone")).trim(),
      email: String(data.get("email") || "").trim(),
      tourId: tour.id,
      /* Snapshot: các trường dưới đây được khoá theo giá trị tại thời điểm đặt.
         Admin có sửa giá hay tour bị ngừng bán thì đơn này vẫn hiển thị đúng. */
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
    });

    saveNotification({
      type: "booking",
      title: `Đã nhận đơn ${record.code}`,
      body: `Yêu cầu đặt ${record.tourName} ngày ${formatDate(record.date)} cho ${record.adults} người lớn${
        record.children ? ` và ${record.children} trẻ em` : ""
      }. Chuyên viên sẽ gọi ${record.phone} để xác nhận.`,
      phone: record.phone,
      email: record.email,
      accountUsername: session.username,
    });
    syncNotificationBadge();

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
          <li>Ngày khởi hành: ${formatDate(record.date)}</li>
          <li>Người lớn: ${record.adults}</li>
          <li>Trẻ em: ${record.children}</li>
          <li>Tổng khách: ${record.people}/${MAX_PASSENGERS}</li>
          <li>Tổng tiền tạm tính: ${formatPrice(record.total)}</li>
        </ul>
        <p class="form-hint">Chuyên viên sẽ gọi ${escapeHtml(record.phone)} trong 30 phút để xác nhận.</p>
        <div class="success-actions booking-success-momo">
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
          <a class="btn btn-light" href="#/tours">Xem thêm tour</a>
        </div>
      </div>`;
  });
});
