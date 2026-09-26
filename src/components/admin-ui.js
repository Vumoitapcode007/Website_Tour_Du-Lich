import { escapeHtml } from "../validate.js";

/* ---------- Định dạng ---------- */

export function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(Number(value) || 0)) + " đ";
}

export function formatCompact(value) {
  const number = Math.round(Number(value) || 0);
  if (Math.abs(number) >= 1000000000) return (number / 1000000000).toFixed(1).replace(".", ",") + " tỷ";
  if (Math.abs(number) >= 1000000) return (number / 1000000).toFixed(1).replace(".", ",") + " tr";
  if (Math.abs(number) >= 1000) return (number / 1000).toFixed(0) + "k";
  return String(number);
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function stars(rating = 0) {
  const full = Math.round(Number(rating) || 0);
  return `<span class="stars" title="${full}/5">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>`;
}

export function statusBadge(status, map) {
  return `<span class="status-pill status-${escapeHtml(status)}">${escapeHtml(map[status] || status)}</span>`;
}

export function progressBar(percent, label = "") {
  const value = Math.max(0, Math.min(100, Math.round(percent) || 0));
  return `
  <div class="progress" title="${value}%">
    <div class="progress-fill" style="width:${value}%"></div>
    <span class="progress-label">${label ? escapeHtml(label) : value + "%"}</span>
  </div>`;
}

export function emptyState(message, action = "") {
  return `<div class="empty-state"><div class="empty-icon">🗂</div><p>${escapeHtml(message)}</p>${action}</div>`;
}

/* ---------- Biểu đồ SVG ---------- */

const PALETTE = ["#1677ff", "#0d47a1", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#ec4899"];

export function colorAt(index) {
  return PALETTE[index % PALETTE.length];
}

export function barChart(data, { height = 210, valueKey = "revenue", labelKey = "label", format = formatCompact } = {}) {
  const max = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);
  const width = Math.max(data.length * 64, 280);

  const bars = data
    .map((item, index) => {
      const value = Number(item[valueKey]) || 0;
      const barHeight = Math.max(Math.round((value / max) * (height - 46)), value > 0 ? 4 : 0);
      const x = index * (width / data.length) + 10;
      const barWidth = Math.max(width / data.length - 22, 8);
      return `
      <g>
        <rect x="${x}" y="${height - 28 - barHeight}" width="${barWidth}" height="${barHeight}" rx="6"
              fill="${colorAt(index)}" opacity="0.9">
          <title>${escapeHtml(item[labelKey])}: ${escapeHtml(format(value))}</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${height - 26}" text-anchor="middle" class="chart-axis">${escapeHtml(item[labelKey])}</text>
        <text x="${x + barWidth / 2}" y="${height - 32 - barHeight}" text-anchor="middle" class="chart-value">${escapeHtml(format(value))}</text>
      </g>`;
    })
    .join("");

  return `
  <div class="chart-scroll">
    <svg viewBox="0 0 ${width} ${height}" class="chart" preserveAspectRatio="xMidYMid meet" role="img">
      <line x1="0" y1="${height - 28}" x2="${width}" y2="${height - 28}" class="chart-axis-line" />
      ${bars}
    </svg>
  </div>`;
}

export function lineChart(data, { height = 210, valueKey = "revenue", labelKey = "label", format = formatCompact } = {}) {
  const values = data.map((item) => Number(item[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const stepX = data.length > 1 ? 100 / (data.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = data.length > 1 ? index * stepX : 50;
    const y = 92 - (value / max) * 74;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const dots = data
    .map((item, index) => {
      const [x, y] = points[index].split(",");
      return `
      <g>
        <circle cx="${x}" cy="${y}" r="4" fill="#1677ff" stroke="#fff" stroke-width="2">
          <title>${escapeHtml(item[labelKey])}: ${escapeHtml(format(values[index]))}</title>
        </circle>
        <text x="${x}" y="100" text-anchor="middle" class="chart-axis">${escapeHtml(item[labelKey])}</text>
      </g>`;
    })
    .join("");

  return `
  <div class="chart-scroll">
    <svg viewBox="0 0 100 ${height / 2}" class="chart" preserveAspectRatio="none" role="img">
      <polygon points="0,100 ${points.join(" ")} 100,100" fill="#1677ff" opacity="0.12" />
      <polyline points="${points.join(" ")}" fill="none" stroke="#1677ff" stroke-width="0.8"
                stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      ${dots}
    </svg>
  </div>`;
}

export function donutChart(data, { size = 190, thickness = 26 } = {}) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = total
    ? data
        .map((item, index) => {
          const share = (Number(item.value) || 0) / total;
          const length = share * circumference;
          const segment = `
          <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
                  stroke="${colorAt(index)}" stroke-width="${thickness}"
                  stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}"
                  stroke-dashoffset="${(-offset).toFixed(2)}"
                  transform="rotate(-90 ${size / 2} ${size / 2})">
            <title>${escapeHtml(item.label)}: ${item.value}</title>
          </circle>`;
          offset += length;
          return segment;
        })
        .join("")
    : `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="${thickness}" />`;

  const legend = data
    .map(
      (item, index) => `
      <li>
        <span class="legend-dot" style="background:${colorAt(index)}"></span>
        <span>${escapeHtml(item.label)}</span>
        <strong>${total ? Math.round(((Number(item.value) || 0) / total) * 100) : 0}%</strong>
      </li>`
    )
    .join("");

  return `
  <div class="donut-wrap">
    <svg viewBox="0 0 ${size} ${size}" class="donut" role="img">
      ${segments}
      <text x="${size / 2}" y="${size / 2 - 2}" text-anchor="middle" class="donut-total">${total}</text>
      <text x="${size / 2}" y="${size / 2 + 16}" text-anchor="middle" class="donut-caption">tổng</text>
    </svg>
    <ul class="legend">${legend}</ul>
  </div>`;
}

/* ---------- Thông báo nhanh ---------- */

function ensureLayer() {
  let box = document.getElementById("admin-toast-layer");
  if (!box) {
    box = document.createElement("div");
    box.id = "admin-toast-layer";
    box.className = "toast-layer";
    document.body.appendChild(box);
  }
  return box;
}

export function toast(message, type = "success") {
  const box = ensureLayer();
  const icons = { success: "✔", error: "✖", info: "ℹ", warning: "!" };
  const node = document.createElement("div");
  node.className = `toast toast-${type}`;
  node.setAttribute("role", "status");
  node.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  box.appendChild(node);

  window.setTimeout(() => {
    node.classList.add("hide");
    window.setTimeout(() => node.remove(), 250);
  }, 2800);
}

export function confirmAction(message) {
  return window.confirm(message);
}

/* ---------- Hộp thoại ---------- */

function ensureModal() {
  let overlay = document.getElementById("admin-modal");
  if (overlay) {
    overlay.innerHTML = "";
    overlay.hidden = false;
    return overlay;
  }
  overlay = document.createElement("div");
  overlay.id = "admin-modal";
  overlay.className = "modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <header class="modal-head">
      <div>
        <h3 data-modal-title></h3>
        <p class="modal-sub" data-modal-sub></p>
      </div>
      <button class="modal-close" type="button" data-modal-close aria-label="Đóng">✕</button>
    </header>
    <div class="modal-body" data-modal-body></div>
    <footer class="modal-foot" data-modal-foot></footer>
  </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-modal-close]")) closeModal();
  });

  return overlay;
}

export function openModal({ title, subtitle = "", body = "", footer = "", size = "" }) {
  const overlay = ensureModal();
  overlay.querySelector(".modal").className = `modal ${size ? `modal-${size}` : ""}`;
  overlay.querySelector("[data-modal-title]").textContent = title;
  overlay.querySelector("[data-modal-sub]").textContent = subtitle;
  overlay.querySelector("[data-modal-body]").innerHTML = body;
  overlay.querySelector("[data-modal-foot]").innerHTML = footer;
  overlay.hidden = false;
  document.body.classList.add("modal-open");
  overlay.querySelector("[data-modal-close]").focus();
}

export function closeModal() {
  const overlay = document.getElementById("admin-modal");
  if (!overlay) return;
  overlay.hidden = true;
  overlay.querySelector("[data-modal-body]").innerHTML = "";
  document.body.classList.remove("modal-open");
}

/* ---------- Xuất CSV ---------- */

export function downloadCsv(filename, header, rows) {
  if (!rows.length) {
    toast("Không có dữ liệu để xuất.", "warning");
    return false;
  }
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast(`Đã xuất ${rows.length} dòng dữ liệu.`);
  return true;
}

export function stamp() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- Phân trang ---------- */

export function paginationHtml(page, totalPages, total) {
  if (totalPages <= 1) return `<p class="result-count">${total} bản ghi</p>`;
  const buttons = [];
  const push = (label, target, disabled = false, active = false) =>
    buttons.push(
      `<button class="page-btn${active ? " active" : ""}" type="button" data-page="${target}"${disabled ? " disabled" : ""}>${label}</button>`
    );

  push("«", 1, page === 1);
  push("‹", page - 1, page === 1);
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) push(i, i, false, i === page);
    else if (Math.abs(i - page) === 2) push("…", i);
  }
  push("›", page + 1, page === totalPages);
  push("»", totalPages, page === totalPages);

  return `
  <div class="pagination">
    <span class="pagination-info">Trang ${page}/${totalPages} · ${total} bản ghi</span>
    <div class="pagination-controls">${buttons.join("")}</div>
  </div>`;
}

/* ---------- Bộ điều khiển bảng ---------- */

export function createListController({
  mount,
  render,
  count,
  pageSize = 10,
  pageEl,
  load,
  onReset = null,
}) {
  const box = typeof mount === "string" ? document.querySelector(mount) : mount;
  const countBox = typeof count === "string" ? document.querySelector(count) : count;
  const pageBox = typeof pageEl === "string" ? document.querySelector(pageEl) : pageEl;
  let page = 1;

  function state() {
    return { items: typeof load === "function" ? load() : [], page, pageSize };
  }

  function visible() {
    const { items, pageSize: size } = state();
    const totalPages = Math.max(Math.ceil(items.length / size), 1);
    page = Math.min(Math.max(page, 1), totalPages);
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  }

  function refresh() {
    const { items } = state();
    if (box) box.innerHTML = render(visible(), items);
    if (countBox) {
      const keyword = onReset ? onReset() : null;
      countBox.textContent = keyword
        ? `Tìm thấy ${items.length} bản ghi cho "${keyword}"`
        : `Tổng ${items.length} bản ghi`;
    }
    if (pageBox) {
      const totalPages = Math.max(Math.ceil(items.length / state().pageSize), 1);
      pageBox.innerHTML = paginationHtml(page, totalPages, items.length);
    }
  }

  function bind() {
    if (pageBox) {
      pageBox.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button) return;
        page = Number(button.dataset.page) || 1;
        refresh();
        box?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  return { refresh, bind, reset: () => { page = 1; refresh(); }, get page() { return page; } };
}

/* ---------- Chọn nhiều dòng ---------- */

export function setupSelection({ headCheckbox, bodyBox, onChange = () => {} }) {
  const head = typeof headCheckbox === "string" ? document.querySelector(headCheckbox) : headCheckbox;
  if (!head || !bodyBox) return { selected: () => [], refresh: () => {} };

  function boxes() {
    return [...bodyBox.querySelectorAll('input[type="checkbox"][data-select]')];
  }

  function paint() {
    const list = boxes();
    const checked = list.filter((box) => box.checked);
    head.checked = list.length > 0 && checked.length === list.length;
    head.indeterminate = checked.length > 0 && checked.length < list.length;
    onChange(checked.map((box) => box.value));
  }

  head.addEventListener("change", () => {
    boxes().forEach((box) => (box.checked = head.checked));
    paint();
  });

  bodyBox.addEventListener("change", (event) => {
    if (event.target.matches('input[type="checkbox"][data-select]')) paint();
  });

  return {
    selected: () => boxes().filter((box) => box.checked).map((box) => box.value),
    refresh: paint,
  };
}
