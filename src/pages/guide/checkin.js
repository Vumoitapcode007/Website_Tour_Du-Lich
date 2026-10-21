import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  guideBookings,
  markAttendance,
  quickCheckIn,
  addCashPayment,
  bookingCashDue,
} from "../../store.js";
import { getTourById } from "../../tour-repository.js";
import { getSession } from "../../auth.js";
import { guideGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  emptyState,
  formatMoney,
  openModal,
  closeModal,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { formatDate } from "../../data.js";
import { escapeHtml, searchKey } from "../../validate.js";
import { assignedTours } from "./dashboard.js";

const FILTERS = { q: "", tourId: "", attendance: "" };

function tourName(booking) {
  return booking.tourName || getTourById(booking.tourId)?.name || "Tour không còn trong danh mục";
}

export function GuideCheckIn() {
  const denied = guideGuard("guide.checkin.manage");
  if (denied) return denied;

  const session = getSession();
  const mine = guideBookings(session.username).filter((item) =>
    ["confirmed", "awaiting_payment", "paid", "upcoming", "ongoing", "completed"].includes(item.status)
  );
  const groups = assignedTours(session.username);

  const totalGuests = mine.reduce((sum, item) => sum + (Number(item.people) || 0), 0);
  const presentCount = mine
    .filter((item) => item.attendance === "present")
    .reduce((sum, item) => sum + (Number(item.people) || 0), 0);
  const absentCount = mine
    .filter((item) => item.attendance === "absent")
    .reduce((sum, item) => sum + (Number(item.people) || 0), 0);
  const uncheckedCount = totalGuests - presentCount - absentCount;

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue">
      <p class="kpi-label">Tổng khách phụ trách</p>
      <strong class="kpi-value">${totalGuests}</strong>
      <span class="kpi-hint">${mine.length} đơn đặt tour</span>
    </article>
    <article class="kpi kpi-green">
      <p class="kpi-label">Đã Check-in có mặt</p>
      <strong class="kpi-value">${presentCount}</strong>
      <span class="kpi-hint">${Math.round((presentCount / (totalGuests || 1)) * 100)}% sĩ số đoàn</span>
    </article>
    <article class="kpi kpi-amber">
      <p class="kpi-label">Chưa điểm danh</p>
      <strong class="kpi-value">${uncheckedCount}</strong>
      <span class="kpi-hint">Đang chờ tập trung</span>
    </article>
    <article class="kpi kpi-violet">
      <p class="kpi-label">Vắng mặt</p>
      <strong class="kpi-value">${absentCount}</strong>
      <span class="kpi-hint">Cần liên hệ hỗ trợ</span>
    </article>
  </section>

  <section class="panel checkin-panel" style="background: linear-gradient(135deg, rgba(22, 119, 255, 0.05) 0%, rgba(14, 165, 233, 0.08) 100%); border: 1px solid rgba(22, 119, 255, 0.2);">
    <div class="panel-head">
      <div>
        <h2>🎟️ Quét mã vé & Check-in đoàn nhanh</h2>
        <p class="panel-sub">Nhập mã vé điện tử, số điện thoại hoặc mã đơn (ví dụ: BK-...) để xác nhận điểm danh tức thì</p>
      </div>
    </div>

    <div class="checkin-box" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; margin-top: 1rem;">
      <div style="flex: 1; min-width: 260px;">
        <label for="checkin-code-input" style="font-weight: 600; display: block; margin-bottom: 6px;">Mã vé / Mã đơn / SĐT khách</label>
        <div style="position: relative;">
          <input
            id="checkin-code-input"
            type="text"
            placeholder="Nhập mã đơn (VD: ${mine[0]?.code || "BK-..."}) hoặc SĐT..."
            style="width: 100%; padding: 12px 14px; font-size: 1.05rem; font-weight: 600; text-transform: uppercase; border-radius: 8px; border: 2px solid #3b82f6;"
            autocomplete="off"
          />
        </div>
      </div>
      <button class="btn btn-primary btn-lg" type="button" id="btn-quick-checkin" style="padding: 12px 24px; font-weight: 600;">
        ⚡ Check-in ngay
      </button>
      <button class="btn btn-outline btn-lg" type="button" id="btn-mock-qr" style="padding: 12px 18px;">
        📷 Quét QR Camera
      </button>
    </div>

    <div id="checkin-result-slot" style="margin-top: 1rem;"></div>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="ci-q">Tìm kiếm khách</label>
        <input id="ci-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên khách, SĐT, mã vé..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="ci-tour">Chuyến tour</label>
        <select id="ci-tour">
          <option value="">Tất cả chuyến</option>
          ${groups
            .map(
              (g) =>
                `<option value="${escapeHtml(g.tourId)}">${escapeHtml(g.tour?.name || tourName(g.bookings[0]))} (${formatDate(g.bookings[0]?.date)})</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="ci-att">Trạng thái điểm danh</label>
        <select id="ci-att">
          <option value="">Tất cả</option>
          <option value="present">Đã có mặt</option>
          <option value="absent">Vắng mặt</option>
          <option value="none">Chưa điểm danh</option>
        </select>
      </div>
    </div>

    <p class="result-count" id="ci-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã vé/đơn</th>
            <th>Khách hàng</th>
            <th>Chuyến tour</th>
            <th>Số lượng</th>
            <th>Tài chính</th>
            <th>Điểm danh</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="ci-table-rows"></tbody>
      </table>
    </div>
  </section>`;
}

function checkinRow(booking) {
  const isPresent = booking.attendance === "present";
  const isAbsent = booking.attendance === "absent";
  const remain = bookingCashDue(booking);

  return `
  <tr data-code="${escapeHtml(booking.code)}">
    <td>
      <strong class="code">${escapeHtml(booking.code)}</strong><br>
      <small>${escapeHtml(formatDate(booking.date))}</small>
    </td>
    <td>
      <strong>${escapeHtml(booking.name)}</strong><br>
      <small>${escapeHtml(booking.phone)}</small>
    </td>
    <td>
      ${escapeHtml(tourName(booking))}<br>
      <small>${escapeHtml(booking.tourLocation || "-")}</small>
    </td>
    <td>
      <strong>${booking.people} khách</strong><br>
      <small>(${booking.adults || booking.people} lớn${booking.children ? `, ${booking.children} trẻ` : ""})</small>
    </td>
    <td>
      ${statusBadge(booking.payment || "unpaid", PAYMENT_STATUS)}
      ${
        remain > 0
          ? `<br><small class="text-danger" style="color:#ef4444; font-weight:600;">Cần thu: ${formatMoney(remain)}</small>`
          : booking.cashCollected > 0
            ? `<br><small class="text-success" style="color:#16a34a; font-weight:600;">Đã thu: ${formatMoney(booking.cashCollected)}</small>`
            : ""
      }
    </td>
    <td>
      ${
        isPresent
          ? `<span class="status-pill status-paid">✓ Có mặt</span>`
          : isAbsent
          ? `<span class="status-pill status-cancelled">✕ Vắng mặt</span>`
          : `<span class="soft-chip">Chưa</span>`
      }
      ${booking.attendanceAt ? `<br><small style="font-size:0.75rem; color:#64748b;">${new Date(booking.attendanceAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</small>` : ""}
    </td>
    <td class="row-actions">
      <button class="btn btn-xs ${isPresent ? "btn-outline" : "btn-primary"}" type="button" data-ci-action="present" data-code="${escapeHtml(booking.code)}">
        ${isPresent ? "✓ Đã đến" : "Có mặt"}
      </button>
      <button class="btn btn-xs btn-outline-danger" type="button" data-ci-action="absent" data-code="${escapeHtml(booking.code)}">
        Vắng
      </button>
      ${
        remain > 0
          ? `<button class="btn btn-xs btn-ghost-soft" type="button" data-ci-cash="${escapeHtml(booking.code)}" title="Thu tiền">Thu tiền</button>`
          : ""
      }
    </td>
  </tr>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "guide/checkin") return;
  const tbody = document.getElementById("ci-table-rows");
  if (!tbody) return;

  const session = getSession();

  function paint() {
    const all = guideBookings(session.username).filter((item) =>
      ["confirmed", "awaiting_payment", "paid", "upcoming", "ongoing", "completed"].includes(item.status)
    );
    const q = searchKey(FILTERS.q);

    const filtered = all.filter((item) => {
      if (FILTERS.tourId && String(item.tourId) !== FILTERS.tourId) return false;
      if (FILTERS.attendance === "present" && item.attendance !== "present") return false;
      if (FILTERS.attendance === "absent" && item.attendance !== "absent") return false;
      if (FILTERS.attendance === "none" && item.attendance) return false;
      if (
        q &&
        !searchKey(`${item.code} ${item.name} ${item.phone} ${item.email} ${tourName(item)}`).includes(q)
      ) {
        return false;
      }
      return true;
    });

    const countEl = document.getElementById("ci-count");
    if (countEl) countEl.textContent = `Hiển thị ${filtered.length} / ${all.length} khách trong danh sách`;

    tbody.innerHTML = filtered.length
      ? filtered.map(checkinRow).join("")
      : `<tr><td colspan="7" class="table-empty">${emptyState("Không tìm thấy khách nào khớp điều kiện lọc.")}</td></tr>`;
  }

  paint();

  document.getElementById("ci-q")?.addEventListener("input", (e) => {
    FILTERS.q = e.target.value;
    paint();
  });
  document.getElementById("ci-tour")?.addEventListener("change", (e) => {
    FILTERS.tourId = e.target.value;
    paint();
  });
  document.getElementById("ci-att")?.addEventListener("change", (e) => {
    FILTERS.attendance = e.target.value;
    paint();
  });

  // Xử lý Quick Check-in
  function doCheckIn(codeVal) {
    if (!codeVal) return toast("Vui lòng nhập mã vé hoặc mã đơn", "error");
    const res = quickCheckIn(codeVal, { guideId: session.username, by: session.name });
    const slot = document.getElementById("checkin-result-slot");

    if (res.error) {
      if (slot) {
        slot.innerHTML = `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; color: #b91c1c;">
            <strong>⚠️ Không thể check-in:</strong> ${escapeHtml(res.error)}
          </div>`;
      }
      return toast(res.error, "error");
    }

    const b = res.booking;
    const remain = bookingCashDue(b);

    if (slot) {
      slot.innerHTML = `
        <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="background: #22c55e; color: #fff; font-size: 0.8rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">✓ CHECK-IN THÀNH CÔNG</span>
              <strong style="font-size: 1.15rem; color: #15803d;">${escapeHtml(b.code)}</strong>
            </div>
            <p style="margin: 0; font-size: 1rem; color: #1e293b;">
              Khách: <strong>${escapeHtml(b.name)}</strong> (${escapeHtml(b.phone)}) · <strong>${b.people} người</strong>
            </p>
            <p style="margin: 2px 0 0; font-size: 0.85rem; color: #64748b;">
              Tour: ${escapeHtml(tourName(b))} · Điểm danh lúc ${new Date().toLocaleTimeString("vi-VN")}
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${
              remain > 0
                ? `<div style="background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #fed7aa; text-align: right;">
                     <small style="color: #c2410c; display:block;">Cần thu thêm:</small>
                     <strong style="color: #ea580c; font-size: 1rem;">${formatMoney(remain)}</strong>
                   </div>
                   <button class="btn btn-sm btn-primary" type="button" data-ci-cash="${escapeHtml(b.code)}">Thu tiền</button>`
                : `<span style="color: #16a34a; font-weight: 600;">Đã thanh toán đủ</span>`
            }
          </div>
        </div>`;
    }

    toast(`Đã xác nhận có mặt cho khách: ${b.name} (${b.code})`);
    paint();
  }

  document.getElementById("btn-quick-checkin")?.addEventListener("click", () => {
    const input = document.getElementById("checkin-code-input");
    doCheckIn(input?.value?.trim());
  });

  document.getElementById("checkin-code-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doCheckIn(e.target.value?.trim());
    }
  });

  // Mock QR Scanner
  document.getElementById("btn-mock-qr")?.addEventListener("click", () => {
    const all = guideBookings(session.username);
    if (!all.length) return toast("Chưa có đơn nào để quét", "error");
    const randomBooking = all[Math.floor(Math.random() * all.length)];

    openModal({
      title: "📷 Trình quét mã QR Camera",
      subtitle: "Hướng camera vào mã QR trên vé điện tử của hành khách",
      body: `
        <div style="text-align: center; padding: 20px;">
          <div style="width: 200px; height: 200px; margin: 0 auto 16px; border: 3px dashed #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f8fafc; position: relative;">
            <div style="position: absolute; width: 100%; height: 2px; background: #ef4444; top: 50%; box-shadow: 0 0 8px #ef4444;"></div>
            <span style="font-size: 3rem;">📱</span>
          </div>
          <p style="color: #64748b; font-size: 0.9rem;">Hệ thống mô phỏng quét mã thành công vé: <strong style="color: #0284c7;">${randomBooking.code}</strong></p>
          <button class="btn btn-primary" type="button" id="btn-accept-mock-qr" data-code="${escapeHtml(randomBooking.code)}">
            Xác nhận điểm danh vé này
          </button>
        </div>`,
      footer: `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`,
    });

    document.getElementById("btn-accept-mock-qr")?.addEventListener("click", (evt) => {
      const code = evt.target.dataset.code;
      closeModal();
      const input = document.getElementById("checkin-code-input");
      if (input) input.value = code;
      doCheckIn(code);
    });
  });
});

document.addEventListener("click", (e) => {
  const session = getSession();

  // Đổi trạng thái có mặt / vắng mặt
  const actBtn = e.target.closest("[data-ci-action]");
  if (actBtn) {
    const code = actBtn.dataset.code;
    const status = actBtn.dataset.ciAction;
    const res = markAttendance(code, status, { guideId: session.username, by: session.name });
    if (res.error) return toast(res.error, "error");
    toast(`Đã cập nhật: ${status === "present" ? "Có mặt" : "Vắng mặt"}`);
    refreshAdmin();
    return;
  }

  // Thu tiền mặt nhanh
  const cashBtn = e.target.closest("[data-ci-cash]");
  if (cashBtn) {
    const code = cashBtn.dataset.ciCash;
    const all = guideBookings(session.username);
    const booking = all.find((b) => b.code === code);
    if (!booking) return;

    const remain = bookingCashDue(booking);
    const amountStr = prompt(`Thu tiền mặt từ khách ${booking.name}.\nSố tiền còn thiếu: ${formatMoney(remain)}\nNhập số tiền thu:`, String(remain));
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return toast("Số tiền không hợp lệ", "error");

    const res = addCashPayment(code, amount, { guideId: session.username, by: session.name });
    if (res.error) return toast(res.error, "error");
    toast(`Đã ghi nhận thu ${formatMoney(amount)} từ khách`);
    refreshAdmin();
    return;
  }
});
