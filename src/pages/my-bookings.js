import { getSession } from "../auth.js";
import { myBookings, cancelBooking, isCancelledBooking } from "../store.js";
import { bookingTracker } from "../components/booking-tracker.js";
import { escapeHtml } from "../validate.js";
import { syncNotificationBadge } from "../components/notification-bell.js";

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "waiting", label: "Chờ thanh toán" },
  { key: "trip", label: "Sắp đi / đang đi" },
  { key: "completed", label: "Đã hoàn thành" },
  { key: "cancelled", label: "Đã huỷ" },
];

const GROUPS = {
  waiting: ["confirmed", "awaiting_payment", "paid"],
  trip: ["upcoming", "ongoing"],
};

function matchGroup(key, status) {
  if (GROUPS[key]) return GROUPS[key].includes(status);
  return key === status;
}

function Guard() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Đơn đặt tour</span>
      <h1>Theo dõi đơn hàng</h1>
      <p>Đăng nhập để xem trạng thái các đơn tour bạn đã đặt.</p>
    </div>
  </section>
  <section class="section container container-narrow">
    <div class="form-card login-card center">
      <h2>Vui lòng đăng nhập</h2>
      <p class="form-hint account-hint">Chỉ tài khoản đã đăng nhập mới theo dõi được đơn đặt tour của mình.</p>
      <div class="success-actions">
        <a class="btn btn-primary btn-lg" href="#/login?next=my-bookings">Đăng nhập</a>
        <a class="btn btn-outline btn-lg" href="#/register?next=my-bookings">Tạo tài khoản</a>
      </div>
    </div>
  </section>`;
}

function stat(value, label) {
  return `<div class="admin-stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

export function MyBookings(path, params = {}, query = new URLSearchParams()) {
  const session = getSession();
  if (!session) return Guard();

  const status = FILTERS.some((item) => item.key === query.get("status"))
    ? query.get("status")
    : "all";
  const bookings = myBookings(session).sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
  const visible =
    status === "all" ? bookings : bookings.filter((item) => matchGroup(status, item.status));
  const total = bookings
    .filter((item) => !isCancelledBooking(item))
    .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const tabs = FILTERS.map(
    (item) => `<a class="track-tab${item.key === status ? " active" : ""}" href="#/my-bookings?status=${item.key}">${item.label}</a>`
  ).join("");

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Đơn đặt tour</span>
      <h1>Theo dõi đơn hàng</h1>
      <p>Xin chào ${escapeHtml(session.name)}, theo dõi trạng thái và thanh toán các đơn của bạn.</p>
    </div>
  </section>

  <section class="section container">
    <div class="admin-stats">
      ${stat(bookings.length, "Tổng đơn")}
      ${stat(
        bookings.filter((item) => ["pending", "confirmed", "awaiting_payment"].includes(item.status))
          .length,
        "Đang xử lý"
      )}
      ${stat(bookings.filter((item) => GROUPS.trip.includes(item.status)).length, "Sắp đi / đang đi")}
      ${stat(bookings.filter((item) => item.status === "completed").length, "Đã hoàn thành")}
      ${stat(`${new Intl.NumberFormat("vi-VN").format(total)} VNĐ`, "Tổng chi tiêu")}
    </div>

    <div class="track-toolbar">
      <div class="track-tabs">${tabs}</div>
      <a class="btn btn-primary" href="#/tours">Đặt tour mới</a>
    </div>

    ${
      visible.length
        ? `<ul class="account-booking-list">${visible.map((item) => bookingTracker(item)).join("")}</ul>`
        : `<p class="search-empty">${
            bookings.length
              ? "Không có đơn nào ở trạng thái này."
              : 'Bạn chưa có đơn đặt tour nào. <a href="#/tours">Xem danh sách tour</a>'
          }</p>`
    }
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "my-bookings" || !getSession()) return;

  const list = document.querySelector(".account-booking-list");
  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cancel-booking]");
    if (!button) return;
    const code = button.dataset.cancelBooking;
    if (!window.confirm(`Huỷ đơn ${code}? Chuyên viên sẽ gọi lại để hỗ trợ bạn đặt tour mới.`)) return;
    const result = cancelBooking(code, { by: getSession()?.name || "Khách hàng", reason: "Khách tự huỷ" });
    if (result.error) {
      window.alert(result.error);
      return;
    }
    syncNotificationBadge();
    document.dispatchEvent(new CustomEvent("app:refresh"));
  });
});