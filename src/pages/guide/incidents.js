import {
  INCIDENT_LEVELS,
  listTourIncidents,
  addTourIncident,
  resolveTourIncident,
  getSettings,
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

const FILTERS = { tourId: "", status: "" };

function tourName(booking) {
  return booking?.tourName || getTourById(booking?.tourId)?.name || "Tour không còn trong danh mục";
}

export function GuideIncidents() {
  const denied = guideGuard("guide.incidents.manage");
  if (denied) return denied;

  const session = getSession();
  const settings = getSettings();
  const groups = assignedTours(session.username);

  const incidents = listTourIncidents(FILTERS.tourId, session.username).filter(
    (item) => !FILTERS.status || item.status === FILTERS.status
  );

  const openCount = incidents.filter((i) => i.status === "open").length;
  const urgentCount = incidents.filter((i) => i.level === "urgent" && i.status === "open").length;

  return `
  <!-- Banner Hotline khẩn cấp -->
  <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #fff; border-radius: 12px; padding: 18px 24px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);">
    <div style="display: flex; align-items: center; gap: 14px;">
      <span style="font-size: 2.2rem;">🚨</span>
      <div>
        <h2 style="color: #fff; margin: 0; font-size: 1.25rem;">Kênh báo cáo sự cố & Hỗ trợ khẩn cấp 24/7</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 0.9rem;">
          Khi gặp sự cố y tế, tai nạn, thất lạc hành lý hoặc sự cố phương tiện, hãy gọi ngay đường dây nóng:
        </p>
      </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <a href="tel:${String(settings.hotline).replace(/\D/g, "")}" class="btn btn-light" style="font-weight: 700; color: #b91c1c; font-size: 1.05rem;">
        📞 Hotline: ${escapeHtml(settings.hotline)}
      </a>
      <button class="btn btn-dark" type="button" id="btn-report-incident" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.3); font-weight: 600;">
        ⚠️ Báo sự cố mới
      </button>
    </div>
  </div>

  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue">
      <p class="kpi-label">Tổng sự cố ghi nhận</p>
      <strong class="kpi-value">${incidents.length}</strong>
      <span class="kpi-hint">Đã từng phát sinh</span>
    </article>
    <article class="kpi ${openCount > 0 ? "kpi-amber" : "kpi-green"}">
      <p class="kpi-label">Đang chờ xử lý</p>
      <strong class="kpi-value" style="color: ${openCount > 0 ? "#ea580c" : "#16a34a"};">${openCount}</strong>
      <span class="kpi-hint">${openCount > 0 ? "Cần theo dõi sát sao" : "Không có sự cố tồn đọng"}</span>
    </article>
    <article class="kpi kpi-violet">
      <p class="kpi-label">Khẩn cấp SOS</p>
      <strong class="kpi-value" style="color: #ef4444;">${urgentCount}</strong>
      <span class="kpi-hint">Mức độ ưu tiên cao nhất</span>
    </article>
    <article class="kpi kpi-green">
      <p class="kpi-label">Đã giải quyết</p>
      <strong class="kpi-value">${incidents.filter((i) => i.status === "resolved").length}</strong>
      <span class="kpi-hint">Đã đóng an toàn</span>
    </article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="inc-tour-select">Lọc theo chuyến tour</label>
        <select id="inc-tour-select">
          <option value="">Tất cả chuyến</option>
          ${groups
            .map(
              (g) =>
                `<option value="${escapeHtml(g.tourId)}" ${g.tourId === FILTERS.tourId ? "selected" : ""}>${escapeHtml(g.tour?.name || tourName(g.bookings[0]))} (${formatDate(g.bookings[0]?.date)})</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="inc-status-select">Trạng thái giải quyết</label>
        <select id="inc-status-select">
          <option value="">Tất cả</option>
          <option value="open" ${FILTERS.status === "open" ? "selected" : ""}>Đang xử lý (Chưa đóng)</option>
          <option value="resolved" ${FILTERS.status === "resolved" ? "selected" : ""}>Đã giải quyết xong</option>
        </select>
      </div>
    </div>
  </section>

  <section class="panel" style="margin-top: 1.5rem;">
    <div class="panel-head">
      <div>
        <h3>Danh sách sự cố & Nhật ký hỗ trợ</h3>
        <p class="panel-sub">Theo dõi sát sao từng sự cố để đảm bảo chuyến đi diễn ra suôn sẻ, an toàn</p>
      </div>
    </div>

    ${
      incidents.length
        ? `<div style="display: flex; flex-direction: column; gap: 16px; margin-top: 1rem;">
            ${incidents
              .map((item) => {
                const isUrgent = item.level === "urgent";
                const isOpen = item.status === "open";
                return `
                <article class="incident-card" style="border: 1px solid ${isUrgent ? "#fca5a5" : "#e2e8f0"}; border-left: 6px solid ${isUrgent ? "#ef4444" : item.level === "high" ? "#f97316" : "#3b82f6"}; border-radius: 10px; background: ${isUrgent && isOpen ? "#fff5f5" : "#fff"}; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="status-pill ${INCIDENT_LEVELS[item.level]?.badgeClass || "status-pending"}" style="font-weight: 700;">
                          ${escapeHtml(INCIDENT_LEVELS[item.level]?.label || item.level)}
                        </span>
                        <strong style="font-size: 1.15rem; color: #0f172a;">${escapeHtml(item.title)}</strong>
                      </div>
                      <span style="font-size: 0.85rem; color: #64748b;">
                        📍 Địa điểm: <strong>${escapeHtml(item.location || "Đang cập nhật")}</strong> · 🕒 ${formatDateTime(item.createdAt)} · Báo bởi: <strong>${escapeHtml(item.by)}</strong>
                      </span>
                    </div>
                    <div>
                      ${
                        isOpen
                          ? `<span class="status-pill status-cancelled" style="background:#fef2f2; color:#ef4444; border:1px solid #fecaca; font-weight:700;">⚠️ ĐANG XỬ LÝ</span>`
                          : `<span class="status-pill status-paid">✓ ĐÃ GIẢI QUYẾT</span>`
                      }
                    </div>
                  </div>

                  <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; margin: 12px 0; background: #f8fafc; padding: 12px 14px; border-radius: 8px;">
                    ${escapeHtml(item.description)}
                  </div>

                  ${
                    item.resolution
                      ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-top: 10px; font-size: 0.9rem; color: #166534;">
                           <strong>✓ Biện pháp đã giải quyết:</strong> ${escapeHtml(item.resolution)}
                           <span style="display:block; font-size:0.8rem; color:#15803d; margin-top:4px;">
                             Xác nhận lúc ${formatDateTime(item.resolvedAt)} bởi ${escapeHtml(item.resolvedBy || item.by)}
                           </span>
                         </div>`
                      : ""
                  }

                  ${
                    isOpen
                      ? `<div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
                           <button class="btn btn-sm btn-primary" type="button" data-resolve-incident="${escapeHtml(item.id)}" data-title="${escapeHtml(item.title)}">
                             ✓ Đánh dấu đã giải quyết xong
                           </button>
                         </div>`
                      : ""
                  }
                </article>`;
              })
              .join("")}
          </div>`
        : emptyState("Không có sự cố nào cần báo cáo hoặc đã được giải quyết an toàn. Chúc đoàn có chuyến đi tốt đẹp!")
    }
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "guide/incidents") return;

  const session = getSession();

  document.getElementById("inc-tour-select")?.addEventListener("change", (e) => {
    FILTERS.tourId = e.target.value;
    refreshAdmin();
  });

  document.getElementById("inc-status-select")?.addEventListener("change", (e) => {
    FILTERS.status = e.target.value;
    refreshAdmin();
  });

  // Modal Báo cáo sự cố mới
  document.getElementById("btn-report-incident")?.addEventListener("click", () => {
    const groups = assignedTours(session.username);

    openModal({
      title: "⚠️ Báo cáo sự cố đoàn & Yêu cầu hỗ trợ",
      subtitle: "Gửi thông tin khẩn cấp đến ban điều hành và lưu lại nhật ký xử lý",
      size: "lg",
      body: `
        <form id="form-new-incident" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="field">
            <label for="ni-tour">Chuyến tour xảy ra sự cố <span class="req">*</span></label>
            <select id="ni-tour" required>
              ${groups
                .map(
                  (g) =>
                    `<option value="${escapeHtml(g.tourId)}">${escapeHtml(g.tour?.name || tourName(g.bookings[0]))}</option>`
                )
                .join("")}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="field">
              <label for="ni-level">Mức độ nghiêm trọng <span class="req">*</span></label>
              <select id="ni-level" required style="font-weight: 600;">
                <option value="low">Nhẹ / Cần chú ý</option>
                <option value="medium" selected>Trung bình</option>
                <option value="high">Nghiêm trọng (Chậm lịch / Đổi xe)</option>
                <option value="urgent">🚨 KHẨN CẤP SOS (Y tế / Tai nạn)</option>
              </select>
            </div>
            <div class="field">
              <label for="ni-location">Địa điểm xảy ra sự cố <span class="req">*</span></label>
              <input id="ni-location" type="text" placeholder="Ví dụ: Km 84 Cao tốc Ninh Bình..." required />
            </div>
          </div>

          <div class="field">
            <label for="ni-title">Tiêu đề sự cố tóm tắt <span class="req">*</span></label>
            <input id="ni-title" type="text" placeholder="Ví dụ: Xe 29 chỗ hỏng lốp, cần hỗ trợ xe trung chuyển..." required />
          </div>

          <div class="field">
            <label for="ni-desc">Mô tả chi tiết sự việc & Biện pháp đã thực hiện <span class="req">*</span></label>
            <textarea id="ni-desc" rows="4" placeholder="Mô tả cụ thể tình hình đoàn, số lượng khách bị ảnh hưởng, hành động HDV đã xử lý và yêu cầu chi tiết gửi ban điều hành..." required></textarea>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-danger" type="button" id="btn-submit-incident" style="background:#ef4444; color:#fff;">
          🚨 Gửi báo cáo sự cố
        </button>`,
    });

    document.getElementById("btn-submit-incident")?.addEventListener("click", () => {
      const tourId = document.getElementById("ni-tour")?.value;
      const level = document.getElementById("ni-level")?.value;
      const location = document.getElementById("ni-location")?.value;
      const title = document.getElementById("ni-title")?.value;
      const description = document.getElementById("ni-desc")?.value;

      if (!title?.trim() || !description?.trim() || !location?.trim()) {
        return toast("Vui lòng điền đầy đủ tiêu đề, địa điểm và mô tả sự cố", "error");
      }

      const res = addTourIncident({
        tourId,
        guideId: session.username,
        level,
        location,
        title,
        description,
        by: session.name,
      });

      if (res.error) return toast(res.error, "error");

      closeModal();
      toast("Đã gửi báo cáo sự cố thành công! Ban điều hành đã nhận được thông tin.");
      refreshAdmin();
    });
  });
});

document.addEventListener("click", (e) => {
  const resolveBtn = e.target.closest("[data-resolve-incident]");
  if (resolveBtn) {
    const id = resolveBtn.dataset.resolveIncident;
    const title = resolveBtn.dataset.title;
    const session = getSession();

    openModal({
      title: "✓ Xác nhận giải quyết sự cố",
      subtitle: title,
      body: `
        <div class="field">
          <label for="incident-res-text">Biện pháp xử lý & Kết quả <span class="req">*</span></label>
          <textarea id="incident-res-text" rows="4" placeholder="Ví dụ: Đã hỗ trợ xe mới đón khách lúc 10:15, khách tiếp tục lịch trình an toàn..." required></textarea>
        </div>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" id="btn-save-resolution">Hoàn tất xử lý</button>`,
    });

    document.getElementById("btn-save-resolution")?.addEventListener("click", () => {
      const text = document.getElementById("incident-res-text")?.value;
      if (!text?.trim()) return toast("Vui lòng nhập biện pháp xử lý", "error");

      resolveTourIncident(id, { resolution: text, by: session.name });
      closeModal();
      toast("Đã cập nhật trạng thái sự cố sang ĐÃ GIẢI QUYẾT.");
      refreshAdmin();
    });
  }
});
