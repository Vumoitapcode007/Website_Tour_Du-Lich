import { formatPrice, formatDate } from "../data.js";
import { listTours, getTourById } from "../tour-repository.js";
import { saveBooking, saveNotification } from "../store.js";
import { syncNotificationBadge } from "../components/notification-bell.js";
import { imgFallback } from "../components/tour-card.js";
import { escapeHtml, isEmail, isName, isPhone } from "../validate.js";

/* Nhóm khách và tỉ lệ áp dụng trên giá gốc của tour */
const AGE_GROUPS = [
  { key: "adults", label: "Người lớn", hint: "Từ 12 tuổi", rate: 1, min: 1 },
  { key: "seniors", label: "Người cao tuổi", hint: "Từ 60 tuổi · 90%", rate: 0.9, min: 0 },
  { key: "children", label: "Trẻ em", hint: "Dưới 12 tuổi · 50%", rate: 0.5, min: 0 },
];

export function quoteTotal(price, groups = {}) {
  const total = AGE_GROUPS.reduce(
    (sum, group) => sum + (Number(groups[group.key]) || 0) * group.rate * Number(price || 0),
    0
  );
  return Math.round(total / 1000) * 1000;
}

export function Booking(path, params = {}, query = new URLSearchParams()) {
  const allTours = listTours();
  const tourOptions = allTours
    .map((tour) => `<option value="${tour.id}">${tour.name} - ${formatPrice(tour.price)}</option>`)
    .join("");
  const preselectAdults = Number(query.get("people")) || 1;

  const ageFields = AGE_GROUPS.map(
    (group) => `
      <div class="age-field">
        <label for="bk-${group.key}">${group.label}</label>
        <input id="bk-${group.key}" name="${group.key}" type="number" inputmode="numeric"
          min="${group.min}" max="20" value="${group.key === "adults" ? preselectAdults : 0}">
        <small>${group.hint}</small>
      </div>`
  ).join("");

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
        <input id="bk-name" name="name" type="text" placeholder="Nguyễn Văn A" required>
        <p class="error" data-error="name"></p>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="bk-phone">Số điện thoại <span class="req">*</span></label>
          <input id="bk-phone" name="phone" type="tel" placeholder="0909 888 777" required>
          <p class="error" data-error="phone"></p>
        </div>
        <div class="field">
          <label for="bk-email">Email</label>
          <input id="bk-email" name="email" type="email" placeholder="email@example.com">
          <p class="error" data-error="email"></p>
        </div>
      </div>

      <div class="field">
        <label for="bk-tour">Chọn tour <span class="req">*</span></label>
        <select id="bk-tour" name="tour" required>${tourOptions}</select>
        <p class="error" data-error="tour"></p>
      </div>

      <div class="field">
        <label for="bk-date">Ngày khởi hành <span class="req">*</span></label>
        <select id="bk-date" name="date" required></select>
      </div>

      <div class="field">
        <label for="bk-adults">Thành phần tham gia <span class="req">*</span></label>
        <div class="age-grid" id="bk-age-grid">${ageFields}</div>
        <small class="form-hint" style="text-align:left">Tổng số khách tối đa theo số chỗ còn trống của tour.</small>
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
        <li><span>Số khách</span><strong id="sum-people"></strong></li>
        <li id="sum-breakdown-row" hidden><span>Thành phần</span><strong id="sum-breakdown"></strong></li>
        <li><span>Giá/người</span><strong id="sum-price"></strong></li>
      </ul>
      <div class="summary-total">
        <span>Tổng cộng</span>
        <strong id="sum-total"></strong>
      </div>
      <p class="summary-note">Đặt tour được hoàn tiền nếu huỷ trước 7 ngày.</p>
    </aside>
  </section>`;
}

function readGroups(form) {
  const groups = {};
  AGE_GROUPS.forEach((group) => {
    groups[group.key] = Math.max(Number(form.elements[group.key]?.value) || 0, 0);
  });
  return groups;
}

function countPeople(groups) {
  return AGE_GROUPS.reduce((sum, group) => sum + (Number(groups[group.key]) || 0), 0);
}

function breakdownText(groups) {
  return AGE_GROUPS.filter((group) => groups[group.key] > 0)
    .map((group) => `${groups[group.key]} ${group.label.toLowerCase()}`)
    .join(" · ");
}

function validate(form) {
  const errors = {};
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const email = String(data.get("email") || "").trim();
  const groups = readGroups(form);
  const people = countPeople(groups);
  const tour = getTourById(data.get("tour"));

  if (!isName(name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
  if (email && !isEmail(email)) errors.email = "Email chưa hợp lệ.";
  if (!data.get("tour")) errors.tour = "Vui lòng chọn tour.";
  if (people < 1) errors.people = "Vui lòng nhập ít nhất 1 khách.";
  else if (tour && people > tour.seatsLeft)
    errors.people = `Tour chỉ còn ${tour.seatsLeft} chỗ trống.`;
  if (!data.get("agree")) errors.agree = "Bạn cần đồng ý điều khoản để tiếp tục.";

  return { errors, data, groups, people };
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "booking") return;
  const form = document.getElementById("booking-form");
  if (!form) return;

  const tourSelect = form.elements.tour;
  const dateSelect = form.elements.date;
  const ageInputs = AGE_GROUPS.map((group) => form.elements[group.key]).filter(Boolean);
  const query = new URLSearchParams(detail.queryString || "");

  if (getTourById(query.get("tour"))) tourSelect.value = query.get("tour");

  function fillDates() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    dateSelect.innerHTML = tour.departures
      .map((date) => `<option value="${date}">${formatDate(date)}</option>`)
      .join("");
    const wanted = query.get("date");
    if (tour.departures.includes(wanted)) dateSelect.value = wanted;
    ageInputs.forEach((input) => {
      input.max = String(Math.max(tour.seatsLeft, 1));
    });
  }

  function refreshSummary() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    const groups = readGroups(form);
    const people = Math.min(countPeople(groups), Math.max(tour.seatsLeft, 0));
    const breakdown = breakdownText(groups);
    document.getElementById("sum-img").src = tour.image;
    document.getElementById("sum-img").alt = tour.name;
    document.getElementById("sum-name").textContent = tour.name;
    document.getElementById("sum-location").textContent = tour.location;
    document.getElementById("sum-time").textContent = tour.time;
    document.getElementById("sum-date").textContent = formatDate(dateSelect.value);
    document.getElementById("sum-people").textContent = `${people} khách`;
    document.getElementById("sum-price").textContent = formatPrice(tour.price);
    document.getElementById("sum-total").textContent = formatPrice(
      quoteTotal(tour.price, groups)
    );
    const row = document.getElementById("sum-breakdown-row");
    if (row) {
      row.hidden = !breakdown;
      document.getElementById("sum-breakdown").textContent = breakdown;
    }
  }

  function showErrors(errors) {
    form.querySelectorAll("[data-error]").forEach((node) => {
      const key = node.dataset.error;
      node.textContent = errors[key] || "";
      const field =
        form.querySelector(`[name="${key}"]`) ||
        (key === "people" ? document.getElementById("bk-age-grid") : null);
      if (field) field.classList.toggle("invalid", Boolean(errors[key]));
    });
  }

  fillDates();
  refreshSummary();

  tourSelect.addEventListener("change", () => {
    fillDates();
    refreshSummary();
  });
  dateSelect.addEventListener("change", refreshSummary);
  ageInputs.forEach((input) => input.addEventListener("input", refreshSummary));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { errors, data, groups, people } = validate(form);
    showErrors(errors);
    if (Object.keys(errors).length) {
      const first = form.querySelector(".invalid");
      (first?.matches?.("input") ? first : first?.querySelector("input"))?.focus();
      return;
    }

    const tour = getTourById(data.get("tour"));
    const record = saveBooking({
      name: String(data.get("name")).trim(),
      phone: String(data.get("phone")).trim(),
      email: String(data.get("email") || "").trim(),
      tourId: tour.id,
      tourName: tour.name,
      date: data.get("date"),
      people,
      groups,
      note: String(data.get("note") || "").trim(),
      total: quoteTotal(tour.price, groups),
    });

    saveNotification({
      type: "booking",
      title: `Đã nhận đơn ${record.code}`,
      body: `Yêu cầu đặt ${record.tourName} ngày ${formatDate(record.date)}. Chuyên viên sẽ gọi ${record.phone} để xác nhận.`,
      phone: record.phone,
      email: record.email,
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
          <li>Số khách: ${record.people} (${breakdownText(record.groups)})</li>
          <li>Tổng tiền tạm tính: ${formatPrice(record.total)}</li>
        </ul>
        <p class="form-hint">Chuyên viên sẽ gọi ${escapeHtml(record.phone)} trong 30 phút để xác nhận.</p>
        <div class="success-actions">
          <a class="btn btn-primary" href="#/tours">Xem thêm tour</a>
          <a class="btn btn-outline" href="#/">Về trang chủ</a>
        </div>
      </div>`;
  });
});
