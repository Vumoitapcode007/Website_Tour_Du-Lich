import { getCurrentUser } from "../auth.js";

export function renderHeader(active = "") {
  const user = getCurrentUser();

  const items = [
    { path: "", label: "Trang chủ" },
    { path: "about", label: "Giới thiệu" },
  ];

  const nav = items
    .map(
      (item) => `
      <li>
        <a href="#/${item.path}" class="${active === item.path ? "active" : ""}">${item.label}</a>
      </li>`
    )
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
          <a href="#/login" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Tài khoản của tôi
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
      <a class="logo" href="#/">
        <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
          <path fill="#1677ff" d="M24 44 2 22l9-9-2-9 9 2 9-8 9 8 9-2-2 9 9 9-22 22z" opacity=".15"/>
          <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
          <path fill="#0d47a1" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
        </svg>
        <span>Travel<span>Go</span></span>
      </a>
      <button class="nav-toggle" aria-label="Mở menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="menu-wrap">
        <ul class="menu">
          ${nav}
        </ul>
        ${authNavHtml}
      </nav>
    </div>
  </header>`;
}

export function renderFooter() {
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
        <p class="muted">Website đặt tour du lịch - đồng hành cùng mọi chuyến đi của bạn.</p>
      </div>
      <div>
        <h4>Liên kết nhanh</h4>
        <ul class="footer-links">
          <li><a href="#/">Trang chủ</a></li>
          <li><a href="#/about">Giới thiệu</a></li>
          <li><a href="#/login">Đăng nhập</a></li>
          <li><a href="#/register">Đăng ký thành viên</a></li>
        </ul>
      </div>
      <div>
        <h4>Liên hệ</h4>
        <ul class="footer-links">
          <li>Hotline: 1900 1234</li>
          <li>Email: hello@travelgo.vn</li>
          <li>123 Đường Biển, Quận 1, TP. Hồ Chí Minh</li>
        </ul>
      </div>
      <div>
        <h4>Theo dõi chúng tôi</h4>
        <div class="socials">
          <a href="#" aria-label="Facebook">Facebook</a>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="YouTube">YouTube</a>
        </div>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; 2026 TravelGo. Bản quyền thuộc về TravelGo.</p>
    </div>
  </footer>`;
}