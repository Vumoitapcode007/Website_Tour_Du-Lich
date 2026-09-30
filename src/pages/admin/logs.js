import { clearLogs, listLogs, logActivity } from "../../store.js";
import { formatDateTime, formatRelative } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import { confirmAction, createListController, downloadCsv, initials, stamp, toast } from "../../components/admin-ui.js";
import { escapeHtml, searchKey } from "../../validate.js";

const FILTERS = { q: "", actor: "" };

function filterLogs(list) {
  const query = searchKey(FILTERS.q);
  return list.filter((item) => {
    if (FILTERS.actor && item.user !== FILTERS.actor) return false;
    if (query && !searchKey(`${item.user} ${item.action} ${item.detail}`).includes(query)) return false;
    return true;
  });
}

function row(entry) {
  return `
  <tr data-id="${escapeHtml(entry.id)}" data-search="${escapeHtml(
    searchKey(`${entry.user} ${entry.action} ${entry.detail}`)
  )}">
    <td>${formatDateTime(entry.createdAt)}<br><small>${formatRelative(entry.createdAt)}</small></td>
    <td>
      <span class="cell-user">
        <span class="avatar-sm">${initials(entry.user)}</span>
        <span><strong>${escapeHtml(entry.user)}</strong></span>
      </span>
    </td>
    <td><span class="log-action">${escapeHtml(entry.action)}</span></td>
    <td>${escapeHtml(entry.detail || "-")}</td>
  </tr>`;
}

export function Logs() {
  const denied = adminGuard("logs.view");
  if (denied) return denied;

  const logs = listLogs(500);
  const today = logs.filter((item) => item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const actors = [...new Set(logs.map((item) => item.user))];

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng thao tác</p><strong class="kpi-value">${logs.length}</strong><span class="kpi-hint">Đang lưu tối đa 300 bản ghi</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Trong hôm nay</p><strong class="kpi-value">${today.length}</strong><span class="kpi-hint">Từ lúc bắt đầu ca</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Người thao tác</p><strong class="kpi-value">${actors.length}</strong><span class="kpi-hint">${escapeHtml(actors.slice(0, 3).join(", "))}</span></article>
    <article class="kpi kpi-slate"><p class="kpi-label">Hoạt động gần nhất</p><strong class="kpi-value kpi-value-sm">${escapeHtml(
      logs[0]?.action || "-"
    )}</strong><span class="kpi-hint">${logs[0] ? formatRelative(logs[0].createdAt) : "Chưa có"}</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="lg-q">Tìm nhật ký</label>
        <input id="lg-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Người thực hiện, hành động, nội dung..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="lg-actor">Người thực hiện</label>
        <select id="lg-actor">
          <option value="">Tất cả</option>
          ${actors.map((actor) => `<option value="${escapeHtml(actor)}">${escapeHtml(actor)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-outline" type="button" id="lg-export">Xuất CSV</button>
        <button class="btn btn-outline-danger" type="button" id="lg-clear">Xoá nhật ký</button>
      </div>
    </div>

    <p class="result-count" id="lg-count" role="status"></p>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Chi tiết</th></tr>
        </thead>
        <tbody id="lg-rows"></tbody>
      </table>
    </div>
    <div id="lg-page"></div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "logs") return;
  const rowsBox = document.getElementById("lg-rows");
  if (!rowsBox) return;

  const controller = createListController({
    mount: "#lg-rows",
    count: "#lg-count",
    pageEl: "#lg-page",
    pageSize: 15,
    load: () => filterLogs(listLogs(500)),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="4" class="table-empty">Không có nhật ký nào khớp bộ lọc.</td></tr>`,
  });
  controller.refresh();
  controller.bind();

  const actorSelect = document.getElementById("lg-actor");
  if (actorSelect) actorSelect.value = FILTERS.actor;

  document.getElementById("lg-q")?.addEventListener("input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
  });
  document.getElementById("lg-actor")?.addEventListener("change", (event) => {
    FILTERS.actor = event.target.value;
    controller.reset();
  });

  document.getElementById("lg-export")?.addEventListener("click", () => {
    downloadCsv(
      `nhat-ky-${stamp()}`,
      ["Thời gian", "Người thực hiện", "Hành động", "Chi tiết"],
      filterLogs(listLogs(500)).map((item) => [item.createdAt, item.user, item.action, item.detail])
    );
  });

  document.getElementById("lg-clear")?.addEventListener("click", () => {
    if (!confirmAction("Xoá toàn bộ nhật ký hoạt động?")) return;
    clearLogs();
    logActivity("Xoá nhật ký", "Xoá toàn bộ nhật ký hoạt động");
    toast("Đã xoá nhật ký.");
    refreshAdmin();
  });
});
