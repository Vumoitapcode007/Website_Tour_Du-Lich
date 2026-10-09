import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  advanceBooking,
  assignBookingGuide,
  cancelBooking,
  getBooking,
  isCancelledBooking,
  isProtectedBooking,
  listBookings,
  logActivity,
  nextBookingStatus,
  removeBooking,
  saveNotification,
  updateBooking,
} from "../../store.js";
import { bookingSummary, formatDateTime, formatRelative } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  closeModal,
  createListController,
  downloadCsv,
  formatMoney,
  initials,
  openModal,
  setupSelection,
  stamp,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { imgFallback } from "../../components/tour-card.js";
import { getSession, hasPermission, listGuides } from "../../auth.js";
import { formatDate } from "../../data.js";
import { getTourById, listTours } from "../../tour-repository.js";
import { escapeHtml, searchKey } from "../../validate.js";
import {
  MAX_PASSENGERS,
  childPrice,
  passengerBreakdown,
  passengerLabel,
} from "../../booking-rules.js";

const canManage = () => hasPermission("bookings.manage");
const canAssign = () => hasPermission("bookings.assign");

/* Báo cho khách khi trạng thái đơn thay đổi */
function notifyBooking(booking, status) {
  if (!booking) return;
  const content = {
    confirmed: [
      `Đơn ${booking.code} đã được xác nhận`,
      `Tour ${booking.tourName} ngày ${formatDate(booking.date)}. Vui lòng hoàn tất thanh toán trước khi khởi hành.`,
    ],
    paid: [
      `Đơn ${booking.code} đã thanh toán thành công`,
      `Quý khách đã thanh toán thành công tour ${booking.tourName}. Chúc quý khách có một chuyến đi tuyệt vời!`,
    ],
    departing: [
      `Tour ${booking.tourName} đang khởi hành`,
      `Chuyến đi mã ${booking.code} đã bắt đầu. Quý khách vui lòng theo dõi hướng dẫn của HDV đoàn.`,
    ],
    completed: [
      `Tour ${booking.tourName} đã hoàn thành`,
      `Cảm ơn quý khách đã đồng hành cùng TravelGo trên chuyến đi ${booking.code}. Xin vui lòng để lại đánh giá trải nghiệm!`,
    ],
    cancelled: [
      `Đơn ${booking.code} đã được huỷ`,
      `Tour ${booking.tourName}. Bạn có thể đặt lại bất cứ lúc nào hoặc liên hệ hotline để được hỗ trợ.`,
    ],
  }[status];

  if (!content) return;
  saveNotification({
    type: "booking",
    title: content[0],
    body: content[1],
    phone: booking.phone,
    email: booking.email,
    accountUsername: booking.accountUsername || "",
  });
}

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
  const { people } = passengerBreakdown(booking);
  const thumb = booking.tourImage || tour?.image || "";
  const unitPrice = booking.tourPrice || tour?.price || 0;
  
  let attendanceHtml = `<small class="soft-chip">Chưa ĐD</small>`;
  if (booking.attendance === "present") attendanceHtml = `<small class="status-pill status-paid">Có mặt</small>`;
  if (booking.attendance === "absent") attendanceHtml = `<small class="status-pill status-cancelled">Vắng mặt</small>`;

  const cashHtml = booking.cashCollected > 0 ? `<br><small>Tiền mặt: ${formatMoney(booking.cashCollected)}</small>` : "";

  return `
  <tr data-code="${escapeHtml(booking.code)}" data-search="${escapeHtml(
    searchKey(`${booking.code} ${booking.name} ${booking.phone} ${booking.tourName}`)
  )}">
    <td class="cell-check">
      ${canManage() ? `<input type="checkbox" data-select value="${escapeHtml(booking.code)}" aria-label="Chọn đơn ${escapeHtml(booking.code)}">` : ""}
    </td>
    <td class="cell-code">
      <span class="code-chip">${escapeHtml(booking.code)}</span>
      <small>${formatRelative(booking.createdAt)}</small>
    </td>
    <td>
      <span class="cell-user">
        <span class="avatar-sm">${escapeHtml(initials(booking.name))}</span>
        <span class="cell-user-info">
          <strong>${escapeHtml(booking.name)}</strong>
          <small>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</small>
        </span>
      </span>
    </td>
    <td>
      <span class="cell-tour">
        ${
          thumb
            ? `<img class="tour-thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy" onerror="${imgFallback}">`
            : `<span class="tour-thumb tour-thumb-empty" aria-hidden="true">🧭</span>`
        }
        <span class="cell-tour-info">
          <strong>${escapeHtml(booking.tourName)}</strong>
          <small>Khởi hành ${formatDate(booking.date)}${tour ? ` · còn ${tour.seatsLeft} chỗ` : ""}</small>
        </span>
      </span>
    </td>
    <td>
      <strong>${people} khách</strong>
      <div style="margin-top:2px">${attendanceHtml}</div>
    </td>
    <td>
      <strong>${formatMoney(booking.total)}</strong>
      ${cashHtml}
    </td>
    <td><span class="status-pill status-${escapeHtml(booking.payment || "unpaid")}">${
      PAYMENT_STATUS[booking.payment || "unpaid"] || booking.payment
    }</span></td>
    <td>${statusBadge(booking.status, BOOKING_STATUS)}${
      booking.guideName ? `<br><small>${escapeHtml(booking.guideName)}</small>` : ""
    }</td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-booking-action="view">Chi tiết</button>
      ${
        canManage() && booking.status === "pending"
          ? `<button class="btn btn-sm btn-primary" type="button" data-booking-action="confirmed">Xác nhận</button>`
          : ""
      }
      ${
        canManage() && !isCancelledBooking(booking) && booking.status !== "completed"
          ? `<button class="btn btn-sm btn-outline" type="button" data-booking-action="cancelled">Huỷ</button>`
          : ""
      }
    </td>
  </tr>`;
}

/* Popup xác nhận đơn - hiển thị đầy đủ để nhân viên không bỏ sót thông tin
   trước khi bấm xác nhận (mã đơn, khách, tour, ngày, số khách, tổng tiền) */
function confirmModal(booking) {
  const { adults, children, people } = passengerBreakdown(booking);
  const tour = getTourById(booking.tourId);
  const unitPrice = booking.tourPrice || tour?.price || 0;
  activeCode = booking.code;

  openModal({
    title: "Xác nhận đơn đặt tour",
    subtitle: `Mã đơn ${booking.code}`,
    size: "md",
    body: `
      <div class="confirm-box">
        <h4 class="confirm-box-title">Kiểm tra lại thông tin đơn</h4>
        <ul class="summary-list">
          <li><span>Mã đơn</span><strong>${escapeHtml(booking.code)}</strong></li>
          <li><span>Khách hàng</span><strong>${escapeHtml(booking.name)}</strong></li>
          <li><span>Số điện thoại</span><strong>${escapeHtml(booking.phone)}</strong></li>
          <li><span>Tour</span><strong>${escapeHtml(booking.tourName)}</strong></li>
          <li><span>Điểm đến</span><strong>${escapeHtml(booking.tourLocation || tour?.location || "-")}</strong></li>
          <li><span>Thời lượng</span><strong>${escapeHtml(booking.tourTime || tour?.time || "-")}</strong></li>
          <li><span>Ngày khởi hành</span><strong>${formatDate(booking.date)}</strong></li>
          <li><span>Người lớn</span><strong>${adults} khách</strong></li>
          <li><span>Trẻ em</span><strong>${children} khách</strong></li>
          <li><span>Tổng khách</span><strong>${people}/${MAX_PASSENGERS}</strong></li>
          <li><span>Giá/người lớn</span><strong>${formatMoney(unitPrice)}</strong></li>
          <li><span>Giá/trẻ em</span><strong>${formatMoney(childPrice(unitPrice))}</strong></li>
          <li><span>Tổng tiền</span><strong class="confirm-box-total">${formatMoney(booking.total)}</strong></li>
        </ul>
      </div>
      ${
        booking.note
          ? `<h4>Ghi chú của khách</h4><p class="note-box">${escapeHtml(booking.note)}</p>`
          : ""
      }
      <p class="form-hint">
        Xác nhận đơn sẽ chuyển sang bước <strong>${BOOKING_STATUS.awaiting_payment}</strong> và khách
        nhận được thông báo yêu cầu thanh toán.
      </p>
      ${assignGuideHtml(booking)}`,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Để xem lại</button>
      <button class="btn btn-primary" type="button" data-modal-confirm>${confirmActionLabel(
        booking
      )}</button>`,
  });
}

function confirmActionLabel(booking) {
  const next = nextBookingStatus(booking.status);
  if (!next) return "Xác nhận đơn";
  return `Chuyển sang ${BOOKING_STATUS[next]}`;
}

/* Ô phân công Tour Guide - chỉ hiện khi Admin có quyền bookings.assign */
function assignGuideHtml(booking) {
  if (!canAssign()) return "";
  const guides = listGuides();

  if (!guides.length) {
    return `
      <section class="assign-guide-box">
        <h4>🧭 Giao việc cho hướng dẫn viên</h4>
        <p class="form-hint">
          Chưa có hướng dẫn viên nào đang hoạt động. Vào mục <strong>Tài khoản</strong> để tạo
          hướng dẫn viên trước khi phân công.
        </p>
      </section>`;
  }

  return `
    <section class="assign-guide-box">
      <h4>🧭 Giao việc cho hướng dẫn viên</h4>
      <div class="field">
        <label for="bk-guide">Chọn hướng dẫn viên phụ trách (${guides.length} HDV có sẵn)</label>
        <select id="bk-guide" data-assign-guide="${escapeHtml(booking.code)}">
          <option value="">-- Chưa phân công --</option>
          ${guides
            .map(
              (guide) =>
                `<option value="${escapeHtml(guide.username)}"${
                  booking.guideId === guide.username ? " selected" : ""
                }>${escapeHtml(guide.name)} · ${escapeHtml(guide.phone || "")}</option>`
            )
            .join("")}
        </select>
        <p class="form-hint">
          ${
            booking.guideName
              ? `Đang phụ trách: <strong>${escapeHtml(booking.guideName)}</strong>`
              : "Chọn hướng dẫn viên để giao tour và danh sách khách này cho họ."
          }
        </p>
      </div>
    </section>`;
}

/* Section giao việc đầy đủ trong modal chi tiết - hiện sau khi đơn đã được xác nhận */
function guideTaskSection(booking) {
  if (!canAssign()) return "";
  const cancelled = booking.status === "cancelled";
  const completed = booking.status === "completed";
  const guides = listGuides();
  const assigned = guides.find((g) => g.username === booking.guideId);

  /* Thông tin HDV đang phụ trách */
  const currentGuideHtml = booking.guideName
    ? `<div class="guide-task-current">
        <span class="guide-task-avatar">${escapeHtml(initials(booking.guideName))}</span>
        <div class="guide-task-info">
          <strong>${escapeHtml(booking.guideName)}</strong>
          ${booking.guidePhone ? `<small>📞 ${escapeHtml(booking.guidePhone)}</small>` : ""}
          ${assigned?.email ? `<small>✉️ ${escapeHtml(assigned.email)}</small>` : ""}
        </div>
        <span class="status-pill status-confirmed">Đã phân công</span>
      </div>`
    : `<p class="guide-task-empty">Chưa có hướng dẫn viên nào được phân công cho đơn này.</p>`;

  if (cancelled || completed) {
    return `
      <section class="assign-guide-box detail-span">
        <h4>🧭 Hướng dẫn viên phụ trách</h4>
        ${currentGuideHtml}
      </section>`;
  }

  if (!guides.length) {
    return `
      <section class="assign-guide-box detail-span">
        <h4>🧭 Giao việc cho hướng dẫn viên</h4>
        ${currentGuideHtml}
        <p class="form-hint" style="margin-top:.5rem">
          Chưa có hướng dẫn viên đang hoạt động. Vào mục <strong>Tài khoản</strong> để thêm HDV.
        </p>
      </section>`;
  }

  return `
    <section class="assign-guide-box detail-span" id="guide-task-section">
      <h4>🧭 Giao việc cho hướng dẫn viên</h4>

      ${currentGuideHtml}

      <div class="guide-task-form">
        <div class="field-row">
          <div class="field">
            <label for="gt-guide">Chọn / thay đổi hướng dẫn viên</label>
            <select id="gt-guide">
              <option value="">-- Chưa phân công --</option>
              ${guides
                .map(
                  (g) =>
                    `<option value="${escapeHtml(g.username)}"${
                      booking.guideId === g.username ? " selected" : ""
                    }>${escapeHtml(g.name)} · ${escapeHtml(g.phone || "")}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
        <div class="field">
          <label for="gt-note">Ghi chú nhiệm vụ cho hướng dẫn viên</label>
          <textarea id="gt-note" rows="3" placeholder="Ví dụ: Đón khách tại sảnh khách sạn lúc 6:00 sáng, mặc đồng phục công ty, mang bảng tên đoàn...">${escapeHtml(booking.guideNote || "")}</textarea>
        </div>
        <div class="guide-task-actions">
          <button class="btn btn-sm btn-primary" type="button" id="gt-save" data-booking-code="${escapeHtml(booking.code)}">
            💾 Lưu phân công
          </button>
          ${
            booking.guideId
              ? `<button class="btn btn-sm btn-ghost-soft" type="button" id="gt-remove" data-booking-code="${escapeHtml(booking.code)}">
                  Bỏ phân công
                </button>`
              : ""
          }
        </div>
      </div>
    </section>`;
}

function detailModal(booking) {
  const tour = getTourById(booking.tourId);
  const history = listBookings()
    .filter((item) => item.phone === booking.phone && item.code !== booking.code)
    .slice(0, 5);
  const { adults, children, people } = passengerBreakdown(booking);
  activeCode = booking.code;
  const remain = booking.total - (booking.cashCollected || 0);

  openModal({
    title: `📋 Chi tiết đơn: ${booking.code}`,
    subtitle: `Thời gian đặt: ${formatDateTime(booking.createdAt)}${booking.updatedAt ? ` · Cập nhật: ${formatDateTime(booking.updatedAt)}` : ""}`,
    size: "lg",
    body: `
    <div class="booking-detail">
      <section>
        <h4>Thông tin khách hàng & Trạng thái</h4>
        <ul class="summary-list">
          <li><span>Họ tên</span><strong>${escapeHtml(booking.name)}</strong></li>
          <li><span>Điện thoại</span><strong><a href="tel:${escapeHtml(booking.phone)}">${escapeHtml(booking.phone)}</a></strong></li>
          <li><span>Email</span><strong>${escapeHtml(booking.email || "Không có")}</strong></li>
          <li><span>Trạng thái đơn</span><strong>${statusBadge(booking.status, BOOKING_STATUS)}</strong></li>
          <li><span>Thanh toán</span><strong>${statusBadge(booking.payment || "unpaid", PAYMENT_STATUS)}</strong></li>
          <li><span>Điểm danh (HDV)</span><strong>${
            booking.attendance === "present" ? `<span class="status-pill status-paid">Có mặt</span>`
            : booking.attendance === "absent" ? `<span class="status-pill status-cancelled">Vắng mặt</span>`
            : `<span class="soft-chip">Chưa kiểm tra</span>`
          }</strong></li>
        </ul>
      </section>
      <section>
        <h4>Thông tin chuyến đi & Tài chính</h4>
        <ul class="summary-list">
          <li><span>Tour</span><strong>${escapeHtml(booking.tourName)}</strong></li>
          <li><span>Ngày khởi hành</span><strong>${formatDate(booking.date)}</strong></li>
          <li><span>Tổng khách</span><strong>${people}/${MAX_PASSENGERS} (${adults} lớn, ${children} trẻ)</strong></li>
          <li><span>Tổng tiền</span><strong>${formatMoney(booking.total)}</strong></li>
          <li><span>Đã thu tiền mặt</span><strong>${formatMoney(booking.cashCollected || 0)}</strong></li>
          <li><span>Còn lại cần thu</span><strong>${remain > 0 ? formatMoney(remain) : "0 đ"}</strong></li>
        </ul>
      </section>

      ${
        (booking.cashPayments || []).length > 0
          ? `<section class="detail-span">
               <h4>Lịch sử thu tiền mặt từ HDV</h4>
               <ul class="history-list">
                 ${booking.cashPayments.map((p) => `
                   <li>
                      <strong>${formatMoney(p.amount)}</strong>
                      <ul class="it-list">
                        <li>Thu lúc ${formatDateTime(p.at)} · Người thu: ${escapeHtml(p.by)}</li>
                        ${p.note ? `<li>Ghi chú: ${escapeHtml(p.note)}</li>` : ""}
                      </ul>
                   </li>`).join("")}
               </ul>
             </section>`
          : ""
      }

      ${guideTaskSection(booking)}

      ${
        (booking.statusHistory || []).length
          ? `<section class="detail-span">
               <h4>Lịch sử trạng thái</h4>
               <ul class="history-list">${booking.statusHistory
                 .map(
                   (entry) =>
                     `<li><strong>${escapeHtml(
                       BOOKING_STATUS[entry.status] || entry.status
                     )}</strong><br><small>${formatDateTime(entry.at)} · ${escapeHtml(
                       entry.by || ""
                     )}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</small></li>`
                 )
                 .join("")}</ul>
             </section>`
          : ""
      }

      <section class="detail-span">
        <h4>Ghi chú của khách</h4>
        <p class="note-box">${booking.note ? escapeHtml(booking.note) : "Khách không để lại ghi chú."}</p>
      </section>

      ${
        canManage()
          ? `<section class="detail-span">
               <h4>⚡ Cập nhật trạng thái đơn hàng &amp; thanh toán</h4>
               <div class="order-status-manager">
                 <div class="field-row">
                   <div class="field">
                     <label for="dlg-status">Trạng thái đơn hàng</label>
                     <select id="dlg-status">
                       ${Object.entries(BOOKING_STATUS)
                         .map(([val, label]) => `<option value="${val}"${booking.status === val ? " selected" : ""}>${label}</option>`)
                         .join("")}
                     </select>
                   </div>
                   <div class="field">
                     <label for="dlg-payment">Trạng thái thanh toán</label>
                     <select id="dlg-payment">
                       ${Object.entries(PAYMENT_STATUS)
                         .map(([val, label]) => `<option value="${val}"${(booking.payment || "unpaid") === val ? " selected" : ""}>${label}</option>`)
                         .join("")}
                     </select>
                   </div>
                 </div>
                 <button class="btn btn-sm btn-primary" type="button" id="dlg-save-status">
                   💾 Lưu thay đổi trạng thái
                 </button>
               </div>
             </section>`
          : ""
      }

      ${
        history.length
          ? `<section class="detail-span">
               <h4>Lịch sử các đơn khác của khách này (${history.length})</h4>
               <ul class="history-list">${history
                 .map(
                   (item) =>
                     `<li><a href="#/admin/bookings?q=${encodeURIComponent(item.code)}">${escapeHtml(item.code)}</a> · ${escapeHtml(item.tourName)} · ${formatDate(item.date)} · ${statusBadge(item.status, BOOKING_STATUS)}</li>`
                 )
                 .join("")}</ul>
             </section>`
          : ""
      }
    </div>`,
    footer: `
      ${
        canManage()
          ? `<button class="btn btn-outline" type="button" data-modal-payment>Đổi trạng thái thanh toán</button>
             ${
               isCancelledBooking(booking) || booking.status === "completed"
                 ? ""
                 : `<button class="btn btn-ghost-soft" type="button" data-modal-cancel>Huỷ đơn</button>`
             }
             ${
               nextBookingStatus(booking.status)
                 ? `<button class="btn btn-primary" type="button" data-modal-confirm>${confirmActionLabel(
                     booking
                   )}</button>`
                 : ""
             }
             ${
               isProtectedBooking(booking)
                 ? `<button class="btn btn-outline-danger" type="button" disabled title="Đơn đã có giao dịch thanh toán, không thể xoá">Không thể xoá</button>`
                 : `<button class="btn btn-outline-danger" type="button" data-modal-delete>Xoá đơn</button>`
             }`
          : `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`
      }`,
  });

  document.getElementById("dlg-save-status")?.addEventListener("click", () => {
    const newStatus = document.getElementById("dlg-status")?.value;
    const newPayment = document.getElementById("dlg-payment")?.value;
    if (!newStatus || !newPayment) return;

    updateBooking(booking.code, { status: newStatus, payment: newPayment });
    notifyBooking(booking, newStatus);
    logActivity("Cập nhật đơn", `Đơn ${booking.code}: Trạng thái -> ${BOOKING_STATUS[newStatus]}, Thanh toán -> ${PAYMENT_STATUS[newPayment]}`);
    toast(`Đã cập nhật trạng thái đơn ${booking.code} vào LocalStorage.`);
    closeModal();
    refreshAdmin();
  });

  /* Lưu phân công Tour Guide kèm ghi chú nhiệm vụ */
  document.getElementById("gt-save")?.addEventListener("click", () => {
    if (!canAssign()) return;
    const code = booking.code;
    const guideId = document.getElementById("gt-guide")?.value || "";
    const guideNote = document.getElementById("gt-note")?.value?.trim() || "";
    const guide = listGuides().find((g) => g.username === guideId) || null;

    const result = assignBookingGuide(code, guide);
    if (result.error) return toast(result.error, "error");

    /* Lưu thêm ghi chú nhiệm vụ vào đơn */
    updateBooking(code, { guideNote });

    logActivity(
      "Phân công hướng dẫn viên",
      guide
        ? `Phân công ${guide.name} cho đơn ${code}${guideNote ? ` — "${guideNote}"` : ""}`
        : `Bỏ phân công hướng dẫn viên cho đơn ${code}`
    );
    toast(guide ? `Đã phân công ${guide.name} cho đơn ${code}.` : `Đã bỏ phân công đơn ${code}.`);
    closeModal();
    refreshAdmin();
  });

  /* Bỏ phân công Tour Guide */
  document.getElementById("gt-remove")?.addEventListener("click", () => {
    if (!canAssign()) return;
    if (!window.confirm(`Bỏ phân công hướng dẫn viên khỏi đơn ${booking.code}?`)) return;
    const result = assignBookingGuide(booking.code, null);
    if (result.error) return toast(result.error, "error");
    updateBooking(booking.code, { guideNote: "" });
    logActivity("Bỏ phân công HDV", `Đơn ${booking.code} — ${booking.guideName}`);
    toast(`Đã bỏ phân công đơn ${booking.code}.`);
    closeModal();
    refreshAdmin();
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

  const confirmedOrPaid = all.filter((item) => item.status === "confirmed" || item.status === "paid").length;
  const departingOrDone = all.filter((item) => item.status === "departing" || item.status === "completed").length;

  return `
  <section class="kpi-grid kpi-grid-5">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng đơn</p><strong class="kpi-value">${summary.total}</strong><span class="kpi-hint">${summary.people} lượt khách</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Chờ xác nhận</p><strong class="kpi-value">${summary.pending}</strong><span class="kpi-hint">${summary.awaiting_payment} đang chờ thanh toán</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đang chạy tour</p><strong class="kpi-value">${
      summary.upcoming + summary.ongoing
    }</strong><span class="kpi-hint">${summary.completed} đã hoàn thành</span></article>
    <article class="kpi kpi-red"><p class="kpi-label">Đã huỷ</p><strong class="kpi-value">${summary.cancelled}</strong><span class="kpi-hint">${formatMoney(summary.cancelledValue)}</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Doanh thu</p><strong class="kpi-value">${formatMoney(summary.revenue)}</strong><span class="kpi-hint">TB ${formatMoney(summary.avgOrder)}</span></article>
  </section>

  <section class="panel bookings-panel">
    <div class="panel-head bookings-head">
      <div>
        <h2>Danh sách đơn đặt tour</h2>
        <p>Tra cứu, lọc và xử lý đơn của khách hàng.</p>
      </div>
      <div class="bookings-head-actions">
        <button class="btn btn-sm btn-ghost-soft" type="button" id="bk-print">🖨️ In danh sách</button>
        ${
          canExport
            ? `<button class="btn btn-sm btn-primary" type="button" id="bk-export">📥 Xuất CSV</button>`
            : ""
        }
      </div>
    </div>

    <div class="booking-filters">
      <div class="filter-field filter-grow">
        <label for="bk-q">Tìm kiếm đơn</label>
        <input id="bk-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Mã đơn, tên khách, số điện thoại, tên tour..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="bk-status">Trạng thái đơn hàng</label>
        <select id="bk-status">
          <option value="">Tất cả trạng thái</option>
          ${Object.entries(BOOKING_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="bk-payment">Thanh toán</label>
        <select id="bk-payment">
          <option value="">Tất cả thanh toán</option>
          ${Object.entries(PAYMENT_STATUS)
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
          <option value="date">Ngày khởi hành gần</option>
        </select>
      </div>
    </div>

    <div class="bookings-toolbar">
      ${
        canManage()
          ? `<div class="bulk-actions" id="bk-bulk" hidden>
              <span>Đã chọn <strong data-selected>0</strong> đơn</span>
              <button class="btn btn-sm btn-primary" type="button" data-bulk="confirmed">Xác nhận</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="paid">Đã thanh toán</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="cancelled">Huỷ</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-bulk="delete">Xoá</button>
            </div>`
          : ""
      }
      <p class="result-count" id="bk-count" role="status"></p>
    </div>

    <div class="table-wrap">
      <table class="data-table bookings-table">
        <thead>
          <tr>
            ${canManage() ? `<th class="cell-check"><input type="checkbox" id="bk-check-all" aria-label="Chọn tất cả"></th>` : ""}
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Tour &amp; khởi hành</th>
            <th>Số lượng</th>
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
    ["Mã đơn", "Khách hàng", "SĐT", "Email", "Tour", "Ngày khởi hành", "Người lớn", "Trẻ em", "Tổng khách", "Tổng tiền", "Thanh toán", "Trạng thái", "Ngày tạo", "Ghi chú"],
    rows.map((item) => [
      item.code,
      item.name,
      item.phone,
      item.email || "",
      item.tourName,
      item.date,
      passengerBreakdown(item).adults,
      passengerBreakdown(item).children,
      item.people,
      item.total,
      PAYMENT_STATUS[item.payment || "unpaid"] || item.payment,
      BOOKING_STATUS[item.status] || item.status,
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
    if (!window.confirm("Mở hộp thoại in danh sách đơn hàng?")) return;
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

    if (action === "confirmed") {
      confirmModal(booking);
      return;
    }

    if (action === "cancelled") {
      const reason = window.prompt(
        `Huỷ đơn ${code}?\nNhập lý do (để gửi khách):`,
        "Khách yêu cầu huỷ"
      );
      if (reason === null) return;
      const result = cancelBooking(code, { by: getSession()?.name || "Admin", reason });
      if (result.error) return toast(result.error, "error");
      notifyBooking(booking, "cancelled");
      logActivity("Huỷ đơn", `Huỷ đơn ${code} - ${booking.name}: ${reason}`);
      toast(`Đã huỷ đơn ${code}.`);
      reload();
      return;
    }
  });

  document.getElementById("bk-bulk")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bulk]");
    if (!button) return;
    const codes = selection.selected();
    if (!codes.length) return;
    const action = button.dataset.bulk;
    const label = { confirmed: "xác nhận", paid: "đánh dấu đã thanh toán", cancelled: "huỷ", delete: "xoá" }[
      action
    ];
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} ${codes.length} đơn đã chọn?`)) return;

    if (action === "delete") {
      let removed = 0;
      const blocked = [];
      codes.forEach((code) => {
        const result = removeBooking(code);
        if (result?.error) blocked.push(code);
        else removed += 1;
      });
      if (blocked.length) {
        toast(
          `${blocked.length} đơn đã có giao dịch nên không xoá được (${blocked
            .slice(0, 3)
            .join(", ")}${blocked.length > 3 ? "..." : ""}).`,
          "error"
        );
      } else {
        toast(`Đã xoá ${removed} đơn.`);
      }
      logActivity("Xoá đơn", `Xoá ${removed}/${codes.length} đơn`);
      refreshAdmin();
      return;
    }

    let failed = 0;
    codes.forEach((code) => {
      const current = getBooking(code);
      const result =
        action === "cancelled"
          ? cancelBooking(code, { by: getSession()?.name || "Admin", reason: "Xử lý hàng loạt" })
          : advanceBooking(code, action, { by: getSession()?.name || "Admin" });
      if (result?.error) {
        failed += 1;
        return;
      }
      notifyBooking(current, action);
    });

    logActivity(
      action === "cancelled" ? "Huỷ đơn hàng loạt" : "Cập nhật đơn hàng loạt",
      `${label} ${codes.length - failed}/${codes.length} đơn: ${codes.slice(0, 5).join(", ")}${
        codes.length > 5 ? "..." : ""
      }`
    );
    toast(
      failed ? `Đã cập nhật ${codes.length - failed} đơn, ${failed} đơn không đúng luồng.` : `Đã ${label} ${codes.length} đơn.`,
      failed ? "error" : "success"
    );
    refreshAdmin();
  });
});

document.addEventListener("click", (event) => {
  if (detailHasModalAction(event.target)) handleModalAction(event.target);
});

function detailHasModalAction(target) {
  return Boolean(
    target.closest?.(
      "[data-modal-confirm],[data-modal-cancel],[data-modal-payment],[data-modal-delete],[data-assign-guide]"
    )
  );
}

function handleModalAction(target) {
  if (!activeCode) return;

  const assign = target.closest("[data-assign-guide]");
  if (assign) {
    handleAssignGuide(assign.dataset.assignGuide, assign.value);
    return;
  }

  if (!canManage()) return;
  const booking = getBooking(activeCode);
  if (!booking) return;

  if (target.closest("[data-modal-confirm]")) {
    const next = nextBookingStatus(booking.status);
    if (!next) return toast("Đơn này đã ở trạng thái cuối.", "error");
    const result = advanceBooking(activeCode, next, { by: getSession()?.name || "Admin" });
    if (result.error) return toast(result.error, "error");
    notifyBooking(booking, next);
    logActivity("Xác nhận đơn", `Đơn ${activeCode} chuyển sang ${BOOKING_STATUS[next]} - ${booking.name}`);
    toast(`Đã chuyển đơn ${activeCode} sang "${BOOKING_STATUS[next]}".`);
  } else if (target.closest("[data-modal-cancel]")) {
    const reason = window.prompt(`Huỷ đơn ${activeCode}?\nNhập lý do:`, "Khách yêu cầu huỷ");
    if (reason === null) return undefined;
    const result = cancelBooking(activeCode, { by: getSession()?.name || "Admin", reason });
    if (result.error) return toast(result.error, "error");
    notifyBooking(booking, "cancelled");
    logActivity("Huỷ đơn", `Huỷ đơn ${activeCode} - ${booking.name}: ${reason}`);
    toast(`Đã huỷ đơn ${activeCode}.`);
  } else if (target.closest("[data-modal-payment]")) {
    const next = window.prompt(
      "Nhập trạng thái thanh toán mới:",
      PAYMENT_STATUS[booking.payment || "unpaid"]
    );
    const found = Object.entries(PAYMENT_STATUS).find(([, label]) => label === next);
    if (!found) return undefined;
    updateBooking(activeCode, { payment: found[0] });
    logActivity("Cập nhật thanh toán", `Đơn ${activeCode} chuyển sang ${found[1]}`);
    toast(`Đã cập nhật thanh toán đơn ${activeCode}.`);
  } else if (target.closest("[data-modal-delete]")) {
    if (!window.confirm(`Xoá đơn ${activeCode}?`)) return undefined;
    const result = removeBooking(activeCode);
    if (result?.error) return toast(result.error, "error");
    logActivity("Xoá đơn", `Xoá đơn ${activeCode} - ${booking.name}`);
    toast(`Đã xoá đơn ${activeCode}.`);
  } else {
    return undefined;
  }

  activeCode = "";
  closeModal();
  refreshAdmin();
  return undefined;
}

/* Gán / bỏ gán Tour Guide từ popup xác nhận hoặc modal chi tiết */
function handleAssignGuide(code, guideId) {
  if (!canAssign()) return;
  const guide = listGuides().find((item) => item.username === guideId);
  const result = assignBookingGuide(code, guide || null);
  if (result.error) return toast(result.error, "error");

  logActivity(
    "Phân công hướng dẫn viên",
    guide
      ? `Phân công ${guide.name} cho đơn ${code}`
      : `Bỏ phân công hướng dẫn viên cho đơn ${code}`
  );
  toast(guide ? `Đã phân công ${guide.name} cho đơn ${code}.` : `Đã bỏ phân công đơn ${code}.`);
  refreshAdmin();
  return undefined;
}
