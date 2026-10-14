import {
  listTourAnnouncements,
  addTourAnnouncement,
  deleteTourAnnouncement,
  getTourChecklist,
  toggleChecklistItem,
  addChecklistItem,
  resetTourChecklist,
} from "../../store.js";
import { getTourById } from "../../tour-repository.js";
import { getSession } from "../../auth.js";
import { guideGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  emptyState,
  openModal,
  closeModal,
  toast,
} from "../../components/admin-ui.js";
import { formatDate } from "../../data.js";
import { escapeHtml } from "../../validate.js";
import { formatDateTime } from "../../reports.js";
import { assignedTours } from "./dashboard.js";

const FILTERS = { tourId: "", tab: "announcements" };

function tourName(booking) {
  return booking?.tourName || getTourById(booking?.tourId)?.name || "Tour không còn trong danh mục";
}

export function GuideAnnouncements() {
  const denied = guideGuard("guide.announcements.manage");
  if (denied) return denied;

  const session = getSession();
  const groups = assignedTours(session.username);

  if (!FILTERS.tourId && groups.length > 0) {
    FILTERS.tourId = groups[0].tourId;
  }

  const currentGroup = groups.find((g) => g.tourId === FILTERS.tourId) || groups[0];
  const announcements = listTourAnnouncements(FILTERS.tourId, session.username);
  const checklist = getTourChecklist(FILTERS.tourId, session.username);

  const checkedCount = checklist.filter((i) => i.checked).length;
  const checklistPct = checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0;

  return `
  <section class="panel">
    <div class="panel-head" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2>📢 Dặn dò đoàn khách & Checklist chuẩn bị</h2>
        <p class="panel-sub">Gửi dặn dò giờ giấc, trang phục đến khách và rà soát các khâu hậu cần trước khi khởi hành</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" type="button" id="btn-create-announcement">
          ✍️ Soạn tin dặn dò mới
        </button>
        <button class="btn btn-outline" type="button" id="btn-add-checklist-item">
          ➕ Thêm mục checklist
        </button>
      </div>
    </div>

    <div class="filter-bar" style="margin-top: 1rem;">
      <div class="filter-field filter-grow">
        <label for="ann-tour-select">Chọn chuyến tour</label>
        <select id="ann-tour-select">
          ${
            groups.length
              ? groups
                  .map(
                    (g) =>
                      `<option value="${escapeHtml(g.tourId)}" ${g.tourId === FILTERS.tourId ? "selected" : ""}>${escapeHtml(g.tour?.name || tourName(g.bookings[0]))} (${formatDate(g.bookings[0]?.date)})</option>`
                  )
                  .join("")
              : `<option value="">Chưa có chuyến tour nào</option>`
          }
        </select>
      </div>
    </div>

    <!-- Thanh chuyển tab -->
    <div class="segmented-control" style="margin-top: 1rem; display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
      <button class="btn btn-sm ${FILTERS.tab === "announcements" ? "btn-primary" : "btn-ghost-soft"}" type="button" data-switch-tab="announcements">
        📢 Tin nhắn dặn dò đoàn (${announcements.length})
      </button>
      <button class="btn btn-sm ${FILTERS.tab === "checklist" ? "btn-primary" : "btn-ghost-soft"}" type="button" data-switch-tab="checklist">
        📋 Checklist chuẩn bị (${checkedCount}/${checklist.length} - ${checklistPct}%)
      </button>
    </div>
  </section>

  ${
    FILTERS.tab === "announcements"
      ? `<section class="panel" style="margin-top: 1.5rem;">
          <div class="panel-head">
            <div>
              <h3>Tin nhắn dặn dò đoàn: ${escapeHtml(currentGroup?.tour?.name || tourName(currentGroup?.bookings[0]) || "Chuyến đi")}</h3>
              <p class="panel-sub">Bạn có thể bấm "Sao chép tin nhắn" để gửi nhanh vào nhóm Zalo / SMS của đoàn khách</p>
            </div>
          </div>

          ${
            announcements.length
              ? `<div style="display: flex; flex-direction: column; gap: 14px; margin-top: 1rem;">
                  ${announcements
                    .map((item) => {
                      const isUrgent = item.priority === "urgent";
                      const isImportant = item.priority === "important";
                      return `
                      <article class="announcement-card" style="border: 1px solid ${isUrgent ? "#fca5a5" : isImportant ? "#fde68a" : "#e2e8f0"}; background: ${isUrgent ? "#fff5f5" : isImportant ? "#fffbeb" : "#fff"}; border-radius: 10px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                          <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                              <span class="status-pill ${isUrgent ? "status-cancelled" : isImportant ? "status-pending" : "status-open"}" style="font-weight: 700;">
                                ${isUrgent ? "🚨 KHẨN CẤP" : isImportant ? "⚡ QUAN TRỌNG" : "THÔNG BÁO"}
                              </span>
                              <strong style="font-size: 1.1rem; color: #0f172a;">${escapeHtml(item.title)}</strong>
                            </div>
                            <span style="font-size: 0.85rem; color: #64748b;">
                              🕒 Đăng lúc ${formatDateTime(item.createdAt)} · Bởi: <strong>${escapeHtml(item.by)}</strong>
                            </span>
                          </div>
                          <div style="display: flex; gap: 6px;">
                            <button class="btn btn-xs btn-primary" type="button" data-copy-ann="${escapeHtml(item.id)}" data-msg="${escapeHtml(item.title + "\n\n" + item.message)}">
                              📋 Sao chép gửi Zalo/SMS
                            </button>
                            <button class="btn btn-xs btn-outline-danger" type="button" data-delete-ann="${escapeHtml(item.id)}">
                              Xoá
                            </button>
                          </div>
                        </div>

                        <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; white-space: pre-wrap; background: rgba(255,255,255,0.7); padding: 12px 14px; border-radius: 8px; border: 1px dashed rgba(0,0,0,0.1);">
                          ${escapeHtml(item.message)}
                        </div>
                      </article>`;
                    })
                    .join("")}
                </div>`
              : emptyState("Chưa có tin dặn dò nào cho chuyến này. Hãy soạn tin dặn dò đầu tiên cho đoàn khách của bạn!")
          }
        </section>`
      : `<section class="panel" style="margin-top: 1.5rem;">
          <div class="panel-head" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3>📋 Checklist kiểm tra trước giờ khởi hành</h3>
              <p class="panel-sub">Đã hoàn thành ${checkedCount}/${checklist.length} tiêu chí (${checklistPct}%)</p>
            </div>
            <button class="btn btn-xs btn-outline" type="button" id="btn-reset-checklist">
              🔄 Đặt lại checklist chuẩn
            </button>
          </div>

          <!-- Thanh tiến độ -->
          <div style="background: #e2e8f0; border-radius: 999px; height: 10px; width: 100%; overflow: hidden; margin: 12px 0 16px;">
            <div style="background: ${checklistPct === 100 ? "#22c55e" : "#3b82f6"}; width: ${checklistPct}%; height: 100%; transition: width 0.3s ease;"></div>
          </div>

          <div class="checklist-items-wrap" style="display: flex; flex-direction: column; gap: 10px;">
            ${checklist
              .map(
                (item) => `
              <label class="checklist-item-row" style="display: flex; align-items: center; gap: 12px; background: ${item.checked ? "#f0fdf4" : "#f8fafc"}; border: 1px solid ${item.checked ? "#86efac" : "#e2e8f0"}; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all 0.2s;">
                <input
                  type="checkbox"
                  data-toggle-chk="${escapeHtml(item.id)}"
                  ${item.checked ? "checked" : ""}
                  style="width: 18px; height: 18px; accent-color: #16a34a; cursor: pointer;"
                />
                <span style="flex: 1; font-size: 0.95rem; color: ${item.checked ? "#15803d" : "#1e293b"}; ${item.checked ? "text-decoration: line-through;" : ""}">
                  ${escapeHtml(item.text)}
                </span>
                ${
                  item.category
                    ? `<span class="soft-chip" style="font-size: 0.75rem;">${escapeHtml(item.category)}</span>`
                    : ""
                }
              </label>`
              )
              .join("")}
          </div>
        </section>`
  }`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "guide/announcements") return;

  const session = getSession();

  document.getElementById("ann-tour-select")?.addEventListener("change", (e) => {
    FILTERS.tourId = e.target.value;
    refreshAdmin();
  });

  // Chuyển tab
  document.querySelectorAll("[data-switch-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      FILTERS.tab = btn.dataset.switchTab;
      refreshAdmin();
    });
  });

  // Modal Soạn tin dặn dò mới
  document.getElementById("btn-create-announcement")?.addEventListener("click", () => {
    const groups = assignedTours(session.username);

    openModal({
      title: "✍️ Soạn thông báo dặn dò đoàn",
      subtitle: "Gửi thông tin giờ giấc tập trung, trang phục, thời tiết",
      size: "lg",
      body: `
        <form id="form-new-ann" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="field">
            <label for="na-tour">Chuyến tour <span class="req">*</span></label>
            <select id="na-tour" required>
              ${groups
                .map(
                  (g) =>
                    `<option value="${escapeHtml(g.tourId)}" ${g.tourId === FILTERS.tourId ? "selected" : ""}>${escapeHtml(g.tour?.name || tourName(g.bookings[0]))}</option>`
                )
                .join("")}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
            <div class="field">
              <label for="na-title">Tiêu đề dặn dò <span class="req">*</span></label>
              <input id="na-title" type="text" placeholder="Ví dụ: ⏰ Dặn dò tập trung ngày 2..." required />
            </div>
            <div class="field">
              <label for="na-priority">Mức độ ưu tiên</label>
              <select id="na-priority">
                <option value="normal">Bình thường</option>
                <option value="important" selected>⚡ Quan trọng</option>
                <option value="urgent">🚨 Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="na-msg">Nội dung tin nhắn dặn dò <span class="req">*</span></label>
            <textarea id="na-msg" rows="5" placeholder="Ví dụ: Kính chào quý khách! Ngày mai đoàn sẽ khởi hành lúc 07:00, quý khách vui lòng ăn sáng trước và chuẩn bị trang phục lịch sự..." required></textarea>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" id="btn-save-ann">Đăng thông báo</button>`,
    });

    document.getElementById("btn-save-ann")?.addEventListener("click", () => {
      const tourId = document.getElementById("na-tour")?.value;
      const title = document.getElementById("na-title")?.value;
      const priority = document.getElementById("na-priority")?.value;
      const message = document.getElementById("na-msg")?.value;

      if (!title?.trim() || !message?.trim()) {
        return toast("Vui lòng nhập đầy đủ tiêu đề và nội dung dặn dò", "error");
      }

      addTourAnnouncement({
        tourId,
        guideId: session.username,
        title,
        priority,
        message,
        by: session.name,
      });

      closeModal();
      toast("Đã đăng thông báo dặn dò thành công!");
      FILTERS.tourId = tourId;
      FILTERS.tab = "announcements";
      refreshAdmin();
    });
  });

  // Modal Thêm mục checklist
  document.getElementById("btn-add-checklist-item")?.addEventListener("click", () => {
    const text = prompt("Nhập nội dung cần kiểm tra trước chuyến đi:");
    if (!text?.trim()) return;

    addChecklistItem(FILTERS.tourId, session.username, text.trim());
    toast("Đã thêm mục checklist mới!");
    FILTERS.tab = "checklist";
    refreshAdmin();
  });

  // Đặt lại checklist gốc
  document.getElementById("btn-reset-checklist")?.addEventListener("click", () => {
    if (!confirm("Khôi phục danh sách checklist về các tiêu chí chuẩn mặc định?")) return;
    resetTourChecklist(FILTERS.tourId, session.username);
    toast("Đã khôi phục checklist chuẩn.");
    refreshAdmin();
  });
});

document.addEventListener("click", (e) => {
  // Toggle checkbox
  const chkInput = e.target.closest("[data-toggle-chk]");
  if (chkInput) {
    const session = getSession();
    toggleChecklistItem(FILTERS.tourId, session.username, chkInput.dataset.toggleChk);
    refreshAdmin();
    return;
  }

  // Sao chép tin nhắn
  const copyBtn = e.target.closest("[data-copy-ann]");
  if (copyBtn) {
    const msg = copyBtn.dataset.msg;
    navigator.clipboard.writeText(msg);
    toast("Đã sao chép nội dung tin dặn dò vào clipboard!");
    return;
  }

  // Xoá tin nhắn
  const delBtn = e.target.closest("[data-delete-ann]");
  if (delBtn) {
    if (!confirm("Bạn có chắc chắn muốn xoá thông báo dặn dò này?")) return;
    deleteTourAnnouncement(delBtn.dataset.deleteAnn);
    toast("Đã xoá thông báo.");
    refreshAdmin();
    return;
  }
});
