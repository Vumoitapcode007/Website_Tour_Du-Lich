import {
  EXPENSE_CATEGORIES,
  listTourExpenses,
  addTourExpense,
  deleteTourExpense,
  getTourExpenseSummary,
} from "../../store.js";
import { getTourById } from "../../tour-repository.js";
import { getSession } from "../../auth.js";
import { guideGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  emptyState,
  formatMoney,
  openModal,
  closeModal,
  downloadCsv,
  stamp,
  toast,
} from "../../components/admin-ui.js";
import { formatDate } from "../../data.js";
import { escapeHtml } from "../../validate.js";
import { assignedTours } from "./dashboard.js";

const FILTERS = { tourId: "", category: "" };

function tourName(booking) {
  return booking?.tourName || getTourById(booking?.tourId)?.name || "Tour không còn trong danh mục";
}

export function GuideExpenses() {
  const denied = guideGuard("guide.expenses.manage");
  if (denied) return denied;

  const session = getSession();
  const groups = assignedTours(session.username);

  if (!FILTERS.tourId && groups.length > 0) {
    FILTERS.tourId = groups[0].tourId;
  }

  const currentGroup = groups.find((g) => g.tourId === FILTERS.tourId) || groups[0];
  const summary = getTourExpenseSummary(FILTERS.tourId, session.username);
  const expenses = listTourExpenses(FILTERS.tourId, session.username).filter(
    (item) => !FILTERS.category || item.category === FILTERS.category
  );

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue">
      <p class="kpi-label">Tạm ứng từ công ty</p>
      <strong class="kpi-value">${formatMoney(summary.advanceBudget)}</strong>
      <span class="kpi-hint">Ngân sách khởi hành</span>
    </article>
    <article class="kpi kpi-amber">
      <p class="kpi-label">Tiền mặt thu từ khách</p>
      <strong class="kpi-value">${formatMoney(summary.cashCollected)}</strong>
      <span class="kpi-hint">Thu trực tiếp trong tour</span>
    </article>
    <article class="kpi kpi-violet">
      <p class="kpi-label">Tổng chi phí thực tế</p>
      <strong class="kpi-value" style="color: #ef4444;">${formatMoney(summary.totalExpense)}</strong>
      <span class="kpi-hint">${summary.count} khoản chi có chứng từ</span>
    </article>
    <article class="kpi ${summary.balance >= 0 ? "kpi-green" : "kpi-amber"}">
      <p class="kpi-label">Chênh lệch hoàn ứng</p>
      <strong class="kpi-value" style="color: ${summary.balance >= 0 ? "#16a34a" : "#ea580c"};">
        ${formatMoney(Math.abs(summary.balance))}
      </strong>
      <span class="kpi-hint">${summary.balance >= 0 ? "HDV hoàn trả công ty" : "Công ty hoàn trả lại HDV"}</span>
    </article>
  </section>

  <section class="panel">
    <div class="panel-head" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2>💳 Quản lý chi tiêu & Quyết toán đoàn</h2>
        <p class="panel-sub">Theo dõi các khoản chi thực tế (vé tham quan, ăn uống, xăng xe, phát sinh) và đối soát tài chính với công ty</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" type="button" id="btn-add-expense">
          ➕ Thêm khoản chi mới
        </button>
        <button class="btn btn-outline" type="button" id="btn-export-expenses">
          📥 Xuất bảng kê chi tiêu (CSV)
        </button>
      </div>
    </div>

    <div class="filter-bar" style="margin-top: 1rem;">
      <div class="filter-field filter-grow">
        <label for="exp-tour-select">Chọn chuyến tour</label>
        <select id="exp-tour-select">
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
      <div class="filter-field">
        <label for="exp-cat-select">Danh mục chi tiêu</label>
        <select id="exp-cat-select">
          <option value="">Tất cả danh mục</option>
          ${Object.entries(EXPENSE_CATEGORIES)
            .map(([val, label]) => `<option value="${val}" ${FILTERS.category === val ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <!-- Phân tích chi tiêu theo danh mục -->
    <div style="margin-top: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
      <strong style="font-size: 0.9rem; color: #334155; display: block; margin-bottom: 8px;">📊 Cơ cấu chi tiêu của chuyến:</strong>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${
          Object.entries(EXPENSE_CATEGORIES)
            .map(([key, label]) => {
              const amount = summary.byCategory[key] || 0;
              return `
              <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: 0.85rem;">
                <span style="color: #64748b;">${label}:</span>
                <strong style="color: ${amount > 0 ? "#0f172a" : "#94a3b8"}; margin-left: 4px;">${formatMoney(amount)}</strong>
              </div>`;
            })
            .join("")
        }
      </div>
    </div>
  </section>

  <section class="panel" style="margin-top: 1.5rem;">
    <div class="panel-head">
      <div>
        <h3>Danh sách các khoản chi: ${escapeHtml(currentGroup?.tour?.name || tourName(currentGroup?.bookings[0]) || "Chuyến đi")}</h3>
        <p class="panel-sub">Hiển thị ${expenses.length} khoản chi</p>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã chi</th>
            <th>Ngày chi</th>
            <th>Danh mục</th>
            <th>Tên khoản chi</th>
            <th>Số tiền</th>
            <th>Số hóa đơn/CT</th>
            <th>Ghi chú</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${
            expenses.length
              ? expenses
                  .map(
                    (item) => `
                <tr>
                  <td><strong class="code">${escapeHtml(item.id)}</strong></td>
                  <td>${escapeHtml(formatDate(item.date))}</td>
                  <td><span class="status-pill status-open">${escapeHtml(EXPENSE_CATEGORIES[item.category] || "Khác")}</span></td>
                  <td><strong>${escapeHtml(item.title)}</strong></td>
                  <td><strong style="color: #dc2626; font-size: 1rem;">${formatMoney(item.amount)}</strong></td>
                  <td>${item.receiptNo ? `<span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${escapeHtml(item.receiptNo)}</span>` : '<span style="color:#94a3b8;">-</span>'}</td>
                  <td><small style="color: #64748b;">${escapeHtml(item.note || "-")}</small></td>
                  <td class="row-actions">
                    <button class="btn btn-xs btn-outline-danger" type="button" data-delete-exp="${escapeHtml(item.id)}">Xoá</button>
                  </td>
                </tr>`
                  )
                  .join("")
              : `<tr><td colspan="8" class="table-empty">${emptyState("Chưa có khoản chi nào cho chuyến này. Bấm 'Thêm khoản chi mới' để ghi nhận hoá đơn/chứng từ.")}</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "guide/expenses") return;

  const session = getSession();

  document.getElementById("exp-tour-select")?.addEventListener("change", (e) => {
    FILTERS.tourId = e.target.value;
    refreshAdmin();
  });

  document.getElementById("exp-cat-select")?.addEventListener("change", (e) => {
    FILTERS.category = e.target.value;
    refreshAdmin();
  });

  // Modal thêm khoản chi
  document.getElementById("btn-add-expense")?.addEventListener("click", () => {
    const groups = assignedTours(session.username);
    if (!groups.length) return toast("Bạn chưa được phân công tour nào.", "error");

    openModal({
      title: "➕ Thêm khoản chi tiêu đoàn",
      subtitle: "Ghi nhận hóa đơn, vé, phí ăn uống và chi phí thực tế",
      size: "lg",
      body: `
        <form id="form-new-expense" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="field">
            <label for="ne-tour">Chuyến tour <span class="req">*</span></label>
            <select id="ne-tour" required>
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
              <label for="ne-cat">Danh mục chi tiêu <span class="req">*</span></label>
              <select id="ne-cat" required>
                ${Object.entries(EXPENSE_CATEGORIES)
                  .map(([val, label]) => `<option value="${val}">${label}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label for="ne-date">Ngày chi <span class="req">*</span></label>
              <input id="ne-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
            <div class="field">
              <label for="ne-title">Tên khoản chi <span class="req">*</span></label>
              <input id="ne-title" type="text" placeholder="Ví dụ: Vé xe điện, Mua nước suối..." required />
            </div>
            <div class="field">
              <label for="ne-amount">Số tiền (VNĐ) <span class="req">*</span></label>
              <input id="ne-amount" type="number" min="1000" step="1000" placeholder="Số tiền..." required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px;">
            <div class="field">
              <label for="ne-receipt">Số hóa đơn / Chứng từ</label>
              <input id="ne-receipt" type="text" placeholder="Ví dụ: HD-1029..." />
            </div>
            <div class="field">
              <label for="ne-note">Ghi chú chi tiết</label>
              <input id="ne-note" type="text" placeholder="Ví dụ: Xuất vé cho 5 khách..." />
            </div>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-light" type="button" data-modal-close>Đóng</button>
        <button class="btn btn-primary" type="button" id="btn-save-expense">Lưu khoản chi</button>`,
    });

    document.getElementById("btn-save-expense")?.addEventListener("click", () => {
      const tourId = document.getElementById("ne-tour")?.value;
      const category = document.getElementById("ne-cat")?.value;
      const date = document.getElementById("ne-date")?.value;
      const title = document.getElementById("ne-title")?.value;
      const amount = document.getElementById("ne-amount")?.value;
      const receiptNo = document.getElementById("ne-receipt")?.value;
      const note = document.getElementById("ne-note")?.value;

      const res = addTourExpense({
        tourId,
        guideId: session.username,
        category,
        date,
        title,
        amount,
        receiptNo,
        note,
        by: session.name,
      });

      if (res.error) return toast(res.error, "error");

      closeModal();
      toast("Đã thêm khoản chi tiêu thành công!");
      FILTERS.tourId = tourId;
      refreshAdmin();
    });
  });

  // Xuất CSV chi tiêu
  document.getElementById("btn-export-expenses")?.addEventListener("click", () => {
    const list = listTourExpenses(FILTERS.tourId, session.username);
    if (!list.length) return toast("Không có dữ liệu chi tiêu để xuất.", "error");

    const rows = list.map((item) => [
      item.id,
      item.date,
      EXPENSE_CATEGORIES[item.category] || "Khác",
      item.title,
      item.amount,
      item.receiptNo,
      item.note,
      item.by,
    ]);

    downloadCsv(
      `bang-ke-chi-tieu-${stamp()}`,
      ["Mã chi", "Ngày chi", "Danh mục", "Khoản chi", "Số tiền (VNĐ)", "Hóa đơn/CT", "Ghi chú", "Người chi"],
      rows
    );
  });
});

document.addEventListener("click", (e) => {
  const delBtn = e.target.closest("[data-delete-exp]");
  if (delBtn) {
    if (!confirm("Bạn có chắc chắn muốn xoá khoản chi này?")) return;
    deleteTourExpense(delBtn.dataset.deleteExp);
    toast("Đã xoá khoản chi.");
    refreshAdmin();
  }
});
