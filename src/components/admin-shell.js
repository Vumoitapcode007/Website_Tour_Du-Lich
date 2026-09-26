import {
  ROLES,
  canAccessAdmin,
  getSession,
  hasPermission,
  isStaffRole,
  logout,
} from "../auth.js";
import { listBookings, listMessages, listReviews } from "../store.js";
import { formatDateTime } from "../reports.js";
import { escapeHtml } from "../validate.js";
import { initials } from "./admin-ui.js";

export const ADMIN_SECTIONS = {
  dashboard: { title: "Bảng điều khiển", desc: "Tổng quan hoạt động của TravelGo" },
  bookings: { title: "Đơn đặt tour", desc: "Theo dõi và xử lý đơn từ khách hàng" },
  tours: { title: "Quản lý tour", desc: "Danh mục tour, lịch trình và chỗ còn" },
  customers: { title: "Khách hàng", desc: "Hồ sơ khách hàng và lịch sử đặt tour" },
  messages: { title: "Tin nhắn", desc: "Tin nhắn từ biểu mẫu liên hệ" },
  reviews: { title: "Đánh giá", desc: "Duyệt đánh giá khách hàng về tour" },
  promotions: { title: "Khuyến mãi", desc: "Mã giảm giá và ưu đãi đang chạy" },
  reports: { title: "Báo cáo", desc: "Phân tích doanh thu và hành vi khách hàng" },
  users: { title: "Tài khoản", desc: "Quản lý nhân viên và tài khoản khách hàng" },
  settings: { title: "Cài đặt", desc: "Thông tin website và cấu hình hệ thống" },
  logs: { title: "Nhật ký", desc: "Lịch sử thao tác trong khu vực quản trị" },
  profile: { title: "Hồ sơ cá nhân", desc: "Thông tin tài khoản và bảo mật" },
};

export const ADMIN_NAV = [
  {
    group: "Tổng quan",
    items: [{ path: "dashboard", label: "Bảng điều khiển", icon: "◈", perm: "dashboard.view" }],
  },
  {
    group: "Nghiệp vụ",
    items: [
      { path: "bookings", label: "Đơn đặt tour", icon: "▤", perm: "bookings.view", badge: "bookings" },
      { path: "tours", label: "Tour", icon: "◉", perm: "tours.view" },
      { path: "customers", label: "Khách hàng", icon: "◍", perm: "customers.view" },
      { path: "messages", label: "Tin nhắn", icon: "✉", perm: "messages.view", badge: "messages" },
    ],
  },
  {
    group: "Tăng trưởng",
    items: [
      { path: "reviews", label: "Đánh giá", icon: "★", perm: "reviews.view", badge: "reviews" },
      { path: "promotions", label: "Khuyến mãi", icon: "◐", perm: "promotions.view" },
      { path: "reports", label: "Báo cáo", icon: "▦", perm: "reports.view" },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { path: "users", label: "Tài khoản", icon: "⚿", perm: "users.view" },
      { path: "settings", label: "Cài đặt", icon: "⚙", perm: "settings.view" },
      { path: "logs", label: "Nhật ký", icon: "⎔", perm: "logs.view" },
    ],
  },
  {
    group: "Cá nhân",
    items: [{ path: "profile", label: "Hồ sơ", icon: "◐", perm: "dashboard.view" }],
  },
];

export function adminSection(path = "dashboard") {
  const key = String(path || "").split("/")[0] || "dashboard";
  return ADMIN_SECTIONS[key] ? key : "dashboard";
}

function badgeCounts() {
  return {
    bookings: listBookings().filter((item) => item.status === "pending").length,
    messages: listMessages().filter((item) => !item.read).length,
    reviews: listReviews().filter((item) => item.status === "pending").length,
  };
}

function deniedView() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Khu vực quản trị</span>
      <h1>Không có quyền truy cập</h1>
      <p>Tài khoản của bạn không được phép xem mục này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.</p>
    </div>
  </section>
  <section class="section container center">
    <a class="btn btn-light btn-lg" href="#/admin/dashboard">Về bảng điều khiển</a>
  </section>`;
}

export function adminDenied() {
  return deniedView();
}

export function adminGuard(permission) {
  if (!canAccessAdmin()) return deniedView();
  if (permission && !hasPermission(permission)) return deniedView();
  return "";
}

/* ---------- Layout vỏ quản trị ---------- */

export function renderAdminShell(path = "dashboard", params = {}) {
  if (!canAccessAdmin()) return deniedView();

  const section = adminSection(params.section || path);
  const meta = ADMIN_SECTIONS[section];
  const session = getSession();
  const counts = badgeCounts();
  const perms = session ? ROLES[session.roleKey] : ROLES.customer;

  const groups = ADMIN_NAV.map((group) => {
    const items = group.items
      .filter((item) => hasPermission(item.perm))
      .map((item) => {
        const active = item.path === section;
        const count = item.badge ? counts[item.badge] : 0;
        return `
        <li>
          <a href="#/admin/${item.path}" class="admin-nav-link${active ? " active" : ""}">
            <span class="admin-nav-icon" aria-hidden="true">${item.icon}</span>
            <span>${escapeHtml(item.label)}</span>
            ${count ? `<span class="admin-nav-badge">${count}</span>` : ""}
          </a>
        </li>`;
      })
      .join("");
    return items ? `<p class="admin-nav-group">${escapeHtml(group.group)}</p><ul class="admin-nav">${items}</ul>` : "";
  }).join("");

  return `
  <div class="admin-shell" data-section="${section}">
    <div class="admin-backdrop" data-sidebar-close></div>
    <aside class="admin-sidebar" id="admin-sidebar">
      <a class="admin-brand" href="#/admin/dashboard">
        <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
          <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
          <path fill="#93c5fd" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
        </svg>
        <span>Travel<b>Go</b></span>
        <em>Quản trị</em>
      </a>

      <nav class="admin-nav-wrap">${groups}</nav>

      <div class="admin-sidebar-foot">
        <a class="admin-user" href="#/admin/profile">
          <span class="avatar-sm">${initials(session?.name)}</span>
          <span class="admin-user-info">
            <strong>${escapeHtml(session?.name || "")}</strong>
            <small>${escapeHtml(session?.role || "")}</small>
          </span>
        </a>
        <div class="admin-user-actions">
          <a class="btn btn-sm btn-ghost-soft" href="#/">Xem website</a>
          <button class="btn btn-sm btn-outline-danger" type="button" id="admin-signout">Đăng xuất</button>
        </div>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <button class="admin-burger" type="button" data-sidebar-open aria-label="Mở menu quản trị">☰</button>
        <div class="admin-topbar-title">
          <h1>${escapeHtml(meta.title)}</h1>
          <p>${escapeHtml(meta.desc)}</p>
        </div>
        <div class="admin-topbar-actions">
          <a class="admin-quick" href="#/admin/bookings">
            <span>Đơn chờ xử lý</span>
            <strong>${counts.bookings}</strong>
          </a>
          <a class="admin-quick" href="#/admin/messages">
            <span>Tin nhắn mới</span>
            <strong>${counts.messages}</strong>
          </a>
          <a class="admin-quick admin-quick-role" href="#/admin/profile">
            <span>${escapeHtml(perms.label)}</span>
            <strong>${escapeHtml(session?.username || "")}</strong>
          </a>
        </div>
      </header>
      <main class="admin-content" id="admin-content">
        <p class="admin-stamp">Phiên đăng nhập: ${formatDateTime(session?.loginAt)}</p>`;
}

export function closeAdminShell() {
  if (!canAccessAdmin()) return "";
  return `
      </main>
    </div>
  </div>`;
}

/* ---------- Hành vi chung của vỏ quản trị ---------- */

function toggleSidebar(open) {
  document.body.classList.toggle("sidebar-open", open);
}

export function setupAdminShell() {
  document.querySelector("[data-sidebar-open]")?.addEventListener("click", () => toggleSidebar(true));
  document.querySelector("[data-sidebar-close]")?.addEventListener("click", () => toggleSidebar(false));
  document.querySelector("#admin-signout")?.addEventListener("click", () => {
    if (!window.confirm("Đăng xuất khỏi khu vực quản trị?")) return;
    logout();
    window.location.hash = "#/login?next=admin";
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  toggleSidebar(false);
});

export function staffOnly(roleKey) {
  return isStaffRole(roleKey);
}

export function refreshAdmin() {
  document.dispatchEvent(new CustomEvent("app:refresh"));
}

document.addEventListener("route:changed", ({ detail }) => {
  if (!String(detail.path).startsWith("admin")) return;
  if (!isStaffRole(getSession()?.roleKey)) return;
  setupAdminShell();
});
