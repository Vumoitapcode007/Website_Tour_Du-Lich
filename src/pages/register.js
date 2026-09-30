import { register, getSession } from "../auth.js";
import { isEmail, isName, isPhone } from "../validate.js";

function AlreadyLoggedIn(session) {
  return `
  <section class="section container center">
    <div class="form-card login-card">
      <div class="success-icon">✓</div>
      <h2>Bạn đã đăng nhập</h2>
      <p>Xin chào <strong>${session.name}</strong> (${session.role}).</p>
      <div class="success-actions">
        <a class="btn btn-primary" href="#/">Về trang chủ</a>
        <a class="btn btn-outline" href="#/tours">Xem danh sách tour</a>
      </div>
    </div>
  </section>`;
}

export function Register() {
  const session = getSession();
  if (session) return AlreadyLoggedIn(session);

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Tài khoản khách hàng</span>
      <h1>Đăng ký tài khoản</h1>
      <p>Tạo tài khoản để đặt tour nhanh hơn và theo dõi lịch trình của bạn.</p>
    </div>
  </section>

  <section class="section container">
    <form class="form-card login-card" id="register-form" novalidate>
      <h2>Thông tin tài khoản</h2>

      <div class="field">
        <label for="rg-name">Họ và tên <span class="req">*</span></label>
        <input id="rg-name" name="name" type="text" placeholder="Nguyễn Văn A" autocomplete="name" required>
        <p class="error" data-error="name"></p>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="rg-username">Tài khoản <span class="req">*</span></label>
          <input id="rg-username" name="username" type="text" placeholder="vd: minhvu" autocomplete="username" required>
          <p class="error" data-error="username"></p>
        </div>
        <div class="field">
          <label for="rg-phone">Số điện thoại <span class="req">*</span></label>
          <input id="rg-phone" name="phone" type="tel" placeholder="0909 888 777" autocomplete="tel" required>
          <p class="error" data-error="phone"></p>
        </div>
      </div>

      <div class="field">
        <label for="rg-email">Email <span class="req">*</span></label>
        <input id="rg-email" name="email" type="email" placeholder="email@example.com" autocomplete="email" required>
        <p class="error" data-error="email"></p>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="rg-password">Mật khẩu <span class="req">*</span></label>
          <div class="password-field">
            <input id="rg-password" name="password" type="password" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password" required>
            <button class="password-toggle" type="button" data-target="rg-password" aria-label="Hiện mật khẩu">Hiện</button>
          </div>
          <p class="error" data-error="password"></p>
        </div>
        <div class="field">
          <label for="rg-confirm">Xác nhận mật khẩu <span class="req">*</span></label>
          <input id="rg-confirm" name="confirm" type="password" placeholder="Nhập lại mật khẩu" autocomplete="new-password" required>
          <p class="error" data-error="confirm"></p>
        </div>
      </div>

      <label class="checkbox">
        <input type="checkbox" name="agree" required>
        <span>Tôi đồng ý với <a href="#/contact">điều khoản</a> và chính sách bảo mật của TravelGo.</span>
      </label>
      <p class="error" data-error="agree"></p>

      <button class="btn btn-primary btn-lg btn-block" type="submit">Tạo tài khoản</button>
      <p class="form-hint">Đã có tài khoản? <a href="#/login">Đăng nhập ngay</a></p>
    </form>
  </section>`;
}

function validate(form) {
  const errors = {};
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const username = String(data.get("username") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const confirm = String(data.get("confirm") || "");

  if (!isName(name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!username) {
    errors.username = "Vui lòng nhập tài khoản.";
  } else if (!/^[a-z0-9]{3,20}$/i.test(username)) {
    errors.username = "Tài khoản cần 3-20 ký tự, không có khoảng trắng.";
  }
  if (!isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
  if (!isEmail(email)) errors.email = "Email chưa hợp lệ.";
  if (!password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (password.length < 6) errors.password = "Mật khẩu cần tối thiểu 6 ký tự.";
  if (!confirm) errors.confirm = "Vui lòng xác nhận mật khẩu.";
  else if (confirm !== password) errors.confirm = "Xác nhận mật khẩu không khớp.";
  if (!data.get("agree")) errors.agree = "Bạn cần đồng ý điều khoản để tiếp tục.";

  return { errors, data };
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "register") return;
  const form = document.getElementById("register-form");
  if (!form) return;

  form.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Ẩn" : "Hiện";
    });
  });

  function showErrors(errors) {
    form.querySelectorAll("[data-error]").forEach((node) => {
      const key = node.dataset.error;
      node.textContent = errors[key] || "";
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.classList.toggle("invalid", Boolean(errors[key]));
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { errors, data } = validate(form);
    showErrors(errors);
    if (Object.keys(errors).length) {
      form.querySelector(".invalid")?.focus();
      return;
    }

    const result = register({
      name: data.get("name"),
      username: data.get("username"),
      email: data.get("email"),
      phone: data.get("phone"),
      password: data.get("password"),
    });

    if (!result.session) {
      showErrors(result.errors);
      return;
    }

    const allowed = ["tours", "booking", "about", "contact"];
    const next = new URLSearchParams(detail.queryString).get("next");
    window.location.hash = `#/${allowed.includes(next) ? next : ""}`;
  });
});
