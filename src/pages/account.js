import { changePassword, getSession, logout, updateProfile } from "../auth.js";
import { BOOKING_STATUS, myBookings, updateBooking } from "../store.js";
import { formatDate, formatPrice } from "../data.js";
import { escapeHtml, isEmail, isName, isPhone } from "../validate.js";

function Guard() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Tài khoản khách hàng</span>
      <h1>Yêu cầu đăng nhập</h1>
      <p>Vui lòng đăng nhập để xem hồ sơ và lịch sử đặt tour của bạn.</p>
    </div>
  </section>
  <section class="section container center">
    <a class="btn btn-light btn-lg" href="#/login?next=account">Đăng nhập ngay</a>
  </section>`;
}

function stat(value, label) {
  return `<div class="admin-stat"><strong>${escapeHtml(value)}</strong><span>${label}</span></div>`;
}

function bookingItem(booking) {
  return `
  <li class="account-booking" data-code="${escapeHtml(booking.code)}">
    <div class="account-booking-head">
      <strong>${escapeHtml(booking.code)}</strong>
      <span class="status-pill status-${escapeHtml(booking.status)}">${BOOKING_STATUS[booking.status]}</span>
    </div>
    <a class="account-booking-tour" href="#/tour/${booking.tourId}">${escapeHtml(booking.tourName)}</a>
    <ul class="account-booking-meta">
      <li>Ngày khởi hành: <strong>${formatDate(booking.date)}</strong></li>
      <li>Số khách: <strong>${booking.people}</strong></li>
      <li>Tổng tiền: <strong>${formatPrice(booking.total)}</strong></li>
    </ul>
    ${
      booking.status === "pending"
        ? `<button class="btn btn-sm btn-outline" data-cancel-booking="${escapeHtml(booking.code)}">Huỷ đơn</button>`
        : booking.status === "confirmed"
          ? `<p class="account-note">Đơn đã xác nhận. Cần huỷ vui lòng gọi hotline.</p>`
          : ""
    }
  </li>`;
}

export function Account() {
  const session = getSession();
  if (!session) return Guard();

  const bookings = myBookings(session);
  const pending = bookings.filter((item) => item.status === "pending").length;
  const confirmed = bookings.filter((item) => item.status === "confirmed").length;
  const spent = bookings
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + item.total, 0);

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Tài khoản của tôi</span>
      <h1>Xin chào ${escapeHtml(session.name)}</h1>
      <p>Quản lý thông tin cá nhân, mật khẩu và lịch sử đặt tour của bạn.</p>
    </div>
  </section>

  <section class="section container">
    <div class="admin-stats">
      ${stat(bookings.length, "Tổng đơn")}
      ${stat(pending, "Chờ xác nhận")}
      ${stat(confirmed, "Đã xác nhận")}
      ${stat(`${new Intl.NumberFormat("vi-VN").format(spent)} VNĐ`, "Tổng chi tiêu")}
    </div>

    <div class="account-layout">
      <form class="form-card" id="profile-form" novalidate>
        <h2>Thông tin cá nhân</h2>
        <p class="form-hint account-hint">Tài khoản: <strong>${escapeHtml(session.username)}</strong> · ${escapeHtml(session.role || "Khách hàng")}</p>

        <div class="field">
          <label for="ac-name">Họ và tên <span class="req">*</span></label>
          <input id="ac-name" name="name" type="text" value="${escapeHtml(session.name || "")}" required>
          <p class="error" data-error="name"></p>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="ac-email">Email</label>
            <input id="ac-email" name="email" type="email" value="${escapeHtml(session.email || "")}" placeholder="email@example.com">
            <p class="error" data-error="email"></p>
          </div>
          <div class="field">
            <label for="ac-phone">Số điện thoại</label>
            <input id="ac-phone" name="phone" type="tel" value="${escapeHtml(session.phone || "")}" placeholder="0909 888 777">
            <p class="error" data-error="phone"></p>
          </div>
        </div>

        <button class="btn btn-primary" type="submit">Lưu thông tin</button>
        <p class="form-success-msg" id="profile-success" hidden>Đã cập nhật thông tin cá nhân.</p>
      </form>

      <form class="form-card" id="password-form" novalidate>
        <h2>Đổi mật khẩu</h2>

        <div class="field">
          <label for="ac-current">Mật khẩu hiện tại <span class="req">*</span></label>
          <input id="ac-current" name="currentPassword" type="password" autocomplete="current-password" required>
          <p class="error" data-error="currentPassword"></p>
        </div>

        <div class="field">
          <label for="ac-new">Mật khẩu mới <span class="req">*</span></label>
          <input id="ac-new" name="newPassword" type="password" autocomplete="new-password" required>
          <p class="error" data-error="newPassword"></p>
        </div>

        <div class="field">
          <label for="ac-confirm">Xác nhận mật khẩu mới <span class="req">*</span></label>
          <input id="ac-confirm" name="confirm" type="password" autocomplete="new-password" required>
          <p class="error" data-error="confirm"></p>
        </div>

        <button class="btn btn-outline" type="submit">Đổi mật khẩu</button>
        <p class="form-success-msg" id="password-success" hidden>Đã đổi mật khẩu thành công.</p>
      </form>
    </div>

    <div class="account-bookings">
      <div class="section-title">
        <h2>Lịch sử đặt tour</h2>
        <p>Các đơn được nhận diện theo số điện thoại hoặc email trong hồ sơ của bạn.</p>
      </div>

      ${
        bookings.length
          ? `<ul class="account-booking-list">${bookings.map(bookingItem).join("")}</ul>`
          : `<p class="search-empty">Bạn chưa có đơn đặt tour nào. <a href="#/tours">Xem danh sách tour</a></p>`
      }
    </div>

    <div class="account-danger">
      <button class="btn btn-ghost-soft" type="button" id="account-logout">Đăng xuất</button>
    </div>
  </section>`;
}

function showErrors(form, errors) {
  form.querySelectorAll("[data-error]").forEach((node) => {
    const key = node.dataset.error;
    node.textContent = errors[key] || "";
    const field = form.querySelector(`[name="${key}"]`);
    if (field) field.classList.toggle("invalid", Boolean(errors[key]));
  });
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "account" || !getSession()) return;

  const profileForm = document.getElementById("profile-form");
  const passwordForm = document.getElementById("password-form");
  const profileSuccess = document.getElementById("profile-success");
  const passwordSuccess = document.getElementById("password-success");
  const list = document.querySelector(".account-booking-list");

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const session = getSession();
    const data = new FormData(profileForm);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const errors = {};

    if (!isName(name)) errors.name = "Vui lòng nhập họ và tên.";
    if (email && !isEmail(email)) errors.email = "Email chưa hợp lệ.";
    if (phone && !isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";

    if (Object.keys(errors).length) {
      profileSuccess.hidden = true;
      showErrors(profileForm, errors);
      return;
    }

    const result = updateProfile(session, { name, email, phone });
    if (result.errors) {
      profileSuccess.hidden = true;
      showErrors(profileForm, result.errors);
      return;
    }

    showErrors(profileForm, {});
    profileSuccess.hidden = false;

    const hero = document.querySelector(".page-hero h1");
    if (hero) hero.textContent = `Xin chào ${result.session.name}`;
  });

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const session = getSession();
    const data = new FormData(passwordForm);
    const currentPassword = String(data.get("currentPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    const confirm = String(data.get("confirm") || "");
    const errors = {};

    if (!currentPassword) errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    if (!newPassword) errors.newPassword = "Vui lòng nhập mật khẩu mới.";
    if (confirm !== newPassword) errors.confirm = "Xác nhận mật khẩu không khớp.";

    if (Object.keys(errors).length) {
      passwordSuccess.hidden = true;
      showErrors(passwordForm, errors);
      return;
    }

    const result = changePassword(session, { currentPassword, newPassword });
    if (result.errors) {
      passwordSuccess.hidden = true;
      showErrors(passwordForm, result.errors);
      return;
    }

    showErrors(passwordForm, {});
    passwordForm.reset();
    passwordSuccess.hidden = false;
  });

  if (list) {
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cancel-booking]");
      if (!button) return;
      const code = button.dataset.cancelBooking;
      if (!window.confirm(`Huỷ đơn ${code}?`)) return;
      updateBooking(code, { status: "cancelled" });
      document.dispatchEvent(new CustomEvent("app:refresh"));
    });
  }

  document.getElementById("account-logout").addEventListener("click", () => {
    logout();
    window.location.hash = "#/";
  });
});
