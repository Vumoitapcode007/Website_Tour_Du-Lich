import { DEMO_CREDENTIALS, ROLES, getSession, homePathForRole, isStaffRole, login } from "../auth.js";
import { escapeHtml } from "../validate.js";
import { getLocalStorageStats, resetDemoData } from "../store.js";
import { resetTours } from "../tour-repository.js";

const PUBLIC_ROUTES = [
  "",
  "tours",
  "booking",
  "about",
  "contact",
  "account",
  "my-bookings",
  "login",
  "register",
  "404",
];

/* next có thể kèm query, ví dụ "booking?tour=3&adults=2" */
function sanitizeNext(value) {
  const next = String(value || "").replace(/^#?\/?/, "");
  if (!next) return "";
  const [path, ...search] = next.split("?");
  if (path.startsWith("admin") || path.startsWith("guide")) return next;
  if (!PUBLIC_ROUTES.includes(path)) return "";
  const clean = search.join("?").replace(/[^a-z0-9=&%+\-._~:,/]/gi, "");
  return clean ? [path, clean].join("?") : path;
}

export function Login(path, params = {}, query = new URLSearchParams()) {
  const session = getSession();
  const home = homePathForRole(session?.roleKey);
  const staff = home !== "my-bookings";
  const stats = getLocalStorageStats();

  if (session) {
    const label =
      home === "guide" ? "Vào khu vực hướng dẫn viên" : home === "admin" ? "Vào trang quản trị" : "Tài khoản của tôi";
    return `
    <section class="page-hero">
      <div class="container">
        <span class="hero-eyebrow">Hệ thống mô phỏng</span>
        <h1>Phiên làm việc hiện tại</h1>
        <p>Bạn đang đăng nhập vào TravelGo với tài khoản mô phỏng lưu trên LocalStorage.</p>
      </div>
    </section>

    <section class="section container center">
      <div class="form-card login-card">
        <div class="success-icon">✓</div>
        <h2>Bạn đã đăng nhập</h2>
        <p>Xin chào <strong>${escapeHtml(session.name)}</strong> · ${escapeHtml(session.role)}</p>
        ${
          staff
            ? ""
            : `<p class="form-hint">Tài khoản khách hàng không được phép truy cập khu vực quản trị.</p>`
        }
        <div class="success-actions">
          <a class="btn btn-primary" href="#/${home === "my-bookings" ? "account" : `${home}/dashboard`}">${label}</a>
          <a class="btn btn-outline" href="#/">Về trang chủ</a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.875rem;">
          <strong style="color: #334155;">Bộ nhớ LocalStorage:</strong>
          <span style="color: #64748b;">Đang lưu ${stats.keys.map(k => `${k.label}: ${k.count}`).join(" · ")} (${stats.totalKb} KB)</span>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-outline-danger" type="button" data-logout style="flex: 1;">Đăng xuất phiên này</button>
          <a class="btn btn-ghost-soft" href="#/login?switch=1">Chuyển tài khoản khác</a>
        </div>
      </div>
    </section>`;
  }

  const roleBadges = {
    admin: '<span class="status-pill status-open">Toàn quyền Admin</span>',
    manager: '<span class="status-pill status-confirmed">Trưởng phòng</span>',
    staff: '<span class="status-pill status-pending">Nhân viên</span>',
    customer: '<span class="status-pill status-deposit">Khách hàng</span>',
  };

  const demoCards = DEMO_CREDENTIALS.map(
    (item) => `
    <div class="demo-card-box" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; transition: border-color 0.2s, box-shadow 0.2s;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <strong style="font-size: 1rem; color: #1e293b;">${escapeHtml(item.username)}</strong>
            ${roleBadges[item.roleKey] || ""}
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #64748b;">
            ${escapeHtml(item.name)} · <span style="color: #475569;">${escapeHtml(item.title || ROLES[item.roleKey]?.label || "")}</span>
          </p>
          <p style="margin: 4px 0 0; font-size: 0.8rem; color: #94a3b8; font-family: monospace;">
            Mật khẩu: <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155;">${escapeHtml(item.password)}</span>
          </p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
          <button class="btn btn-sm btn-primary" type="button" data-instant-login="${escapeHtml(item.username)}" data-instant-pass="${escapeHtml(item.password)}" title="Đăng nhập ngay không cần gõ mật khẩu">
            ⚡ Đăng nhập 1-Click
          </button>
          <button class="btn btn-xs btn-ghost-soft" type="button" data-demo-user="${escapeHtml(item.username)}" data-demo-pass="${escapeHtml(item.password)}" style="font-size: 0.75rem; padding: 2px 8px;">
            Điền form
          </button>
        </div>
      </div>
    </div>`
  ).join("");

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Mô phỏng hệ thống</span>
      <h1>Đăng nhập mô phỏng</h1>
      <p>Trang đăng nhập dành cho kiểm thử và quản lý tour TravelGo. Dữ liệu tài khoản, tour và đơn hàng lưu hoàn toàn trên LocalStorage.</p>
    </div>
  </section>

  <section class="section container login-layout" style="max-width: 1040px; margin: 0 auto;">
    <form class="form-card login-card" id="login-form" novalidate style="background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); padding: 2rem;">
      <h2 style="margin-top: 0; font-size: 1.4rem;">Đăng nhập hệ thống</h2>
      <p class="form-hint" style="margin-top: -0.5rem; margin-bottom: 1.5rem;">
        Nhập tài khoản hoặc chọn <strong>Đăng nhập 1-Click</strong> ở cột bên phải.
      </p>

      <div class="field">
        <label for="lg-username">Tài khoản hoặc email <span class="req">*</span></label>
        <input id="lg-username" name="username" type="text" placeholder="Ví dụ: admin hoặc email của bạn" autocomplete="username" required>
        <p class="error" data-error="username"></p>
      </div>

      <div class="field">
        <label for="lg-password">Mật khẩu <span class="req">*</span></label>
        <div class="password-field">
          <input id="lg-password" name="password" type="password" placeholder="Nhập mật khẩu (mặc định: 123456)" autocomplete="current-password" required>
          <button class="password-toggle" type="button" data-target="lg-password" aria-label="Hiện mật khẩu">Hiện</button>
        </div>
        <p class="error" data-error="password"></p>
      </div>

      <button class="btn btn-primary btn-lg btn-block" type="submit" style="margin-top: 0.5rem; font-weight: 600;">
        Đăng nhập
      </button>

      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #e2e8f0; font-size: 0.85rem; color: #64748b; line-height: 1.6;">
        <p style="margin: 0;">💡 <strong>Gợi ý:</strong> Bạn có thể sử dụng bất kỳ tài khoản demo nào để trải nghiệm đầy đủ quyền quản lý Tour (Thêm/Sửa/Xoá, Theo dõi tiến độ) và Quản lý Đơn đặt tour.</p>
      </div>
    </form>

    <aside class="login-demo" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a;">Tài khoản mô phỏng (Demo)</h3>
      </div>
      <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #64748b;">
        Bấm nút <strong>⚡ Đăng nhập 1-Click</strong> để truy cập ngay với vai trò tương ứng:
      </p>

      <div class="demo-list">${demoCards}</div>

      <div class="localstorage-box" style="margin-top: 1.25rem; padding: 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <strong style="font-size: 0.85rem; color: #0f172a;">💾 Bộ nhớ LocalStorage:</strong>
          <span style="font-size: 0.75rem; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Hoạt động</span>
        </div>
        <p style="margin: 0 0 8px; font-size: 0.8rem; color: #64748b;">
          Đã lưu ${stats.keys.find(k => k.key === "travelgo.tours")?.count || 0} tour · ${stats.keys.find(k => k.key === "travelgo.bookings")?.count || 0} đơn đặt tour trên trình duyệt này.
        </p>
        <button class="btn btn-xs btn-outline" type="button" id="btn-reset-demo" style="width: 100%; font-size: 0.8rem;">
          🔄 Đặt lại dữ liệu mẫu LocalStorage
        </button>
      </div>
    </aside>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "login") return;

  const form = document.getElementById("login-form");

  // Toggle password visibility
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Ẩn" : "Hiện";
    });
  });

  // Điền form
  document.querySelectorAll("[data-demo-user]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!form) return;
      form.elements.username.value = button.dataset.demoUser;
      form.elements.password.value = button.dataset.demoPass;
      form.querySelectorAll("[data-error]").forEach((node) => (node.textContent = ""));
    });
  });

  // 1-Click Instant Login
  document.querySelectorAll("[data-instant-login]").forEach((button) => {
    button.addEventListener("click", () => {
      const username = button.dataset.instantLogin;
      const password = button.dataset.instantPass;
      const result = login(username, password);
      if (result) {
        const staff = isStaffRole(result.roleKey);
        const next = sanitizeNext(new URLSearchParams(detail.queryString).get("next"));
        window.location.hash = `#/${next || (staff ? "admin/tours" : "account")}`;
      }
    });
  });

  // Reset LocalStorage demo data
  document.getElementById("btn-reset-demo")?.addEventListener("click", () => {
    if (!window.confirm("Khôi phục toàn bộ danh sách tour và đơn hàng về dữ liệu mẫu gốc trên LocalStorage?")) return;
    resetDemoData();
    resetTours();
    window.alert("Đã khôi phục dữ liệu mẫu LocalStorage thành công!");
    window.location.reload();
  });

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    const errorBox = form.querySelector('[data-error="password"]');

    form.querySelectorAll("[data-error]").forEach((node) => (node.textContent = ""));

    if (!username) {
      form.querySelector('[data-error="username"]').textContent = "Vui lòng nhập tài khoản hoặc email.";
      return;
    }
    if (!password) {
      errorBox.textContent = "Vui lòng nhập mật khẩu.";
      return;
    }

    const result = login(username, password);
    if (result?.locked) {
      errorBox.textContent = "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.";
      return;
    }
    if (!result) {
      errorBox.textContent = "Tài khoản hoặc mật khẩu không đúng (Thử lại với: 123456).";
      return;
    }

    const home = homePathForRole(result.roleKey);
    const next = sanitizeNext(new URLSearchParams(detail.queryString).get("next"));
    if (next?.startsWith("admin") && home !== "admin") {
      errorBox.textContent = "Tài khoản của bạn không có quyền vào khu vực quản trị.";
      return;
    }
    if (next?.startsWith("guide") && home !== "guide") {
      errorBox.textContent = "Tài khoản của bạn không phải hướng dẫn viên.";
      return;
    }

    window.location.hash = `#/${next || (home === "my-bookings" ? "account" : `${home}/dashboard`)}`;
  });
});
