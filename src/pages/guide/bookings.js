import { BOOKING_STATUS, guideBookings, nextBookingStatus, updateBooking } from "../../store.js";
import { getTourById } from "../../tour-repository.js";
import { getSession, hasPermission } from "../../auth.js";
import { guideGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  createListController,
  downloadCsv,
  closeModal,
  openModal,
  formatMoney,
  statusBadge,
  stamp,
  toast,
} from "../../components/admin-ui.js";
import { formatPrice, formatDate } from "../../data.js";
import { escapeHtml, searchKey } from "../../validate.js";

const FILTERS = { q: "", status: "", tour: "" };

function tourName(booking) {
  return booking.tourName || getTourById(booking.tourId)?.name || "Tour không còn trong danh mục";
}

/* Chỉ hiện đơn đã xác nhận trở đi: khách chưa thanh toán chưa phải việc của Guide */
function operationalBookings() {
  const session = getSession();
  return guideBookings(session.username).filter((item) =>
    ["paid", "upcoming", "ongoing", "completed"].includes(item.status)
  );
}

function filterRows(rows) {
  const query = searchKey(FILTERS.q);
  return rows.filter((booking) => {
    if (FILTERS.status && booking.status !== FILTERS.status) return false;
    if (FILTERS.tour && String(booking.tourId) !== FILTERS.tour) return false;
    if (
      query &&
      !searchKey(
        `${booking.code} ${booking.name} ${booking.phone} ${booking.email} ${booking.tourName} ${booking.note}`
      ).includes(query)
    )
      return false;
    return true;
  });
}

function row(booking) {
  const next = nextBookingStatus(booking.status, { guide: true });
  const canRun = hasPermission("guide.tours.run") && next;
  return `
  <tr data-code="${escapeHtml(booking.code)}" data-search="${escapeHtml(
    searchKey(`${booking.code} ${booking.name} ${booking.phone} ${booking.tourName}`)
  )}">
    <td><strong class="code">${escapeHtml(booking.code)}</strong><br><small>${escapeHtml(
    formatDate(booking.date)
  )}</small></td>
    <td>
      <span class="cell-user">
        <span>
          <strong>${escapeHtml(booking.name)}</strong>
          <small>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</small>
        </span>
      </span>
    </td>
    <td>${escapeHtml(tourName(booking))}<br><small>${escapeHtml(booking.tourLocation || "-")}</small></td>
    <td>${booking.people} khách<br><small>${formatPrice(booking.tourPrice || 0)}/người</small></td>
    <td>${statusBadge(booking.status, BOOKING_STATUS)}</td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-guide-view="${escapeHtml(booking.code)}">Chi tiết</button>
      ${
        canRun
          ? `<button class="btn btn-sm btn-primary" type="button" data-guide-advance="${escapeHtml(
              booking.code
            )}" data-next="${escapeHtml(next)}">${escapeHtml(BOOKING_STATUS[next])}</button>`
          : ""
      }
    </td>
  </tr>`;
}

export function GuideBookings() {
  const denied = guideGuard("guide.customers.view");
  if (denied) return denied;

  const rows = operationalBookings();
  const tours = [...new Map(rows.map((item) => [String(item.tourId), item])).values()];

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Đơn được giao</p><strong class="kpi-value">${rows.length}</strong><span class="kpi-hint">Đã thanh toán trở đi</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Sắp khởi hành</p><strong class="kpi-value">${
      rows.filter((item) => item.status === "upcoming").length
    }</strong><span class="kpi-hint">Cần đón khách</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Đang diễn ra</p><strong class="kpi-value">${
      rows.filter((item) => item.status === "ongoing").length
    }</strong><span class="kpi-hint">Đang phụ trách</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Tổng khách</p><strong class="kpi-value">${rows.reduce(
      (sum, item) => sum + (Number(item.people) || 0),
      0
    )}</strong><span class="kpi-hint">${formatMoney(rows.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="gb-q">Tìm khách</label>
        <input id="gb-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên, số điện thoại, mã đơn..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="gb-tour">Chuyến</label>
        <select id="gb-tour">
          <option value="">Tất cả chuyến</option>
          ${tours
            .map(
              (item) =>
                `<option value="${escapeHtml(String(item.tourId))}">${escapeHtml(tourName(item))}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="gb-status">Trạng thái</label>
        <select id="gb-status">
          <option value="">Tất cả</option>
          ${Object.entries(BOOKING_STATUS)
            .filter(([key]) => ["paid", "upcoming", "ongoing", "completed"].includes(key))
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <div class="toolbar-actions toolbar-actions-end">
      <button class="btn btn-sm btn-ghost-soft" type="button" id="gb-export">Xuất CSV</button>
    </div>

    <p class="result-count" id="gb-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Mã đơn</th><th>Khách</th><th>Chuyến</th><th>Quy mô</th><th>Trạng thái</th><th>Thao tác</th></tr>
        </thead>
        <tbody id="gb-rows"></tbody>
      </table>
    </div>
    <div id="gb-page"></div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (String(detail.path) !== "guide/bookings") return;
  if (!document.getElementById("gb-rows")) return;

  const controller = createListController({
    mount: "#gb-rows",
    count: "#gb-count",
    pageEl: "#gb-page",
    pageSize: 10,
    load: () => filterRows(operationalBookings()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="6" class="table-empty">Không có khách nào khớp bộ lọc.</td></tr>`,
  });

  controller.refresh();
  controller.bind();

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("gb-tour", FILTERS.tour);
  set("gb-status", FILTERS.status);

  document.getElementById("gb-q")?.addEventListener("input", (event) => {
    FILTERS.q = event.target.value;
    controller.refresh();
  });
  document.getElementById("gb-tour")?.addEventListener("change", (event) => {
    FILTERS.tour = event.target.value;
    controller.refresh();
  });
  document.getElementById("gb-status")?.addEventListener("change", (event) => {
    FILTERS.status = event.target.value;
    controller.refresh();
  });

  document.getElementById("gb-export")?.addEventListener("click", () => {
    const rows = filterRows(operationalBookings());
    if (!rows.length) return toast("Không có dữ liệu để xuất.", "error");
    return downloadCsv(
      `khach-hang-phan-cong-${stamp()}`,
      ["Mã đơn", "Khách", "Điện thoại", "Email", "Tour", "Khởi hành", "Số khách", "Tổng tiền", "Trạng thái", "Ghi chú"],
      rows.map((item) => [
        item.code,
        item.name,
        item.phone,
        item.email,
        tourName(item),
        item.date,
        item.people,
        item.total,
        BOOKING_STATUS[item.status],
        item.note,
      ])
    );
  });
});

/* Xem đầy đủ thông tin một khách + ghi chú vận hành của Guide */
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-guide-view]");
  if (!button) return;

  const session = getSession();
  const booking = guideBookings(session.username).find((item) => item.code === button.dataset.guideView);
  if (!booking) return;

  openModal({
      title: `Khách ${booking.name}`,
      subtitle: `${booking.code} · ${tourName(booking)}`,
      size: "lg",
      body: `
        <div class="detail-grid">
          <section>
            <h4>Thông tin khách</h4>
            <ul class="summary-list">
              <li><span>Họ tên</span><strong>${escapeHtml(booking.name)}</strong></li>
              <li><span>Điện thoại</span><strong>${escapeHtml(booking.phone)}</strong></li>
              <li><span>Email</span><strong>${escapeHtml(booking.email || "-")}</strong></li>
              <li><span>Số khách</span><strong>${booking.people} (${booking.adults} lớn, ${booking.children} trẻ)</strong></li>
              <li><span>Tổng tiền</span><strong>${formatPrice(booking.total)}</strong></li>
            </ul>
          </section>
          <section>
            <h4>Chuyến đi</h4>
            <ul class="summary-list">
              <li><span>Tour</span><strong>${escapeHtml(tourName(booking))}</strong></li>
              <li><span>Địa điểm</span><strong>${escapeHtml(booking.tourLocation || "-")}</strong></li>
              <li><span>Thời lượng</span><strong>${escapeHtml(booking.tourTime || "-")}</strong></li>
              <li><span>Khởi hành</span><strong>${escapeHtml(formatDate(booking.date))}</strong></li>
              <li><span>Trạng thái</span><strong>${statusBadge(booking.status, BOOKING_STATUS)}</strong></li>
            </ul>
          </section>
        </div>
        ${
          booking.note
            ? `<h4>Ghi chú của khách</h4><div class="note-box">${escapeHtml(booking.note)}</div>`
            : ""
        }
        <div class="field">
          <label for="guide-note">Ghi chú vận hành (nội bộ)</label>
          <textarea id="guide-note" rows="3" placeholder="Ghi chú riêng cho team, khách không thấy">${escapeHtml(
            booking.guideNote || ""
          )}</textarea>
        </div>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" data-save-guide-note="${escapeHtml(booking.code)}">Lưu ghi chú</button>`,
    });

  document.querySelector("[data-save-guide-note]")?.addEventListener("click", () => {
    const value = document.getElementById("guide-note")?.value || "";
    updateBooking(booking.code, { guideNote: value, guideNoteBy: session.name });
    closeModal();
    toast("Đã lưu ghi chú vận hành.");
    refreshAdmin();
  });
});