import { DEMO_CREDENTIALS, ROLES, getSession, isStaffRole, login } from "../auth.js";
import { escapeHtml } from "../validate.js";

const PUBLIC_ROUTES = ["", "tours", "booking", "about", "contact", "login", "register", "404"];

function sanitizeNext(value) {
  const next = String(value || "").replace(/^#?\/?/, "");
  if (!next) return "";
  if (next.startsWith("admin")) return next;
  return PUBLIC_ROUTES.includes(next) ? next : "";
}

export function Login(path, params = {}, query = new URLSearchParams()) {
  const session = getSession();
  const staff = isStaffRole(session?.roleKey);

  if (session) {
    const target = sanitizeNext(query.get("next")) || (staff ? "admin/dashboard" : "");
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
          <a class="btn btn-primary" href="#/${target}">${
            staff ? "Vào trang quản trị" : "Tiếp tục đặt tour"
          }</a>
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
      <span>${escapeHtml(item.password)}</span>
      <small>${escapeHtml(item.name)} · ${escapeHtml(item.title || ROLES[item.roleKey]?.label || "")}</small>
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

  <section class="section container container-narrow">
    <form class="form-card login-card" id="login-form" novalidate>
      <h2>Đăng nhập hệ thống</h2>

      <div class="field">
        <label for="lg-username">Tài khoản <span class="req">*</span></label>
        <input id="lg-username" name="username" type="text" placeholder="Nhập tài khoản" autocomplete="username" required>
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

  form.querySelectorAll("[data-demo-user]").forEach((button) => {
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
      form.querySelector('[data-error="username"]').textContent = "Vui lòng nhập tài khoản.";
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

    const staff = isStaffRole(result.roleKey);
    const next = sanitizeNext(new URLSearchParams(detail.queryString).get("next"));
    if (next?.startsWith("admin") && !staff) {
      errorBox.textContent = "Tài khoản của bạn không có quyền vào khu vực quản trị.";
      return;
    }

    window.location.hash = `#/${next || (staff ? "admin/dashboard" : "")}`;
  });
});
