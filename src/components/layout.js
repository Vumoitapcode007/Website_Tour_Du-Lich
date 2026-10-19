import { getSession, isStaffRole } from "../auth.js";
import { getSettings } from "../store.js";
import { compareBar } from "./compare-bar.js";
import { notificationBell } from "./notification-bell.js";
import { chatWidget } from "./chat-widget.js";
export const navItems = [
  { path: "", label: "Trang chủ", aliases: [] },
  { path: "tours", label: "Danh sách tour", aliases: ["tour"] },
  { path: "blog", label: "Cẩm nang", aliases: ["blog"] },
  { path: "about", label: "Giới thiệu", aliases: [] },
  { path: "contact", label: "Liên hệ", aliases: [] },
];

const adminItem = { path: "admin", label: "Quản trị", aliases: [] };
const loginItem = { path: "login", label: "Đăng nhập", aliases: [] };
const profileItem = { path: "admin/profile", label: "Hồ sơ", aliases: [] };
const accountItem = { path: "account", label: "Tài khoản", aliases: [] };
const logoutItem = { path: "login", label: "Đăng xuất", aliases: ["logout"] };

function isActive(active, item) {
  if (item.aliases?.includes("logout")) return false;
  return [item.path, ...(item.aliases || [])].some(
    (key) => active === key || active.startsWith(`${key}/`)
  );
}

export function renderHeader(active = "") {
  const session = getSession();
  const user = session ? { ...session, avatar: session.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || "User")}&background=0284c7&color=fff` } : null;
  const staff = isStaffRole(session?.roleKey);
  const isGuide = session?.roleKey === "tour_guide";
  
  const currentAdminItem = isGuide ? { path: "guide", label: "Bảng điều khiển", aliases: [] } : adminItem;
  const currentProfileItem = isGuide ? { path: "guide/profile", label: "Hồ sơ", aliases: [] } : profileItem;

const registerItem = { path: "register", label: "Đăng ký", aliases: [] };

  const items = staff
    ? [...navItems, currentAdminItem, currentProfileItem, logoutItem]
    : session
      ? [...navItems, accountItem, logoutItem]
      : [...navItems, loginItem, registerItem];

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

  // Nút Auth hoặc Dropdown User
  let authNavHtml = "";
  if (user) {
    authNavHtml = `
      <div class="user-menu-dropdown">
        <button class="user-profile-btn" id="btn-user-menu" aria-haspopup="true">
          <img src="${user.avatar}" alt="${user.name}" class="user-avatar-sm" />
          <span class="user-name">${user.name.split(" ").slice(-1)[0] || user.name}</span>
          <svg class="dropdown-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div class="user-dropdown-menu" id="user-dropdown">
          <div class="dropdown-header">
            <strong>${user.name}</strong>
            <small class="text-muted">${user.email}</small>
          </div>
          <div class="dropdown-divider"></div>
          <a href="#/account" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Tài khoản của tôi
          </a>
          <a href="#/payment" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Thanh toán đơn tour
          </a>
          <button class="dropdown-item text-danger" id="btn-header-logout" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>
    `;
  } else {
    authNavHtml = `
      <div class="auth-btn-group">
        <a class="btn-auth-link ${active === "login" ? "active" : ""}" href="#/login">Đăng nhập</a>
        <a class="btn btn-primary btn-sm-pill" href="#/register">Đăng ký</a>
      </div>
    `;
  }

  return `
  <header class="site-header">
    <div class="container nav">
      <div class="nav-left">
        <a class="logo" href="#/">
          <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
            <path fill="#1677ff" d="M24 44 2 22l9-9-2-9 9 2 9-8 9 8 9-2-2 9 9 9-22 22z" opacity=".15"/>
            <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
            <path fill="#0d47a1" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
          </svg>
          <span>Travel<span>Go</span></span>
        </a>
        ${notificationBell()}
      </div>
      <button class="nav-toggle" aria-label="Mở menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="menu-wrap">
        <ul class="menu">
          ${nav}
        </ul>
      </nav>
    </div>
  </header>`;
}

export function renderFooter() {
  const settings = getSettings();

  return `
  <footer class="site-footer">
    <div class="container footer-newsletter-strip">
      <div class="newsletter-strip-info">
        <h3>📬 Đăng ký nhận cẩm nang & ưu đãi độc quyền</h3>
        <p>Nhận ngay mã giảm giá <strong>TRAVELGO10</strong> (giảm 10% tối đa 200k) gửi trực tiếp về email.</p>
      </div>
      <form class="newsletter-strip-form" id="footer-newsletter-form">
        <input type="email" placeholder="Nhập địa chỉ email của bạn..." required>
        <button type="submit" class="btn btn-primary">Nhận ưu đãi</button>
      </form>
    </div>

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
        <div class="footer-cert" style="margin-top: 12px; display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); padding: 6px 12px; border-radius: 6px; font-size: 0.8rem;">
          <span>🛡️</span>
          <span>Đã đăng ký chứng nhận an toàn du lịch 2026</span>
        </div>
      </div>
      <div>
        <h4>Khám phá & Tour</h4>
        <ul class="footer-links">
          <li><a href="#/">Trang chủ</a></li>
          <li><a href="#/tours">Danh sách tour</a></li>
          <li><a href="#/blog">Cẩm nang du lịch</a></li>
          <li><a href="#/about">Về chúng tôi</a></li>
          <li><a href="#/contact">Liên hệ tư vấn</a></li>
        </ul>
      </div>
      <div>
        <h4>Chính sách & Quy định</h4>
        <ul class="footer-links">
          <li><a href="#/policies?tab=terms">Điều khoản dịch vụ</a></li>
          <li><a href="#/policies?tab=privacy">Chính sách bảo mật</a></li>
          <li><a href="#/policies?tab=refund">Hủy tour & Hoàn tiền</a></li>
          <li><a href="#/policies?tab=insurance">Bảo hiểm du lịch</a></li>
          <li><a href="#/my-bookings">Tra cứu đơn tour</a></li>
        </ul>
      </div>
      <div>
        <h4>Liên hệ hỗ trợ</h4>
        <ul class="footer-links">
          <li>Hotline 24/7: <a href="tel:${String(settings.hotline).replace(/\D/g, "")}">${settings.hotline}</a></li>
          <li>Email: <a href="mailto:${settings.email}">${settings.email}</a></li>
          <li>${settings.address}</li>
          <li>${settings.hours}</li>
        </ul>
        <div class="socials" style="margin-top: 12px;">
          <a href="#" aria-label="Facebook">Facebook</a>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="YouTube">YouTube</a>
        </div>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; 2026 ${settings.siteName}. Giấy phép kinh doanh dịch vụ lữ hành quốc tế số 01-1234/2026/TCDL-GP LHQT.</p>
    </div>
  </footer>
  ${compareBar()}
  ${chatWidget()}`;
}

document.addEventListener("submit", (e) => {
  if (e.target.id === "footer-newsletter-form") {
    e.preventDefault();
    const input = e.target.querySelector("input[type='email']");
    if (input && input.value) {
      alert(`Đăng ký thành công! TravelGo đã ghi nhận email ${input.value}. Mã giảm giá của bạn là: TRAVELGO10 (áp dụng khi đặt tour).`);
      input.value = "";
    }
  }
});
