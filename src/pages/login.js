import { DEMO_CREDENTIALS, ROLES, getSession, homePathForRole, login } from "../auth.js";
import { escapeHtml } from "../validate.js";

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

  if (session) {
    const label =
      home === "guide" ? "Vào khu vực hướng dẫn viên" : home === "admin" ? "Vào trang quản trị" : "Tài khoản của tôi";
    return `
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
        <div class="success-actions">
          <button class="btn btn-ghost-soft" type="button" data-logout>Đăng xuất</button>
        </div>
      </div>
    </section>`;
  }

  const demoCards = DEMO_CREDENTIALS.map(
    (item) => `
    <button class="demo-account" type="button" data-demo-user="${escapeHtml(item.username)}" data-demo-pass="${escapeHtml(item.password)}">
      <strong>${escapeHtml(item.username)}</strong>
      <small>${escapeHtml(item.name)} · ${escapeHtml(item.title || ROLES[item.roleKey]?.label || "")}</small>
      <span>${escapeHtml(item.password)}</span>
    </button>`
  ).join("");

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Khu vực quản trị</span>
      <h1>Đăng nhập</h1>
      <p>Dành cho nhân viên TravelGo quản lý đơn đặt tour.</p>
    </div>
  </section>

  <section class="section container container-narrow login-layout">
    <form class="form-card login-card" id="login-form" novalidate>
      <h2>Đăng nhập hệ thống</h2>

      <div class="field">
        <label for="lg-username">Tài khoản hoặc email <span class="req">*</span></label>
        <input id="lg-username" name="username" type="text" placeholder="Ví dụ: admin hoặc email của bạn" autocomplete="username" required>
        <p class="error" data-error="username"></p>
      </div>

      <div class="field">
        <label for="lg-password">Mật khẩu <span class="req">*</span></label>
        <div class="password-field">
          <input id="lg-password" name="password" type="password" placeholder="Nhập mật khẩu" autocomplete="current-password" required>
          <button class="password-toggle" type="button" data-target="lg-password" aria-label="Hiện mật khẩu">Hiện</button>
        </div>
        <p class="error" data-error="password"></p>
      </div>

      <button class="btn btn-primary btn-lg btn-block" type="submit">Đăng nhập</button>
      <p class="form-hint">Chưa có tài khoản? <a href="#/register">Đăng ký ngay</a></p>
    </form>

    <aside class="login-demo">
      <h3>Tài khoản trải nghiệm</h3>
      <p>Chọn một tài khoản để điền nhanh vào biểu mẫu.</p>
      <div class="demo-list">${demoCards}</div>
      <p class="form-hint">Mọi tài khoản demo đều dùng mật khẩu <strong>123456</strong>.</p>
    </aside>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "login") return;

  const form = document.getElementById("login-form");
  if (!form) return;

  form.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Ẩn" : "Hiện";
    });
  });

  document.querySelectorAll("[data-demo-user]").forEach((button) => {
    button.addEventListener("click", () => {
      form.elements.username.value = button.dataset.demoUser;
      form.elements.password.value = button.dataset.demoPass;
      form.querySelectorAll("[data-error]").forEach((node) => (node.textContent = ""));
    });
  });

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
      errorBox.textContent = "Tài khoản hoặc mật khẩu không đúng.";
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
