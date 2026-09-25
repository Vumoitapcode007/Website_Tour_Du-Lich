import { login, getSession } from "../auth.js";

export function Login(path, params = {}, query = new URLSearchParams()) {
  const session = getSession();

  if (session) {
    return `
    <section class="section container center">
      <div class="form-card login-card">
        <div class="success-icon">✓</div>
        <h2>Bạn đã đăng nhập</h2>
        <p>Xin chào <strong>${session.name}</strong> (${session.role}).</p>
        <div class="success-actions">
          <a class="btn btn-primary" href="#/admin">Vào trang quản lý</a>
          <a class="btn btn-outline" href="#/">Về trang chủ</a>
        </div>
      </div>
    </section>`;
  }

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Khu vực quản trị</span>
      <h1>Đăng nhập</h1>
      <p>Dành cho nhân viên TravelGo quản lý đơn đặt tour.</p>
    </div>
  </section>

  <section class="section container">
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
      <p class="form-hint">Tài khoản demo: <strong>admin</strong> / <strong>123456</strong></p>
    </form>
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;

    form.querySelectorAll("[data-error]").forEach((node) => (node.textContent = ""));

    if (!username) {
      form.querySelector('[data-error="username"]').textContent = "Vui lòng nhập tài khoản.";
      return;
    }
    if (!password) {
      form.querySelector('[data-error="password"]').textContent = "Vui lòng nhập mật khẩu.";
      return;
    }

    const session = login(username, password);
    if (!session) {
      form.querySelector('[data-error="password"]').textContent =
        "Tài khoản hoặc mật khẩu không đúng.";
      return;
    }

    const allowed = ["admin"];
    const next = new URLSearchParams(detail.queryString).get("next");
    window.location.hash = `#/${allowed.includes(next) ? next : "admin"}`;
  });
});
