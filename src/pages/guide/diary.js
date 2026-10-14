import {
  listTourLogs,
  addTourLog,
  deleteTourLog,
  guideBookings,
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
import { assignedTours } from "./dashboard.js";

const FILTERS = { tourId: "" };

function tourName(booking) {
  return booking?.tourName || getTourById(booking?.tourId)?.name || "Tour không còn trong danh mục";
}

export function GuideDiary() {
  const denied = guideGuard("guide.diary.manage");
  if (denied) return denied;

  const session = getSession();
  const groups = assignedTours(session.username);

  // Mặc định chọn chuyến đầu tiên nếu chưa chọn
  if (!FILTERS.tourId && groups.length > 0) {
    FILTERS.tourId = groups[0].tourId;
  }

  const currentGroup = groups.find((g) => g.tourId === FILTERS.tourId) || groups[0];
  const logs = listTourLogs(FILTERS.tourId, session.username);

  return `
  <section class="panel">
    <div class="panel-head" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2>📖 Nhật ký hành trình & Báo cáo chuyến đi</h2>
        <p class="panel-sub">Ghi lại diễn biến thực tế từng ngày của tour, thời tiết, sự kiện nổi bật và phản hồi của đoàn</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" type="button" id="btn-add-diary">
          ✍️ Viết nhật ký mới
        </button>
        <button class="btn btn-outline" type="button" id="btn-export-tour-report">
          📄 Xuất báo cáo kết thúc tour
        </button>
      </div>
    </div>

    <div class="filter-bar" style="margin-top: 1rem;">
      <div class="filter-field filter-grow">
        <label for="diary-tour-select">Chọn chuyến tour</label>
        <select id="diary-tour-select">
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
  </section>

  <section class="panel" style="margin-top: 1.5rem;">
    <div class="panel-head">
      <div>
        <h3>Nhật ký hành trình: ${escapeHtml(currentGroup?.tour?.name || tourName(currentGroup?.bookings[0]) || "Chuyến đi")}</h3>
        <p class="panel-sub">Đã ghi ${logs.length} mốc nhật ký cho chuyến này</p>
      </div>
    </div>

    ${
      logs.length
        ? `<div class="timeline diary-timeline" style="margin-top: 1.25rem;">
            ${logs
              .map(
                (item) => `
              <div class="timeline-item diary-item" style="position: relative; padding-bottom: 24px; border-left: 2px solid #3b82f6; margin-left: 12px; padding-left: 20px;">
                <div style="position: absolute; left: -9px; top: 0; width: 16px; height: 16px; border-radius: 50%; background: #3b82f6; border: 3px solid #fff;"></div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                    <div>
                      <span class="status-pill status-paid" style="font-weight: 700; margin-right: 6px;">NGÀY ${item.dayNumber}</span>
                      <strong style="font-size: 1.1rem; color: #0f172a;">${escapeHtml(item.title)}</strong>
                      <span style="display: block; font-size: 0.85rem; color: #64748b; margin-top: 2px;">
                        📅 ${escapeHtml(formatDate(item.date))} · Người ghi: <strong>${escapeHtml(item.by)}</strong>
                      </span>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-xs btn-outline-danger" type="button" data-delete-diary="${escapeHtml(item.id)}">Xoá</button>
                    </div>
                  </div>

                  <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 0.85rem; background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                    <span>⛅ Thời tiết: <strong style="color: #0284c7;">${escapeHtml(item.weather || "Bình thường")}</strong></span>
                    <span>😊 Tâm trạng đoàn: <strong style="color: #16a34a;">${escapeHtml(item.mood || "Hào hứng")}</strong></span>
                  </div>

                  <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; white-space: pre-wrap;">
                    ${escapeHtml(item.content)}
                  </div>
                </div>
              </div>`
              )
              .join("")}
          </div>`
        : emptyState("Chưa có mục nhật ký nào cho chuyến này. Hãy bấm 'Viết nhật ký mới' để bắt đầu ghi lại diễn biến chuyến đi!")
    }
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "guide/diary") return;

  const session = getSession();
  const select = document.getElementById("diary-tour-select");
  select?.addEventListener("change", (e) => {
    FILTERS.tourId = e.target.value;
    refreshAdmin();
  });

  // Mở modal thêm nhật ký
  document.getElementById("btn-add-diary")?.addEventListener("click", () => {
    const groups = assignedTours(session.username);
    if (!groups.length) return toast("Bạn chưa được phân công tour nào.", "error");

    openModal({
      title: "✍️ Viết nhật ký hành trình",
      subtitle: "Ghi lại diễn biến, sự kiện và phản hồi của đoàn khách",
      size: "lg",
      body: `
        <form id="form-new-diary" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="field">
            <label for="nd-tour">Chuyến tour <span class="req">*</span></label>
            <select id="nd-tour" required>
              ${groups
                .map(
                  (g) =>
                    `<option value="${escapeHtml(g.tourId)}" ${g.tourId === FILTERS.tourId ? "selected" : ""}>${escapeHtml(g.tour?.name || tourName(g.bookings[0]))}</option>`
                )
                .join("")}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="field">
              <label for="nd-day">Ngày thứ mấy <span class="req">*</span></label>
              <input id="nd-day" type="number" min="1" max="30" value="1" required />
            </div>
            <div class="field">
              <label for="nd-date">Ngày thực tế <span class="req">*</span></label>
              <input id="nd-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required />
            </div>
          </div>

          <div class="field">
            <label for="nd-title">Tiêu đề mốc nhật ký <span class="req">*</span></label>
            <input id="nd-title" type="text" placeholder="Ví dụ: Đón đoàn tại điểm hẹn & Viếng chùa..." required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="field">
              <label for="nd-weather">Thời tiết trong ngày</label>
              <input id="nd-weather" type="text" placeholder="Ví dụ: Nắng ráo (28°C), có gió nhẹ" />
            </div>
            <div class="field">
              <label for="nd-mood">Tâm trạng & Tinh thần đoàn</label>
              <input id="nd-mood" type="text" placeholder="Ví dụ: Cả đoàn vui vẻ, hào hứng" />
            </div>
          </div>

          <div class="field">
            <label for="nd-content">Nội dung diễn biến chi tiết <span class="req">*</span></label>
            <textarea id="nd-content" rows="5" placeholder="Ghi nhận giờ xuất phát, các điểm tham quan, tình hình ăn uống nghỉ ngơi của khách, lưu ý phát sinh..." required></textarea>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" id="btn-save-diary">Lưu nhật ký</button>`,
    });

    document.getElementById("btn-save-diary")?.addEventListener("click", () => {
      const tourId = document.getElementById("nd-tour")?.value;
      const dayNumber = document.getElementById("nd-day")?.value;
      const date = document.getElementById("nd-date")?.value;
      const title = document.getElementById("nd-title")?.value;
      const weather = document.getElementById("nd-weather")?.value;
      const mood = document.getElementById("nd-mood")?.value;
      const content = document.getElementById("nd-content")?.value;

      if (!title?.trim() || !content?.trim()) {
        return toast("Vui lòng nhập đầy đủ tiêu đề và nội dung nhật ký", "error");
      }

      addTourLog({
        tourId,
        guideId: session.username,
        dayNumber,
        date,
        title,
        weather,
        mood,
        content,
        by: session.name,
      });

      closeModal();
      toast("Đã lưu nhật ký hành trình thành công!");
      FILTERS.tourId = tourId;
      refreshAdmin();
    });
  });

  // Xuất báo cáo kết thúc tour
  document.getElementById("btn-export-tour-report")?.addEventListener("click", () => {
    const groups = assignedTours(session.username);
    const group = groups.find((g) => g.tourId === FILTERS.tourId) || groups[0];
    if (!group) return toast("Chưa có chuyến tour nào", "error");

    const logs = listTourLogs(group.tourId, session.username);
    const guests = group.bookings;
    const totalPeople = guests.reduce((sum, b) => sum + (Number(b.people) || 0), 0);

    const reportContent = `
======================================================
       BÁO CÁO KẾT THÚC TOUR & BÀN GIAO ĐOÀN
              TRAVELGO VIỆT NAM
======================================================
Tour: ${group.tour?.name || tourName(group.bookings[0])}
Mã tour: ${group.tourId}
Khởi hành: ${formatDate(group.bookings[0]?.date)}
Hướng dẫn viên: ${session.name} (${session.username})
Quy mô đoàn: ${guests.length} đơn đặt / ${totalPeople} khách

1. TÌNH HÌNH ĐOÀN & ĐIỂM DANH:
- Tổng số khách: ${totalPeople} người
- Có mặt: ${guests.filter((b) => b.attendance === "present").reduce((sum, b) => sum + (Number(b.people) || 0), 0)} người
- Vắng mặt: ${guests.filter((b) => b.attendance === "absent").reduce((sum, b) => sum + (Number(b.people) || 0), 0)} người

2. TỔNG KẾT NHẬT KÝ HÀNH TRÌNH:
${
  logs.length
    ? logs
        .map(
          (l) => `
[Ngày ${l.dayNumber} - ${l.date}] ${l.title}
- Thời tiết: ${l.weather || "Bình thường"} | Tâm trạng đoàn: ${l.mood || "Tốt"}
- Chi tiết: ${l.content}
`
        )
        .join("")
    : "Chưa ghi nhật ký chi tiết."
}

3. KẾT LUẬN & ĐỀ XUẤT CỦA HƯỚNG DẪN VIÊN:
- Chuyến đi đã hoàn thành an toàn và đúng lịch trình quy định.
- Khách hàng hài lòng với chất lượng dịch vụ và thái độ phục vụ của đoàn.

Người lập báo cáo:
${session.name}
Thời gian: ${new Date().toLocaleString("vi-VN")}
======================================================`;

    openModal({
      title: "📄 Báo cáo kết thúc tour",
      subtitle: "Biên bản báo cáo bàn giao gửi về ban điều hành công ty",
      size: "lg",
      body: `
        <div style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; max-height: 400px; overflow-y: auto; white-space: pre-wrap;">
${escapeHtml(reportContent)}
        </div>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" id="btn-copy-report">📋 Sao chép nội dung</button>`,
    });

    document.getElementById("btn-copy-report")?.addEventListener("click", () => {
      navigator.clipboard.writeText(reportContent);
      toast("Đã sao chép toàn bộ nội dung báo cáo!");
    });
  });
});

document.addEventListener("click", (e) => {
  const delBtn = e.target.closest("[data-delete-diary]");
  if (delBtn) {
    if (!confirm("Bạn có chắc chắn muốn xoá mốc nhật ký này?")) return;
    deleteTourLog(delBtn.dataset.deleteDiary);
    toast("Đã xoá mốc nhật ký.");
    refreshAdmin();
  }
});
