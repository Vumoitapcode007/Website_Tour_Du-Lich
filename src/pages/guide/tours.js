import { BOOKING_STATUS, markAttendance, getBooking } from "../../store.js";
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
import { assignedTours, guideActionButton } from "./dashboard.js";
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
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue">
      <p class="kpi-label">Tổng tour phụ trách</p>
      <strong class="kpi-value">${groups.length}</strong>
      <span class="kpi-hint">Được phân công cho bạn</span>
    </article>
    <article class="kpi kpi-amber">
      <p class="kpi-label">Sắp khởi hành</p>
      <strong class="kpi-value">${upcomingCount}</strong>
      <span class="kpi-hint">Cần chuẩn bị & liên hệ khách</span>
    </article>
    <article class="kpi kpi-green">
      <p class="kpi-label">Đang diễn ra</p>
      <strong class="kpi-value">${ongoingCount}</strong>
      <span class="kpi-hint">Đang điều hành trên tuyến</span>
    </article>
    <article class="kpi kpi-violet">
      <p class="kpi-label">Đã hoàn thành</p>
      <strong class="kpi-value">${doneCount}</strong>
      <span class="kpi-hint">Đã quyết toán & bàn giao</span>
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
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  const collectedCash = bookings.reduce((sum, b) => sum + (Number(b.cashCollected) || 0), 0);

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
            <span class="m-label">Tổng doanh thu</span>
            <strong class="m-val">${formatMoney(totalRevenue)}</strong>
            <span class="m-sub">Giá trị hợp đồng</span>
          </div>

          <div class="guide-metric-box">
            <span class="m-label">Tiền mặt đã thu</span>
            <strong class="m-val ${collectedCash > 0 ? "text-success" : ""}">${formatMoney(collectedCash)}</strong>
            <span class="m-sub">Thu trực tiếp</span>
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
          👥 Danh sách khách (${bookings.length})
        </button>
        <a class="btn btn-sm btn-outline" href="#/guide/checkin">
          🎟️ Điểm danh vé (QR)
        </a>
        <a class="btn btn-sm btn-ghost-soft" href="#/guide/diary">
          📖 Nhật ký tour
        </a>
        <a class="btn btn-sm btn-ghost-soft" href="#/guide/expenses">
          💳 Chi tiêu & Quyết toán
        </a>
        <a class="btn btn-sm btn-ghost-soft" href="#/guide/announcements">
          📢 Gửi thông báo đoàn
        </a>
        ${
          tour?.itinerary?.length
            ? `<button class="btn btn-sm btn-ghost-soft" type="button" data-trip-plan="${escapeHtml(group.tourId)}">
                🗺️ Lịch trình chi tiết
              </button>`
            : ""
        }
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
    title: `Danh sách hành khách (${bookings.length} đơn · ${people} khách)`,
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
                    ${item.payment === "paid" ? "✓ Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                  ${item.cashCollected > 0 ? `<br><small class="text-success" style="font-weight:600;">Đã thu: ${formatMoney(item.cashCollected)}</small>` : ""}
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
                    <button class="btn btn-xs btn-ghost-soft" type="button" data-guide-view="${escapeHtml(item.code)}">
                      Chi tiết
                    </button>
                  </div>
                </td>
              </tr>`
                )
                .join("")
            }
          </tbody>
        </table>
      </div>`,
    footer: `<button class="btn btn-light" type="button" data-modal-close>Đóng danh sách</button>`,
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

document.addEventListener("click", (event) => {
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

  // Chuyển hướng khi bấm "Chi tiết" ở danh sách khách trong 1 tour
  const viewBtn = event.target.closest("[data-guide-view]");
  if (viewBtn) {
    const code = viewBtn.dataset.guideView;
    closeModal();
    window.location.hash = `#/guide/bookings?q=${code}`;
    return;
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