import { BOOKING_STATUS } from "../../store.js";
import { getSession } from "../../auth.js";
import { guideGuard } from "../../components/admin-shell.js";
import {
  downloadCsv,
  emptyState,
  openModal,
  stars,
  statusBadge,
  stamp,
  toast,
} from "../../components/admin-ui.js";
import { formatPrice, formatDate } from "../../data.js";
import { daysToDeparture } from "../../components/booking-tracker.js";
import { assignedTours, guideActionButton } from "./dashboard.js";
import { escapeHtml, searchKey } from "../../validate.js";

const FILTERS = { q: "", status: "" };

const TRIP_STATUS = {
  upcoming: "Sắp khởi hành",
  ongoing: "Đang diễn ra",
  done: "Đã hoàn thành",
  preparing: "Chờ khách thanh toán",
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
  if (status && TRIP_STATUS[tripStatus(group.bookings)] !== status) return false;
  if (!query) return true;
  const tour = group.tour;
  return searchKey(
    `${tour?.name || ""} ${tour?.location || ""} ${group.bookings
      .map((item) => `${item.name} ${item.code} ${item.date}`)
      .join(" ")}`
  ).includes(query);
}

export function GuideTours() {
  const denied = guideGuard("guide.tours.view");
  if (denied) return denied;

  const session = getSession();
  const groups = assignedTours(session.username);

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng chuyến</p><strong class="kpi-value">${groups.length}</strong><span class="kpi-hint">Được phân công cho bạn</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Sắp khởi hành</p><strong class="kpi-value">${groups.filter((g) => tripStatus(g.bookings) === "upcoming").length}</strong><span class="kpi-hint">Cần chuẩn bị</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đang diễn ra</p><strong class="kpi-value">${groups.filter((g) => tripStatus(g.bookings) === "ongoing").length}</strong><span class="kpi-hint">Bạn đang phụ trách</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Đã xong</p><strong class="kpi-value">${groups.filter((g) => tripStatus(g.bookings) === "done").length}</strong><span class="kpi-hint">Đã bàn giao</span></article>
  </section>

  ${
    groups.length
      ? ""
      : `<section class="panel">${emptyState("Chưa có tour nào được phân công. Liên hệ quản trị viên.")}</section>`
  }

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="gt-q">Tìm chuyến</label>
        <input id="gt-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên tour, tên khách, mã đơn..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="gt-status">Trạng thái</label>
        <select id="gt-status">
          <option value="">Tất cả</option>
          ${Object.entries(TRIP_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <div class="toolbar-actions toolbar-actions-end">
      <button class="btn btn-sm btn-ghost-soft" type="button" id="gt-export">Xuất danh sách khách</button>
    </div>

    <p class="result-count" id="gt-count" role="status"></p>
    <div id="gt-list"></div>
  </section>`;
}

function tripCard(group) {
  const tour = group.tour;
  const bookings = group.bookings;
  const first = bookings.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  const status = tripStatus(bookings);
  const days = daysToDeparture(first.date);
  const people = bookings.reduce((sum, item) => sum + (Number(item.people) || 0), 0);

  return `
  <article class="guide-trip" data-trip="${escapeHtml(group.tourId)}">
    <img class="guide-trip-img" src="${escapeHtml(tour?.image || "")}" alt="" loading="lazy">
    <div class="guide-trip-body">
      <div class="guide-trip-top">
        ${statusBadge(status, TRIP_STATUS)}
        <span class="soft-chip">${days >= 0 ? `còn ${days} ngày` : `đã qua ${Math.abs(days)} ngày`}</span>
      </div>
      <h3>${escapeHtml(tour?.name || first.tourName)}</h3>
      <ul class="guide-trip-meta">
        <li>Điểm đến: <strong>${escapeHtml(tour?.location || first.tourLocation || "-")}</strong></li>
        <li>Thời lượng: <strong>${escapeHtml(tour?.time || first.tourTime || "-")}</strong></li>
        <li>Khởi hành: <strong>${escapeHtml(formatDate(first.date))}</strong></li>
        <li>Khách: <strong>${bookings.length} đơn / ${people} khách</strong></li>
        <li>Giá: <strong>${formatPrice(first.tourPrice || tour?.price || 0)}</strong>${tour?.rating ? ` · ${stars(tour.rating)}` : ""}</li>
      </ul>
    </div>
    <div class="guide-trip-actions">
      <button class="btn btn-sm btn-primary" type="button" data-trip-guests="${escapeHtml(group.tourId)}">Danh sách khách</button>
      ${tour?.itinerary?.length ? `<button class="btn btn-sm btn-outline" type="button" data-trip-plan="${escapeHtml(group.tourId)}">Lịch trình</button>` : ""}
    </div>
  </article>`;
}

function openGuests(group) {
  const bookings = group.bookings;
  openModal({
    title: "Danh sách khách",
    subtitle: `${group.tour?.name || bookings[0].tourName} · ${formatDate(bookings[0].date)}`,
    size: "lg",
    body: `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Mã đơn</th><th>Khách</th><th>Số khách</th><th>Ghi chú</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            ${
              bookings
                .map(
                  (item) => `
              <tr>
                <td><strong class="code">${escapeHtml(item.code)}</strong></td>
                <td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.phone)}</small></td>
                <td>${item.people}</td>
                <td>${escapeHtml(item.note || "-")}</td>
                <td>${statusBadge(item.status, BOOKING_STATUS)}</td>
                <td class="row-actions">${guideActionButton(item)}</td>
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
    title: "Lịch trình chi tiết",
    subtitle: tour?.name || "",
    size: "lg",
    body: `
      <div class="timeline">
        ${(tour?.itinerary || [])
          .map(
            (day) => `
          <div class="timeline-item">
            <span class="timeline-day">${escapeHtml(day.day)}</span>
            <div>
              <h3>${escapeHtml(day.title || "-")}</h3>
              <ul>${(day.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>`
          )
          .join("")}
      </div>
      ${
        tour?.includes?.length || tour?.excludes?.length
          ? `<div class="detail-grid">
              <section><h4>Bao gồm</h4><ul class="it-list tick">${(tour.includes || [])
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}</ul></section>
              <section><h4>Không bao gồm</h4><ul class="it-list cross">${(tour.excludes || [])
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}</ul></section>
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
    document.getElementById("gt-count").textContent = `Tìm thấy ${list.length} chuyến được phân công`;
    box.innerHTML = list.length ? list.map(tripCard).join("") : emptyState("Không có chuyến nào khớp bộ lọc.");
    box.dataset.count = String(list.length);
  }

  paint();

  document.getElementById("gt-q")?.addEventListener("input", (event) => {
    FILTERS.q = event.target.value;
    paint();
  });
  document.getElementById("gt-status")?.addEventListener("change", (event) => {
    FILTERS.status = event.target.value;
    paint();
  });

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
        BOOKING_STATUS[item.status],
      ])
    );
    if (!rows.length) return toast("Không có dữ liệu để xuất.", "error");
    return downloadCsv(
      `danh-sach-khach-${stamp()}`,
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

  return undefined;
});