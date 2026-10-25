import { BOOKING_STATUS, markAttendance, getBooking, advanceTripStatus, addCashPayment, bookingCashDue } from "../../store.js";
import { updateTourProgress, TOUR_PROGRESS_STAGES } from "../../tour-repository.js";
import { getSession } from "../../auth.js";
import { guideGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  downloadCsv,
  emptyState,
  openModal,
  closeModal,
  stars,
  statusBadge,
  stamp,
  toast,
  formatMoney
} from "../../components/admin-ui.js";
import { formatPrice, formatDate } from "../../data.js";
import { daysToDeparture } from "../../components/booking-tracker.js";
import { assignedTours } from "./dashboard.js";
import { escapeHtml, searchKey } from "../../validate.js";
import { imgFallback } from "../../components/tour-card.js";

const FILTERS = { q: "", status: "" };

const TRIP_STATUS = {
  upcoming: "Sắp khởi hành",
  ongoing: "Đang diễn ra",
  done: "Đã hoàn thành",
  preparing: "Chờ thanh toán",
};

/* Trạng thái của cả chuyến, dựa trên các đơn được phân công */
function tripStatus(bookings) {
  if (bookings.some((item) => item.status === "ongoing")) return "ongoing";
  /* Còn khách chưa trả đủ tiền (trả trực tiếp cho HDV) thì chuyến đang chờ thu tiền */
  const active = bookings.filter((item) => !["cancelled", "completed"].includes(item.status));
  if (active.some((item) => bookingCashDue(item) > 0)) return "preparing";
  if (bookings.some((item) => item.status === "upcoming")) return "upcoming";
  if (bookings.some((item) => item.status === "paid")) return "preparing";
  if (bookings.some((item) => item.status === "completed")) return "done";
  return "upcoming";
}

function matches(group, query, status) {
  if (status && tripStatus(group.bookings) !== status) return false;
  if (!query) return true;
  const tour = group.tour;
  return searchKey(
    `${tour?.name || ""} ${tour?.location || ""} ${group.bookings
      .map((item) => `${item.name} ${item.code} ${item.date} ${item.phone}`)
      .join(" ")}`
  ).includes(query);
}

export function GuideTours() {
  const denied = guideGuard("guide.tours.view");
  if (denied) return denied;

  const session = getSession();
  const groups = assignedTours(session.username);

  const upcomingCount = groups.filter((g) => tripStatus(g.bookings) === "upcoming").length;
  const ongoingCount = groups.filter((g) => tripStatus(g.bookings) === "ongoing").length;
  const doneCount = groups.filter((g) => tripStatus(g.bookings) === "done").length;

  return `
  <section class="kpi-grid kpi-grid-2 guide-tours-summary">
    <article class="kpi kpi-blue">
      <p class="kpi-label">Tổng tour phụ trách</p>
      <strong class="kpi-value">${groups.length}</strong>
      <span class="kpi-hint">Được phân công cho bạn</span>
    </article>
    <article class="kpi kpi-amber">
      <p class="kpi-label">Cần xử lý</p>
      <strong class="kpi-value">${groups.filter((g) => g.bookings.some((b) => bookingCashDue(b) > 0)).length}</strong>
      <span class="kpi-hint">Chuyến còn khoản cần thu</span>
    </article>
  </section>

  <section class="panel">
    <!-- Thanh Tab lọc nhanh trạng thái -->
    <div class="guide-filter-tabs" id="gt-tabs">
      <button type="button" class="guide-filter-tab ${!FILTERS.status ? "is-active" : ""}" data-status="">
        Tất cả tour <span class="tab-count">${groups.length}</span>
      </button>
      <button type="button" class="guide-filter-tab ${FILTERS.status === "upcoming" ? "is-active" : ""}" data-status="upcoming">
        ⏳ Sắp khởi hành <span class="tab-count">${upcomingCount}</span>
      </button>
      <button type="button" class="guide-filter-tab ${FILTERS.status === "ongoing" ? "is-active" : ""}" data-status="ongoing">
        🔥 Đang diễn ra <span class="tab-count">${ongoingCount}</span>
      </button>
      <button type="button" class="guide-filter-tab ${FILTERS.status === "done" ? "is-active" : ""}" data-status="done">
        ✓ Đã hoàn thành <span class="tab-count">${doneCount}</span>
      </button>
    </div>

    <div class="filter-bar" style="margin-bottom: 14px;">
      <div class="filter-field filter-grow">
        <label for="gt-q">Tìm kiếm nhanh</label>
        <input id="gt-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Nhập tên tour, điểm đến, tên khách, số điện thoại hoặc mã đơn..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="gt-status">Bộ lọc trạng thái</label>
        <select id="gt-status">
          <option value="">Tất cả trạng thái</option>
          ${Object.entries(TRIP_STATUS)
            .map(([value, label]) => `<option value="${value}" ${FILTERS.status === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field" style="align-self: flex-end;">
        <button class="btn btn-outline" type="button" id="gt-export" style="height: 42px;">
          📥 Xuất danh sách đoàn (CSV)
        </button>
      </div>
    </div>

    <p class="result-count" id="gt-count" role="status" style="font-weight: 600; color: #475569; margin: 8px 0 16px;"></p>
    
    <div id="gt-list" class="guide-tours-grid"></div>
  </section>`;
}

function tripCard(group) {
  const tour = group.tour;
  const bookings = group.bookings;
  const first = bookings.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  const status = tripStatus(bookings);
  const days = daysToDeparture(first.date);
  const people = bookings.reduce((sum, item) => sum + (Number(item.people) || 0), 0);
  const presentCount = bookings.filter((b) => b.attendance === "present").length;
  const attendanceRate = people > 0 ? Math.round((presentCount / people) * 100) : 0;
  const cashDue = bookings.reduce((sum, b) => sum + bookingCashDue(b), 0);
  const unpaidCount = bookings.filter((b) => bookingCashDue(b) > 0).length;

  const countdownText =
    days > 0
      ? `⏳ Khởi hành sau ${days} ngày`
      : days === 0
      ? `🔥 Khởi hành hôm nay!`
      : `✓ Đã qua ${Math.abs(days)} ngày`;

  return `
  <article class="guide-trip-card is-${status}" data-trip="${escapeHtml(group.tourId)}">
    <div class="guide-trip-main">
      <!-- Cột ảnh tour & Badge -->
      <div class="guide-trip-media">
        <img src="${escapeHtml(tour?.image || "")}" alt="${escapeHtml(tour?.name || first.tourName)}" loading="lazy" onerror="${imgFallback}">
        <div class="guide-trip-badge-top">
          ${statusBadge(status, TRIP_STATUS)}
        </div>
        <div class="guide-trip-countdown-pill">
          ${countdownText}
        </div>
      </div>

      <!-- Cột thông tin chi tiết đoàn tour -->
      <div class="guide-trip-info">
        <div class="guide-trip-header-row">
          <h3 class="guide-trip-title">${escapeHtml(tour?.name || first.tourName)}</h3>
          ${tour?.rating ? `<div class="tour-rating-stars">${stars(tour.rating)} <small>(${tour.rating})</small></div>` : ""}
        </div>

        <div class="guide-trip-meta-chips">
          <span>📍 <strong>${escapeHtml(tour?.location || first.tourLocation || "Việt Nam")}</strong></span>
          <span>⏱️ Thời lượng: <strong>${escapeHtml(tour?.time || first.tourTime || "-")}</strong></span>
          <span>📅 Khởi hành: <strong>${escapeHtml(formatDate(first.date))}</strong></span>
          <span>🎫 Giá tour: <strong>${formatPrice(first.tourPrice || tour?.price || 0)}</strong></span>
        </div>

        <!-- Bảng thông số vận hành của đoàn -->
        <div class="guide-trip-metrics-grid">
          <div class="guide-metric-box">
            <span class="m-label">Đoàn khách</span>
            <strong class="m-val text-primary">${people} khách</strong>
            <span class="m-sub">${bookings.length} đơn đặt</span>
          </div>

          <div class="guide-metric-box">
            <span class="m-label">Tiến độ điểm danh</span>
            <strong class="m-val ${presentCount === people && people > 0 ? "text-success" : "text-amber"}">
              ${presentCount}/${people} <small>(${attendanceRate}%)</small>
            </strong>
            <div class="guide-trip-progress-bar">
              <div class="guide-trip-progress-fill" style="width: ${attendanceRate}%;"></div>
            </div>
          </div>

          <div class="guide-metric-box">
            <span class="m-label">Còn phải thu</span>
            <strong class="m-val ${cashDue > 0 ? "text-amber" : "text-success"}">${formatMoney(cashDue)}</strong>
            <span class="m-sub">${unpaidCount > 0 ? `${unpaidCount} đơn chưa đủ tiền` : "Đã thu đủ"}</span>
          </div>
        </div>

        <!-- Danh sách khách đại diện tóm tắt -->
        <div class="guide-trip-guests-preview" style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">
          <span>📞 Liên hệ khách:</span>
          ${bookings
            .slice(0, 3)
            .map(
              (b) => `
            <a href="tel:${escapeHtml(b.phone)}" class="soft-chip" style="text-decoration:none; color:#1e293b; margin-left: 4px; display: inline-flex; align-items: center; gap: 4px;">
              <strong>${escapeHtml(b.name)}</strong> (${escapeHtml(b.phone)})
            </a>`
            )
            .join("")}
          ${bookings.length > 3 ? `<span class="soft-chip" style="margin-left: 4px;">+${bookings.length - 3} khách khác</span>` : ""}
        </div>
      </div>
    </div>

    <!-- Thanh thao tác nhanh nghiệp vụ cho HDV -->
    <div class="guide-trip-bottom-bar">
      <div class="guide-trip-quick-actions">
        <button class="btn btn-sm btn-primary" type="button" data-trip-guests="${escapeHtml(group.tourId)}">
          👥 Khách · Điểm danh ${presentCount}/${people}
        </button>
        ${unpaidCount ? `<button class="btn btn-sm btn-outline guide-trip-collect" type="button" data-trip-guests="${escapeHtml(group.tourId)}">💵 Thu còn thiếu · ${formatMoney(cashDue)}</button>` : ""}
        ${status !== "ongoing" && status !== "done" ? `<button class="btn btn-sm btn-outline" type="button" data-trip-start="${escapeHtml(group.tourId)}">▶ Bắt đầu chuyến</button>` : ""}
        ${status === "ongoing" ? `<button class="btn btn-sm btn-outline" type="button" data-trip-progress-btn="${escapeHtml(group.tourId)}">Cập nhật trạng thái</button><button class="btn btn-sm btn-outline" type="button" data-trip-finish="${escapeHtml(group.tourId)}">✓ Kết thúc chuyến</button>` : ""}
        ${tour?.itinerary?.length ? `<button class="btn btn-sm btn-ghost-soft" type="button" data-trip-plan="${escapeHtml(group.tourId)}">🗺️ Lịch trình</button>` : ""}
      </div>

      <div class="guide-trip-status-action">
        <span style="font-size: 0.82rem; color: #64748b;">Mã tour: <code>${escapeHtml(group.tourId)}</code></span>
      </div>
    </div>
  </article>`;
}

function openGuests(group) {
  const bookings = group.bookings;
  const people = bookings.reduce((sum, item) => sum + (Number(item.people) || 0), 0);
  const presentCount = bookings.filter((b) => b.attendance === "present").length;

  openModal({
    title: `Khách, thanh toán & điểm danh (${people} khách)`,
    subtitle: `${group.tour?.name || bookings[0].tourName} · Khởi hành: ${formatDate(bookings[0].date)}`,
    size: "lg",
    body: `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: #f8fafc; padding: 10px 14px; border-radius: 8px;">
        <div>
          <span>Tiến độ có mặt: <strong>${presentCount}/${people} khách (${people > 0 ? Math.round((presentCount / people) * 100) : 0}%)</strong></span>
        </div>
        <div style="font-size: 0.85rem; color: #64748b;">
          Bấm <strong>"Có mặt"</strong> hoặc <strong>"Vắng mặt"</strong> để cập nhật điểm danh nhanh.
        </div>
      </div>

      <div class="guide-trip-checkin" style="display:flex; gap:8px; align-items:end; flex-wrap:wrap; margin-bottom:16px; padding:14px; border:1px solid #dbeafe; border-radius:10px; background:#eff6ff;">
        <div class="field" style="flex:1; min-width:220px; margin:0;">
          <label for="trip-checkin-code">Điểm danh nhanh bằng mã vé / mã đơn</label>
          <input id="trip-checkin-code" class="form-input" type="search" placeholder="Nhập mã của khách thuộc chuyến này">
        </div>
        <button class="btn btn-primary" type="button" data-trip-checkin="${escapeHtml(group.tourId)}">Xác nhận có mặt</button>
        <button class="btn btn-outline" type="button" data-trip-mock-scan="${escapeHtml(group.tourId)}">Quét QR</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách đại diện</th>
              <th>Số lượng</th>
              <th>Trạng thái & Thanh toán</th>
              <th>Điểm danh</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${
              bookings
                .map(
                  (item) => `
              <tr>
                <td><strong class="code">${escapeHtml(item.code)}</strong></td>
                <td>
                  <strong>${escapeHtml(item.name)}</strong><br>
                  <a href="tel:${escapeHtml(item.phone)}" style="color: #1677ff; text-decoration: none; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;">
                    📞 ${escapeHtml(item.phone)}
                  </a>
                </td>
                <td>
                  <strong>${item.people} khách</strong>
                  ${item.children ? `<br><small class="text-muted">(${item.adults} lớn, ${item.children} trẻ)</small>` : ""}
                </td>
                <td>
                  <span class="status-pill ${item.payment === "paid" ? "status-paid" : "status-unpaid"}">
                    ${item.payment === "paid" ? "✓ Đã thanh toán" : item.payment === "deposit" ? "Thu một phần" : "Chưa thanh toán"}
                  </span>
                  ${item.cashCollected > 0 ? `<br><small class="text-success" style="font-weight:600;">Đã thu: ${formatMoney(item.cashCollected)}</small>` : ""}
                  ${bookingCashDue(item) > 0 ? `<br><small class="text-danger" style="color:#dc2626; font-weight:600;">Còn thiếu: ${formatMoney(bookingCashDue(item))}</small>` : ""}
                </td>
                <td>
                  ${
                    item.attendance === "present"
                      ? `<span class="status-pill status-paid">✓ Có mặt</span>`
                      : item.attendance === "absent"
                      ? `<span class="status-pill status-cancelled">✗ Vắng mặt</span>`
                      : `<span class="soft-chip">Chưa điểm danh</span>`
                  }
                </td>
                <td class="row-actions">
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn btn-xs ${item.attendance === "present" ? "btn-success" : "btn-outline"}" type="button" data-attendance="present" data-code="${escapeHtml(item.code)}" title="Điểm danh có mặt">
                      ✓
                    </button>
                    <button class="btn btn-xs ${item.attendance === "absent" ? "btn-danger" : "btn-outline"}" type="button" data-attendance="absent" data-code="${escapeHtml(item.code)}" title="Báo vắng mặt">
                      ✗
                    </button>
                    ${
                      bookingCashDue(item) > 0 && !["pending", "cancelled", "completed"].includes(item.status)
                        ? `<button class="btn btn-xs btn-primary" type="button" data-trip-cash="${escapeHtml(item.code)}">
                             💵 Thu tiền
                           </button>`
                        : ""
                    }
                  </div>
                </td>
              </tr>`
                )
                .join("")
            }
          </tbody>
        </table>
      </div>`,
    footer: `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`,
  });
}

function openPlan(group) {
  const tour = group.tour;
  openModal({
    title: "Lịch trình chi tiết tuyến tour",
    subtitle: tour?.name || "",
    size: "lg",
    body: `
      <div class="timeline" style="margin-top: 10px;">
        ${(tour?.itinerary || [])
          .map(
            (day) => `
          <div class="timeline-item" style="margin-bottom: 16px;">
            <span class="timeline-day" style="background: #1677ff; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">
              ${escapeHtml(day.day)}
            </span>
            <div style="margin-top: 6px;">
              <h3 style="font-size: 1.05rem; margin: 4px 0 6px; color: #0f172a;">${escapeHtml(day.title || "-")}</h3>
              <ul style="padding-left: 20px; color: #475569; font-size: 0.9rem; line-height: 1.6;">
                ${(day.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </div>
          </div>`
          )
          .join("")}
      </div>
      ${
        tour?.includes?.length || tour?.excludes?.length
          ? `<div class="detail-grid" style="margin-top: 18px; border-top: 1px dashed #e2e8f0; padding-top: 14px;">
              <section>
                <h4 style="color: #16a34a; margin-bottom: 8px;">✓ Dịch vụ bao gồm</h4>
                <ul class="it-list tick">${(tour.includes || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </section>
              <section>
                <h4 style="color: #dc2626; margin-bottom: 8px;">✗ Không bao gồm</h4>
                <ul class="it-list cross">${(tour.excludes || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </section>
            </div>`
          : ""
      }`,
    footer: `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`,
  });
}

function openCashCollect(code) {
  const booking = getBooking(code);
  if (!booking) return;
  const remain = bookingCashDue(booking);
  if (remain <= 0) return toast("Đơn này đã thu đủ tiền.", "error");

  openModal({
    title: `💵 Thu tiền mặt - ${booking.code}`,
    subtitle: `${booking.name} · ${booking.tourName} · Khởi hành ${formatDate(booking.date)}`,
    size: "sm",
    body: `
      <ul class="summary-list" style="margin-bottom:14px;">
        <li><span>Tổng tiền</span><strong>${formatMoney(booking.total)}</strong></li>
        <li><span>Đã thu</span><strong>${formatMoney(booking.cashCollected || 0)}</strong></li>
        <li><span>Còn phải thu</span><strong>${formatMoney(remain)}</strong></li>
      </ul>
      <div class="field">
        <label for="trip-cash-amount">Số tiền thu lần này</label>
        <input id="trip-cash-amount" type="number" min="1" max="${remain}" value="${remain}" class="form-input">
        <p class="form-hint">Có thể thu một phần. Đơn chỉ chuyển sang Đã thanh toán khi thu đủ ${formatMoney(remain)}.</p>
      </div>
      <div class="field">
        <label for="trip-cash-note">Ghi chú (không bắt buộc)</label>
        <input id="trip-cash-note" type="text" class="form-input" placeholder="Ví dụ: khách trả trước một nửa">
      </div>
      <input type="hidden" id="trip-cash-code" value="${escapeHtml(booking.code)}">
    `,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
      <button class="btn btn-primary" type="button" id="trip-cash-submit">Xác nhận đã thu</button>`,
  });

  document.getElementById("trip-cash-submit")?.addEventListener("click", () => {
    const session = getSession();
    const amount = Number(document.getElementById("trip-cash-amount")?.value);
    const note = document.getElementById("trip-cash-note")?.value || "";
    const targetCode = document.getElementById("trip-cash-code")?.value || code;

    const res = addCashPayment(targetCode, amount, {
      guideId: session.username,
      by: session.name || "Hướng dẫn viên",
      note,
    });
    if (res.error) return toast(res.error, "error");

    const updated = res.booking;
    toast(
      bookingCashDue(updated) > 0
        ? `Đã ghi nhận thu ${formatMoney(amount)}. Còn thiếu ${formatMoney(bookingCashDue(updated))}.`
        : `Đã thu đủ tiền - đơn ${targetCode} chuyển sang Đã thanh toán.`
    );
    closeModal();
    refreshAdmin();
    return undefined;
  });
}

document.addEventListener("route:changed", ({ detail }) => {
  if (String(detail.path) !== "guide/tours") return;
  const box = document.getElementById("gt-list");
  if (!box) return;

  const session = getSession();

  function paint() {
    const query = searchKey(FILTERS.q);
    const list = assignedTours(session.username).filter((group) =>
      matches(group, query, FILTERS.status)
    );
    const countEl = document.getElementById("gt-count");
    if (countEl) {
      countEl.textContent = `Hiển thị ${list.length} tour được phân công ${FILTERS.status ? `(trạng thái: ${TRIP_STATUS[FILTERS.status] || FILTERS.status})` : ""}`;
    }
    box.innerHTML = list.length
      ? list.map(tripCard).join("")
      : emptyState("Không tìm thấy chuyến đi nào khớp với bộ lọc hiện tại.");
    box.dataset.count = String(list.length);
  }

  paint();

  // Tìm kiếm
  document.getElementById("gt-q")?.addEventListener("input", (event) => {
    FILTERS.q = event.target.value;
    paint();
  });

  // Chọn dropdown trạng thái
  document.getElementById("gt-status")?.addEventListener("change", (event) => {
    FILTERS.status = event.target.value;
    // Đồng bộ lại tab
    document.querySelectorAll(".guide-filter-tab").forEach((t) => {
      t.classList.toggle("is-active", t.dataset.status === FILTERS.status);
    });
    paint();
  });

  // Bấm tab lọc nhanh trạng thái
  document.querySelectorAll(".guide-filter-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".guide-filter-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      FILTERS.status = tab.dataset.status || "";
      const select = document.getElementById("gt-status");
      if (select) select.value = FILTERS.status;
      paint();
    });
  });

  // Xuất CSV danh sách đoàn
  document.getElementById("gt-export")?.addEventListener("click", () => {
    const rows = assignedTours(session.username).flatMap((group) =>
      group.bookings.map((item) => [
        item.code,
        group.tour?.name || item.tourName,
        item.date,
        item.name,
        item.phone,
        item.people,
        item.total,
        BOOKING_STATUS[item.status] || item.status,
      ])
    );
    if (!rows.length) return toast("Không có dữ liệu để xuất.", "error");
    return downloadCsv(
      `danh-sach-doan-tour-${stamp()}`,
      ["Mã đơn", "Tour", "Ngày khởi hành", "Khách", "Điện thoại", "Số khách", "Tổng tiền", "Trạng thái"],
      rows
    );
  });
});


function openProgressModal(group) {
  const tour = group.tour;
  const p = tour?.progress || {};
  const currentStage = p.stage || "not_started";
  const stages = Object.entries(TOUR_PROGRESS_STAGES).map(([key, item]) => {
    return `<option value="${key}" ${key === currentStage ? "selected" : ""}>${item.icon} ${item.label} (${item.desc || ""})</option>`;
  }).join("");

  openModal({
    title: "📍 Cập nhật tiến độ hành trình cho đoàn khách",
    subtitle: `${tour?.name || group.tourId} · Cập nhật theo thời gian thực`,
    size: "md",
    body: `
      <form id="form-update-progress" style="display: grid; gap: 14px;">
        <div class="field">
          <label for="prog-stage">Giai đoạn hiện tại của đoàn</label>
          <select id="prog-stage" name="stage" class="form-input">
            ${stages}
          </select>
        </div>
        <div class="field">
          <label for="prog-day">Ngày thứ mấy của tour</label>
          <input id="prog-day" name="currentDay" type="number" min="1" max="${tour?.days || 10}" value="${p.currentDay || 1}" class="form-input">
        </div>
        <div class="field">
          <label for="prog-loc">Vị trí / Địa điểm hiện tại</label>
          <input id="prog-loc" name="currentLocation" type="text" placeholder="Ví dụ: Đang dừng chân tại Đèo Mã Pí Lèng" value="${escapeHtml(p.currentLocation || "")}" class="form-input">
        </div>
        <div class="field">
          <label for="prog-note">Lời nhắn / Dặn dò nhanh cho khách</label>
          <textarea id="prog-note" name="note" rows="3" class="form-input" placeholder="Ví dụ: Thời tiết mát mẻ, đoàn dừng chụp ảnh 30 phút rồi về khách sạn...">${escapeHtml(p.note || "")}</textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
          <button type="button" class="btn btn-ghost-soft" onclick="document.querySelector('.admin-modal-close')?.click()">Đóng</button>
          <button type="submit" class="btn btn-primary">Lưu & Hiển thị cho khách</button>
        </div>
      </form>
    `
  });

  const form = document.getElementById("form-update-progress");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const stage = document.getElementById("prog-stage")?.value;
    const currentDay = Number(document.getElementById("prog-day")?.value) || 1;
    const currentLocation = document.getElementById("prog-loc")?.value;
    const note = document.getElementById("prog-note")?.value;

    updateTourProgress(group.tourId, { stage, currentDay, currentLocation, note });
    toast("✓ Đã cập nhật tiến độ hành trình thành công! Khách hàng sẽ thấy ngay trên hệ thống.");
    closeModal();
    refreshAdmin();
  });
}

document.addEventListener("click", (event) => {
  // 1. Khởi hành cả chuyến
  const startBtn = event.target.closest("[data-trip-start]");
  if (startBtn) {
    const tourId = startBtn.dataset.tripStart;
    if (!window.confirm("Xác nhận BẮT ĐẦU KHỞI HÀNH chuyến đi này? Toàn bộ khách hợp lệ trong chuyến sẽ được chuyển sang trạng thái ĐANG DIỄN RA.")) return;
    const session = getSession();
    const res = advanceTripStatus(tourId, "ongoing", {
      guideId: session.username,
      by: session.name || "Hướng dẫn viên",
      note: "Hướng dẫn viên xác nhận xuất phát tour"
    });
    if (res.error) return toast(res.error, "error");
    toast(`🚀 Chuyến đi đã bắt đầu! Đã cập nhật ${res.count} đơn khách hàng.${res.skipped ? ` ${res.skipped} đơn chưa thu đủ tiền được giữ lại để thu tiếp.` : ""}`);
    refreshAdmin();
    return;
  }

  // 2. Kết thúc cả chuyến
  const finishBtn = event.target.closest("[data-trip-finish]");
  if (finishBtn) {
    const tourId = finishBtn.dataset.tripFinish;
    if (!window.confirm("Xác nhận KẾT THÚC chuyến đi an toàn cho toàn đoàn? Tất cả đơn sẽ được chuyển sang HOÀN THÀNH.")) return;
    const session = getSession();
    const res = advanceTripStatus(tourId, "completed", {
      guideId: session.username,
      by: session.name || "Hướng dẫn viên",
      note: "Hoàn tất chuyến đi an toàn"
    });
    if (res.error) return toast(res.error, "error");
    toast(`🏁 Tour kết thúc thành công! Đã hoàn tất ${res.count} đơn.`);
    refreshAdmin();
    return;
  }

  // 3. Mở popup cập nhật tiến độ
  const progBtn = event.target.closest("[data-trip-progress-btn]");
  if (progBtn) {
    const tourId = progBtn.dataset.tripProgressBtn;
    const session = getSession();
    const group = assignedTours(session.username).find((g) => g.tourId === tourId);
    if (group) openProgressModal(group);
    return;
  }

  const cashBtn = event.target.closest("[data-trip-cash]");
  if (cashBtn) {
    return openCashCollect(cashBtn.dataset.tripCash);
  }

  const checkinBtn = event.target.closest("[data-trip-checkin]");
  const scanBtn = event.target.closest("[data-trip-mock-scan]");
  if (checkinBtn || scanBtn) {
    const session = getSession();
    const tourId = (checkinBtn || scanBtn).dataset.tripCheckin || (checkinBtn || scanBtn).dataset.tripMockScan;
    const group = assignedTours(session.username).find((item) => item.tourId === tourId);
    if (!group) return;
    const input = document.getElementById("trip-checkin-code");
    const booking = scanBtn
      ? group.bookings[Math.floor(Math.random() * group.bookings.length)]
      : group.bookings.find((item) => item.code.toLowerCase() === String(input?.value || "").trim().toLowerCase() || item.phone === String(input?.value || "").trim());
    if (scanBtn && booking && input) {
      input.value = booking.code;
      return toast(`Đã nhận mã QR ${booking.code}. Xác nhận để điểm danh khách ${booking.name}.`);
    }
    if (!booking) return toast("Không tìm thấy mã vé trong chuyến này.", "error");
    const result = markAttendance(booking.code, "present", { guideId: session.username, by: session.name });
    if (result.error) return toast(result.error, "error");
    toast(`Đã điểm danh ${booking.name} có mặt.`);
    closeModal();
    refreshAdmin();
    setTimeout(() => {
      const updatedGroup = assignedTours(session.username).find((item) => item.tourId === tourId);
      if (updatedGroup) openGuests(updatedGroup);
    }, 120);
    return;
  }

  const guests = event.target.closest("[data-trip-guests]");
  if (guests) {
    const session = getSession();
    const group = assignedTours(session.username).find(
      (item) => item.tourId === guests.dataset.tripGuests
    );
    return group ? openGuests(group) : undefined;
  }

  const plan = event.target.closest("[data-trip-plan]");
  if (plan) {
    const session = getSession();
    const group = assignedTours(session.username).find((item) => item.tourId === plan.dataset.tripPlan);
    return group ? openPlan(group) : undefined;
  }

  // Điểm danh nhanh từ popup danh sách khách
  const attBtn = event.target.closest("[data-attendance]");
  if (attBtn) {
    const code = attBtn.dataset.code;
    const session = getSession();
    const res = markAttendance(code, attBtn.dataset.attendance, { guideId: session.username, by: session.name });
    if (res.error) {
      return toast(res.error, "error");
    }
    toast(`Đã cập nhật: ${attBtn.dataset.attendance === "present" ? "Có mặt" : "Vắng mặt"}`);
    closeModal();
    refreshAdmin();
    // Mở lại modal cập nhật tức thì
    setTimeout(() => {
      const group = assignedTours(session.username).find((item) => item.tourId === getBooking(code)?.tourId);
      if (group) openGuests(group);
    }, 120);
    return;
  }

  return undefined;
});
