import { getSession } from "../auth.js";
import { myBookings } from "../store.js";
import { escapeHtml } from "../validate.js";
import { purchasedTicketCard } from "./account.js";

const FILTERS = [
  { key: "all", label: "Tất cả vé" },
  { key: "upcoming", label: "Sắp khởi hành" },
  { key: "completed", label: "Đã hoàn thành" },
];

function matchesStatus(booking, status) {
  if (status === "all") return true;
  if (status === "upcoming") return booking.status !== "completed";
  return booking.status === status;
}

export function MyTickets(path, params = {}, query = new URLSearchParams()) {
  const session = getSession();
  if (!session) {
    return `<section class="section container container-narrow"><div class="form-card login-card center"><h2>Vui lòng đăng nhập</h2><p class="form-hint">Đăng nhập để xem vé của bạn.</p><a class="btn btn-primary" href="#/login?next=my-tickets">Đăng nhập</a></div></section>`;
  }

  const status = FILTERS.some((filter) => filter.key === query.get("status")) ? query.get("status") : "all";
  const code = String(query.get("code") || "").trim().toLowerCase();
  const bookings = myBookings(session)
    .filter((booking) => booking.payment === "paid" && booking.status !== "cancelled")
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const visible = bookings.filter((booking) => matchesStatus(booking, status) && (!code || String(booking.code).toLowerCase().includes(code)));
  const tabs = FILTERS.map((filter) => `<a class="track-tab${filter.key === status ? " active" : ""}" href="#/my-tickets?status=${filter.key}">${filter.label}</a>`).join("");

  return `<section class="page-hero"><div class="container"><span class="hero-eyebrow">Tài khoản của tôi</span><h1>Vé của tôi</h1><p>Danh sách toàn bộ vé đã thanh toán của bạn.</p></div></section>
    <section class="section container">
      <div class="track-toolbar"><div class="track-tabs">${tabs}</div><a class="btn btn-outline" href="#/my-bookings">Xem tất cả đơn</a></div>
      <form class="booking-code-search" action="#/my-tickets" method="get">
        <label for="ticket-code-query">Tìm theo mã vé</label>
        <div class="booking-code-search-row"><input id="ticket-code-query" name="code" value="${escapeHtml(query.get("code") || "")}" placeholder="Ví dụ: TG12345"><input type="hidden" name="status" value="${escapeHtml(status)}"><button class="btn btn-outline" type="submit">Tìm vé</button></div>
      </form>
      ${visible.length ? `<div class="purchased-tickets-grid">${visible.map((booking) => purchasedTicketCard(booking)).join("")}</div>` : `<p class="search-empty">${bookings.length ? "Không tìm thấy vé phù hợp." : 'Bạn chưa có vé đã thanh toán. <a href="#/tours">Khám phá tour</a>'}</p>`}
    </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "my-tickets" || !getSession()) return;
  document.querySelector(".booking-code-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const search = new URLSearchParams();
    search.set("status", String(data.get("status") || "all"));
    const code = String(data.get("code") || "").trim();
    if (code) search.set("code", code);
    window.location.hash = `#/my-tickets?${search.toString()}`;
  });
});
