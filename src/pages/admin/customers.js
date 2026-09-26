import { BOOKING_STATUS, listBookings, logActivity, removeNote, saveNote } from "../../store.js";
import { formatDateTime, formatRelative, listCustomers } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  closeModal,
  createListController,
  downloadCsv,
  formatMoney,
  initials,
  openModal,
  stamp,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { hasPermission, listAccounts } from "../../auth.js";
import { formatDate } from "../../data.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("customers.manage");

const FILTERS = { q: "", tier: "", sort: "total" };

const TIER_STATUS = {
  vip: "Khách VIP",
  gold: "Khách vàng",
  silver: "Khách bạc",
  new: "Khách mới",
};

function buildCustomers() {
  const accounts = new Map(
    listAccounts("customer").map((item) => [item.phone, item])
  );
  return listCustomers(listBookings()).map((item) => ({
    ...item,
    account: accounts.get(item.phone) || null,
  }));
}

function filterCustomers(list) {
  const query = searchKey(FILTERS.q);
  const result = list.filter((item) => {
    if (FILTERS.tier && item.tier.key !== FILTERS.tier) return false;
    if (query && !searchKey(`${item.name} ${item.phone} ${item.email} ${item.tours.join(" ")}`).includes(query))
      return false;
    return true;
  });

  const sorters = {
    total: (a, b) => b.total - a.total,
    orders: (a, b) => b.orders - a.orders,
    new: (a, b) => new Date(b.lastOrder) - new Date(a.lastOrder),
    name: (a, b) => a.name.localeCompare(b.name, "vi"),
  };
  return result.sort(sorters[FILTERS.sort] || sorters.total);
}

function row(customer) {
  return `
  <tr data-phone="${escapeHtml(customer.phone)}" data-search="${escapeHtml(
    searchKey(`${customer.name} ${customer.phone} ${customer.email}`)
  )}">
    <td>
      <span class="cell-user">
        <span class="avatar-sm">${initials(customer.name)}</span>
        <span>
          <strong>${escapeHtml(customer.name)}</strong>
          <small>${customer.account ? "Có tài khoản" : "Khách vãng lai"}</small>
        </span>
      </span>
    </td>
    <td><a href="tel:${escapeHtml(customer.phone)}">${escapeHtml(customer.phone)}</a><br><small>${escapeHtml(customer.email || "Chưa có email")}</small></td>
    <td><span class="tier-badge tier-${customer.tier.key}">${escapeHtml(customer.tier.label)}</span></td>
    <td>${customer.orders}<br><small>${customer.confirmed} xác nhận · ${customer.cancelled} huỷ</small></td>
    <td>${customer.people}</td>
    <td><strong>${formatMoney(customer.total)}</strong></td>
    <td>${formatRelative(customer.lastOrder)}<br><small>${escapeHtml(customer.tours.slice(0, 2).join(", "))}</small></td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-customer-action="view">Hồ sơ</button>
      ${
        canManage()
          ? `<button class="btn btn-sm btn-outline" type="button" data-customer-action="note">Ghi chú</button>
             <a class="btn btn-sm btn-primary" href="tel:${escapeHtml(customer.phone)}">Gọi</a>`
          : ""
      }
    </td>
  </tr>`;
}

let activePhone = "";

function openProfile(customer) {
  activePhone = customer.phone;
  const history = listBookings().filter((item) => item.phone === customer.phone);

  openModal({
    title: customer.name,
    subtitle: `${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`,
    size: "lg",
    body: `
    <div class="detail-grid">
      <section>
        <h4>Tổng quan</h4>
        <ul class="summary-list">
          <li><span>Hạng khách</span><strong><span class="tier-badge tier-${customer.tier.key}">${escapeHtml(customer.tier.label)}</span></strong></li>
          <li><span>Số đơn</span><strong>${customer.orders} đơn</strong></li>
          <li><span>Tổng chi tiêu</span><strong>${formatMoney(customer.total)}</strong></li>
          <li><span>Số lượt khách</span><strong>${customer.people}</strong></li>
          <li><span>Khách hàng từ</span><strong>${formatDateTime(customer.firstOrder)}</strong></li>
          <li><span>Đặt gần nhất</span><strong>${formatDateTime(customer.lastOrder)}</strong></li>
          <li><span>Tài khoản</span><strong>${customer.account ? `@${escapeHtml(customer.account.username)}` : "Chưa đăng ký"}</strong></li>
        </ul>
      </section>
      <section>
        <h4>Ghi chú nội bộ</h4>
        <div class="note-editor">
          <textarea id="customer-note" rows="5" placeholder="Ghi lại lịch sử, yêu cầu đặc biệt của khách...">${escapeHtml(customer.note)}</textarea>
          ${
            canManage()
              ? `<div class="success-actions">
                  <button class="btn btn-sm btn-primary" type="button" data-note-save>Lưu ghi chú</button>
                  ${customer.note ? `<button class="btn btn-sm btn-outline-danger" type="button" data-note-clear>Xoá ghi chú</button>` : ""}
                </div>`
              : `<p class="form-hint">Bạn chỉ có quyền xem.</p>`
          }
        </div>
        ${
          customer.tours.length
            ? `<h4>Tour đã tham gia</h4>
               <p class="chip-row">${customer.tours.map((tour) => `<span class="soft-chip">${escapeHtml(tour)}</span>`).join("")}</p>`
            : ""
        }
      </section>
    </div>

    <h4>Lịch sử đặt tour</h4>
    <div class="table-wrap table-wrap-flat">
      <table class="data-table">
        <thead><tr><th>Mã đơn</th><th>Tour</th><th>Ngày đi</th><th>SL</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${history
            .map(
              (item) => `
            <tr>
              <td><a href="#/admin/bookings?q=${encodeURIComponent(item.code)}">${escapeHtml(item.code)}</a><br><small>${formatRelative(item.createdAt)}</small></td>
              <td>${escapeHtml(item.tourName)}</td>
              <td>${formatDate(item.date)}</td>
              <td>${item.people}</td>
              <td><strong>${formatMoney(item.total)}</strong></td>
              <td>${statusBadge(item.status, BOOKING_STATUS)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`,
    footer: `
      <a class="btn btn-light" href="tel:${escapeHtml(customer.phone)}">Gọi ${escapeHtml(customer.phone)}</a>
      ${
        customer.email
          ? `<a class="btn btn-ghost-soft" href="mailto:${escapeHtml(customer.email)}">Gửi email</a>`
          : ""
      }
      <a class="btn btn-primary" href="#/booking?tour=1&people=${Math.max(1, Math.min(customer.people, 6))}">Đặt tour cho khách</a>
      <button class="btn btn-light" type="button" data-modal-close>Đóng</button>`,
  });
}

export function Customers() {
  const denied = adminGuard("customers.view");
  if (denied) return denied;

  const customers = buildCustomers();
  const vip = customers.filter((item) => item.tier.key === "vip").length;
  const withAccount = customers.filter((item) => item.account).length;
  const totalSpend = customers.reduce((sum, item) => sum + item.total, 0);
  const average = customers.length ? Math.round(totalSpend / customers.length) : 0;

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng khách hàng</p><strong class="kpi-value">${customers.length}</strong><span class="kpi-hint">${withAccount} tài khoản đã đăng ký</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Khách VIP</p><strong class="kpi-value">${vip}</strong><span class="kpi-hint">Chi tiêu từ 10 triệu</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Tổng chi tiêu</p><strong class="kpi-value">${formatMoney(totalSpend)}</strong><span class="kpi-hint">TB ${formatMoney(average)}</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Có ghi chú</p><strong class="kpi-value">${customers.filter((item) => item.note).length}</strong><span class="kpi-hint">Cần theo dõi thêm</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="cu-q">Tìm khách hàng</label>
        <input id="cu-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên, số điện thoại, email..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="cu-tier">Hạng khách</label>
        <select id="cu-tier">
          <option value="">Tất cả hạng</option>
          ${Object.entries(TIER_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="cu-sort">Sắp xếp</label>
        <select id="cu-sort">
          <option value="total">Chi tiêu cao nhất</option>
          <option value="orders">Số đơn nhiều nhất</option>
          <option value="new">Đặt gần đây</option>
          <option value="name">Tên A→Z</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" type="button" id="cu-export">Xuất CSV</button>
      </div>
    </div>

    <p class="result-count" id="cu-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Liên hệ</th>
            <th>Hạng</th>
            <th>Đơn hàng</th>
            <th>Lượt khách</th>
            <th>Tổng chi tiêu</th>
            <th>Hoạt động</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="cu-rows"></tbody>
      </table>
    </div>
    <div id="cu-page"></div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "customers") return;
  const rowsBox = document.getElementById("cu-rows");
  if (!rowsBox) return;

  const controller = createListController({
    mount: "#cu-rows",
    count: "#cu-count",
    pageEl: "#cu-page",
    pageSize: 10,
    load: () => filterCustomers(buildCustomers()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="8" class="table-empty">Không có khách hàng nào khớp bộ lọc.</td></tr>`,
  });
  controller.refresh();
  controller.bind();

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("cu-tier", FILTERS.tier);
  set("cu-sort", FILTERS.sort);

  document.getElementById("cu-q")?.addEventListener("input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
  });
  document.getElementById("cu-tier")?.addEventListener("change", (event) => {
    FILTERS.tier = event.target.value;
    controller.reset();
  });
  document.getElementById("cu-sort")?.addEventListener("change", (event) => {
    FILTERS.sort = event.target.value;
    controller.refresh();
  });

  document.getElementById("cu-export")?.addEventListener("click", () => {
    downloadCsv(
      `khach-hang-${stamp()}`,
      ["Họ tên", "Điện thoại", "Email", "Hạng", "Số đơn", "Đơn xác nhận", "Đơn huỷ", "Lượt khách", "Tổng chi tiêu", "Tour đã đi", "Đặt lần đầu", "Đặt gần nhất", "Ghi chú"],
      filterCustomers(buildCustomers()).map((item) => [
        item.name,
        item.phone,
        item.email,
        item.tier.label,
        item.orders,
        item.confirmed,
        item.cancelled,
        item.people,
        item.total,
        item.tours.join(" | "),
        item.firstOrder,
        item.lastOrder,
        item.note,
      ])
    );
  });

  rowsBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-customer-action]");
    if (!button) return;
    const phone = button.closest("tr").dataset.phone;
    const customer = buildCustomers().find((item) => item.phone === phone);
    if (!customer) return;

    if (button.dataset.customerAction === "view") {
      openProfile(customer);
      return;
    }
    if (button.dataset.customerAction === "note") {
      openProfile(customer);
      document.getElementById("customer-note")?.focus();
    }
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-note-save]")) {
    const note = document.getElementById("customer-note")?.value.trim() || "";
    saveNote(activePhone, note);
    logActivity("Ghi chú khách hàng", `Cập nhật ghi chú cho khách ${activePhone}`);
    toast("Đã lưu ghi chú khách hàng.");
    closeModal();
    return refreshAdmin();
  }
  if (event.target.closest("[data-note-clear]")) {
    removeNote(activePhone);
    logActivity("Ghi chú khách hàng", `Xoá ghi chú của khách ${activePhone}`);
    toast("Đã xoá ghi chú.");
    closeModal();
    return refreshAdmin();
  }
  return undefined;
});
