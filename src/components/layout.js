export function renderHeader(active = "") {
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
        <a class="btn btn-primary" href="#/about">Xem ngay</a>
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
        <h4>Liên kết</h4>
        <ul class="footer-links">
          <li><a href="#/">Trang chủ</a></li>
          <li><a href="#/about">Giới thiệu</a></li>
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
        <h4>Theo dõi</h4>
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