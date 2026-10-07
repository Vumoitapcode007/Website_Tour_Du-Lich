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
  TOUR_PROGRESS_STAGES,
  TOUR_STATUS,
  checkTourDelete,
  getTourById,
  getDestinations,
  isSellableTour,
  listTours,
  normalizeTour,
  removeTour,
  resetTours,
  saveTour,
  setTourStatus,
  tourOrderCount,
} from "../../tour-repository.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("tours.manage");

const SAMPLE_IMAGES = [
  { label: "Hà Giang", url: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80" },
  { label: "Hạ Long", url: "https://live.staticflickr.com/3836/33523114580_bb89d2cc22_b.jpg" },
  { label: "Sa Pa", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { label: "Hội An", url: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80" },
  { label: "Phú Quốc", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" },
  { label: "Ninh Bình", url: "https://images.unsplash.com/photo-1666160416071-f760a7af9ea6?auto=format&fit=crop&w=800&q=80" },
  { label: "Đà Lạt", url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80" },
];

const FILTERS = { q: "", location: "", status: "", sort: "name", view: "table" };

function filterTours(list) {
  const query = searchKey(FILTERS.q);
  const result = list.filter((tour) => {
    if (FILTERS.location && tour.location !== FILTERS.location) return false;
    if (FILTERS.status && tour.status !== FILTERS.status) return false;
    if (query && !searchKey(`${tour.name} ${tour.location} ${tour.time} ${tour.description} ${tour.progress?.currentLocation || ""}`).includes(query))
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

function progressCell(tour) {
  const p = tour.progress || {};
  const stage = TOUR_PROGRESS_STAGES[p.stage] || TOUR_PROGRESS_STAGES.not_started;
  const dayStr = tour.days > 1 && p.currentDay ? `Ngày ${p.currentDay}/${tour.days}` : "";

  return `
  <div class="progress-cell" title="${escapeHtml(p.note || stage.desc || '')}">
    <span class="progress-chip stage-${escapeHtml(p.stage || 'not_started')}">
      ${stage.icon} ${escapeHtml(stage.label)}${dayStr ? ` · ${dayStr}` : ""}
    </span>
    ${
      p.currentLocation
        ? `<div class="progress-loc" title="${escapeHtml(p.currentLocation)}">📍 ${escapeHtml(p.currentLocation)}</div>`
        : ""
    }
  </div>`;
}

function row(tour) {
  const orders = tourOrderCount(tour.id);
  const sellable = isSellableTour(tour);
  return `
  <tr data-tour="${escapeHtml(tour.id)}" data-search="${escapeHtml(
    searchKey(`${tour.name} ${tour.location} ${tour.time}`)
  )}">
    <td class="cell-check">
      ${canManage() ? `<input type="checkbox" data-select value="${escapeHtml(tour.id)}" aria-label="Chọn tour ${escapeHtml(tour.name)}">` : ""}
    </td>
    <td>
      <span class="cell-user">
        <img class="cell-thumb" src="${escapeHtml(tour.image)}" alt="" loading="lazy" width="56" height="42" style="border-radius: 6px; object-fit: cover;">
        <span>
          <strong>${escapeHtml(tour.name)}</strong>
          <small>${escapeHtml(tour.description?.slice(0, 60) || "Chưa có mô tả")}</small>
        </span>
      </span>
    </td>
    <td>${escapeHtml(tour.location || "-")}</td>
    <td>${escapeHtml(tour.time)}<br><small>${tour.departures.length} lịch khởi hành</small></td>
    <td><strong>${formatPrice(tour.price)}</strong>${tour.oldPrice ? `<br><small><del>${formatPrice(tour.oldPrice)}</del></small>` : ""}</td>
    <td><strong>${tour.seatsLeft}</strong> chỗ</td>
    <td>${progressCell(tour)}</td>
    <td>${statusBadge(tour.status, TOUR_STATUS)}</td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-tour-action="view" title="Xem chi tiết tour">Xem</button>
      <button class="btn btn-sm btn-outline" type="button" data-tour-action="progress" title="Xem & cập nhật tiến độ chuyến đi" style="border-color: #0284c7; color: #0284c7;">📍 Tiến độ</button>
      ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" data-tour-action="edit">Sửa</button>` : ""}
      ${canManage() ? `<button class="btn btn-sm btn-outline" type="button" data-tour-action="duplicate">Nhân bản</button>` : ""}
      ${
        canManage()
          ? sellable
            ? `<button class="btn btn-sm btn-outline-danger" type="button" data-tour-action="delete">Xoá</button>`
            : `<button class="btn btn-sm btn-outline" type="button" data-tour-action="reopen">Mở bán</button>`
          : ""
      }
    </td>
  </tr>`;
}

function card(tour) {
  const sellable = isSellableTour(tour);
  return `
  <article class="tour-admin-card" data-tour="${escapeHtml(tour.id)}">
    <img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.name)}" loading="lazy">
    <div class="tour-admin-body">
      <div class="tour-admin-top">
        ${statusBadge(tour.status, TOUR_STATUS)}
        <span class="tour-admin-price">${formatPrice(tour.price)}</span>
      </div>
      <h3>${escapeHtml(tour.name)}</h3>
      <p>${escapeHtml(tour.description?.slice(0, 100) || "Chưa có mô tả")}</p>

      <div class="tour-card-progress" style="margin: 8px 0 12px; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
          <strong style="color: #334155;">📍 Tiến độ đoàn:</strong>
          <span class="progress-chip stage-${escapeHtml(p.stage || 'not_started')}" style="font-size: 0.75rem;">
            ${stage.icon} ${escapeHtml(stage.label)} ${dayStr}
          </span>
        </div>
        ${
          p.currentLocation
            ? `<div style="margin-top: 4px; color: #0369a1; font-weight: 500; font-size: 0.8rem;">Vị trí: ${escapeHtml(p.currentLocation)}</div>`
            : ""
        }
      </div>

      <ul class="tour-admin-meta">
        <li>Điểm đến: <strong>${escapeHtml(tour.location || "-")}</strong></li>
        <li>Thời lượng: <strong>${escapeHtml(tour.time)}</strong></li>
        <li>Chỗ còn: <strong>${tour.seatsLeft}</strong></li>
        <li>Đánh giá: <strong>${tour.rating}★ (${tour.reviews})</strong></li>
      </ul>
      <div class="tour-admin-actions">
        <button class="btn btn-sm btn-ghost-soft" type="button" data-tour-action="view">Xem</button>
        <button class="btn btn-sm btn-outline" type="button" data-tour-action="progress" style="border-color: #0284c7; color: #0284c7;">📍 Tiến độ</button>
        ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" data-tour-action="edit">Sửa</button>` : ""}
        ${
          canManage()
            ? sellable
              ? `<button class="btn btn-sm btn-outline-danger" type="button" data-tour-action="delete">Xoá</button>`
              : `<button class="btn btn-sm btn-outline" type="button" data-tour-action="reopen">Mở bán</button>`
            : ""
        }
      </div>
    </div>
  </article>`;
}

/* ---------- Modal theo dõi & cập nhật tiến độ tour ---------- */

function openProgressModal(tour) {
  const p = tour.progress || {};
  const currentStage = p.stage || "not_started";
  const stages = Object.values(TOUR_PROGRESS_STAGES);

  const stageKeys = Object.keys(TOUR_PROGRESS_STAGES);
  const currentIdx = stageKeys.indexOf(currentStage);

  const stepperHtml = stages
    .map((s, idx) => {
      const isPast = idx < currentIdx;
      const isCurrent = idx === currentIdx;
      const stepState = isCurrent ? "active" : isPast ? "completed" : "upcoming";
      return `
      <div class="stepper-step ${stepState}" data-stepper-key="${s.key}" style="cursor: pointer;" title="Chọn chặng: ${escapeHtml(s.label)}">
        <div class="stepper-dot">${isPast ? "✓" : s.icon}</div>
        <div class="stepper-label">${escapeHtml(s.label)}</div>
      </div>`;
    })
    .join('<div class="stepper-line"></div>');

  const daysOptions = Array.from({ length: tour.days || 1 }, (_, i) => i + 1)
    .map((d) => {
      const itItem = (tour.itinerary || []).find((it) => it.day === d || it.day === `Ngày ${d}`);
      const title = itItem?.title ? ` - ${itItem.title}` : "";
      return `<option value="${d}"${(p.currentDay || 1) === d ? " selected" : ""}>Ngày ${d}${escapeHtml(title)}</option>`;
    })
    .join("");

  openModal({
    title: `📍 Tiến độ chuyến đi: ${tour.name}`,
    subtitle: `${tour.location || "Điểm đến"} · Thời lượng: ${tour.time} (${tour.days} ngày)`,
    size: "lg",
    body: `
    <div class="progress-modal-container">
      <div class="tour-stepper-box" style="margin-bottom: 1.5rem; padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto;">
        <h4 style="margin: 0 0 1rem; font-size: 0.95rem; color: #334155; display: flex; align-items: center; justify-content: space-between;">
          <span>Hành trình diễn tiến chuyến đi</span>
          <span class="status-pill status-${tour.status}">${TOUR_STATUS[tour.status]}</span>
        </h4>
        <div class="tour-progress-stepper" style="display: flex; align-items: center; justify-content: space-between; min-width: 600px;">
          ${stepperHtml}
        </div>
      </div>

      <form id="progress-form" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="prog-stage">Chặng tiến độ hiện tại <span class="req">*</span></label>
            <select id="prog-stage" name="stage" required style="font-weight: 600;">
              ${stages
                .map(
                  (s) =>
                    `<option value="${s.key}"${currentStage === s.key ? " selected" : ""}>${s.icon} ${s.label} (${s.desc})</option>`
                )
                .join("")}
            </select>
          </div>

          <div class="field">
            <label for="prog-day">Đang ở ngày thứ mấy</label>
            <select id="prog-day" name="currentDay">
              ${daysOptions}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="prog-location">Địa điểm thực tế hiện tại của đoàn <span class="req">*</span></label>
          <input id="prog-location" name="currentLocation" type="text"
                 value="${escapeHtml(p.currentLocation || "")}"
                 placeholder="Ví dụ: Đèo Mã Pí Lèng, Bến tàu Tuần Châu, Khách sạn Mường Thanh..." required>
          <small class="form-hint">Nhập mốc vị trí thực tế để khách hàng hoặc điều hành biết đoàn đang ở đâu.</small>
        </div>

        <div class="field">
          <label for="prog-note">Tình hình đoàn &amp; Ghi chú thực địa</label>
          <textarea id="prog-note" name="note" rows="3"
                    placeholder="Ví dụ: Thời tiết nắng đẹp, đoàn đã chụp ảnh tại đỉnh đèo, chuẩn bị ăn trưa lúc 12:30...">${escapeHtml(p.note || "")}</textarea>
        </div>

        <div class="field" style="background: #eff6ff; padding: 10px 14px; border-radius: 8px; border: 1px solid #bfdbfe;">
          <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer; color: #1e40af; font-size: 0.9rem;">
            <input type="checkbox" id="prog-sync-status" checked style="width: auto;">
            <span>Tự động đồng bộ trạng thái tour: Nếu đang di chuyển/tham quan -> chuyển thành <strong>"Đang khởi hành"</strong>; nếu đã hoàn thành -> chuyển thành <strong>"Đã hoàn thành"</strong></span>
          </label>
        </div>

        ${
          p.updatedAt
            ? `<p style="font-size: 0.8rem; color: #64748b; margin-top: 10px;">Lần cập nhật tiến độ trước: <strong>${new Date(p.updatedAt).toLocaleString("vi-VN")}</strong></p>`
            : ""
        }
      </form>
    </div>`,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
      <button class="btn btn-primary" type="submit" form="progress-form">Lưu tiến độ tour</button>`,
  });

  // Clicking a step in stepper updates the dropdown
  document.querySelectorAll("[data-stepper-key]").forEach((stepEl) => {
    stepEl.addEventListener("click", () => {
      const select = document.getElementById("prog-stage");
      if (select) {
        select.value = stepEl.dataset.stepperKey;
        select.dispatchEvent(new Event("change"));
      }
    });
  });

  const form = document.getElementById("progress-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const stage = document.getElementById("prog-stage").value;
    const currentDay = Number(document.getElementById("prog-day").value) || 1;
    const currentLocation = document.getElementById("prog-location").value.trim();
    const note = document.getElementById("prog-note").value.trim();
    const syncStatus = document.getElementById("prog-sync-status")?.checked;

    updateTourProgress(tour.id, {
      stage,
      currentDay,
      currentLocation,
      note,
    });

    if (syncStatus) {
      const currentTour = getTourById(tour.id);
      if (currentTour) {
        if (["gathering", "moving", "visiting", "resting", "returning"].includes(stage)) {
          saveTour({ ...currentTour, status: "ongoing" });
        } else if (stage === "finished") {
          saveTour({ ...currentTour, status: "completed" });
        }
      }
    }

    const stageLabel = TOUR_PROGRESS_STAGES[stage]?.label || stage;
    logActivity("Cập nhật tiến độ", `Cập nhật tiến độ "${tour.name}": ${stageLabel} ${currentLocation ? `tại ${currentLocation}` : ""}`);
    toast(`Đã cập nhật tiến độ tour "${tour.name}".`);
    closeModal();
    refreshAdmin();
  });
}

/* ---------- Biểu mẫu tour (Thêm / Sửa) ---------- */

function listToText(value = []) {
  return value.join("\n");
}

function itineraryHtml(itinerary = []) {
  if (!itinerary.length) return `<p class="itinerary-empty">Chưa có ngày nào. Bấm "+ Thêm ngày" để bắt đầu thiết kế lịch trình.</p>`;
  return itinerary
    .map(
      (day, index) => `
    <fieldset class="itinerary-day" data-day="${index}" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #fff;">
      <legend style="font-weight: bold; color: #1e293b; padding: 0 6px;">Ngày ${index + 1}</legend>
      <div class="field-row">
        <div class="field" style="flex: 1;">
          <label>Tiêu đề ngày</label>
          <input type="text" data-day-title value="${escapeHtml(day.title || "")}" placeholder="Ví dụ: Hà Nội - Tràng An - Tam Cốc">
        </div>
        <div class="field" style="flex: 2;">
          <label>Nội dung hoạt động (mỗi dòng một gạch đầu dòng)</label>
          <textarea data-day-items rows="3" placeholder="06:30 Xuất phát&#10;11:00 Ăn trưa đặc sản&#10;14:00 Tham quan thắng cảnh">${escapeHtml(listToText(day.items))}</textarea>
        </div>
      </div>
      <button class="btn btn-xs btn-outline-danger" type="button" data-day-remove="${index}" style="margin-top: 4px;">Xoá ngày này</button>
    </fieldset>`
    )
    .join("");
}

function formHtml(tour = null) {
  const samplePills = SAMPLE_IMAGES.map(
    (item) => `
    <button class="sample-img-pill" type="button" data-fill-img="${escapeHtml(item.url)}" style="display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;">
      <img src="${escapeHtml(item.url)}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;">
      <span>${escapeHtml(item.label)}</span>
    </button>`
  ).join("");

  return `
  <form id="tour-form" novalidate>
    <input type="hidden" name="id" value="${escapeHtml(tour?.id ?? "")}">

    <div class="form-grid">
      <div class="field">
        <label for="tf-name">Tên tour <span class="req">*</span></label>
        <input id="tf-name" name="name" type="text" value="${escapeHtml(tour?.name || "")}" placeholder="Ví dụ: Tour Hà Giang 3N2Đ Mùa Lúa Chín" required>
      </div>
      <div class="field">
        <label for="tf-location">Điểm đến <span class="req">*</span></label>
        <input id="tf-location" name="location" type="text" value="${escapeHtml(tour?.location || "")}" placeholder="Ví dụ: Hà Giang, Hạ Long, Sa Pa..." required>
      </div>
      <div class="field">
        <label for="tf-time">Thời lượng hiển thị</label>
        <input id="tf-time" name="time" type="text" value="${escapeHtml(tour?.time || "")}" placeholder="Ví dụ: 3 ngày 2 đêm">
      </div>
      <div class="field">
        <label for="tf-days">Số ngày thực tế</label>
        <input id="tf-days" name="days" type="number" min="1" value="${tour?.days || 1}">
      </div>
      <div class="field">
        <label for="tf-price">Giá vé tour (VNĐ) <span class="req">*</span></label>
        <input id="tf-price" name="price" type="number" min="0" step="1000" value="${tour?.price || ""}" placeholder="Ví dụ: 2500000" required>
      </div>
      <div class="field">
        <label for="tf-oldPrice">Giá cũ / Giá gốc (VNĐ)</label>
        <input id="tf-oldPrice" name="oldPrice" type="number" min="0" step="1000" value="${tour?.oldPrice || ""}" placeholder="Ví dụ: 2990000">
      </div>
      <div class="field">
        <label for="tf-seats">Số chỗ còn</label>
        <input id="tf-seats" name="seatsLeft" type="number" min="0" value="${tour?.seatsLeft ?? 10}">
      </div>
      <div class="field">
        <label for="tf-status">Trạng thái tour <span class="req">*</span></label>
        <select id="tf-status" name="status" style="font-weight: 600;">
          ${Object.entries(TOUR_STATUS)
            .map(([value, label]) => `<option value="${value}"${tour?.status === value ? " selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="field">
        <label for="tf-rating">Điểm đánh giá (1-5)</label>
        <input id="tf-rating" name="rating" type="number" min="1" max="5" step="0.1" value="${tour?.rating ?? 5}">
      </div>
      <div class="field">
        <label for="tf-reviews">Số lượt đánh giá</label>
        <input id="tf-reviews" name="reviews" type="number" min="0" value="${tour?.reviews ?? 0}">
      </div>
    </div>

    <div class="field" style="margin-top: 1rem;">
      <label for="tf-image">Ảnh chính của tour (URL) <span class="req">*</span></label>
      <div style="display: flex; gap: 8px; margin-bottom: 6px;">
        <input id="tf-image" name="image" type="text" value="${escapeHtml(tour?.image || "")}" placeholder="https://..." required style="flex: 1;">
        <button class="btn btn-sm btn-outline" type="button" id="tf-preview-btn">Xem ảnh</button>
      </div>
      <div style="margin: 6px 0 10px;">
        <span style="font-size: 0.8rem; color: #64748b; margin-right: 6px;">Chọn nhanh ảnh đẹp:</span>
        <div style="display: inline-flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
          ${samplePills}
        </div>
      </div>
      <div id="tf-img-preview" style="margin-top: 6px; max-height: 180px; overflow: hidden; border-radius: 8px; display: ${tour?.image ? 'block' : 'none'};">
        <img src="${escapeHtml(tour?.image || '')}" alt="Preview" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;">
      </div>
    </div>

    <div class="field">
      <label for="tf-gallery">Thư viện ảnh bổ sung (mỗi dòng một URL ảnh)</label>
      <textarea id="tf-gallery" name="gallery" rows="2" placeholder="https://...&#10;https://...">${escapeHtml(listToText(tour?.gallery))}</textarea>
    </div>

    <div class="field">
      <label for="tf-description">Mô tả ngắn</label>
      <textarea id="tf-description" name="description" rows="3" placeholder="Giới thiệu tóm tắt về điểm đặc sắc của tour...">${escapeHtml(tour?.description || "")}</textarea>
    </div>

    <div class="field">
      <label for="tf-highlights">Điểm nhấn nổi bật (mỗi dòng một điểm)</label>
      <textarea id="tf-highlights" name="highlights" rows="3" placeholder="Ngắm hoàng hôn trên vịnh&#10;Thưởng thức đặc sản vùng cao">${escapeHtml(listToText(tour?.highlights))}</textarea>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="tf-includes">Dịch vụ bao gồm (mỗi dòng một mục)</label>
        <textarea id="tf-includes" name="includes" rows="3" placeholder="Xe du lịch đời mới&#10;Khách sạn 4 sao&#10;Vé thắng cảnh">${escapeHtml(listToText(tour?.includes))}</textarea>
      </div>
      <div class="field">
        <label for="tf-excludes">Dịch vụ không bao gồm (mỗi dòng một mục)</label>
        <textarea id="tf-excludes" name="excludes" rows="3" placeholder="Chi phí cá nhân&#10;Tiền tip HDV">${escapeHtml(listToText(tour?.excludes))}</textarea>
      </div>
    </div>

    <div class="field">
      <label for="tf-departures">Lịch khởi hành (cách nhau bằng dấu phẩy)</label>
      <input id="tf-departures" name="departures" type="text" value="${escapeHtml((tour?.departures || []).join(", "))}" placeholder="2026-10-10, 2026-10-17, 2026-10-24">
    </div>

    <div class="itinerary-block" style="margin-top: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
      <div class="itinerary-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0; font-size: 1rem; color: #1e293b;">📅 Lịch trình chi tiết theo từng ngày</h4>
        <button class="btn btn-sm btn-primary" type="button" id="itinerary-add">+ Thêm ngày</button>
      </div>
      <div id="itinerary-list">${itineraryHtml(tour?.itinerary)}</div>
    </div>

    <p class="error" id="tour-error" style="margin-top: 1rem;"></p>
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
    title: tour ? "✏️ Cập nhật tour" : "➕ Thêm tour mới",
    subtitle: tour ? tour.name : "Điền đầy đủ thông tin để tour hiển thị và được lưu vào LocalStorage",
    size: "xl",
    body: formHtml(tour),
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Huỷ</button>
      <button class="btn btn-primary" type="submit" form="tour-form">${tour ? "Lưu thay đổi" : "Tạo tour mới"}</button>`,
  });

  const form = document.getElementById("tour-form");
  const list = document.getElementById("itinerary-list");
  const imgInput = document.getElementById("tf-image");
  const imgPreview = document.getElementById("tf-img-preview");

  const updatePreview = (url) => {
    if (url && imgPreview) {
      imgPreview.style.display = "block";
      imgPreview.querySelector("img").src = url;
    }
  };

  // Sample image clicks
  document.querySelectorAll("[data-fill-img]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.fillImg;
      if (imgInput) imgInput.value = url;
      updatePreview(url);
    });
  });

  document.getElementById("tf-preview-btn")?.addEventListener("click", () => {
    if (imgInput) updatePreview(imgInput.value.trim());
  });

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

    if (name.length < 2) return void (error.textContent = "Vui lòng nhập tên tour hợp lệ.");
    if (!location) return void (error.textContent = "Vui lòng nhập điểm đến.");
    if (!price || price <= 0) return void (error.textContent = "Vui lòng nhập giá vé tour lớn hơn 0.");

    const current = id ? getTourById(id) : null;
    const image = String(data.get("image") || "").trim() || SAMPLE_IMAGES[0].url;
    const gallery = String(data.get("gallery") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const saved = saveTour({
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
      image,
      itinerary: collectItinerary(list),
    });

    logActivity(current ? "Cập nhật tour" : "Tạo tour", `${current ? "Cập nhật" : "Thêm mới"} tour ${name}`);
    toast(`Đã lưu tour "${name}" vào LocalStorage thành công!`);
    closeModal();
    refreshAdmin();
  });
}

/* Tour có đơn thì không xoá vật lý - chuyển sang ngừng bán để giữ lịch sử.
   Tour chưa có đơn thì cho xoá hẳn. */
function handleDeleteTour(tour) {
  const check = checkTourDelete(tour.id);

  if (check.ok) {
    if (!confirmAction(`Xoá tour "${tour.name}"? Tour chưa có đơn nào nên không mất dữ liệu.`)) return;
    removeTour(tour.id);
    logActivity("Xoá tour", `Xoá tour ${tour.name}`);
    toast(`Đã xoá tour "${tour.name}".`);
    return refreshAdmin();
  }

  openModal({
    title: "Không thể xoá tour",
    subtitle: tour.name,
    size: "md",
    body: `
      <p class="form-hint">${escapeHtml(check.error)}</p>
      <div class="note-box">
        <strong>${check.orders} đơn</strong> đang tham chiếu tour này. Hệ thống giữ liên kết này để:
        <ul class="it-list">
          <li>Đơn của khách vẫn hiển thị đúng tên, giá và lịch trình tại thời điểm đặt.</li>
          <li>Doanh thu và thống kê không bị sai lệch.</li>
          <li>Lịch sử thanh toán không bị mất.</li>
        </ul>
      </div>
      <p class="form-hint">
        Chuyển sang <strong>Ngừng bán</strong> sẽ ẩn tour khỏi trang đặt tour nhưng vẫn cho phép
        Admin quản lý và tra cứu đơn cũ.
      </p>`,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
      <button class="btn btn-primary" type="button" data-stop-selling="${escapeHtml(tour.id)}">Ngừng bán tour này</button>`,
  });
}

function openTourView(tour) {
  const orders = listBookings().filter((item) => String(item.tourId) === String(tour.id));
  viewingTourId = tour.id;
  const revenue = orders
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const p = tour.progress || {};
  const stage = TOUR_PROGRESS_STAGES[p.stage] || TOUR_PROGRESS_STAGES.not_started;

  openModal({
    title: tour.name,
    subtitle: `${tour.location || "Chưa có điểm đến"} · ${tour.time}`,
    size: "lg",
    body: `
      <img class="modal-cover" src="${escapeHtml(tour.image)}" alt="" loading="lazy" style="height: 240px; object-fit: cover; border-radius: 8px;">
      
      <div style="margin: 1rem 0; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h4 style="margin: 0; color: #166534; font-size: 0.95rem;">📍 Tiến độ hành trình đoàn</h4>
          <button class="btn btn-xs btn-primary" type="button" data-view-progress style="font-size: 0.8rem;">Cập nhật tiến độ</button>
        </div>
        <p style="margin: 6px 0 0; font-size: 0.9rem; color: #15803d;">
          <strong>${stage.icon} ${stage.label}</strong>
          ${p.currentDay ? ` (Ngày ${p.currentDay}/${tour.days})` : ""}
          ${p.currentLocation ? ` — 📍 <strong>${escapeHtml(p.currentLocation)}</strong>` : ""}
        </p>
        ${p.note ? `<p style="margin: 4px 0 0; font-size: 0.85rem; color: #475569;">Ghi chú: ${escapeHtml(p.note)}</p>` : ""}
      </div>

      <div class="detail-grid">
        <section>
          <h4>Thông tin tour</h4>
          <ul class="summary-list">
            <li><span>Giá vé</span><strong>${formatPrice(tour.price)}</strong></li>
            <li><span>Giá gốc</span><strong>${tour.oldPrice ? formatPrice(tour.oldPrice) : "-"}</strong></li>
            <li><span>Số chỗ còn</span><strong>${tour.seatsLeft}</strong></li>
            <li><span>Đánh giá</span><strong>${stars(tour.rating)} ${tour.rating} (${tour.reviews})</strong></li>
            <li><span>Trạng thái</span><strong>${statusBadge(tour.status, TOUR_STATUS)}</strong></li>
          </ul>
        </section>
        <section>
          <h4>Hiệu quả bán hàng</h4>
          <ul class="summary-list">
            <li><span>Số đơn đặt</span><strong>${orders.length} đơn</strong></li>
            <li><span>Doanh thu</span><strong>${formatMoney(revenue)}</strong></li>
            <li><span>Lượt khách</span><strong>${orders.reduce((sum, item) => sum + (Number(item.people) || 0), 0)} khách</strong></li>
            <li><span>Lịch khởi hành</span><strong>${tour.departures.length} đợt</strong></li>
          </ul>
        </section>
      </div>

      <h4>Lịch khởi hành</h4>
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
    `,
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
  const ongoing = tours.filter((tour) => tour.status === "ongoing").length;
  const limited = tours.filter((tour) => tour.status === "limited").length;
  const completed = tours.filter((tour) => tour.status === "completed").length;
  const closed = tours.filter((tour) => tour.status === "closed").length;
  const seats = tours.reduce((sum, tour) => sum + (Number(tour.seatsLeft) || 0), 0);
  const stopped = tours.filter((tour) => !isSellableTour(tour));
  const lockedByOrders = stopped.filter((tour) => tourOrderCount(tour.id) > 0).length;

  return `
  <section class="kpi-grid kpi-grid-5">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng tour</p><strong class="kpi-value">${tours.length}</strong><span class="kpi-hint">${destinations.length} điểm đến</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đang bán</p><strong class="kpi-value">${open + limited}</strong><span class="kpi-hint">Hiển thị trên website</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Sắp hết chỗ</p><strong class="kpi-value">${limited}</strong><span class="kpi-hint">${tours.filter((t) => t.seatsLeft <= 4).length} tour dưới 5 chỗ</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Tổng suất còn</p><strong class="kpi-value">${seats}</strong><span class="kpi-hint">Toàn bộ tuyến</span></article>
    <article class="kpi kpi-red"><p class="kpi-label">Ngừng bán</p><strong class="kpi-value">${stopped.length}</strong><span class="kpi-hint">${lockedByOrders} tour đang có đơn</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="tr-q">Tìm kiếm tour</label>
        <input id="tr-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên tour, điểm đến, địa điểm tiến độ..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="tr-location">Điểm đến</label>
        <select id="tr-location">
          <option value="">Tất cả điểm đến</option>
          ${destinations.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="tr-status">Trạng thái tour</label>
        <select id="tr-status">
          <option value="">Tất cả trạng thái</option>
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
          <option value="rating">Đánh giá cao nhất</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="tr-view">Kiểu hiển thị</label>
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
              <button class="btn btn-sm btn-outline" type="button" data-bulk="closed">Ngừng bán</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="finished">Đánh dấu kết thúc</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-bulk="delete">Xoá</button>
            </div>`
          : `<span></span>`
      }
      <div class="toolbar-actions">
        ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" id="tr-add">➕ Thêm tour mới</button>` : ""}
        <button class="btn btn-sm btn-ghost-soft" type="button" id="tr-export">📥 Xuất CSV</button>
        ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" id="tr-reset">🔄 Khôi phục dữ liệu gốc</button>` : ""}
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
            <th>Giá vé</th>
            <th>Chỗ còn</th>
            <th>Tiến độ chuyến đi</th>
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
      ["Mã tour", "Tên tour", "Điểm đến", "Thời lượng", "Số ngày", "Giá", "Giá cũ", "Chỗ còn", "Trạng thái", "Tiến độ", "Vị trí hiện tại", "Ghi chú tiến độ"],
      filterTours(listTours()).map((tour) => [
        tour.id,
        tour.name,
        tour.location,
        tour.time,
        tour.days,
        tour.price,
        tour.oldPrice,
        tour.seatsLeft,
        TOUR_STATUS[tour.status],
        TOUR_PROGRESS_STAGES[tour.progress?.stage]?.label || "",
        tour.progress?.currentLocation || "",
        tour.progress?.note || "",
      ])
    );
  });

  bind("tr-reset", "click", () => {
    if (!confirmAction("Khôi phục toàn bộ danh sách tour về dữ liệu gốc trên LocalStorage? Các tour thêm mới sẽ bị xóa.")) return;
    resetTours();
    logActivity("Khôi phục dữ liệu", "Khôi phục danh sách tour về dữ liệu gốc");
    toast("Đã khôi phục danh sách tour gốc thành công!");
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
    if (action === "progress") return openProgressModal(tour);
    if (action === "edit") return openTourForm(tour);

    if (action === "duplicate") {
      const { id, ...rest } = tour;
      saveTour({ ...rest, name: `${tour.name} (Bản sao)`, status: "closed", reviews: 0 });
      logActivity("Nhân bản tour", `Tạo bản sao của tour ${tour.name}`);
      toast(`Đã nhân bản tour "${tour.name}".`);
      return refreshAdmin();
    }

    if (action === "delete") return handleDeleteTour(tour);

    if (action === "reopen") {
      setTourStatus(tour.id, "open");
      logActivity("Mở bán tour", `Mở bán lại tour ${tour.name}`);
      toast(`Tour "${tour.name}" đã mở bán trở lại.`);
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
      if (!confirmAction(`Xoá ${ids.length} tour đã chọn? Tour có đơn sẽ không bị xoá mà chuyển sang ngừng bán.`)) return;
      let removed = 0;
      let stopped = 0;
      const blocked = [];

      ids.forEach((id) => {
        const check = checkTourDelete(id);
        if (check.ok) {
          removeTour(id);
          removed += 1;
        } else {
          /* Tour đã có đơn: giữ nguyên dữ liệu, chuyển sang ngừng bán */
          if (!isSellableTour(getTourById(id))) {
            blocked.push(getTourById(id)?.name || id);
            return;
          }
          setTourStatus(id, "closed");
          stopped += 1;
        }
      });

      logActivity("Xoá tour", `Xoá ${removed}/${ids.length} tour${stopped ? `, chuyển ${stopped} tour sang ngừng bán` : ""}${blocked.length ? `, ${blocked.length} tour đã ngừng bán sẵn` : ""}`);
      toast(
        [
          removed ? `Đã xoá ${removed} tour.` : "",
          stopped ? `Đã chuyển ${stopped} tour có đơn sang ngừng bán.` : "",
          blocked.length ? `${blocked.length} tour đã ngừng bán sẵn nên được giữ nguyên.` : "",
        ]
          .filter(Boolean)
          .join(" ") || "Không có tour nào được cập nhật."
      );
    } else {
      ids.forEach((id) => saveTour({ ...getTourById(id), status: action }));
      logActivity("Cập nhật tour", `Đặt ${ids.length} tour sang trạng thái ${TOUR_STATUS[action]}`);
      toast(`Đã cập nhật ${ids.length} tour.`);
    }
    refreshAdmin();
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-view-edit]")) {
    const tour = getTourById(viewingTourId);
    closeModal();
    if (tour) openTourForm(tour);
  }
  if (event.target.closest("[data-view-progress]")) {
    const tour = getTourById(viewingTourId);
    closeModal();
    if (tour) openProgressModal(tour);
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stop-selling]");
  if (!button) return;
  const tour = getTourById(button.dataset.stopSelling);
  closeModal();
  if (!tour) return;
  setTourStatus(tour.id, "closed");
  logActivity("Ngừng bán tour", `Chuyển tour ${tour.name} sang ngừng bán vì đang có đơn`);
  toast(`Tour "${tour.name}" đã ngừng bán. Đơn cũ vẫn được giữ nguyên.`);
  refreshAdmin();
});
