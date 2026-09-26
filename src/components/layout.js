import { getSession, isStaffRole } from "../auth.js";
import { getSettings } from "../store.js";

export const navItems = [
  { path: "", label: "Trang chủ", aliases: [] },
  { path: "tours", label: "Danh sách tour", aliases: ["tour"] },
  { path: "about", label: "Giới thiệu", aliases: [] },
  { path: "contact", label: "Liên hệ", aliases: [] },
];

const adminItem = { path: "admin", label: "Quản trị", aliases: [] };
const loginItem = { path: "login", label: "Đăng nhập", aliases: [] };
const profileItem = { path: "admin/profile", label: "Hồ sơ", aliases: [] };
const logoutItem = { path: "login", label: "Đăng xuất", aliases: ["logout"] };

function isActive(active, item) {
  if (item.aliases?.includes("logout")) return false;
  return [item.path, ...(item.aliases || [])].some(
    (key) => active === key || active.startsWith(`${key}/`)
  );
}

export function renderHeader(active = "") {
  const session = getSession();
  const staff = isStaffRole(session?.roleKey);
  const items = staff
    ? [...navItems, adminItem, profileItem, logoutItem]
    : session
      ? [...navItems, loginItem]
      : [...navItems, loginItem];

  const nav = items
    .map((item) => {
      if (item.aliases?.includes("logout")) {
        return `<li><a href="#/login" data-logout="1" class="${isActive(active, item) ? "active" : ""}">${item.label}</a></li>`;
      }
      return `
      <li>
        <a href="#/${item.path}" class="${isActive(active, item) ? "active" : ""}">${item.label}</a>
      </li>`;
    })
    .join("");

  return `
  <header class="site-header">
    <div class="container nav">
      <a class="logo" href="#/">
        <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
          <path fill="#1677ff" d="M24 44 2 22l9-9-2-9 9 2 9-8 9 8 9-2-2 9 9 9-22 22z" opacity=".15"/>
          <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
          <path fill="#0d47a1" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
        </svg>
        <span>Travel<span>Go</span></span>
      </a>
      <button class="nav-toggle" aria-label="Mở menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="menu-wrap">
        <ul class="menu">
          ${nav}
        </ul>
        <a class="btn btn-primary" href="#/booking">Đặt tour</a>
      </nav>
    </div>
  </header>`;
}

export function renderFooter() {
  const settings = getSettings();

  return `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="logo light" href="#/">
          <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
            <path fill="#fff" d="M24 44 15 26 2 22h44L31 26z"/>
            <path fill="#93c5fd" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
          </svg>
          <span>Travel<span>Go</span></span>
        </a>
        <p class="muted">${settings.footerNote}</p>
      </div>
      <div>
        <h4>Liên kết</h4>
        <ul class="footer-links">
          <li><a href="#/">Trang chủ</a></li>
          <li><a href="#/tours">Danh sách tour</a></li>
          <li><a href="#/about">Giới thiện</a></li>
          <li><a href="#/contact">Liên hệ</a></li>
          <li><a href="#/register">Đăng ký tài khoản</a></li>
          <li><a href="#/admin">Quản trị</a></li>
        </ul>
      </div>
      <div>
        <h4>Liên hệ</h4>
        <ul class="footer-links">
          <li>Hotline: <a href="tel:${String(settings.hotline).replace(/\D/g, "")}">${settings.hotline}</a></li>
          <li>Email: <a href="mailto:${settings.email}">${settings.email}</a></li>
          <li>${settings.address}</li>
          <li>${settings.hours}</li>
        </ul>
      </div>
      <div>
        <h4>Theo dõi</h4>
        <div class="socials">
          <a href="#" aria-label="Facebook">Facebook</a>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="YouTube">YouTube</a>
        </div>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; 2026 ${settings.siteName}. Bản quyền thuộc về ${settings.siteName}.</p>
    </div>
  </footer>`;
}
