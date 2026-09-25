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
import { TOUR_STATUS, getTourById, listTours, removeTour, resetTours, saveTour } from "../tour-repository.js";
import { escapeHtml, searchKey } from "../validate.js";

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

function bookingRow(booking) {
  return `
  <tr data-code="${escapeHtml(booking.code)}" data-search="${escapeHtml(
    searchKey(`${booking.code} ${booking.name} ${booking.phone} ${booking.email} ${booking.tourName}`)
  )}">
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

function tourRow(tour) {
  return `
  <tr data-tour="${escapeHtml(tour.id)}" data-search="${escapeHtml(
    searchKey(`${tour.name} ${tour.location} ${tour.time}`)
  )}">
    <td>
      <strong>${escapeHtml(tour.name)}</strong><br>
      <small>${escapeHtml(tour.description || "Chưa có mô tả")}</small>
    </td>
    <td>${escapeHtml(tour.location)}</td>
    <td>${escapeHtml(tour.time)}</td>
    <td><strong>${formatPrice(tour.price)}</strong>${
      tour.oldPrice ? `<br><small><del>${formatPrice(tour.oldPrice)}</del></small>` : ""
    }</td>
    <td>${tour.seatsLeft}</td>
    <td><span class="status-pill status-${escapeHtml(tour.status)}">${
      TOUR_STATUS[tour.status] || TOUR_STATUS.open
    }</span></td>
    <td class="row-actions">
      <button class="btn btn-sm btn-outline" data-tour-action="edit">Sửa</button>
      <button class="btn btn-sm btn-ghost-soft" data-tour-action="delete">Xoá</button>
    </td>
  </tr>`;
}

function tourForm() {
  return `
  <form class="admin-form form-card" id="tour-form" novalidate hidden>
    <h2 id="tour-form-title">Thêm tour mới</h2>
    <input type="hidden" name="id" value="">

    <div class="field-row">
      <div class="field">
        <label for="tf-name">Tên tour <span class="req">*</span></label>
        <input id="tf-name" name="name" type="text" placeholder="Tour Hà Giang 3N2Đ" required>
      </div>
      <div class="field">
        <label for="tf-location">Điểm đến <span class="req">*</span></label>
        <input id="tf-location" name="location" type="text" placeholder="Hà Giang" required>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="tf-time">Thời lượng</label>
        <input id="tf-time" name="time" type="text" placeholder="3 ngày 2 đêm">
      </div>
      <div class="field">
        <label for="tf-days">Số ngày</label>
        <input id="tf-days" name="days" type="number" min="1" value="1">
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="tf-price">Giá (VNĐ) <span class="req">*</span></label>
        <input id="tf-price" name="price" type="number" min="0" step="1000" placeholder="2500000" required>
      </div>
      <div class="field">
        <label for="tf-oldPrice">Giá cũ (VNĐ)</label>
        <input id="tf-oldPrice" name="oldPrice" type="number" min="0" step="1000" placeholder="2900000">
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="tf-seatsLeft">Số chỗ còn</label>
        <input id="tf-seatsLeft" name="seatsLeft" type="number" min="0" value="10">
      </div>
      <div class="field">
        <label for="tf-status">Trạng thái</label>
        <select id="tf-status" name="status">
          ${Object.entries(TOUR_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <div class="field">
      <label for="tf-image">Ảnh chính (URL)</label>
      <input id="tf-image" name="image" type="url" placeholder="https://...">
    </div>

    <div class="field">
      <label for="tf-gallery">Thư viện ảnh (URL, cách nhau bằng dấu phẩy)</label>
      <input id="tf-gallery" name="gallery" type="text" placeholder="https://... , https://...">
    </div>

    <div class="field">
      <label for="tf-description">Mô tả ngắn</label>
      <textarea id="tf-description" name="description" rows="3" placeholder="Giới thiệu ngắn về tour..."></textarea>
    </div>

    <div class="field">
      <label for="tf-highlights">Điểm nhấn (mỗi dòng một điểm)</label>
      <textarea id="tf-highlights" name="highlights" rows="3" placeholder="Ruộng bậc thang&#10;Cột cờ Lũng Cầu"></textarea>
    </div>

    <div class="field">
      <label for="tf-departures">Ngày khởi hành (định dạng 2026-10-10, cách nhau bằng dấu phẩy)</label>
      <input id="tf-departures" name="departures" type="text" placeholder="2026-10-10, 2026-10-17">
    </div>

    <p class="error" data-error="tour"></p>
    <div class="success-actions">
      <button class="btn btn-primary" type="submit">Lưu tour</button>
      <button class="btn btn-ghost-soft" type="button" id="tour-cancel">Huỷ</button>
    </div>
  </form>`;
}

export function Admin() {
  const session = getSession();
  if (!session) return Guard();

  const bookings = listBookings();
  const messages = listMessages();
  const tours = listTours();
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
      <h1>Trang quản trị TravelGo</h1>
      <p>Xin chào ${escapeHtml(session.name)} - ${escapeHtml(session.role)}</p>
    </div>
  </section>

  <section class="section container">
    <div class="admin-tabs" role="tablist">
      <button class="admin-tab active" type="button" role="tab" data-tab="bookings" aria-selected="true">
        Đơn đặt tour (${bookings.length})
      </button>
      <button class="admin-tab" type="button" role="tab" data-tab="messages" aria-selected="false">
        Tin nhắn (${messages.length})
      </button>
      <button class="admin-tab" type="button" role="tab" data-tab="tours" aria-selected="false">
        Quản lý tour (${tours.length})
      </button>
    </div>

    <div class="admin-panel" data-panel="bookings">
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
            ${bookings.length ? bookings.map(bookingRow).join("") : ""}
          </tbody>
        </table>
      </div>
      <p class="search-empty" id="admin-empty" ${bookings.length ? "hidden" : ""}>
        Chưa có đơn đặt tour nào. Các đơn từ trang <a href="#/booking">Đặt tour</a> sẽ hiện ở đây.
      </p>
    </div>

    <div class="admin-panel" data-panel="messages" hidden>
      <h2 class="admin-panel-title">Tin nhắn từ khách hàng (${messages.length})</h2>
      ${
        messages.length
          ? `<div class="admin-messages">
            <ul>
              ${messages
                .map(
                  (item) => `
                <li>
                  <strong>${escapeHtml(item.topic)}</strong> - ${escapeHtml(item.name)}
                  <small>(${escapeHtml(item.phone)})${item.email ? ` · ${escapeHtml(item.email)}` : ""} · ${formatDateTime(item.createdAt)}</small>
                  <p>${escapeHtml(item.message)}</p>
                </li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p class="search-empty">Chưa có tin nhắn nào từ trang <a href="#/contact">Liên hệ</a>.</p>`
      }
    </div>

    <div class="admin-panel" data-panel="tours" hidden>
      <div class="admin-toolbar">
        <div class="toolbar-field">
          <label for="tour-keyword">Tìm tour</label>
          <input id="tour-keyword" type="search" placeholder="Tên tour, điểm đến..." autocomplete="off">
        </div>
        <div class="toolbar-actions">
          <button class="btn btn-primary" type="button" id="tour-add">Thêm tour</button>
          <button class="btn btn-ghost-soft" type="button" id="tour-reset">Khôi phục dữ liệu gốc</button>
        </div>
      </div>

      <p class="result-count" id="tour-admin-count" role="status"></p>

      ${tourForm()}

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Điểm đến</th>
              <th>Thời lượng</th>
              <th>Giá</th>
              <th>Chỗ còn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="tour-admin-rows">
            ${tours.length ? tours.map(tourRow).join("") : ""}
          </tbody>
        </table>
      </div>
      <p class="search-empty" id="tour-empty" ${tours.length ? "hidden" : ""}>
        Chưa có tour nào trong danh mục. Bấm "Thêm tour" để tạo tour đầu tiên.
      </p>
    </div>
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

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setupTabs() {
  const tabs = [...document.querySelectorAll(".admin-tab")];
  const panels = [...document.querySelectorAll(".admin-panel")];

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.panel !== target;
      });
    });
  });
}

function setupTourManager() {
  const form = document.getElementById("tour-form");
  const rowsBox = document.getElementById("tour-admin-rows");
  if (!form || !rowsBox) return;

  const keyword = document.getElementById("tour-keyword");
  const count = document.getElementById("tour-admin-count");
  const empty = document.getElementById("tour-empty");
  const title = document.getElementById("tour-form-title");
  const errorBox = form.querySelector('[data-error="tour"]');

  const rows = [...rowsBox.querySelectorAll("tr")];

  function applyFilter() {
    const query = searchKey(keyword.value);
    let visible = 0;
    rows.forEach((row) => {
      const match = !query || row.dataset.search.includes(query);
      row.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `Hiển thị ${visible}/${rows.length} tour`;
    empty.hidden = visible > 0;
  }

  function openForm(tour = null) {
    errorBox.textContent = "";
    form.hidden = false;
    title.textContent = tour ? `Cập nhật: ${tour.name}` : "Thêm tour mới";
    form.elements.id.value = tour ? tour.id : "";
    form.elements.name.value = tour?.name || "";
    form.elements.location.value = tour?.location || "";
    form.elements.time.value = tour?.time || "";
    form.elements.days.value = tour?.days || 1;
    form.elements.price.value = tour?.price || "";
    form.elements.oldPrice.value = tour?.oldPrice || "";
    form.elements.seatsLeft.value = tour?.seatsLeft ?? 10;
    form.elements.status.value = tour?.status || "open";
    form.elements.image.value = tour?.image || "";
    form.elements.gallery.value = (tour?.gallery || []).join(", ");
    form.elements.description.value = tour?.description || "";
    form.elements.highlights.value = (tour?.highlights || []).join("\n");
    form.elements.departures.value = (tour?.departures || []).join(", ");
    form.scrollIntoView?.({ behavior: "smooth", block: "start" });
    form.elements.name.focus();
  }

  keyword.addEventListener("input", applyFilter);
  applyFilter();

  document.getElementById("tour-add").addEventListener("click", () => openForm());

  document.getElementById("tour-cancel").addEventListener("click", () => {
    form.hidden = true;
  });

  document.getElementById("tour-reset").addEventListener("click", () => {
    if (!window.confirm("Khôi phục danh sách tour về dữ liệu gốc?")) return;
    resetTours();
    refresh();
  });

  rowsBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tour-action]");
    if (!button) return;
    const id = button.closest("tr").dataset.tour;
    const tour = getTourById(id);
    if (!tour) return;

    if (button.dataset.tourAction === "edit") {
      openForm(tour);
      return;
    }

    if (!window.confirm(`Xoá tour "${tour.name}"?`)) return;
    removeTour(id);
    form.hidden = true;
    refresh();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const location = String(data.get("location") || "").trim();
    const price = Number(data.get("price"));
    const id = String(data.get("id") || "").trim();

    if (name.length < 2) {
      errorBox.textContent = "Vui lòng nhập tên tour.";
      return;
    }
    if (!location) {
      errorBox.textContent = "Vui lòng nhập điểm đến.";
      return;
    }
    if (!price || price <= 0) {
      errorBox.textContent = "Vui lòng nhập giá tour lớn hơn 0.";
      return;
    }

    const current = id ? getTourById(id) : null;
    const image = String(data.get("image") || "").trim();
    const gallery = splitList(data.get("gallery"));

    saveTour({
      ...(current || {}),
      id: current ? current.id : undefined,
      name,
      location,
      time: String(data.get("time") || "").trim() || `${Number(data.get("days")) || 1} ngày`,
      days: Number(data.get("days")) || 1,
      price,
      oldPrice: Number(data.get("oldPrice")) || 0,
      seatsLeft: Math.max(Number(data.get("seatsLeft")) || 0, 0),
      status: String(data.get("status") || "open"),
      description: String(data.get("description") || "").trim(),
      highlights: splitLines(data.get("highlights")),
      departures: splitList(data.get("departures")),
      gallery: gallery.length ? gallery : image ? [image] : [],
      image: image || current?.image,
      itinerary: current?.itinerary || [],
      includes: current?.includes || [],
      excludes: current?.excludes || [],
    });

    refresh();
  });
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "admin" || !getSession()) return;

  setupTabs();

  const keyword = document.getElementById("admin-keyword");
  const status = document.getElementById("admin-status");
  const rows = [...document.querySelectorAll("#admin-rows tr")];

  function applyFilter() {
    const query = searchKey(keyword.value);
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

  setupTourManager();
});
