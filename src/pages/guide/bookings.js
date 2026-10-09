import { BOOKING_STATUS, PAYMENT_STATUS, guideBookings, nextBookingStatus, updateBooking, markAttendance, addCashPayment, removeCashPayment } from "../../store.js";
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
import { formatDateTime } from "../../reports.js";

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
  
  // Trạng thái điểm danh
  let attendanceHtml = `<span class="soft-chip">Chưa điểm danh</span>`;
  if (booking.attendance === "present") attendanceHtml = `<span class="status-pill status-paid">Có mặt</span>`;
  if (booking.attendance === "absent") attendanceHtml = `<span class="status-pill status-cancelled">Vắng mặt</span>`;

  // Trạng thái thanh toán & Tiền mặt
  const remain = booking.total - (booking.cashCollected || 0);
  let paymentHtml = statusBadge(booking.payment || "unpaid", BOOKING_STATUS); // using statusBadge but for payment, wait, let's use PAYMENT_STATUS if imported or just badge. We don't import PAYMENT_STATUS here yet.
  
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
    <td>${booking.people} khách<br>${attendanceHtml}</td>
    <td>
       <span class="status-pill status-${escapeHtml(booking.payment || "unpaid")}">${booking.payment === 'paid' ? 'Đã thanh toán' : booking.payment === 'deposit' ? 'Đã cọc' : 'Chưa thanh toán'}</span>
       ${booking.cashCollected > 0 ? `<br><small>Đã thu: ${formatMoney(booking.cashCollected)}</small>` : ""}
    </td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-guide-view="${escapeHtml(booking.code)}">Chi tiết & Cập nhật</button>
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

  const remain = booking.total - (booking.cashCollected || 0);

  openModal({
      title: `Khách ${booking.name}`,
      subtitle: `${booking.code} · ${tourName(booking)}`,
      size: "lg",
      body: `
        <div class="detail-grid">
          <section>
            <h4>Thông tin khách & Trạng thái</h4>
            <ul class="summary-list">
              <li><span>Họ tên</span><strong>${escapeHtml(booking.name)}</strong></li>
              <li><span>Điện thoại</span><strong>${escapeHtml(booking.phone)}</strong></li>
              <li><span>Email</span><strong>${escapeHtml(booking.email || "-")}</strong></li>
              <li><span>Số khách</span><strong>${booking.people} (${booking.adults} lớn, ${booking.children} trẻ)</strong></li>
              <li><span>Trạng thái</span><strong>${statusBadge(booking.status, BOOKING_STATUS)}</strong></li>
              <li>
                <span>Điểm danh</span>
                <div class="attendance-actions" style="margin-top:4px">
                   ${
                     booking.attendance === "present"
                       ? `<span class="status-pill status-paid">Đã xác nhận có mặt</span>`
                       : booking.attendance === "absent"
                       ? `<span class="status-pill status-cancelled">Đã xác nhận vắng mặt</span>`
                       : `<span class="soft-chip">Chưa kiểm tra</span>`
                   }
                   ${
                     ["upcoming", "ongoing"].includes(booking.status)
                       ? `<div style="margin-top:8px; display:flex; gap:8px">
                            <button class="btn btn-sm btn-outline" type="button" data-attendance="present" data-code="${escapeHtml(booking.code)}">Có mặt</button>
                            <button class="btn btn-sm btn-outline-danger" type="button" data-attendance="absent" data-code="${escapeHtml(booking.code)}">Vắng mặt</button>
                          </div>`
                       : ""
                   }
                </div>
              </li>
            </ul>
          </section>
          <section>
            <h4>Thanh toán & Thu tiền mặt</h4>
            <ul class="summary-list">
              <li><span>Tổng tiền</span><strong>${formatMoney(booking.total)}</strong></li>
              <li><span>Trạng thái TT</span><strong>${statusBadge(booking.payment || "unpaid", PAYMENT_STATUS)}</strong></li>
              <li><span>Đã thu tiền mặt</span><strong>${formatMoney(booking.cashCollected || 0)}</strong></li>
              <li><span>Còn lại cần thu</span><strong>${remain > 0 ? formatMoney(remain) : "0 đ"}</strong></li>
            </ul>
            ${
              remain > 0 && ["upcoming", "ongoing", "awaiting_payment"].includes(booking.status)
                ? `<div class="payment-action-box" style="margin-top:16px; background:var(--bg-soft); padding:12px; border-radius:8px;">
                     <h5 style="margin-bottom:8px">Ghi nhận thu thêm tiền mặt</h5>
                     <div style="display:flex; gap:8px;">
                        <input type="number" id="guide-cash-amount" class="input-field" placeholder="Nhập số tiền..." max="${remain}" style="flex:1">
                        <button class="btn btn-primary" type="button" data-add-cash="${escapeHtml(booking.code)}">Xác nhận thu</button>
                     </div>
                     <p class="form-hint" style="margin-top:4px">Khách thanh toán trực tiếp cho HDV</p>
                   </div>`
                : ""
            }
          </section>
        </div>
        
        ${
          (booking.cashPayments || []).length > 0
            ? `<div class="detail-span" style="margin-top:16px;">
                 <h4>Lịch sử thu tiền mặt của đơn này</h4>
                 <ul class="history-list">
                   ${booking.cashPayments.map((p, i) => `
                     <li>
                        <strong>${formatMoney(p.amount)}</strong>
                        <ul class="it-list">
                          <li>Thu lúc ${formatDateTime(p.at)} · Bời ${escapeHtml(p.by)}</li>
                        </ul>
                     </li>`).join("")}
                 </ul>
               </div>`
            : ""
        }

        ${
          booking.note
            ? `<div style="margin-top:16px;"><h4>Ghi chú của khách</h4><div class="note-box">${escapeHtml(booking.note)}</div></div>`
            : ""
        }
        <div class="field" style="margin-top:16px;">
          <label for="guide-note">Ghi chú vận hành (nội bộ)</label>
          <textarea id="guide-note" rows="3" placeholder="Ghi chú riêng cho team, khách không thấy">${escapeHtml(
            booking.guideNote || ""
          )}</textarea>
        </div>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" data-save-guide-note="${escapeHtml(booking.code)}">Lưu ghi chú</button>`,
    });
});

/* Lắng nghe sự kiện lưu ghi chú, điểm danh, thu tiền */
document.addEventListener("click", (event) => {
  const session = getSession();

  // 1. Lưu ghi chú
  const btnNote = event.target.closest("[data-save-guide-note]");
  if (btnNote) {
    const code = btnNote.dataset.saveGuideNote;
    const value = document.getElementById("guide-note")?.value || "";
    updateBooking(code, { guideNote: value, guideNoteBy: session.name });
    closeModal();
    toast("Đã lưu ghi chú vận hành.");
    refreshAdmin();
    return;
  }

  // 2. Điểm danh
  const btnAtt = event.target.closest("[data-attendance]");
  if (btnAtt) {
    const code = btnAtt.dataset.code;
    const status = btnAtt.dataset.attendance;
    const res = markAttendance(code, status, { guideId: session.username, by: session.name });
    if (res.error) return toast(res.error, "error");
    toast(`Đã cập nhật điểm danh: ${status === "present" ? "Có mặt" : "Vắng mặt"}`);
    closeModal();
    refreshAdmin();
    return;
  }

  // 3. Thu tiền mặt
  const btnCash = event.target.closest("[data-add-cash]");
  if (btnCash) {
    const code = btnCash.dataset.addCash;
    const amount = document.getElementById("guide-cash-amount")?.value;
    if (!amount || amount <= 0) return toast("Vui lòng nhập số tiền hợp lệ", "error");
    
    if (!confirm(`Xác nhận đã thu ${formatMoney(amount)} tiền mặt từ khách?`)) return;

    const res = addCashPayment(code, amount, { guideId: session.username, by: session.name });
    if (res.error) return toast(res.error, "error");
    
    toast(`Đã ghi nhận thu ${formatMoney(amount)}`);
    closeModal();
    refreshAdmin();
    return;
  }
});