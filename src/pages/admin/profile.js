import { BOOKING_STATUS, listBookings, listMessages, logActivity } from "../../store.js";
import { formatDateTime } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import { formatMoney, initials, stars, toast } from "../../components/admin-ui.js";
import { PERMISSIONS, ROLES, changePassword, getAccount, getSession, rolePermissions, updateProfile } from "../../auth.js";
import { formatDate } from "../../data.js";
import { escapeHtml, isEmail, isName, isPhone } from "../../validate.js";

export function Profile() {
  const denied = adminGuard("dashboard.view");
  if (denied) return denied;

  const session = getSession();
  const account = getAccount(session?.username);
  const permissions = rolePermissions(session?.roleKey);
  const bookings = listBookings().filter((item) => item.phone === account?.phone);
  const messages = listMessages().filter((item) => item.phone === account?.phone);

  return `
  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div>
          <h2>Thông tin cá nhân</h2>
          <p>Cập nhật tên, email và số điện thoại của bạn</p>
        </div>
      </header>

      <div class="profile-head">
        <span class="profile-avatar">${initials(account?.name)}</span>
        <div>
          <h3>${escapeHtml(account?.name || "")}</h3>
          <p><span class="role-badge role-${escapeHtml(session?.roleKey || "customer")}">${escapeHtml(
            ROLES[session?.roleKey]?.label || "Khách hàng"
          )}</span></p>
          <small>${escapeHtml(account?.title || ROLES[session?.roleKey]?.desc || "")}</small>
        </div>
      </div>

      <form class="settings-form" id="profile-form" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="pf-username">Tài khoản</label>
            <input id="pf-username" type="text" value="${escapeHtml(account?.username || "")}" readonly>
          </div>
          <div class="field">
            <label for="pf-name">Họ và tên <span class="req">*</span></label>
            <input id="pf-name" name="name" type="text" value="${escapeHtml(account?.name || "")}" required>
          </div>
          <div class="field">
            <label for="pf-email">Email</label>
            <input id="pf-email" name="email" type="email" value="${escapeHtml(account?.email || "")}">
          </div>
          <div class="field">
            <label for="pf-phone">Điện thoại</label>
            <input id="pf-phone" name="phone" type="tel" value="${escapeHtml(account?.phone || "")}">
          </div>
        </div>
        <p class="error" data-error="profile"></p>
        <div class="success-actions">
          <button class="btn btn-primary" type="submit">Lưu thông tin</button>
        </div>
      </form>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div>
          <h2>Đổi mật khẩu</h2>
          <p>Nên dùng mật khẩu tối thiểu 6 ký tự</p>
        </div>
      </header>

      <form class="settings-form" id="password-form" novalidate>
        <div class="field">
          <label for="pw-old">Mật khẩu hiện tại <span class="req">*</span></label>
          <div class="password-field">
            <input id="pw-old" name="oldPassword" type="password" autocomplete="current-password" required>
            <button class="password-toggle" type="button" data-target="pw-old">Hiện</button>
          </div>
        </div>
        <div class="field">
          <label for="pw-new">Mật khẩu mới <span class="req">*</span></label>
          <div class="password-field">
            <input id="pw-new" name="newPassword" type="password" autocomplete="new-password" required>
            <button class="password-toggle" type="button" data-target="pw-new">Hiện</button>
          </div>
        </div>
        <div class="field">
          <label for="pw-confirm">Xác nhận mật khẩu mới <span class="req">*</span></label>
          <input id="pw-confirm" name="confirmPassword" type="password" autocomplete="new-password" required>
        </div>
        <p class="error" data-error="password"></p>
        <div class="success-actions">
          <button class="btn btn-primary" type="submit">Đổi mật khẩu</button>
        </div>
      </form>

      <header class="panel-head panel-head-sub">
        <div><h2>Quyền của bạn</h2><p>${permissions.length}/${PERMISSIONS.length} quyền hạn được phép</p></div>
      </header>
      <ul class="perm-grid">
        ${permissions
          .map((key) => `<li class="on"><span>✔</span> ${escapeHtml(key)}</li>`)
          .join("")}
      </ul>
    </article>
  </section>

  <section class="admin-grid admin-grid-3">
    <article class="panel">
      <header class="panel-head"><div><h2>Phiên đăng nhập</h2><p>Thông tin phiên hiện tại</p></div></header>
      <ul class="summary-list">
        <li><span>Đăng nhập lúc</span><strong>${formatDateTime(session?.loginAt)}</strong></li>
        <li><span>Tài khoản</span><strong>${escapeHtml(session?.username || "")}</strong></li>
        <li><span>Vai trò</span><strong>${escapeHtml(session?.role || "")}</strong></li>
        <li><span>Loại tài khoản</span><strong>${account?.origin === "demo" ? "Tài khoản mẫu hệ thống" : "Tài khoản nội bộ"}</strong></li>
        <li><span>Ngày tạo</span><strong>${formatDateTime(account?.createdAt)}</strong></li>
      </ul>
    </article>

    <article class="panel">
      <header class="panel-head"><div><h2>Đơn của tôi</h2><p>Số điện thoại khớp tài khoản</p></div></header>
      ${
        bookings.length
          ? `<div class="table-wrap table-wrap-flat"><table class="data-table">
              <thead><tr><th>Mã</th><th>Tour / ngày đi</th><th>Tổng tiền</th></tr></thead>
              <tbody>${bookings
                .slice(0, 5)
                .map(
                  (item) => `<tr>
                    <td><a href="#/admin/bookings?q=${encodeURIComponent(item.code)}">${escapeHtml(item.code)}</a><br><small>${escapeHtml(BOOKING_STATUS[item.status])}</small></td>
                    <td>${escapeHtml(item.tourName)}<br><small>${formatDate(item.date)}</small></td>
                    <td><strong>${formatMoney(item.total)}</strong></td>
                  </tr>`
                )
                .join("")}</tbody>
            </table></div>`
          : `<p class="search-empty">Bạn chưa có đơn nào khớp số điện thoại này.</p>`
      }
    </article>

    <article class="panel">
      <header class="panel-head"><div><h2>Tin nhắn của tôi</h2><p>Số điện thoại khớp tài khoản</p></div></header>
      ${
        messages.length
          ? `<ul class="msg-brief">${messages
              .slice(0, 5)
              .map(
                (item) => `<li>
                  <span class="avatar-sm">${initials(item.name)}</span>
                  <span class="msg-brief-info">
                    <strong>${escapeHtml(item.topic)}</strong>
                    <small>${escapeHtml(item.message.slice(0, 70))}…</small>
                  </span>
                  <span class="msg-brief-time">${formatDateTime(item.createdAt)}</span>
                </li>`
              )
              .join("")}</ul>`
          : `<p class="search-empty">Chưa có tin nhắn nào.</p>`
      }
      <p class="form-hint" style="text-align:left">${stars(5)} ${escapeHtml(ROLES[session?.roleKey]?.desc || "")}</p>
    </article>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "profile") return;
  const session = getSession();
  const profileForm = document.getElementById("profile-form");
  if (!session || !profileForm) return;

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Ẩn" : "Hiện";
    });
  });

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(profileForm);
    const error = profileForm.querySelector('[data-error="profile"]');
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();

    if (!isName(name)) return void (error.textContent = "Vui lòng nhập họ tên đầy đủ.");
    if (email && !isEmail(email)) return void (error.textContent = "Email không hợp lệ.");
    if (phone && !isPhone(phone)) return void (error.textContent = "Số điện thoại không hợp lệ.");

    const result = updateProfile(session.username, { name, email, phone });
    if (result.errors) return void (error.textContent = Object.values(result.errors)[0]);

    logActivity("Cập nhật hồ sơ", `${session.username} cập nhật thông tin cá nhân`);
    toast("Đã cập nhật hồ sơ. Hãy đăng nhập lại để áp dụng.");
    refreshAdmin();
  });

  document.getElementById("password-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const error = form.querySelector('[data-error="password"]');
    const oldPassword = String(data.get("oldPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) return void (error.textContent = "Mật khẩu xác nhận không khớp.");
    const result = changePassword(session.username, oldPassword, newPassword);
    if (result.errors) return void (error.textContent = Object.values(result.errors)[0]);

    logActivity("Đổi mật khẩu", `${session.username} đổi mật khẩu`);
    toast("Đã đổi mật khẩu thành công.");
    form.reset();
  });
});
