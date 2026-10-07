import {
  ROLES,
  canAccessAdmin,
  canAccessAdminArea,
  getSession,
  hasPermission,
  isAdminRole,
  isGuideRole,
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

/* Khu vực riêng của Tour Guide - dùng chung layout/CSS với khu vực quản trị */
export const GUIDE_SECTIONS = {
  dashboard: { title: "Bảng điều khiển", desc: "Tour được phân công và tình trạng khách của bạn" },
  tours: { title: "Tour của tôi", desc: "Lịch trình và danh sách khách của từng chuyến" },
  bookings: { title: "Danh sách khách", desc: "Khách được phân công cùng trạng thái đơn" },
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

export const GUIDE_NAV = [
  {
    group: "Công việc của tôi",
    items: [
      { path: "dashboard", label: "Bảng điều khiển", icon: "◈", perm: "guide.dashboard.view" },
      { path: "tours", label: "Tour của tôi", icon: "◉", perm: "guide.tours.view", badge: "guideTours" },
      { path: "bookings", label: "Danh sách khách", icon: "◍", perm: "guide.customers.view", badge: "guideGuests" },
    ],
  },
  {
    group: "Cá nhân",
    items: [{ path: "profile", label: "Hồ sơ", icon: "◐", perm: "guide.dashboard.view" }],
  },
];

/* "admin" hoặc "guide" - quyết định bảng section, menu và tiều đề vỏ */
export function shellArea(path = "") {
  return String(path).split("/")[0] === "guide" ? "guide" : "admin";
}

export function adminSection(path = "dashboard", area = "admin") {
  const sections = area === "guide" ? GUIDE_SECTIONS : ADMIN_SECTIONS;
  const key = String(path || "").split("/")[0] || "dashboard";
  return sections[key] ? key : "dashboard";
}

function badgeCounts(area = "admin", guideId = "") {
  if (area === "guide") {
    const mine = listBookings().filter((item) => item.guideId === guideId);
    return {
      guideTours: new Set(mine.map((item) => String(item.tourId))).size,
      guideGuests: mine
        .filter((item) => ["upcoming", "ongoing"].includes(item.status))
        .reduce((sum, item) => sum + (Number(item.people) || 0), 0),
    };
  }
  return {
    bookings: listBookings().filter((item) => item.status === "pending").length,
    messages: listMessages().filter((item) => !item.read).length,
    reviews: listReviews().filter((item) => item.status === "pending").length,
  };
}

function deniedView(area = "admin") {
  const isGuide = area === "guide";
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">${isGuide ? "Khu vực hướng dẫn viên" : "Khu vực quản trị"}</span>
      <h1>Không có quyền truy cập</h1>
      <p>Tài khoản của bạn không được phép xem mục này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.</p>
    </div>
  </section>
  <section class="section container center">
    <a class="btn btn-light btn-lg" href="#/${area}/dashboard">Về bảng điều khiển</a>
  </section>`;
}

export function adminDenied() {
  return deniedView();
}

/* Chỉ admin/manager/staff mới vào được #/admin */
export function adminGuard(permission) {
  if (!canAccessAdminArea()) return deniedView();
  if (permission && !hasPermission(permission)) return deniedView();
  return "";
}

/* Chỉ tour_guide mới vào được #/guide */
export function guideGuard(permission) {
  const session = getSession();
  if (!session || !isGuideRole(session.roleKey)) return deniedView("guide");
  if (permission && !hasPermission(permission)) return deniedView("guide");
  return "";
}

/* ---------- Layout vỏ quản trị ---------- */

export function renderAdminShell(path = "dashboard", params = {}) {
  const area = shellArea(path);

  if (area === "guide") {
    if (!canAccessAdmin()) return deniedView("guide");
  } else if (!canAccessAdminArea()) {
    return deniedView();
  }

  const section = adminSection(params.section || path, area);
  const meta = (area === "guide" ? GUIDE_SECTIONS : ADMIN_SECTIONS)[section];
  const nav = area === "guide" ? GUIDE_NAV : ADMIN_NAV;
  const session = getSession();
  const counts = badgeCounts(area, session?.username || "");
  const perms = ROLES[session?.roleKey] || ROLES.customer;
  const isGuide = area === "guide";

  const groups = nav
    .map((group) => {
      const items = group.items
        .filter((item) => hasPermission(item.perm))
        .map((item) => {
          const active = item.path === section;
          const count = item.badge ? counts[item.badge] : 0;
          return `
        <li>
          <a href="#/${area}/${item.path}" class="admin-nav-link${active ? " active" : ""}">
            <span class="admin-nav-icon" aria-hidden="true">${item.icon}</span>
            <span>${escapeHtml(item.label)}</span>
            ${count ? `<span class="admin-nav-badge">${count}</span>` : ""}
          </a>
        </li>`;
        })
        .join("");
      return items ? `<p class="admin-nav-group">${escapeHtml(group.group)}</p><ul class="admin-nav">${items}</ul>` : "";
    })
    .join("");

  const quick = isGuide
    ? `<a class="admin-quick" href="#/guide/tours">
         <span>Chuyến đang chuẩn bị</span>
         <strong>${counts.guideTours}</strong>
       </a>
       <a class="admin-quick" href="#/guide/bookings">
         <span>Khách cần đón</span>
         <strong>${counts.guideGuests}</strong>
       </a>`
    : `<a class="admin-quick" href="#/admin/bookings">
         <span>Đơn chờ xử lý</span>
         <strong>${counts.bookings}</strong>
       </a>
       <a class="admin-quick" href="#/admin/messages">
         <span>Tin nhắn mới</span>
         <strong>${counts.messages}</strong>
       </a>`;

  return `
  <div class="admin-shell${isGuide ? " admin-shell-guide" : ""}" data-section="${section}" data-area="${area}">
    <div class="admin-backdrop" data-sidebar-close></div>
    <aside class="admin-sidebar" id="admin-sidebar">
      <a class="admin-brand" href="#/${area}/dashboard">
        <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
          <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
          <path fill="#93c5fd" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
        </svg>
        <span>Travel<b>Go</b></span>
        <em>${isGuide ? "Hướng dẫn" : "Quản trị"}</em>
      </a>

      <nav class="admin-nav-wrap">${groups}</nav>

      <div class="admin-sidebar-foot">
        <a class="admin-user" href="#/${area}/profile">
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
          ${quick}
          <a class="admin-quick admin-quick-role" href="#/${area}/profile">
            <span>${escapeHtml(perms.label)}</span>
            <strong>${escapeHtml(session?.username || "")}</strong>
          </a>
        </div>
      </header>
      <main class="admin-content" id="admin-content">
        <p class="admin-stamp">Phiên đăng nhập: ${formatDateTime(session?.loginAt)}</p>`;
}

export function closeAdminShell(path = "", params = {}) {
  if (shellArea(path) === "guide") {
    if (!canAccessAdmin()) return "";
  } else if (!canAccessAdminArea()) {
    return "";
  }
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

export function adminOnly(roleKey) {
  return isAdminRole(roleKey);
}

export function refreshAdmin() {
  document.dispatchEvent(new CustomEvent("app:refresh"));
}

document.addEventListener("route:changed", ({ detail }) => {
  const path = String(detail.path || "");
  if (shellArea(path) !== "guide" && !path.startsWith("admin")) return;
  if (!isStaffRole(getSession()?.roleKey)) return;
  setupAdminShell();
});
