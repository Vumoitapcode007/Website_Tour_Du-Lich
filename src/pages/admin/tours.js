import { listBookings, logActivity } from "../../store.js";
import { formatPrice } from "../../data.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  closeModal,
  confirmAction,
  createListController,
  downloadCsv,
  emptyState,
  formatMoney,
  openModal,
  setupSelection,
  stars,
  stamp,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { hasPermission } from "../../auth.js";
import {
  TOUR_STATUS,
  getTourById,
  getDestinations,
  listTours,
  normalizeTour,
  removeTour,
  resetTours,
  saveTour,
} from "../../tour-repository.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("tours.manage");

const FILTERS = { q: "", location: "", status: "", sort: "name", view: "table" };

function filterTours(list) {
  const query = searchKey(FILTERS.q);
  const result = list.filter((tour) => {
    if (FILTERS.location && tour.location !== FILTERS.location) return false;
    if (FILTERS.status && tour.status !== FILTERS.status) return false;
    if (query && !searchKey(`${tour.name} ${tour.location} ${tour.time} ${tour.description}`).includes(query))
      return false;
    return true;
  });

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, "vi"),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    seats: (a, b) => a.seatsLeft - b.seatsLeft,
    rating: (a, b) => b.rating - a.rating,
  };
  return result.sort(sorters[FILTERS.sort] || sorters.name);
}

function row(tour) {
  const orders = listBookings().filter((item) => String(item.tourId) === String(tour.id)).length;
  return `
  <tr data-tour="${escapeHtml(tour.id)}" data-search="${escapeHtml(
    searchKey(`${tour.name} ${tour.location} ${tour.time}`)
  )}">
    <td class="cell-check">
      ${canManage() ? `<input type="checkbox" data-select value="${escapeHtml(tour.id)}" aria-label="Chọn tour ${escapeHtml(tour.name)}">` : ""}
    </td>
    <td>
      <span class="cell-user">
        <img class="cell-thumb" src="${escapeHtml(tour.image)}" alt="" loading="lazy" width="52" height="40">
        <span>
          <strong>${escapeHtml(tour.name)}</strong>
          <small>${escapeHtml(tour.description?.slice(0, 60) || "Chưa có mô tả")}</small>
        </span>
      </span>
    </td>
    <td>${escapeHtml(tour.location || "-")}</td>
    <td>${escapeHtml(tour.time)}<br><small>${tour.departures.length} lịch khởi hành</small></td>
    <td><strong>${formatPrice(tour.price)}</strong>${tour.oldPrice ? `<br><small><del>${formatPrice(tour.oldPrice)}</del></small>` : ""}</td>
    <td>${tour.seatsLeft}</td>
    <td>${stars(tour.rating)}<br><small>${tour.reviews} đánh giá · ${orders} đơn</small></td>
    <td>${statusBadge(tour.status, TOUR_STATUS)}</td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-tour-action="view">Xem</button>
      ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" data-tour-action="edit">Sửa</button>` : ""}
      ${canManage() ? `<button class="btn btn-sm btn-outline" type="button" data-tour-action="duplicate">Nhân bản</button>` : ""}
      ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" data-tour-action="delete">Xoá</button>` : ""}
    </td>
  </tr>`;
}

function card(tour) {
  return `
  <article class="tour-admin-card" data-tour="${escapeHtml(tour.id)}">
    <img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.name)}" loading="lazy">
    <div class="tour-admin-body">
      <div class="tour-admin-top">
        ${statusBadge(tour.status, TOUR_STATUS)}
        <span class="tour-admin-price">${formatPrice(tour.price)}</span>
      </div>
      <h3>${escapeHtml(tour.name)}</h3>
      <p>${escapeHtml(tour.description?.slice(0, 110) || "Chưa có mô tả")}</p>
      <ul class="tour-admin-meta">
        <li>Điểm đến: <strong>${escapeHtml(tour.location || "-")}</strong></li>
        <li>Thời lượng: <strong>${escapeHtml(tour.time)}</strong></li>
        <li>Chỗ còn: <strong>${tour.seatsLeft}</strong></li>
        <li>Đánh giá: <strong>${tour.rating}★ (${tour.reviews})</strong></li>
      </ul>
      <div class="tour-admin-actions">
        <button class="btn btn-sm btn-ghost-soft" type="button" data-tour-action="view">Xem</button>
        ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" data-tour-action="edit">Sửa</button>` : ""}
        ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" data-tour-action="delete">Xoá</button>` : ""}
      </div>
    </div>
  </article>`;
}

/* ---------- Biểu mẫu tour ---------- */

function listToText(value = []) {
  return value.join("\n");
}

function itineraryHtml(itinerary = []) {
  if (!itinerary.length) return `<p class="itinerary-empty">Chưa có ngày nào. Bấm "Thêm ngày" để bắt đầu.</p>`;
  return itinerary
    .map(
      (day, index) => `
    <fieldset class="itinerary-day" data-day="${index}">
      <legend>Ngày ${index + 1}</legend>
      <div class="field-row">
        <div class="field">
          <label>Tiêu đề ngày</label>
          <input type="text" data-day-title value="${escapeHtml(day.title || "")}" placeholder="Hạ Long - Vùng Vịnh">
        </div>
        <div class="field">
          <label>Nội dung (mỗi dòng một hoạt động)</label>
          <textarea data-day-items rows="4" placeholder="06:30 Xuất phát&#10;11:00 Tham quan đảo">${escapeHtml(listToText(day.items))}</textarea>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger" type="button" data-day-remove="${index}">Xoá ngày này</button>
    </fieldset>`
    )
    .join("");
}

function formHtml(tour = null) {
  return `
  <form id="tour-form" novalidate>
    <input type="hidden" name="id" value="${escapeHtml(tour?.id ?? "")}">

    <div class="form-grid">
      <div class="field">
        <label for="tf-name">Tên tour <span class="req">*</span></label>
        <input id="tf-name" name="name" type="text" value="${escapeHtml(tour?.name || "")}" placeholder="Tour Hà Giang 3N2Đ" required>
      </div>
      <div class="field">
        <label for="tf-location">Điểm đến <span class="req">*</span></label>
        <input id="tf-location" name="location" type="text" value="${escapeHtml(tour?.location || "")}" placeholder="Hà Giang" required>
      </div>
      <div class="field">
        <label for="tf-time">Thời lượng</label>
        <input id="tf-time" name="time" type="text" value="${escapeHtml(tour?.time || "")}" placeholder="3 ngày 2 đêm">
      </div>
      <div class="field">
        <label for="tf-days">Số ngày</label>
        <input id="tf-days" name="days" type="number" min="1" value="${tour?.days || 1}">
      </div>
      <div class="field">
        <label for="tf-price">Giá (VNĐ) <span class="req">*</span></label>
        <input id="tf-price" name="price" type="number" min="0" step="1000" value="${tour?.price || ""}" placeholder="2500000" required>
      </div>
      <div class="field">
        <label for="tf-oldPrice">Giá cũ (VNĐ)</label>
        <input id="tf-oldPrice" name="oldPrice" type="number" min="0" step="1000" value="${tour?.oldPrice || ""}" placeholder="2900000">
      </div>
      <div class="field">
        <label for="tf-seats">Số chỗ còn</label>
        <input id="tf-seats" name="seatsLeft" type="number" min="0" value="${tour?.seatsLeft ?? 10}">
      </div>
      <div class="field">
        <label for="tf-status">Trạng thái</label>
        <select id="tf-status" name="status">
          ${Object.entries(TOUR_STATUS)
            .map(([value, label]) => `<option value="${value}"${tour?.status === value ? " selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="field">
        <label for="tf-rating">Điểm đánh giá</label>
        <input id="tf-rating" name="rating" type="number" min="1" max="5" step="0.1" value="${tour?.rating ?? 5}">
      </div>
      <div class="field">
        <label for="tf-reviews">Số lượt đánh giá</label>
        <input id="tf-reviews" name="reviews" type="number" min="0" value="${tour?.reviews ?? 0}">
      </div>
    </div>

    <div class="field">
      <label for="tf-image">Ảnh chính (URL)</label>
      <input id="tf-image" name="image" type="text" value="${escapeHtml(tour?.image || "")}" placeholder="https://images.unsplash.com/...">
    </div>
    <div class="field">
      <label for="tf-gallery">Thư viện ảnh (mỗi dòng một URL)</label>
      <textarea id="tf-gallery" name="gallery" rows="2" placeholder="https://...&#10;https://...">${escapeHtml(listToText(tour?.gallery))}</textarea>
    </div>
    <div class="field">
      <label for="tf-description">Mô tả ngắn</label>
      <textarea id="tf-description" name="description" rows="3" placeholder="Giới thiệu ngắn về tour...">${escapeHtml(tour?.description || "")}</textarea>
    </div>
    <div class="field">
      <label for="tf-highlights">Điểm nhấn (mỗi dòng một điểm)</label>
      <textarea id="tf-highlights" name="highlights" rows="3">${escapeHtml(listToText(tour?.highlights))}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="tf-includes">Bao gồm (mỗi dòng một mục)</label>
        <textarea id="tf-includes" name="includes" rows="4">${escapeHtml(listToText(tour?.includes))}</textarea>
      </div>
      <div class="field">
        <label for="tf-excludes">Không bao gồm (mỗi dòng một mục)</label>
        <textarea id="tf-excludes" name="excludes" rows="4">${escapeHtml(listToText(tour?.excludes))}</textarea>
      </div>
    </div>
    <div class="field">
      <label for="tf-departures">Ngày khởi hành (định dạng 2026-10-10, cách nhau bằng dấu phẩy)</label>
      <input id="tf-departures" name="departures" type="text" value="${escapeHtml((tour?.departures || []).join(", "))}" placeholder="2026-10-10, 2026-10-17">
    </div>

    <div class="itinerary-block">
      <div class="itinerary-head">
        <h4>Lịch trình chi tiết</h4>
        <button class="btn btn-sm btn-ghost-soft" type="button" id="itinerary-add">+ Thêm ngày</button>
      </div>
      <div id="itinerary-list">${itineraryHtml(tour?.itinerary)}</div>
    </div>

    <p class="error" id="tour-error"></p>
  </form>`;
}

let itineraryState = [];
let viewingTourId = null;

function collectItinerary(root) {
  return [...root.querySelectorAll(".itinerary-day")].map((box, index) => ({
    day: index + 1,
    title: box.querySelector("[data-day-title]").value.trim(),
    items: box
      .querySelector("[data-day-items]")
      .value.split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  }));
}

function openTourForm(tour = null) {
  if (!canManage()) return;
  itineraryState = normalizeTour(tour || {}).itinerary.map((day) => ({ ...day, items: [...day.items] }));

  openModal({
    title: tour ? "Cập nhật tour" : "Thêm tour mới",
    subtitle: tour ? tour.name : "Điền đầy đủ thông tin để tour hiển thị trên website",
    size: "xl",
    body: formHtml(tour),
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Huỷ</button>
      <button class="btn btn-primary" type="submit" form="tour-form">${tour ? "Lưu thay đổi" : "Thêm tour"}</button>`,
  });

  const form = document.getElementById("tour-form");
  const list = document.getElementById("itinerary-list");

  const repaint = () => {
    list.innerHTML = itineraryHtml(itineraryState);
  };

  document.getElementById("itinerary-add")?.addEventListener("click", () => {
    itineraryState = collectItinerary(list);
    itineraryState.push({ day: itineraryState.length + 1, title: "", items: [] });
    repaint();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-day-remove]");
    if (!button) return;
    itineraryState = collectItinerary(list);
    itineraryState.splice(Number(button.dataset.dayRemove), 1);
    repaint();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const location = String(data.get("location") || "").trim();
    const price = Number(data.get("price"));
    const id = String(data.get("id") || "").trim();
    const error = document.getElementById("tour-error");

    if (name.length < 2) return void (error.textContent = "Vui lòng nhập tên tour.");
    if (!location) return void (error.textContent = "Vui lòng nhập điểm đến.");
    if (!price || price <= 0) return void (error.textContent = "Vui lòng nhập giá tour lớn hơn 0.");

    const current = id ? getTourById(id) : null;
    const image = String(data.get("image") || "").trim();
    const gallery = String(data.get("gallery") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

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
      rating: Math.min(Math.max(Number(data.get("rating")) || 5, 1), 5),
      reviews: Math.max(Number(data.get("reviews")) || 0, 0),
      description: String(data.get("description") || "").trim(),
      highlights: String(data.get("highlights") || "").split("\n").map((l) => l.trim()).filter(Boolean),
      includes: String(data.get("includes") || "").split("\n").map((l) => l.trim()).filter(Boolean),
      excludes: String(data.get("excludes") || "").split("\n").map((l) => l.trim()).filter(Boolean),
      departures: String(data.get("departures") || "")
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      gallery: gallery.length ? gallery : image ? [image] : [],
      image: image || current?.image,
      itinerary: collectItinerary(list),
    });

    logActivity(current ? "Cập nhật tour" : "Tạo tour", `${current ? "Cập nhật" : "Thêm"} tour ${name}`);
    toast(`Đã lưu tour "${name}".`);
    closeModal();
    refreshAdmin();
  });
}

function openTourView(tour) {
  const orders = listBookings().filter((item) => String(item.tourId) === String(tour.id));
  viewingTourId = tour.id;
  const revenue = orders
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  openModal({
    title: tour.name,
    subtitle: `${tour.location || "Chưa có điểm đến"} · ${tour.time}`,
    size: "lg",
    body: `
      <img class="modal-cover" src="${escapeHtml(tour.image)}" alt="" loading="lazy">
      <div class="detail-grid">
        <section>
          <h4>Thông tin tour</h4>
          <ul class="summary-list">
            <li><span>Giá</span><strong>${formatPrice(tour.price)}</strong></li>
            <li><span>Giá cũ</span><strong>${tour.oldPrice ? formatPrice(tour.oldPrice) : "-"}</strong></li>
            <li><span>Chỗ còn</span><strong>${tour.seatsLeft}</strong></li>
            <li><span>Đánh giá</span><strong>${stars(tour.rating)} ${tour.rating} (${tour.reviews})</strong></li>
            <li><span>Trạng thái</span><strong>${statusBadge(tour.status, TOUR_STATUS)}</strong></li>
          </ul>
        </section>
        <section>
          <h4>Hiệu quả bán hàng</h4>
          <ul class="summary-list">
            <li><span>Số đơn</span><strong>${orders.length}</strong></li>
            <li><span>Doanh thu</span><strong>${formatMoney(revenue)}</strong></li>
            <li><span>Lượt khách</span><strong>${orders.reduce((sum, item) => sum + (Number(item.people) || 0), 0)}</strong></li>
            <li><span>Lịch khởi hành</span><strong>${tour.departures.length}</strong></li>
          </ul>
        </section>
      </div>

      <h4>Ngày khởi hành</h4>
      <p class="chip-row">${tour.departures.map((date) => `<span class="soft-chip">${escapeHtml(date)}</span>`).join("") || "Chưa có lịch"}</p>

      ${
        tour.itinerary.length
          ? `<h4>Lịch trình</h4>
             <ul class="history-list">${tour.itinerary
               .map(
                 (day) =>
                   `<li><strong>Ngày ${day.day}: ${escapeHtml(day.title || "-")}</strong><ul class="it-list">${day.items
                     .map((item) => `<li>${escapeHtml(item)}</li>`)
                     .join("")}</ul></li>`
               )
               .join("")}</ul>`
          : ""
      }

      ${
        tour.includes.length
          ? `<div class="detail-grid"><section><h4>Bao gồm</h4><ul class="it-list tick">${tour.includes
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul></section><section><h4>Không bao gồm</h4><ul class="it-list cross">${tour.excludes
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul></section></div>`
          : ""
      }`,
    footer: `
      <a class="btn btn-light" href="#/tour/${tour.id}" target="_blank" rel="noopener">Xem trên website</a>
      ${
        canManage()
          ? `<button class="btn btn-outline" type="button" data-modal-close>Đóng</button>
             <button class="btn btn-primary" type="button" data-view-edit>Sửa tour</button>`
          : `<button class="btn btn-light" type="button" data-modal-close>Đóng</button>`
      }`,
  });
}

export function Tours() {
  const denied = adminGuard("tours.view");
  if (denied) return denied;

  const tours = listTours();
  const destinations = getDestinations();
  const open = tours.filter((tour) => tour.status === "open").length;
  const limited = tours.filter((tour) => tour.status === "limited").length;
  const seats = tours.reduce((sum, tour) => sum + (Number(tour.seatsLeft) || 0), 0);

  return `
  <section class="kpi-grid kpi-grid-5">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng tour</p><strong class="kpi-value">${tours.length}</strong><span class="kpi-hint">${destinations.length} điểm đến</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đang nhận khách</p><strong class="kpi-value">${open}</strong><span class="kpi-hint">Hiển thị trên website</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Sắp hết chỗ</p><strong class="kpi-value">${limited}</strong><span class="kpi-hint">${tours.filter((t) => t.seatsLeft <= 4).length} tour dưới 5 chỗ</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Tổng suất còn</p><strong class="kpi-value">${seats}</strong><span class="kpi-hint">Toàn bộ tuyến</span></article>
    <article class="kpi kpi-red"><p class="kpi-label">Tạm ngưng</p><strong class="kpi-value">${tours.filter((t) => t.status === "closed").length}</strong><span class="kpi-hint">Không nhận đặt tour</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="tr-q">Tìm tour</label>
        <input id="tr-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên tour, điểm đến, mô tả..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="tr-location">Điểm đến</label>
        <select id="tr-location">
          <option value="">Tất cả điểm đến</option>
          ${destinations.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="tr-status">Trạng thái</label>
        <select id="tr-status">
          <option value="">Tất cả</option>
          ${Object.entries(TOUR_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="tr-sort">Sắp xếp</label>
        <select id="tr-sort">
          <option value="name">Tên A→Z</option>
          <option value="price-desc">Giá cao → thấp</option>
          <option value="price-asc">Giá thấp → cao</option>
          <option value="seats">Chỗ còn ít nhất</option>
          <option value="rating">Đánh giá cao</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="tr-view">Hiển thị</label>
        <select id="tr-view">
          <option value="table">Dạng bảng</option>
          <option value="card">Dạng thẻ</option>
        </select>
      </div>
    </div>

    <div class="toolbar-actions toolbar-actions-between">
      ${
        canManage()
          ? `<div class="bulk-actions" id="tr-bulk" hidden>
              <span>Đã chọn <strong data-selected>0</strong> tour</span>
              <button class="btn btn-sm btn-primary" type="button" data-bulk="open">Cho nhận khách</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="limited">Đánh dấu sắp hết</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="closed">Tạm ngưng</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-bulk="delete">Xoá</button>
            </div>`
          : `<span></span>`
      }
      <div class="toolbar-actions">
        ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" id="tr-add">+ Thêm tour</button>` : ""}
        <button class="btn btn-sm btn-ghost-soft" type="button" id="tr-export">Xuất CSV</button>
        ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" id="tr-reset">Khôi phục dữ liệu gốc</button>` : ""}
      </div>
    </div>

    <p class="result-count" id="tr-count" role="status"></p>

    <div class="table-wrap" id="tr-table">
      <table class="data-table">
        <thead>
          <tr>
            ${canManage() ? `<th class="cell-check"><input type="checkbox" id="tr-check-all" aria-label="Chọn tất cả"></th>` : ""}
            <th>Tour</th>
            <th>Điểm đến</th>
            <th>Thời lượng</th>
            <th>Giá</th>
            <th>Chỗ còn</th>
            <th>Đánh giá</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="tr-rows"></tbody>
      </table>
    </div>
    <div class="tour-cards" id="tr-cards" hidden></div>
    <div id="tr-page"></div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "tours") return;
  const rowsBox = document.getElementById("tr-rows");
  if (!rowsBox) return;

  const isTable = () => FILTERS.view !== "card";

  const controller = createListController({
    mount: "#tr-rows",
    count: "#tr-count",
    pageEl: "#tr-page",
    pageSize: 10,
    load: () => filterTours(listTours()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="${canManage() ? 9 : 8}" class="table-empty">Không có tour nào khớp bộ lọc.</td></tr>`,
  });

  const cardsBox = document.getElementById("tr-cards");

  function paintCards() {
    const list = filterTours(listTours());
    cardsBox.innerHTML = list.length
      ? list.map(card).join("")
      : emptyState("Không có tour nào khớp bộ lọc.");
  }

  function paint() {
    document.getElementById("tr-table").hidden = !isTable();
    cardsBox.hidden = isTable();
    if (isTable()) {
      controller.refresh();
    } else {
      paintCards();
      document.getElementById("tr-count").textContent = `Tìm thấy ${filterTours(listTours()).length} tour`;
    }
  }

  paint();
  controller.bind();

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("tr-location", FILTERS.location);
  set("tr-status", FILTERS.status);
  set("tr-sort", FILTERS.sort);
  set("tr-view", FILTERS.view);

  const selection = setupSelection({
    headCheckbox: "#tr-check-all",
    bodyBox: rowsBox,
    onChange: (ids) => {
      const bulk = document.getElementById("tr-bulk");
      const count = bulk?.querySelector("[data-selected]");
      if (bulk) bulk.hidden = ids.length === 0;
      if (count) count.textContent = ids.length;
    },
  });

  const bind = (id, event, handler) =>
    document.getElementById(id)?.addEventListener(event, handler);

  bind("tr-q", "input", (event) => {
    FILTERS.q = event.target.value;
    paint();
  });
  bind("tr-location", "change", (event) => {
    FILTERS.location = event.target.value;
    paint();
  });
  bind("tr-status", "change", (event) => {
    FILTERS.status = event.target.value;
    paint();
  });
  bind("tr-sort", "change", (event) => {
    FILTERS.sort = event.target.value;
    paint();
  });
  bind("tr-view", "change", (event) => {
    FILTERS.view = event.target.value;
    paint();
  });

  bind("tr-add", "click", () => openTourForm(null));

  bind("tr-export", "click", () => {
    downloadCsv(
      `danh-muc-tour-${stamp()}`,
      ["Mã tour", "Tên tour", "Điểm đến", "Thời lượng", "Số ngày", "Giá", "Giá cũ", "Chỗ còn", "Đánh giá", "Số đánh giá", "Trạng thái", "Ngày khởi hành"],
      filterTours(listTours()).map((tour) => [
        tour.id,
        tour.name,
        tour.location,
        tour.time,
        tour.days,
        tour.price,
        tour.oldPrice,
        tour.seatsLeft,
        tour.rating,
        tour.reviews,
        TOUR_STATUS[tour.status],
        tour.departures.join(" | "),
      ])
    );
  });

  bind("tr-reset", "click", () => {
    if (!confirmAction("Khôi phục toàn bộ danh sách tour về dữ liệu gốc? Các thay đổi sẽ mất.")) return;
    resetTours();
    logActivity("Khôi phục dữ liệu", "Khôi phục danh sách tour về dữ liệu gốc");
    toast("Đã khôi phục danh sách tour gốc.");
    refreshAdmin();
  });

  const onAction = (event) => {
    const button = event.target.closest("[data-tour-action]");
    if (!button) return;
    const box = button.closest("[data-tour]");
    if (!box) return;
    const tour = getTourById(box.dataset.tour);
    if (!tour) return;
    const action = button.dataset.tourAction;

    if (action === "view") return openTourView(tour);
    if (action === "edit") return openTourForm(tour);

    if (action === "duplicate") {
      const { id, ...rest } = tour;
      saveTour({ ...rest, name: `${tour.name} (bản sao)`, status: "closed", reviews: 0 });
      logActivity("Nhân bản tour", `Tạo bản sao của tour ${tour.name}`);
      toast(`Đã nhân bản tour "${tour.name}".`);
      return refreshAdmin();
    }

    if (action === "delete") {
      if (!confirmAction(`Xoá tour "${tour.name}"? Đơn đặt tour cũ vẫn được giữ lại.`)) return;
      removeTour(tour.id);
      logActivity("Xoá tour", `Xoá tour ${tour.name}`);
      toast(`Đã xoá tour "${tour.name}".`);
      return refreshAdmin();
    }
    return undefined;
  };

  rowsBox.addEventListener("click", onAction);
  cardsBox.addEventListener("click", onAction);

  document.getElementById("tr-bulk")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bulk]");
    if (!button) return;
    const ids = selection.selected();
    if (!ids.length) return;
    const action = button.dataset.bulk;

    if (action === "delete") {
      if (!confirmAction(`Xoá ${ids.length} tour đã chọn?`)) return;
      ids.forEach((id) => removeTour(id));
      logActivity("Xoá tour", `Xoá ${ids.length} tour: ${ids.join(", ")}`);
      toast(`Đã xoá ${ids.length} tour.`);
    } else {
      ids.forEach((id) => saveTour({ ...getTourById(id), status: action }));
      logActivity("Cập nhật tour", `Đặt ${ids.length} tour sang trạng thái ${TOUR_STATUS[action]}`);
      toast(`Đã cập nhật ${ids.length} tour.`);
    }
    refreshAdmin();
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-view-edit]")) return;
  const tour = getTourById(viewingTourId);
  closeModal();
  if (tour) openTourForm(tour);
});
