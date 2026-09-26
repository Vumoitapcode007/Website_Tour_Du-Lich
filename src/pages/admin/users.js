import { logActivity } from "../../store.js";
import { formatDateTime } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  closeModal,
  confirmAction,
  createListController,
  downloadCsv,
  initials,
  openModal,
  stamp,
  toast,
} from "../../components/admin-ui.js";
import {
  PERMISSIONS,
  ROLES,
  getSession,
  hasPermission,
  listAccounts,
  removeAccount,
  rolePermissions,
  saveAccount,
} from "../../auth.js";
import { escapeHtml, isEmail, isName, isPhone, searchKey } from "../../validate.js";

const canManage = () => hasPermission("users.manage");

const FILTERS = { q: "", role: "", status: "" };

function buildAccounts() {
  return listAccounts();
}

function filterAccounts(list) {
  const query = searchKey(FILTERS.q);
  return list.filter((item) => {
    if (FILTERS.role && item.roleKey !== FILTERS.role) return false;
    if (FILTERS.status && item.status !== FILTERS.status) return false;
    if (query && !searchKey(`${item.name} ${item.username} ${item.email} ${item.phone} ${item.title || ""}`).includes(query))
      return false;
    return true;
  });
}

function row(account) {
  const isSelf = account.username === getSession()?.username;
  return `
  <tr data-username="${escapeHtml(account.username)}" data-search="${escapeHtml(
    searchKey(`${account.name} ${account.username} ${account.email} ${account.title || ""}`)
  )}">
    <td>
      <span class="cell-user">
        <span class="avatar-sm">${initials(account.name)}</span>
        <span>
          <strong>${escapeHtml(account.name)}</strong>
          <small>@${escapeHtml(account.username)} ${isSelf ? "· bạn" : ""}</small>
        </span>
      </span>
    </td>
    <td><span class="role-badge role-${account.roleKey}">${escapeHtml(account.role)}</span><br><small>${escapeHtml(account.title || ROLES[account.roleKey]?.desc || "")}</small></td>
    <td>${escapeHtml(account.email || "-")}<br><small>${escapeHtml(account.phone || "")}</small></td>
    <td><span class="status-pill status-${account.status === "active" ? "open" : "cancelled"}">${account.status === "active" ? "Hoạt động" : "Đã khoá"}</span></td>
    <td>${formatDateTime(account.createdAt)}</td>
    <td class="row-actions">
      ${
        canManage()
          ? `<button class="btn btn-sm btn-ghost-soft" type="button" data-user-action="view">Chi tiết</button>
             <button class="btn btn-sm btn-primary" type="button" data-user-action="edit">Sửa</button>
             <button class="btn btn-sm btn-outline" type="button" data-user-action="toggle">${account.status === "active" ? "Khoá" : "Mở"}</button>
             ${
               account.origin === "registered"
                 ? `<button class="btn btn-sm btn-outline-danger" type="button" data-user-action="delete">Xoá</button>`
                 : `<button class="btn btn-sm btn-outline-danger" type="button" data-user-action="delete" disabled>Tài khoản mẫu</button>`
             }`
          : `<button class="btn btn-sm btn-ghost-soft" type="button" data-user-action="view">Chi tiết</button>`
      }
    </td>
  </tr>`;
}

function permissionsTable(roleKey) {
  const allowed = rolePermissions(roleKey);
  return `
  <ul class="perm-grid">
    ${PERMISSIONS.map(
      (key) =>
        `<li class="${allowed.includes(key) ? "on" : "off"}"><span>${allowed.includes(key) ? "✔" : "—"}</span> ${escapeHtml(key)}</li>`
    ).join("")}
  </ul>`;
}

function openAccountForm(account = null) {
  if (!canManage()) return;

  openModal({
    title: account ? `Cập nhật ${account.username}` : "Tạo tài khoản mới",
    subtitle: account ? `Vai trò hiện tại: ${account.role}` : "Tạo tài khoản nhân viên hoặc khách hàng",
    size: "lg",
    body: `
    <form id="user-form" novalidate>
      <div class="form-grid">
        <div class="field">
          <label for="uf-username">Tài khoản <span class="req">*</span></label>
          <input id="uf-username" name="username" type="text" value="${escapeHtml(account?.username || "")}" ${
            account ? "readonly" : ""
          } placeholder="chamcong01" required>
        </div>
        <div class="field">
          <label for="uf-name">Họ và tên <span class="req">*</span></label>
          <input id="uf-name" name="name" type="text" value="${escapeHtml(account?.name || "")}" required>
        </div>
        <div class="field">
          <label for="uf-email">Email</label>
          <input id="uf-email" name="email" type="email" value="${escapeHtml(account?.email || "")}">
        </div>
        <div class="field">
          <label for="uf-phone">Điện thoại</label>
          <input id="uf-phone" name="phone" type="tel" value="${escapeHtml(account?.phone || "")}">
        </div>
        <div class="field">
          <label for="uf-role">Vai trò <span class="req">*</span></label>
          <select id="uf-role" name="roleKey">
            ${Object.values(ROLES)
              .map(
                (role) =>
                  `<option value="${role.key}"${account?.roleKey === role.key ? " selected" : ""}>${escapeHtml(role.label)}</option>`
              )
              .join("")}
          </select>
          <small class="form-hint" id="role-desc">${escapeHtml(ROLES[account?.roleKey || "staff"]?.desc || "")}</small>
        </div>
        <div class="field">
          <label for="uf-password">Mật khẩu ${account ? "(để trống nếu không đổi)" : '<span class="req">*</span>'}</label>
          <input id="uf-password" name="password" type="password" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password">
        </div>
      </div>
      <p class="error" id="user-error"></p>
    </form>`,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Huỷ</button>
      <button class="btn btn-primary" type="submit" form="user-form">${account ? "Lưu thay đổi" : "Tạo tài khoản"}</button>`,
  });

  const roleSelect = document.getElementById("uf-role");
  roleSelect?.addEventListener("change", () => {
    document.getElementById("role-desc").textContent = ROLES[roleSelect.value]?.desc || "";
  });

  document.getElementById("user-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const error = document.getElementById("user-error");
    const username = String(data.get("username") || "").trim().toLowerCase();
    const name = String(data.get("name") || "").trim();
    const password = String(data.get("password") || "");

    if (!/^[a-z0-9]{3,20}$/.test(username)) {
      return void (error.textContent = "Tài khoản chỉ gồm 3-20 ký tự a-z hoặc số.");
    }
    if (!isName(name)) return void (error.textContent = "Vui lòng nhập họ tên đầy đủ.");
    if (!account && password.length < 6) {
      return void (error.textContent = "Mật khẩu phải có ít nhất 6 ký tự.");
    }
    const email = String(data.get("email") || "").trim();
    if (email && !isEmail(email)) return void (error.textContent = "Email không hợp lệ.");
    const phone = String(data.get("phone") || "").trim();
    if (phone && !isPhone(phone)) return void (error.textContent = "Số điện thoại không hợp lệ.");

    const result = saveAccount({
      username,
      name,
      email,
      phone,
      password,
      roleKey: String(data.get("roleKey")),
      status: account?.status || "active",
    });

    if (result.errors) {
      error.textContent = Object.values(result.errors)[0];
      return;
    }
    logActivity(
      account ? "Cập nhật tài khoản" : "Tạo tài khoản",
      `${account ? "Cập nhật" : "Tạo"} tài khoản ${username} (${result.account.role})`
    );
    toast(`Đã lưu tài khoản ${username}.`);
    closeModal();
    refreshAdmin();
  });
}

function openAccountDetail(account) {
  openModal({
    title: account.name,
    subtitle: `@${account.username} · ${account.role}`,
    body: `
    <ul class="summary-list">
      <li><span>Loại tài khoản</span><strong>${account.origin === "demo" ? "Tài khoản mẫu hệ thống" : "Đăng ký từ website"}</strong></li>
      <li><span>Email</span><strong>${escapeHtml(account.email || "-")}</strong></li>
      <li><span>Điện thoại</span><strong>${escapeHtml(account.phone || "-")}</strong></li>
      <li><span>Chức danh</span><strong>${escapeHtml(account.title || ROLES[account.roleKey]?.desc || "-")}</strong></li>
      <li><span>Ngày tạo</span><strong>${formatDateTime(account.createdAt)}</strong></li>
      <li><span>Trạng thái</span><strong>${account.status === "active" ? "Hoạt động" : "Đã khoá"}</strong></li>
    </ul>

    <h4>Quyền hạn của vai trò ${escapeHtml(account.role)}</h4>
    <p class="form-hint" style="text-align:left">${escapeHtml(ROLES[account.roleKey]?.desc || "")}</p>
    ${permissionsTable(account.roleKey)}`,
    footer: `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>
      ${canManage() ? `<button class="btn btn-primary" type="button" data-user-edit="${escapeHtml(account.username)}">Sửa tài khoản</button>` : ""}`,
  });
}

export function Users() {
  const denied = adminGuard("users.view");
  if (denied) return denied;

  const accounts = buildAccounts();
  const staff = accounts.filter((item) => item.roleKey !== "customer");
  const customers = accounts.filter((item) => item.roleKey === "customer");
  const locked = accounts.filter((item) => item.status === "locked");

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Tài khoản nhân viên</p><strong class="kpi-value">${staff.length}</strong><span class="kpi-hint">Có quyền truy cập quản trị</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Tài khoản khách</p><strong class="kpi-value">${customers.length}</strong><span class="kpi-hint">Đăng ký trên website</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Đang bị khoá</p><strong class="kpi-value">${locked.length}</strong><span class="kpi-hint">Không đăng nhập được</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Vai trò</p><strong class="kpi-value">${Object.keys(ROLES).length}</strong><span class="kpi-hint">${PERMISSIONS.length} quyền hạn được định nghĩa</span></article>
  </section>

  <section class="admin-grid admin-grid-2">
    ${Object.values(ROLES)
      .map(
        (role) => `
      <article class="panel">
        <header class="panel-head">
          <div><h2>${escapeHtml(role.label)}</h2><p>${escapeHtml(role.desc)}</p></div>
          <span class="role-badge role-${role.key}">${accounts.filter((item) => item.roleKey === role.key).length}</span>
        </header>
        ${permissionsTable(role.key)}
      </article>`
      )
      .join("")}
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="us-q">Tìm tài khoản</label>
        <input id="us-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên, tài khoản, email..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="us-role">Vai trò</label>
        <select id="us-role">
          <option value="">Tất cả vai trò</option>
          ${Object.values(ROLES)
            .map((role) => `<option value="${role.key}">${escapeHtml(role.label)}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="us-status">Trạng thái</label>
        <select id="us-status">
          <option value="">Tất cả</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Đã khoá</option>
        </select>
      </div>
      <div class="filter-actions">
        ${canManage() ? `<button class="btn btn-primary" type="button" id="us-add">+ Tạo tài khoản</button>` : ""}
        <button class="btn btn-outline" type="button" id="us-export">Xuất CSV</button>
      </div>
    </div>

    <p class="result-count" id="us-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Vai trò</th>
            <th>Liên hệ</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="us-rows"></tbody>
      </table>
    </div>
    <div id="us-page"></div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "users") return;
  const rowsBox = document.getElementById("us-rows");
  if (!rowsBox) return;

  const controller = createListController({
    mount: "#us-rows",
    count: "#us-count",
    pageEl: "#us-page",
    pageSize: 10,
    load: () => filterAccounts(buildAccounts()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="6" class="table-empty">Không có tài khoản nào khớp bộ lọc.</td></tr>`,
  });
  controller.refresh();
  controller.bind();

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("us-role", FILTERS.role);
  set("us-status", FILTERS.status);

  const bind = (id, event, handler) =>
    document.getElementById(id)?.addEventListener(event, handler);

  bind("us-q", "input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
  });
  bind("us-role", "change", (event) => {
    FILTERS.role = event.target.value;
    controller.reset();
  });
  bind("us-status", "change", (event) => {
    FILTERS.status = event.target.value;
    controller.reset();
  });

  bind("us-add", "click", () => openAccountForm(null));

  bind("us-export", "click", () => {
    downloadCsv(
      `tai-khoan-${stamp()}`,
      ["Tài khoản", "Họ tên", "Vai trò", "Email", "Điện thoại", "Chức danh", "Trạng thái", "Nguồn", "Ngày tạo"],
      filterAccounts(buildAccounts()).map((item) => [
        item.username,
        item.name,
        item.role,
        item.email,
        item.phone,
        item.title || "",
        item.status === "active" ? "Hoạt động" : "Đã khoá",
        item.origin === "demo" ? "Mẫu hệ thống" : "Đăng ký web",
        item.createdAt,
      ])
    );
  });

  rowsBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button || button.disabled) return;
    const username = button.closest("tr").dataset.username;
    const account = listAccounts().find((item) => item.username === username);
    if (!account) return;
    const action = button.dataset.userAction;

    if (action === "view") return openAccountDetail(account);
    if (action === "edit") return openAccountForm(account);
    if (!canManage()) return undefined;

    if (action === "toggle") {
      if (account.username === getSession()?.username) {
        return toast("Không thể tự khoá tài khoản của bạn.", "error");
      }
      const next = account.status === "active" ? "locked" : "active";
      saveAccount({ ...account, status: next });
      logActivity("Cập nhật tài khoản", `${next === "locked" ? "Khoá" : "Mở"} tài khoản ${username}`);
      toast(`Đã ${next === "locked" ? "khoá" : "mở"} tài khoản ${username}.`);
      return controller.refresh();
    }
    if (action === "delete") {
      if (!confirmAction(`Xoá tài khoản ${username}?`)) return;
      const result = removeAccount(username);
      if (result.error) return toast(result.error, "error");
      logActivity("Xoá tài khoản", `Xoá tài khoản ${username}`);
      toast(`Đã xoá tài khoản ${username}.`);
      return refreshAdmin();
    }
    return undefined;
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-user-edit]");
  if (!button) return;
  const account = listAccounts().find((item) => item.username === button.dataset.userEdit);
  closeModal();
  if (account) openAccountForm(account);
});
