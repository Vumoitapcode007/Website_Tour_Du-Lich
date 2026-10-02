import {
  BOOKING_STATUS,
  advanceBooking,
  guideBookings,
  nextBookingStatus,
} from "../../store.js";
import { getTourById } from "../../tour-repository.js";
import { getSession, hasPermission } from "../../auth.js";
import { guideGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  emptyState,
  formatMoney,
  openModal,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { formatDate } from "../../data.js";
import { formatDateTime } from "../../reports.js";
import { daysToDeparture, departureCountdown } from "../../components/booking-tracker.js";
import { escapeHtml } from "../../validate.js";

/* Tour Guide chỉ thấy các tour từ đơn được phân công cho mình */
export function assignedTours(guideId) {
  const rows = guideBookings(guideId);
  const map = new Map();

  rows.forEach((booking) => {
    const key = String(booking.tourId);
    if (!map.has(key)) {
      map.set(key, {
        tourId: key,
        tour: getTourById(booking.tourId),
        bookings: [],
      });
    }
    map.get(key).bookings.push(booking);
  });

  return [...map.values()].sort((a, b) => {
    const dateA = a.bookings.map((item) => item.date).sort()[0] || "9999";
    const dateB = b.bookings.map((item) => item.date).sort()[0] || "9999";
    return dateA.localeCompare(dateB);
  });
}

function tourName(booking) {
  return booking.tourName || getTourById(booking.tourId)?.name || "Tour không còn trong danh mục";
}

function guestCount(bookings) {
  return bookings.reduce((sum, item) => sum + (Number(item.people) || 0), 0);
}

/* Nút cập nhật trạng thái vận hành đúng theo luồng Guide */
export function guideActionButton(booking) {
  const next = nextBookingStatus(booking.status, { guide: true });
  if (!next || !hasPermission("guide.tours.run")) return "";
  return `<button class="btn btn-sm btn-primary" type="button" data-guide-advance="${escapeHtml(
    booking.code
  )}" data-next="${escapeHtml(next)}">${escapeHtml(BOOKING_STATUS[next])}</button>`;
}

function advanceGuide(code, next) {
  const session = getSession();
  const result = advanceBooking(code, next, {
    guide: true,
    by: session?.name || session?.username || "Tour Guide",
  });

  if (result.error) return toast(result.error, "error");
  toast(`Đã cập nhật đơn ${code} sang "${BOOKING_STATUS[next]}".`);
  return refreshAdmin();
}

function bookingRow(booking) {
  return `
  <tr>
    <td><strong class="code">${escapeHtml(booking.code)}</strong></td>
    <td>
      <span class="cell-user">
        <span>
          <strong>${escapeHtml(booking.name)}</strong>
          <small>${escapeHtml(booking.phone)}</small>
        </span>
      </span>
    </td>
    <td>${escapeHtml(tourName(booking))}<br><small>${escapeHtml(booking.date || "-")}</small></td>
    <td>${booking.people}</td>
    <td>${statusBadge(booking.status, BOOKING_STATUS)}</td>
    <td class="row-actions">${guideActionButton(booking)}</td>
  </tr>`;
}

function guestRow(booking) {
  return `
  <tr>
    <td><strong class="code">${escapeHtml(booking.code)}</strong></td>
    <td>
      <strong>${escapeHtml(booking.name)}</strong><br>
      <small>${escapeHtml(booking.phone)}</small>
    </td>
    <td>${booking.people}</td>
    <td>${statusBadge(booking.status, BOOKING_STATUS)}</td>
  </tr>`;
}

export function GuideDashboard() {
  const denied = guideGuard("guide.dashboard.view");
  if (denied) return denied;

  const session = getSession();
  const mine = guideBookings(session.username);
  const groups = assignedTours(session.username);

  const upcoming = mine.filter((item) => ["paid", "upcoming"].includes(item.status));
  const ongoing = mine.filter((item) => item.status === "ongoing");
  const completed = mine.filter((item) => item.status === "completed");
  const nextDeparture = upcoming
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  const attention = mine.filter((item) => ["upcoming", "ongoing"].includes(item.status));

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Chuyến được giao</p><strong class="kpi-value">${groups.length}</strong><span class="kpi-hint">Tour có khách của bạn</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Sắp khởi hành</p><strong class="kpi-value">${upcoming.length}</strong><span class="kpi-hint">${upcoming.reduce((sum, item) => sum + (Number(item.people) || 0), 0)} khách</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đang diễn ra</p><strong class="kpi-value">${ongoing.length}</strong><span class="kpi-hint">${ongoing.reduce((sum, item) => sum + (Number(item.people) || 0), 0)} khách trên đường</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Đã hoàn thành</p><strong class="kpi-value">${completed.length}</strong><span class="kpi-hint">Tổng ${formatMoney(completed.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}</span></article>
  </section>

  ${
    nextDeparture
      ? `<section class="panel guide-next-trip">
          <div class="panel-head">
            <div>
              <h2>Chuyến gần nhất</h2>
              <p class="panel-sub">${escapeHtml(tourName(nextDeparture))}</p>
            </div>
            <div class="guide-countdown">
              <strong>${escapeHtml(departureCountdown(nextDeparture) || "-")}</strong>
              <small>Khởi hành ${escapeHtml(formatDate(nextDeparture.date))}</small>
            </div>
          </div>
          <ul class="summary-list">
            <li><span>Mã đơn</span><strong>${escapeHtml(nextDeparture.code)}</strong></li>
            <li><span>Số khách</span><strong>${nextDeparture.people} khách</strong></li>
            <li><span>Điểm đến</span><strong>${escapeHtml(nextDeparture.tourLocation || getTourById(nextDeparture.tourId)?.location || "-")}</strong></li>
            <li><span>Thời lượng</span><strong>${escapeHtml(nextDeparture.tourTime || getTourById(nextDeparture.tourId)?.time || "-")}</strong></li>
          </ul>
        </section>`
      : `<section class="panel">${emptyState("Bạn chưa được phân công tour nào. Liên hệ quản trị viên để nhận phép công việc.")}</section>`
  }

  <section class="panel">
    <div class="panel-head">
      <div><h2>Cần xử lý hôm nay</h2><p class="panel-sub">Cập nhật tiến trình để khách và quản trị viên theo dõi được</p></div>
      <a class="btn btn-sm btn-ghost-soft" href="#/guide/bookings">Xem tất cả khách</a>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Mã đơn</th><th>Khách</th><th>Tour</th><th>Khách</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>${attention.length ? attention.map(bookingRow).join("") : `<tr><td colspan="6" class="table-empty">Không có chuyến nào đang chờ bạn xử lý.</td></tr>`}</tbody>
      </table>
    </div>
  </section>

  <section class="admin-grid admin-grid-2">
    <section class="panel">
      <div class="panel-head"><div><h2>Lịch khởi hành</h2><p class="panel-sub">Sắp xếp theo ngày gần nhất</p></div></div>
      <ul class="history-list">
        ${
          groups.length
            ? groups
                .slice(0, 6)
                .map((group) => {
                  const first = group.bookings[0];
                  const days = daysToDeparture(first.date);
                  return `<li data-guide-trip="${escapeHtml(group.tourId)}" role="button" tabindex="0">
                    <strong>${escapeHtml(group.tour?.name || tourName(first))}</strong>
                    <ul class="it-list">
                      <li>${escapeHtml(formatDate(first.date))} · ${days >= 0 ? `còn ${days} ngày` : `đã qua ${Math.abs(days)} ngày`}</li>
                      <li>${group.bookings.length} đơn · ${guestCount(group.bookings)} khách</li>
                    </ul>
                  </li>`;
                })
                .join("")
            : "<li>Chưa có lịch nào.</li>"
        }
      </ul>
    </section>

    <section class="panel">
      <div class="panel-head"><div><h2>Nhật ký phân công</h2><p class="panel-sub">Thay đổi trạng thái gần nhất của bạn</p></div></div>
      <ul class="history-list">
        ${
          mine
            .flatMap((item) => (item.statusHistory || []).map((entry) => ({ ...entry, code: item.code })))
            .sort((a, b) => String(b.at).localeCompare(String(a.at)))
            .slice(0, 8)
            .map(
              (entry) => `<li>
                <strong>${escapeHtml(entry.code)} → ${escapeHtml(BOOKING_STATUS[entry.status] || entry.status)}</strong>
                <ul class="it-list">
                  <li>${escapeHtml(formatDateTime(entry.at))} · ${escapeHtml(entry.by || "")}</li>
                  ${entry.note ? `<li>${escapeHtml(entry.note)}</li>` : ""}
                </ul>
              </li>`
            )
            .join("") || "<li>Chưa có thay đổi nào.</li>"
        }
      </ul>
    </section>
  </section>`;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-guide-advance]");
  if (!button) return;
  advanceGuide(button.dataset.guideAdvance, button.dataset.next);
});

/* Xem nhanh danh sách khách của một chuyến ngay trên dashboard */
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-guide-trip]");
  if (!button) return;
  const session = getSession();
  const bookings = guideBookings(session.username).filter(
    (item) => String(item.tourId) === button.dataset.guideTrip
  );
  if (!bookings.length) return;

  openModal({
    title: "Danh sách khách",
    subtitle: `${tourName(bookings[0])} · ${formatDate(bookings[0].date)}`,
    size: "lg",
    body: `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Mã đơn</th><th>Khách</th><th>Số khách</th><th>Trạng thái</th></tr></thead>
          <tbody>${bookings.map(guestRow).join("")}</tbody>
        </table>
      </div>`,
    footer: `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`,
  });
});