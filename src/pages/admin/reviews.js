import {
  REVIEW_STATUS,
  clearReviews,
  listReviews,
  logActivity,
  removeReview,
  saveReview,
  updateReview,
} from "../../store.js";
import { formatRelative } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  closeModal,
  confirmAction,
  createListController,
  downloadCsv,
  openModal,
  setupSelection,
  stamp,
  stars,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { getSession, hasPermission } from "../../auth.js";
import { listTours } from "../../tour-repository.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("reviews.manage");

const FILTERS = { q: "", status: "", tour: "", rating: "" };

function tourName(id) {
  return listTours().find((tour) => String(tour.id) === String(id))?.name || "Tour đã xoá";
}

function filterReviews(list) {
  const query = searchKey(FILTERS.q);
  return list.filter((item) => {
    if (FILTERS.status && item.status !== FILTERS.status) return false;
    if (FILTERS.tour && String(item.tourId) !== FILTERS.tour) return false;
    if (FILTERS.rating && String(item.rating) !== FILTERS.rating) return false;
    if (query && !searchKey(`${item.author} ${item.content} ${tourName(item.tourId)}`).includes(query))
      return false;
    return true;
  });
}

function row(review) {
  return `
  <tr data-id="${escapeHtml(review.id)}" data-search="${escapeHtml(
    searchKey(`${review.author} ${review.content} ${tourName(review.tourId)}`)
  )}">
    <td class="cell-check">
      ${canManage() ? `<input type="checkbox" data-select value="${escapeHtml(review.id)}" aria-label="Chọn đánh giá">` : ""}
    </td>
    <td>${stars(review.rating)}<br><small>${review.rating}/5</small></td>
    <td>
      <span class="cell-user">
        <span class="avatar-sm">${escapeHtml((review.author || "?").slice(0, 2).toUpperCase())}</span>
        <span>
          <strong>${escapeHtml(review.author)}</strong>
          <small>${formatRelative(review.createdAt)}</small>
        </span>
      </span>
    </td>
    <td>${escapeHtml(tourName(review.tourId))}</td>
    <td class="cell-review">${escapeHtml(review.content)}</td>
    <td>${statusBadge(review.status, REVIEW_STATUS)}</td>
    <td class="row-actions">
      ${
        canManage() && review.status !== "approved"
          ? `<button class="btn btn-sm btn-primary" type="button" data-review-action="approved">Duyệt</button>`
          : ""
      }
      ${
        canManage() && review.status !== "rejected"
          ? `<button class="btn btn-sm btn-outline" type="button" data-review-action="rejected">Từ chối</button>`
          : ""
      }
      ${canManage() ? `<button class="btn btn-sm btn-outline" type="button" data-review-action="edit">Sửa</button>` : ""}
      ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" data-review-action="delete">Xoá</button>` : ""}
    </td>
  </tr>`;
}

function reviewStats(list) {
  const approved = list.filter((item) => item.status === "approved");
  const byTour = new Map();
  approved.forEach((item) => {
    const current = byTour.get(item.tourId) || { sum: 0, count: 0 };
    current.sum += Number(item.rating) || 0;
    current.count += 1;
    byTour.set(item.tourId, current);
  });
  return {
    approved: approved.length,
    pending: list.filter((item) => item.status === "pending").length,
    rejected: list.filter((item) => item.status === "rejected").length,
    average: approved.length
      ? Math.round((approved.reduce((sum, item) => sum + item.rating, 0) / approved.length) * 10) / 10
      : 0,
    byTour: [...byTour.entries()]
      .map(([id, value]) => ({
        id,
        name: tourName(id),
        average: Math.round((value.sum / value.count) * 10) / 10,
        count: value.count,
      }))
      .sort((a, b) => b.average - a.average),
  };
}

export function Reviews() {
  const denied = adminGuard("reviews.view");
  if (denied) return denied;

  const reviews = listReviews();
  const stats = reviewStats(reviews);
  const tours = listTours();

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-violet"><p class="kpi-label">Điểm trung bình</p><strong class="kpi-value">${stats.average || "-"}★</strong><span class="kpi-hint">Tính trên ${stats.approved} đánh giá đã duyệt</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Chờ duyệt</p><strong class="kpi-value">${stats.pending}</strong><span class="kpi-hint">Chưa hiển thị trên website</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đã duyệt</p><strong class="kpi-value">${stats.approved}</strong><span class="kpi-hint">Đang công khai</span></article>
    <article class="kpi kpi-red"><p class="kpi-label">Đã từ chối</p><strong class="kpi-value">${stats.rejected}</strong><span class="kpi-hint">Bị ẩn khỏi website</span></article>
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div><h2>Điểm đánh giá theo tour</h2><p>Chỉ tính đánh giá đã duyệt</p></div>
      </header>
      <ul class="rank-list">
        ${
          stats.byTour.length
            ? stats.byTour
                .map(
                  (item) => `
          <li>
            <span class="rank-info">
              <strong>${escapeHtml(item.name)}</strong>
              <small>${item.count} đánh giá</small>
            </span>
            <span class="rank-value">${stars(item.average)} ${item.average}</span>
          </li>`
                )
                .join("")
            : `<li class="rank-empty">Chưa có đánh giá nào được duyệt.</li>`
        }
      </ul>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Hướng dẫn duyệt</h2><p>Quy trình nội bộ</p></div>
      </header>
      <ol class="steps">
        <li><strong>Kiểm tra nội dung</strong><span>Đánh giá có thật, không chứa thông tin cá nhân hoặc ngôn từ không phù hợp.</span></li>
        <li><strong>Duyệt hoặc từ chối</strong><span>Đánh giá được duyệt sẽ hiển thị trên trang chi tiết tour.</span></li>
        <li><strong>Cập nhật điểm tour</strong><span>Điểm trung bình của tour được tính lại tự động.</span></li>
        <li><strong>Phản hồi khách</strong><span>Nên gọi lại khách khi gặp đánh giá 1-2 sao.</span></li>
      </ol>
    </article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="rv-q">Tìm đánh giá</label>
        <input id="rv-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên khách, nội dung, tour..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="rv-status">Trạng thái</label>
        <select id="rv-status">
          <option value="">Tất cả</option>
          ${Object.entries(REVIEW_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="rv-tour">Tour</label>
        <select id="rv-tour">
          <option value="">Tất cả tour</option>
          ${tours.map((tour) => `<option value="${tour.id}">${escapeHtml(tour.name)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="rv-rating">Số sao</label>
        <select id="rv-rating">
          <option value="">Tất cả</option>
          ${[5, 4, 3, 2, 1].map((value) => `<option value="${value}">${value} sao</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="toolbar-actions toolbar-actions-between">
      ${
        canManage()
          ? `<div class="bulk-actions" id="rv-bulk" hidden>
              <span>Đã chọn <strong data-selected>0</strong> đánh giá</span>
              <button class="btn btn-sm btn-primary" type="button" data-bulk="approved">Duyệt</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="rejected">Từ chối</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-bulk="delete">Xoá</button>
            </div>`
          : `<span></span>`
      }
      <div class="toolbar-actions">
        ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" id="rv-add">+ Thêm đánh giá</button>` : ""}
        <button class="btn btn-sm btn-ghost-soft" type="button" id="rv-export">Xuất CSV</button>
        ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" id="rv-clear">Xoá tất cả</button>` : ""}
      </div>
    </div>

    <p class="result-count" id="rv-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${canManage() ? `<th class="cell-check"><input type="checkbox" id="rv-check-all" aria-label="Chọn tất cả"></th>` : ""}
            <th>Điểm</th>
            <th>Khách hàng</th>
            <th>Tour</th>
            <th>Nội dung</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="rv-rows"></tbody>
      </table>
    </div>
    <div id="rv-page"></div>
  </section>`;
}

function openReviewForm(review = null) {
  if (!canManage()) return;
  const tours = listTours();
  const session = getSession();

  openModal({
    title: review ? "Cập nhật đánh giá" : "Thêm đánh giá",
    subtitle: review ? review.author : "Dùng khi cần bổ sung đánh giá từ khách ngoài hệ thống",
    body: `
    <form id="review-form" novalidate>
      <input type="hidden" name="id" value="${escapeHtml(review?.id || "")}">
      <div class="form-grid">
        <div class="field">
          <label for="rf-author">Tên khách <span class="req">*</span></label>
          <input id="rf-author" name="author" type="text" value="${escapeHtml(review?.author || session?.name || "")}" required>
        </div>
        <div class="field">
          <label for="rf-tour">Tour <span class="req">*</span></label>
          <select id="rf-tour" name="tourId" required>
            ${tours.map((tour) => `<option value="${tour.id}"${String(review?.tourId) === String(tour.id) ? " selected" : ""}>${escapeHtml(tour.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="rf-rating">Số sao <span class="req">*</span></label>
          <select id="rf-rating" name="rating">
            ${[5, 4, 3, 2, 1]
              .map((value) => `<option value="${value}"${review?.rating === value ? " selected" : ""}>${value} sao</option>`)
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="rf-status">Trạng thái</label>
          <select id="rf-status" name="status">
            ${Object.entries(REVIEW_STATUS)
              .map(([value, label]) => `<option value="${value}"${review?.status === value ? " selected" : ""}>${label}</option>`)
              .join("")}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="rf-content">Nội dung đánh giá <span class="req">*</span></label>
        <textarea id="rf-content" name="content" rows="4" required>${escapeHtml(review?.content || "")}</textarea>
      </div>
      <p class="error" id="review-error"></p>
    </form>`,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Huỷ</button>
      <button class="btn btn-primary" type="submit" form="review-form">Lưu đánh giá</button>`,
  });

  document.getElementById("review-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const author = String(data.get("author") || "").trim();
    const content = String(data.get("content") || "").trim();
    const error = document.getElementById("review-error");
    if (author.length < 2) return void (error.textContent = "Vui lòng nhập tên khách.");
    if (content.length < 5) return void (error.textContent = "Nội dung đánh giá quá ngắn.");

    saveReview({
      ...(review || {}),
      id: review?.id,
      author,
      tourId: Number(data.get("tourId")),
      rating: Number(data.get("rating")),
      status: String(data.get("status")),
      content,
      createdAt: review?.createdAt,
    });

    logActivity(review ? "Cập nhật đánh giá" : "Thêm đánh giá", `${review ? "Cập nhật" : "Thêm"} đánh giá của ${author}`);
    toast("Đã lưu đánh giá.");
    closeModal();
    refreshAdmin();
  });
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "reviews") return;
  const rowsBox = document.getElementById("rv-rows");
  if (!rowsBox) return;

  const controller = createListController({
    mount: "#rv-rows",
    count: "#rv-count",
    pageEl: "#rv-page",
    pageSize: 10,
    load: () => filterReviews(listReviews()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="${canManage() ? 7 : 6}" class="table-empty">Không có đánh giá nào khớp bộ lọc.</td></tr>`,
  });
  controller.refresh();
  controller.bind();

  const selection = setupSelection({
    headCheckbox: "#rv-check-all",
    bodyBox: rowsBox,
    onChange: (ids) => {
      const bulk = document.getElementById("rv-bulk");
      const count = bulk?.querySelector("[data-selected]");
      if (bulk) bulk.hidden = ids.length === 0;
      if (count) count.textContent = ids.length;
    },
  });

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("rv-status", FILTERS.status);
  set("rv-tour", FILTERS.tour);
  set("rv-rating", FILTERS.rating);

  const bind = (id, event, handler) =>
    document.getElementById(id)?.addEventListener(event, handler);

  bind("rv-q", "input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
  });
  bind("rv-status", "change", (event) => {
    FILTERS.status = event.target.value;
    controller.reset();
  });
  bind("rv-tour", "change", (event) => {
    FILTERS.tour = event.target.value;
    controller.reset();
  });
  bind("rv-rating", "change", (event) => {
    FILTERS.rating = event.target.value;
    controller.reset();
  });

  bind("rv-add", "click", () => openReviewForm(null));

  bind("rv-export", "click", () => {
    downloadCsv(
      `danh-gia-${stamp()}`,
      ["Mã", "Khách hàng", "Tour", "Số sao", "Nội dung", "Trạng thái", "Thời gian"],
      filterReviews(listReviews()).map((item) => [
        item.id,
        item.author,
        tourName(item.tourId),
        item.rating,
        item.content,
        REVIEW_STATUS[item.status],
        item.createdAt,
      ])
    );
  });

  bind("rv-clear", "click", () => {
    if (!confirmAction("Xoá toàn bộ đánh giá?")) return;
    clearReviews();
    logActivity("Xoá đánh giá", "Xoá toàn bộ đánh giá tour");
    toast("Đã xoá tất cả đánh giá.");
    refreshAdmin();
  });

  rowsBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-action]");
    if (!button) return;
    const id = button.closest("tr").dataset.id;
    const action = button.dataset.reviewAction;

    if (action === "edit") {
      const review = listReviews().find((item) => item.id === id);
      if (review) openReviewForm(review);
      return undefined;
    }

    if (action === "delete") {
      if (!confirmAction("Xoá đánh giá này?")) return;
      removeReview(id);
      logActivity("Xoá đánh giá", `Xoá đánh giá ${id}`);
      toast("Đã xoá đánh giá.");
      return refreshAdmin();
    }

    if (action === "approved" || action === "rejected") {
      updateReview(id, { status: action });
      logActivity(
        action === "approved" ? "Duyệt đánh giá" : "Từ chối đánh giá",
        `${action === "approved" ? "Duyệt" : "Từ chối"} đánh giá ${id}`
      );
      toast(action === "approved" ? "Đã duyệt đánh giá." : "Đã từ chối đánh giá.");
      return controller.refresh();
    }
    return undefined;
  });

  document.getElementById("rv-bulk")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bulk]");
    if (!button) return;
    const ids = selection.selected();
    if (!ids.length) return;
    const action = button.dataset.bulk;

    if (action === "delete") {
      if (!confirmAction(`Xoá ${ids.length} đánh giá đã chọn?`)) return;
      ids.forEach(removeReview);
    } else {
      ids.forEach((id) => updateReview(id, { status: action }));
    }
    logActivity("Cập nhật đánh giá", `${action === "delete" ? "Xoá" : "Cập nhật"} ${ids.length} đánh giá`);
    toast(`Đã xử lý ${ids.length} đánh giá.`);
    refreshAdmin();
  });
});
