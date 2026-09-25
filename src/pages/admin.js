import { getSession, logout } from "../auth.js";
import {
  BOOKING_STATUS,
  clearBookings,
  listBookings,
  listMessages,
  removeBooking,
  updateBooking,
} from "../store.js";
import { formatPrice, formatDate } from "../data.js";
import { escapeHtml } from "../validate.js";

function Guard() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Khu vực quản trị</span>
      <h1>Yêu cầu đăng nhập</h1>
      <p>Vui lòng đăng nhập để xem và quản lý đơn đặt tour.</p>
    </div>
  </section>
  <section class="section container center">
    <a class="btn btn-light btn-lg" href="#/login?next=admin">Đăng nhập ngay</a>
  </section>`;
}

function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function row(booking) {
  return `
  <tr data-code="${escapeHtml(booking.code)}" data-search="${escapeHtml(
    `${booking.code} ${booking.name} ${booking.phone} ${booking.email} ${booking.tourName}`
  ).toLocaleLowerCase("vi")}">
    <td><strong>${escapeHtml(booking.code)}</strong><br><small>${formatDateTime(booking.createdAt)}</small></td>
    <td>
      ${escapeHtml(booking.name)}<br>
      <small>${escapeHtml(booking.phone)}${booking.email ? ` · ${escapeHtml(booking.email)}` : ""}</small>
    </td>
    <td>${escapeHtml(booking.tourName)}<br><small>${formatDate(booking.date)}</small></td>
    <td>${booking.people}</td>
    <td><strong>${formatPrice(booking.total)}</strong></td>
    <td><span class="status-pill status-${escapeHtml(booking.status)}">${BOOKING_STATUS[booking.status]}</span></td>
    <td class="row-actions">
      ${
        booking.status === "pending"
          ? `<button class="btn btn-sm btn-primary" data-action="confirmed">Xác nhận</button>`
          : ""
      }
      ${
        booking.status === "confirmed"
          ? `<button class="btn btn-sm btn-outline" data-action="cancelled">Huỷ</button>`
          : ""
      }
      <button class="btn btn-sm btn-ghost-soft" data-action="delete">Xoá</button>
    </td>
  </tr>`;
}

export function Admin() {
  const session = getSession();
  if (!session) return Guard();

  const bookings = listBookings();
  const messages = listMessages();
  const pending = bookings.filter((item) => item.status === "pending").length;
  const confirmed = bookings.filter((item) => item.status === "confirmed").length;
  const revenue = bookings
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + item.total, 0);
  const customers = new Set(bookings.map((item) => item.phone)).size;

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Khu vực quản trị</span>
      <h1>Quản lý đơn đặt tour</h1>
      <p>Xin chào ${escapeHtml(session.name)} - ${escapeHtml(session.role)}</p>
    </div>
  </section>

  <section class="section container">
    <div class="admin-stats">
      <div class="admin-stat"><strong>${bookings.length}</strong><span>Tổng đơn</span></div>
      <div class="admin-stat"><strong>${pending}</strong><span>Chờ xác nhận</span></div>
      <div class="admin-stat"><strong>${confirmed}</strong><span>Đã xác nhận</span></div>
      <div class="admin-stat"><strong>${customers}</strong><span>Khách hàng</span></div>
      <div class="admin-stat"><strong>${formatPrice(revenue)}</strong><span>Doanh thu ước tính</span></div>
    </div>

    <div class="admin-toolbar">
      <div class="toolbar-field">
        <label for="admin-keyword">Tìm đơn</label>
        <input id="admin-keyword" type="search" placeholder="Mã đơn, tên, SĐT, tour..." autocomplete="off">
      </div>
      <div class="toolbar-field">
        <label for="admin-status">Trạng thái</label>
        <select id="admin-status">
          <option value="">Tất cả trạng thái</option>
          ${Object.entries(BOOKING_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-primary" type="button" id="admin-export">Xuất CSV</button>
        <button class="btn btn-outline" type="button" id="admin-clear">Xoá tất cả</button>
        <button class="btn btn-ghost-soft" type="button" id="admin-logout">Đăng xuất</button>
      </div>
    </div>

    <p class="result-count" id="admin-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Tour</th>
            <th>SL</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="admin-rows">
          ${bookings.length ? bookings.map(row).join("") : ""}
        </tbody>
      </table>
    </div>
    <p class="search-empty" id="admin-empty" ${bookings.length ? "hidden" : ""}>
      Chưa có đơn đặt tour nào. Các đơn từ trang <a href="#/booking">Đặt tour</a> sẽ hiện ở đây.
    </p>

    ${
      messages.length
        ? `<div class="admin-messages">
            <h2>Tin nhắn từ khách hàng (${messages.length})</h2>
            <ul>
              ${messages
                .slice(0, 5)
                .map(
                  (item) => `
                <li>
                  <strong>${escapeHtml(item.topic)}</strong> - ${escapeHtml(item.name)}
                  <small>(${escapeHtml(item.phone)}) · ${formatDateTime(item.createdAt)}</small>
                  <p>${escapeHtml(item.message)}</p>
                </li>`
                )
                .join("")}
            </ul>
          </div>`
        : ""
    }
  </section>`;
}

function refreshCount() {
  const rows = [...document.querySelectorAll("#admin-rows tr")];
  const visible = rows.filter((row) => !row.hidden).length;
  const count = document.getElementById("admin-count");
  const empty = document.getElementById("admin-empty");
  if (count) count.textContent = `Hiển thị ${visible}/${rows.length} đơn`;
  if (empty) empty.hidden = visible > 0;
}

function downloadCsv() {
  const rows = [...document.querySelectorAll("#admin-rows tr")].filter((row) => !row.hidden);
  if (!rows.length) {
    window.alert("Không có đơn nào để xuất.");
    return;
  }

  const header = ["Ma don", "Khach hang", "So dien thoai", "Email", "Tour", "Ngay khoi hanh", "So khach", "Tong tien", "Trang thai", "Ngay tao"];
  const body = rows.map((row) => {
    const booking = listBookings().find((item) => item.code === row.dataset.code);
    return [
      booking.code,
      booking.name,
      booking.phone,
      booking.email || "",
      booking.tourName,
      booking.date,
      booking.people,
      booking.total,
      BOOKING_STATUS[booking.status],
      booking.createdAt,
    ];
  });

  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `don-dat-tour-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function refresh() {
  document.dispatchEvent(new CustomEvent("app:refresh"));
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "admin" || !getSession()) return;

  const keyword = document.getElementById("admin-keyword");
  const status = document.getElementById("admin-status");
  const rows = [...document.querySelectorAll("#admin-rows tr")];

  function applyFilter() {
    const query = keyword.value.trim().toLocaleLowerCase("vi");
    rows.forEach((row) => {
      const matchText = !query || row.dataset.search.includes(query);
      const matchStatus = !status.value || row.querySelector(".status-pill").classList.contains(`status-${status.value}`);
      row.hidden = !(matchText && matchStatus);
    });
    refreshCount();
  }

  keyword.addEventListener("input", applyFilter);
  status.addEventListener("change", applyFilter);
  applyFilter();

  document.getElementById("admin-rows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const code = button.closest("tr").dataset.code;

    if (button.dataset.action === "delete") {
      if (!window.confirm(`Xoá đơn ${code}?`)) return;
      removeBooking(code);
    } else {
      updateBooking(code, { status: button.dataset.action });
    }
    refresh();
  });

  document.getElementById("admin-export").addEventListener("click", downloadCsv);

  document.getElementById("admin-clear").addEventListener("click", () => {
    if (!window.confirm("Xoá toàn bộ đơn đặt tour?")) return;
    clearBookings();
    refresh();
  });

  document.getElementById("admin-logout").addEventListener("click", () => {
    logout();
    window.location.hash = "#/login";
  });
});
