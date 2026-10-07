import { formatPrice, formatDate } from "../data.js";
import { listTours, getTourById } from "../tour-repository.js";
import { saveBooking, saveNotification } from "../store.js";
import { syncNotificationBadge } from "../components/notification-bell.js";
import { imgFallback } from "../components/tour-card.js";
import { escapeHtml, isEmail, isName, isPhone } from "../validate.js";

export function Booking(path, params = {}, query = new URLSearchParams()) {
  const allTours = listTours();
  const tourOptions = allTours
    .map((tour) => `<option value="${tour.id}">${tour.name} - ${formatPrice(tour.price)}</option>`)
    .join("");
  const preselectPeople = Number(query.get("people")) || 1;

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

      <div class="field-row">
        <div class="field">
          <label for="bk-date">Ngày khởi hành <span class="req">*</span></label>
          <select id="bk-date" name="date" required></select>
        </div>
        <div class="field">
          <label for="bk-people">Số lượng khách <span class="req">*</span></label>
          <input id="bk-people" name="people" type="number" min="1" max="20" value="${preselectPeople}" required>
          <p class="error" data-error="people"></p>
        </div>
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

function validate(form) {
  const errors = {};
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const email = String(data.get("email") || "").trim();
  const people = Number(data.get("people"));

  if (!isName(name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
  if (email && !isEmail(email)) errors.email = "Email chưa hợp lệ.";
  if (!data.get("tour")) errors.tour = "Vui lòng chọn tour.";
  if (!people || people < 1) errors.people = "Số khách phải từ 1 trở lên.";
  if (!data.get("agree")) errors.agree = "Bạn cần đồng ý điều khoản để tiếp tục.";

  return { errors, data };
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "booking") return;
  const form = document.getElementById("booking-form");
  if (!form) return;

  const tourSelect = form.elements.tour;
  const dateSelect = form.elements.date;
  const peopleInput = form.elements.people;
  const query = new URLSearchParams(detail.queryString || "");

  if (getTourById(query.get("tour"))) tourSelect.value = query.get("tour");
  peopleInput.value = Number(query.get("people")) || peopleInput.value;

  function fillDates() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    dateSelect.innerHTML = tour.departures
      .map((date) => `<option value="${date}">${formatDate(date)}</option>`)
      .join("");
    const wanted = query.get("date");
    if (tour.departures.includes(wanted)) dateSelect.value = wanted;
    form.elements.people.max = String(Math.max(tour.seatsLeft, 1));
  }

  function refreshSummary() {
    const tour = getTourById(tourSelect.value);
    if (!tour) return;
    const people = Math.min(Math.max(Number(peopleInput.value) || 1, 1), tour.seatsLeft);
    document.getElementById("sum-img").src = tour.image;
    document.getElementById("sum-img").alt = tour.name;
    document.getElementById("sum-name").textContent = tour.name;
    document.getElementById("sum-location").textContent = tour.location;
    document.getElementById("sum-time").textContent = tour.time;
    document.getElementById("sum-date").textContent = formatDate(dateSelect.value);
    document.getElementById("sum-people").textContent = `${people} khách`;
    document.getElementById("sum-price").textContent = formatPrice(tour.price);
    document.getElementById("sum-total").textContent = formatPrice(tour.price * people);
  }

  function showErrors(errors) {
    form.querySelectorAll("[data-error]").forEach((node) => {
      const key = node.dataset.error;
      node.textContent = errors[key] || "";
      const field = form.querySelector(`[name="${key}"]`);
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
  peopleInput.addEventListener("input", refreshSummary);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { errors, data } = validate(form);
    showErrors(errors);
    if (Object.keys(errors).length) {
      form.querySelector(".invalid")?.focus();
      return;
    }

    const tour = getTourById(data.get("tour"));
    const people = Math.min(Math.max(Number(data.get("people")), 1), tour.seatsLeft);
    const record = saveBooking({
      name: String(data.get("name")).trim(),
      phone: String(data.get("phone")).trim(),
      email: String(data.get("email") || "").trim(),
      tourId: tour.id,
      tourName: tour.name,
      date: data.get("date"),
      people,
      note: String(data.get("note") || "").trim(),
      total: tour.price * people,
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
          <li>Số khách: ${record.people}</li>
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
