import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  getBooking,
  listBookings,
  logActivity,
  removeBooking,
  updateBooking,
} from "../../store.js";
import { bookingSummary, formatDateTime, formatRelative } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  createListController,
  downloadCsv,
  formatMoney,
  openModal,
  closeModal,
  setupSelection,
  stamp,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { hasPermission } from "../../auth.js";
import { formatDate } from "../../data.js";
import { getTourById, listTours } from "../../tour-repository.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("bookings.manage");

const FILTERS = { q: "", status: "", tour: "", payment: "", from: "", to: "", sort: "new" };

let activeCode = "";

function filterBookings(list) {
  const query = searchKey(FILTERS.q);
  const result = list.filter((item) => {
    if (FILTERS.status && item.status !== FILTERS.status) return false;
    if (FILTERS.tour && String(item.tourId) !== FILTERS.tour) return false;
    if (FILTERS.payment && (item.payment || "unpaid") !== FILTERS.payment) return false;
    if (FILTERS.from && item.createdAt < `${FILTERS.from}T00:00:00`) return false;
    if (FILTERS.to && item.createdAt > `${FILTERS.to}T23:59:59`) return false;
    if (query && !searchKey(`${item.code} ${item.name} ${item.phone} ${item.email} ${item.tourName} ${item.note}`).includes(query))
      return false;
    return true;
  });

  const sorters = {
    old: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    total: (a, b) => b.total - a.total,
    "total-asc": (a, b) => a.total - b.total,
    date: (a, b) => new Date(a.date) - new Date(b.date),
  };
  return result.sort(sorters[FILTERS.sort] || sorters.new);
}

function row(booking) {
  const tour = getTourById(booking.tourId);
  return `
  <tr data-code="${escapeHtml(booking.code)}" data-search="${escapeHtml(
    searchKey(`${booking.code} ${booking.name} ${booking.phone} ${booking.tourName}`)
  )}">
    <td class="cell-check">
      ${canManage() ? `<input type="checkbox" data-select value="${escapeHtml(booking.code)}" aria-label="Chọn đơn ${escapeHtml(booking.code)}">` : ""}
    </td>
    <td>
      <strong>${escapeHtml(booking.code)}</strong><br>
      <small>${formatRelative(booking.createdAt)}</small>
    </td>
    <td>
      <span class="cell-user">
        <span class="avatar-sm">${escapeHtml((booking.name || "?").slice(0, 2).toUpperCase())}</span>
        <span>
          <strong>${escapeHtml(booking.name)}</strong>
          <small>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</small>
        </span>
      </span>
    </td>
    <td>
      ${escapeHtml(booking.tourName)}<br>
      <small>${formatDate(booking.date)}${tour ? ` · còn ${tour.seatsLeft} chỗ` : ""}</small>
    </td>
    <td>${booking.people}</td>
    <td><strong>${formatMoney(booking.total)}</strong></td>
    <td><span class="status-pill status-${escapeHtml(booking.payment || "unpaid")}">${
      PAYMENT_STATUS[booking.payment || "unpaid"]
    }</span></td>
    <td>${statusBadge(booking.status, BOOKING_STATUS)}</td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-booking-action="view">Chi tiết</button>
      ${
        canManage() && booking.status === "pending"
          ? `<button class="btn btn-sm btn-primary" type="button" data-booking-action="confirmed">Xác nhận</button>`
          : ""
      }
      ${
        canManage() && booking.status === "confirmed"
          ? `<button class="btn btn-sm btn-outline" type="button" data-booking-action="cancelled">Huỷ</button>`
          : ""
      }
    </td>
  </tr>`;
}

function detailModal(booking) {
  const tour = getTourById(booking.tourId);
  const history = listBookings()
    .filter((item) => item.phone === booking.phone && item.code !== booking.code)
    .slice(0, 5);
  activeCode = booking.code;

  openModal({
    title: `Đơn ${booking.code}`,
    subtitle: `Tạo ${formatDateTime(booking.createdAt)}${booking.updatedAt ? ` · Cập nhật ${formatDateTime(booking.updatedAt)}` : ""}`,
    size: "lg",
    body: `
    <div class="detail-grid">
      <section>
        <h4>Thông tin khách hàng</h4>
        <ul class="summary-list">
          <li><span>Họ tên</span><strong>${escapeHtml(booking.name)}</strong></li>
          <li><span>Điện thoại</span><strong><a href="tel:${escapeHtml(booking.phone)}">${escapeHtml(booking.phone)}</a></strong></li>
          <li><span>Email</span><strong>${escapeHtml(booking.email || "Không có")}</strong></li>
          <li><span>Trạng thái</span><strong>${statusBadge(booking.status, BOOKING_STATUS)}</strong></li>
          <li><span>Thanh toán</span><strong>${statusBadge(booking.payment || "unpaid", PAYMENT_STATUS)}</strong></li>
        </ul>
      </section>
      <section>
        <h4>Thông tin chuyến đi</h4>
        <ul class="summary-list">
          <li><span>Tour</span><strong>${escapeHtml(booking.tourName)}</strong></li>
          <li><span>Ngày khởi hành</span><strong>${formatDate(booking.date)}</strong></li>
          <li><span>Số lượng</span><strong>${booking.people} khách</strong></li>
          <li><span>Đơn giá</span><strong>${formatMoney(tour?.price || Math.round(booking.total / (booking.people || 1)))}</strong></li>
          <li><span>Tổng tiền</span><strong>${formatMoney(booking.total)}</strong></li>
        </ul>
      </section>
    </div>

    <h4>Ghi chú của khách</h4>
    <p class="note-box">${booking.note ? escapeHtml(booking.note) : "Khách không để lại ghi chú."}</p>

    ${
      history.length
        ? `<h4>Khách này đã đặt thêm</h4>
           <ul class="history-list">${history
             .map(
               (item) =>
                 `<li><a href="#/admin/bookings?q=${encodeURIComponent(item.code)}">${escapeHtml(item.code)}</a> · ${escapeHtml(item.tourName)} · ${formatDate(item.date)} · ${statusBadge(item.status, BOOKING_STATUS)}</li>`
             )
             .join("")}</ul>`
        : ""
    }`,
    footer: `
      ${
        canManage()
          ? `<button class="btn btn-outline" type="button" data-modal-payment>Đổi trạng thái thanh toán</button>
             <button class="btn btn-ghost-soft" type="button" data-modal-cancel>Huỷ đơn</button>
             <button class="btn btn-primary" type="button" data-modal-confirm>Xác nhận đơn</button>
             <button class="btn btn-outline-danger" type="button" data-modal-delete>Xoá đơn</button>`
          : `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`
      }`,
  });
}

export function Bookings(path, params = {}, query = new URLSearchParams()) {
  const denied = adminGuard("bookings.view");
  if (denied) return denied;

  FILTERS.q = query.get("q") || "";
  FILTERS.status = query.get("status") || "";
  FILTERS.tour = "";
  FILTERS.payment = "";
  FILTERS.from = "";
  FILTERS.to = "";
  FILTERS.sort = "new";

  const all = listBookings();
  const summary = bookingSummary(all);
  const tours = listTours();
  const canExport = hasPermission("reports.view") || canManage();

  return `
  <section class="kpi-grid kpi-grid-5">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng đơn</p><strong class="kpi-value">${summary.total}</strong><span class="kpi-hint">${summary.people} lượt khách</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Chờ xác nhận</p><strong class="kpi-value">${summary.pending}</strong><span class="kpi-hint">Cần chuyên viên xử lý</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đã xác nhận</p><strong class="kpi-value">${summary.confirmed}</strong><span class="kpi-hint">${summary.conversion}% tỉ lệ chốt</span></article>
    <article class="kpi kpi-red"><p class="kpi-label">Đã huỷ</p><strong class="kpi-value">${summary.cancelled}</strong><span class="kpi-hint">${formatMoney(summary.cancelledValue)}</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Doanh thu</p><strong class="kpi-value">${formatMoney(summary.revenue)}</strong><span class="kpi-hint">TB ${formatMoney(summary.avgOrder)}</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="bk-q">Tìm đơn</label>
        <input id="bk-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Mã đơn, tên khách, SĐT, tên tour..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="bk-status">Trạng thái</label>
        <select id="bk-status">
          <option value="">Tất cả</option>
          ${Object.entries(BOOKING_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="bk-tour">Tour</label>
        <select id="bk-tour">
          <option value="">Tất cả tour</option>
          ${tours.map((tour) => `<option value="${tour.id}">${escapeHtml(tour.name)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="bk-payment">Thanh toán</label>
        <select id="bk-payment">
          <option value="">Tất cả</option>
          ${Object.entries(PAYMENT_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="bk-from">Từ ngày</label>
        <input id="bk-from" type="date">
      </div>
      <div class="filter-field">
        <label for="bk-to">Đến ngày</label>
        <input id="bk-to" type="date">
      </div>
      <div class="filter-field">
        <label for="bk-sort">Sắp xếp</label>
        <select id="bk-sort">
          <option value="new">Mới nhất</option>
          <option value="old">Cũ nhất</option>
          <option value="total">Tổng tiền giảm dần</option>
          <option value="total-asc">Tổng tiền tăng dần</option>
          <option value="date">Ngày khởi hành sớm</option>
        </select>
      </div>
    </div>

    <div class="toolbar-actions toolbar-actions-between">
      ${
        canManage()
          ? `<div class="bulk-actions" id="bk-bulk" hidden>
              <span>Đã chọn <strong data-selected>0</strong> đơn</span>
              <button class="btn btn-sm btn-primary" type="button" data-bulk="confirmed">Xác nhận</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="cancelled">Huỷ</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-bulk="delete">Xoá</button>
            </div>`
          : `<span></span>`
      }
      <div class="toolbar-actions">
        <button class="btn btn-sm btn-ghost-soft" type="button" id="bk-print">In danh sách</button>
        ${
          canExport
            ? `<button class="btn btn-sm btn-primary" type="button" id="bk-export">Xuất CSV</button>`
            : ""
        }
      </div>
    </div>

    <p class="result-count" id="bk-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${canManage() ? `<th class="cell-check"><input type="checkbox" id="bk-check-all" aria-label="Chọn tất cả"></th>` : ""}
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Tour &amp; ngày đi</th>
            <th>SL</th>
            <th>Tổng tiền</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="bk-rows"></tbody>
      </table>
    </div>
    <div id="bk-page"></div>
  </section>`;
}

function syncInputs() {
  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("bk-status", FILTERS.status);
  set("bk-tour", FILTERS.tour);
  set("bk-payment", FILTERS.payment);
  set("bk-from", FILTERS.from);
  set("bk-to", FILTERS.to);
  set("bk-sort", FILTERS.sort);
}

function exportBookings(rows) {
  downloadCsv(
    `don-dat-tour-${stamp()}`,
    ["Mã đơn", "Khách hàng", "SĐT", "Email", "Tour", "Ngày khởi hành", "Số khách", "Tổng tiền", "Thanh toán", "Trạng thái", "Ngày tạo", "Ghi chú"],
    rows.map((item) => [
      item.code,
      item.name,
      item.phone,
      item.email || "",
      item.tourName,
      item.date,
      item.people,
      item.total,
      PAYMENT_STATUS[item.payment || "unpaid"],
      BOOKING_STATUS[item.status],
      item.createdAt,
      item.note || "",
    ])
  );
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "bookings") return;
  const rowsBox = document.getElementById("bk-rows");
  if (!rowsBox) return;

  const controller = createListController({
    mount: "#bk-rows",
    count: "#bk-count",
    pageEl: "#bk-page",
    pageSize: 10,
    load: () => filterBookings(listBookings()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="${canManage() ? 9 : 8}" class="table-empty">Không có đơn nào khớp bộ lọc.</td></tr>`,
  });
  controller.refresh();
  controller.bind();

  const selection = setupSelection({
    headCheckbox: "#bk-check-all",
    bodyBox: rowsBox,
    onChange: (codes) => {
      const bulk = document.getElementById("bk-bulk");
      const count = bulk?.querySelector("[data-selected]");
      if (bulk) bulk.hidden = codes.length === 0;
      if (count) count.textContent = codes.length;
    },
  });

  syncInputs();

  const bind = (id, event, handler) =>
    document.getElementById(id)?.addEventListener(event, handler);

  bind("bk-q", "input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
  });
  bind("bk-status", "change", (event) => {
    FILTERS.status = event.target.value;
    controller.reset();
  });
  bind("bk-tour", "change", (event) => {
    FILTERS.tour = event.target.value;
    controller.reset();
  });
  bind("bk-payment", "change", (event) => {
    FILTERS.payment = event.target.value;
    controller.reset();
  });
  bind("bk-from", "change", (event) => {
    FILTERS.from = event.target.value;
    controller.reset();
  });
  bind("bk-to", "change", (event) => {
    FILTERS.to = event.target.value;
    controller.reset();
  });
  bind("bk-sort", "change", (event) => {
    FILTERS.sort = event.target.value;
    controller.refresh();
  });

  bind("bk-export", "click", () => exportBookings(filterBookings(listBookings())));

  bind("bk-print", "click", () => {
    if (!window.confirm("Mở hộp thoại in của trình duyệt?")) return;
    window.print();
  });

  const reload = () => {
    controller.refresh();
    selection.refresh();
  };

  rowsBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-booking-action]");
    if (!button) return;
    const code = button.closest("tr").dataset.code;
    const action = button.dataset.bookingAction;
    const booking = getBooking(code);
    if (!booking) return;

    if (action === "view") {
      detailModal(booking);
      return;
    }
    if (!canManage()) return;
    if (!window.confirm(`${action === "confirmed" ? "Xác nhận" : "Huỷ"} đơn ${code}?`)) return;
    updateBooking(code, { status: action });
    logActivity(
      action === "confirmed" ? "Xác nhận đơn" : "Huỷ đơn",
      `${action === "confirmed" ? "Xác nhận" : "Huỷ"} đơn ${code} - ${booking.name}`
    );
    toast(`Đã cập nhật đơn ${code}.`);
    reload();
  });

  document.getElementById("bk-bulk")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bulk]");
    if (!button) return;
    const codes = selection.selected();
    if (!codes.length) return;
    const action = button.dataset.bulk;
    const label = { confirmed: "xác nhận", cancelled: "huỷ", delete: "xoá" }[action];
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} ${codes.length} đơn đã chọn?`)) return;

    if (action === "delete") codes.forEach((code) => removeBooking(code));
    else codes.forEach((code) => updateBooking(code, { status: action }));
    logActivity(
      action === "delete" ? "Xoá đơn" : "Cập nhật đơn hàng loạt",
      `${label} ${codes.length} đơn: ${codes.slice(0, 5).join(", ")}${codes.length > 5 ? "..." : ""}`
    );
    toast(`Đã ${label} ${codes.length} đơn.`);
    refreshAdmin();
  });
});

document.addEventListener("click", (event) => {
  if (detailHasModalAction(event.target)) handleModalAction(event.target);
});

function detailHasModalAction(target) {
  return Boolean(
    target.closest?.(
      "[data-modal-confirm],[data-modal-cancel],[data-modal-payment],[data-modal-delete]"
    )
  );
}

function handleModalAction(target) {
  if (!canManage() || !activeCode) return;
  const booking = getBooking(activeCode);
  if (!booking) return;

  if (target.closest("[data-modal-confirm]")) {
    updateBooking(activeCode, { status: "confirmed" });
    logActivity("Xác nhận đơn", `Xác nhận đơn ${activeCode} - ${booking.name}`);
    toast(`Đã xác nhận đơn ${activeCode}.`);
  } else if (target.closest("[data-modal-cancel]")) {
    updateBooking(activeCode, { status: "cancelled" });
    logActivity("Huỷ đơn", `Huỷ đơn ${activeCode} - ${booking.name}`);
    toast(`Đã huỷ đơn ${activeCode}.`);
  } else if (target.closest("[data-modal-payment]")) {
    const next = window.prompt(
      "Nhập trạng thái thanh toán mới:",
      PAYMENT_STATUS[booking.payment || "unpaid"]
    );
    const found = Object.entries(PAYMENT_STATUS).find(([, label]) => label === next);
    if (!found) return;
    updateBooking(activeCode, { payment: found[0] });
    logActivity("Cập nhật thanh toán", `Đơn ${activeCode} chuyển sang ${found[1]}`);
    toast(`Đã cập nhật thanh toán đơn ${activeCode}.`);
  } else if (target.closest("[data-modal-delete]")) {
    if (!window.confirm(`Xoá đơn ${activeCode}?`)) return;
    removeBooking(activeCode);
    logActivity("Xoá đơn", `Xoá đơn ${activeCode} - ${booking.name}`);
    toast(`Đã xoá đơn ${activeCode}.`);
  } else {
    return;
  }

  activeCode = "";
  closeModal();
  refreshAdmin();
}
