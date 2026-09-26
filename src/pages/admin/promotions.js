import {
  COUPON_TYPE,
  listBookings,
  listCoupons,
  logActivity,
  removeCoupon,
  saveCoupon,
  updateCoupon,
} from "../../store.js";
import { formatDate } from "../../data.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  closeModal,
  confirmAction,
  createListController,
  downloadCsv,
  openModal,
  progressBar,
  setupSelection,
  stamp,
  toast,
} from "../../components/admin-ui.js";
import { hasPermission } from "../../auth.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("promotions.manage");

const FILTERS = { q: "", type: "", state: "" };

let view = "table";

function couponState(coupon) {
  const today = new Date().toISOString().slice(0, 10);
  if (!coupon.active) return { key: "inactive", label: "Tạm dừng" };
  if (coupon.endDate && coupon.endDate < today) return { key: "expired", label: "Đã hết hạn" };
  if (coupon.startDate && coupon.startDate > today) return { key: "scheduled", label: "Đã lên lịch" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { key: "exhausted", label: "Đã dùng hết" };
  return { key: "active", label: "Đang chạy" };
}

const STATE_STATUS = {
  active: "Đang chạy",
  scheduled: "Đã lên lịch",
  expired: "Đã hết hạn",
  exhausted: "Đã dùng hết",
  inactive: "Tạm dừng",
};

function filterCoupons(list) {
  const query = searchKey(FILTERS.q);
  return list.filter((item) => {
    if (FILTERS.type && item.type !== FILTERS.type) return false;
    if (FILTERS.state && couponState(item).key !== FILTERS.state) return false;
    if (query && !searchKey(`${item.code} ${item.description}`).includes(query)) return false;
    return true;
  });
}

function row(coupon) {
  const state = couponState(coupon);
  const used = coupon.usageLimit || 0;
  return `
  <tr data-id="${escapeHtml(coupon.id)}" data-search="${escapeHtml(
    searchKey(`${coupon.code} ${coupon.description}`)
  )}">
    <td class="cell-check">
      ${canManage() ? `<input type="checkbox" data-select value="${escapeHtml(coupon.id)}" aria-label="Chọn mã ${escapeHtml(coupon.code)}">` : ""}
    </td>
    <td><strong class="code-chip">${escapeHtml(coupon.code)}</strong><br><small>${escapeHtml(coupon.description || "")}</small></td>
    <td>${COUPON_TYPE[coupon.type]}<br><strong>${
      coupon.type === "percent" ? `${coupon.value}%` : new Intl.NumberFormat("vi-VN").format(coupon.value) + " đ"
    }</strong></td>
    <td>${coupon.minTotal ? `Từ ${new Intl.NumberFormat("vi-VN").format(coupon.minTotal)} đ` : "Không"}
      ${coupon.type === "percent" && coupon.maxDiscount ? `<br><small>Giảm tối đa ${new Intl.NumberFormat("vi-VN").format(coupon.maxDiscount)} đ</small>` : ""}</td>
    <td class="cell-usage">
      ${progressBar(used ? (coupon.usedCount / used) * 100 : 0, `${coupon.usedCount}/${used || "∞"}`)}
    </td>
    <td>${formatDate(coupon.startDate)}<br><small>đến ${formatDate(coupon.endDate)}</small></td>
    <td><span class="status-pill status-${state.key === "active" ? "open" : state.key === "expired" || state.key === "exhausted" ? "cancelled" : state.key === "inactive" ? "closed" : "pending"}">${escapeHtml(state.label)}</span></td>
    <td class="row-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-coupon-action="copy">Sao chép</button>
      ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" data-coupon-action="edit">Sửa</button>` : ""}
      ${
        canManage()
          ? `<button class="btn btn-sm btn-outline" type="button" data-coupon-action="toggle">${coupon.active ? "Tạm dừng" : "Kích hoạt"}</button>`
          : ""
      }
      ${canManage() ? `<button class="btn btn-sm btn-outline-danger" type="button" data-coupon-action="delete">Xoá</button>` : ""}
    </td>
  </tr>`;
}

function card(coupon) {
  const state = couponState(coupon);
  return `
  <article class="coupon-card${coupon.active ? "" : " inactive"}" data-id="${escapeHtml(coupon.id)}">
    <div class="coupon-head">
      <span class="code-chip">${escapeHtml(coupon.code)}</span>
      <span class="status-pill status-${state.key === "active" ? "open" : "closed"}">${escapeHtml(state.label)}</span>
    </div>
    <p class="coupon-value">${
      coupon.type === "percent" ? `Giảm ${coupon.value}%` : `Giảm ${new Intl.NumberFormat("vi-VN").format(coupon.value)} đ`
    }</p>
    <p class="coupon-desc">${escapeHtml(coupon.description || "Không có mô tả")}</p>
    <ul class="coupon-meta">
      <li>Đơn tối thiểu: <strong>${coupon.minTotal ? new Intl.NumberFormat("vi-VN").format(coupon.minTotal) + " đ" : "Không"}</strong></li>
      <li>Thời hạn: <strong>${formatDate(coupon.startDate)} - ${formatDate(coupon.endDate)}</strong></li>
      <li>Đã dùng: <strong>${coupon.usedCount}/${coupon.usageLimit || "∞"}</strong></li>
    </ul>
    <div class="tour-admin-actions">
      <button class="btn btn-sm btn-ghost-soft" type="button" data-coupon-action="copy">Sao chép</button>
      ${canManage() ? `<button class="btn btn-sm btn-primary" type="button" data-coupon-action="edit">Sửa</button>` : ""}
    </div>
  </article>`;
}

function openCouponForm(coupon = null) {
  if (!canManage()) return;

  openModal({
    title: coupon ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá",
    subtitle: coupon ? coupon.code : "Thiết lập điều kiện và thời hạn sử dụng",
    size: "lg",
    body: `
    <form id="coupon-form" novalidate>
      <input type="hidden" name="id" value="${escapeHtml(coupon?.id || "")}">
      <div class="form-grid">
        <div class="field">
          <label for="cf-code">Mã giảm giá <span class="req">*</span></label>
          <input id="cf-code" name="code" type="text" value="${escapeHtml(coupon?.code || "")}" placeholder="CHAOBAN10" required style="text-transform: uppercase">
        </div>
        <div class="field">
          <label for="cf-type">Loại giảm <span class="req">*</span></label>
          <select id="cf-type" name="type">
            ${Object.entries(COUPON_TYPE)
              .map(([value, label]) => `<option value="${value}"${coupon?.type === value ? " selected" : ""}>${label}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="cf-value">Mức giảm <span class="req">*</span></label>
          <input id="cf-value" name="value" type="number" min="1" value="${coupon?.value || 10}" required>
        </div>
        <div class="field">
          <label for="cf-min">Đơn tối thiểu (VNĐ)</label>
          <input id="cf-min" name="minTotal" type="number" min="0" step="100000" value="${coupon?.minTotal || 0}">
        </div>
        <div class="field">
          <label for="cf-max">Giảm tối đa (VNĐ, chỉ áp dụng giảm %)</label>
          <input id="cf-max" name="maxDiscount" type="number" min="0" step="100000" value="${coupon?.maxDiscount || 0}">
        </div>
        <div class="field">
          <label for="cf-limit">Số lượt sử dụng tối đa</label>
          <input id="cf-limit" name="usageLimit" type="number" min="0" value="${coupon?.usageLimit ?? 100}">
        </div>
        <div class="field">
          <label for="cf-start">Bắt đầu</label>
          <input id="cf-start" name="startDate" type="date" value="${escapeHtml(coupon?.startDate || new Date().toISOString().slice(0, 10))}">
        </div>
        <div class="field">
          <label for="cf-end">Kết thúc</label>
          <input id="cf-end" name="endDate" type="date" value="${escapeHtml(coupon?.endDate || "")}">
        </div>
      </div>
      <div class="field">
        <label for="cf-desc">Mô tả chương trình</label>
        <textarea id="cf-desc" name="description" rows="2">${escapeHtml(coupon?.description || "")}</textarea>
      </div>
      <label class="checkbox">
        <input type="checkbox" name="active"${coupon?.active === false ? "" : " checked"}>
        <span>Kích hoạt mã ngay bây giờ</span>
      </label>
      <p class="error" id="coupon-error"></p>
    </form>`,
    footer: `
      <button class="btn btn-light" type="button" data-modal-close>Huỷ</button>
      <button class="btn btn-primary" type="submit" form="coupon-form">${coupon ? "Lưu thay đổi" : "Tạo mã"}</button>`,
  });

  document.getElementById("coupon-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const error = document.getElementById("coupon-error");
    const code = String(data.get("code") || "").trim().toUpperCase();
    const value = Number(data.get("value"));

    if (!/^[A-Z0-9]{4,20}$/.test(code)) {
      return void (error.textContent = "Mã giảm giá chỉ gồm 4-20 ký tự A-Z hoặc số.");
    }
    if (listCoupons().some((item) => item.code === code && item.id !== coupon?.id)) {
      return void (error.textContent = "Mã giảm giá đã tồn tại.");
    }
    if (!value || value <= 0) return void (error.textContent = "Vui lòng nhập mức giảm lớn hơn 0.");

    saveCoupon({
      ...(coupon || {}),
      id: coupon?.id,
      code,
      type: String(data.get("type")),
      value,
      minTotal: Number(data.get("minTotal")) || 0,
      maxDiscount: Number(data.get("maxDiscount")) || 0,
      usageLimit: Number(data.get("usageLimit")) || 0,
      startDate: String(data.get("startDate") || ""),
      endDate: String(data.get("endDate") || ""),
      description: String(data.get("description") || "").trim(),
      active: data.get("active") !== null,
    });

    logActivity(coupon ? "Cập nhật khuyến mãi" : "Tạo mã giảm giá", `${coupon ? "Cập nhật" : "Tạo"} mã ${code}`);
    toast(`Đã lưu mã ${code}.`);
    closeModal();
    refreshAdmin();
  });
}

export function Promotions() {
  const denied = adminGuard("promotions.view");
  if (denied) return denied;

  const coupons = listCoupons();
  const running = coupons.filter((item) => couponState(item).key === "active");
  const redemptions = coupons.reduce((sum, item) => sum + (Number(item.usedCount) || 0), 0);
  const orders = listBookings().filter((item) => item.status !== "cancelled");
  const avgOrder = orders.length
    ? orders.reduce((sum, item) => sum + (Number(item.total) || 0), 0) / orders.length
    : 0;
  const discount = coupons.reduce((sum, item) => {
    const used = Number(item.usedCount) || 0;
    if (!used) return sum;
    const raw = item.type === "percent" ? (avgOrder * (Number(item.value) || 0)) / 100 : Number(item.value) || 0;
    const capped = item.maxDiscount ? Math.min(raw, Number(item.maxDiscount)) : raw;
    return sum + capped * used;
  }, 0);

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng mã</p><strong class="kpi-value">${coupons.length}</strong><span class="kpi-hint">${running.length} đang chạy</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Lượt sử dụng</p><strong class="kpi-value">${redemptions}</strong><span class="kpi-hint">Tổng lượt đã áp dụng</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Chiết khấu ước tính</p><strong class="kpi-value kpi-value-sm">${new Intl.NumberFormat("vi-VN").format(Math.round(discount))} đ</strong><span class="kpi-hint">Tính trên giá trị đơn TB</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Đơn chưa huỷ</p><strong class="kpi-value">${orders.length}</strong><span class="kpi-hint">Cơ sở áp dụng mã</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="cp-q">Tìm mã giảm giá</label>
        <input id="cp-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Mã hoặc mô tả..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="cp-type">Loại giảm</label>
        <select id="cp-type">
          <option value="">Tất cả</option>
          ${Object.entries(COUPON_TYPE)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="cp-state">Trạng thái</label>
        <select id="cp-state">
          <option value="">Tất cả</option>
          ${Object.entries(STATE_STATUS)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="cp-view">Hiển thị</label>
        <select id="cp-view">
          <option value="table">Dạng bảng</option>
          <option value="card">Dạng thẻ</option>
        </select>
      </div>
      <div class="filter-actions">
        ${canManage() ? `<button class="btn btn-primary" type="button" id="cp-add">+ Tạo mã</button>` : ""}
        <button class="btn btn-outline" type="button" id="cp-export">Xuất CSV</button>
      </div>
    </div>

    <div class="toolbar-actions toolbar-actions-between">
      ${
        canManage()
          ? `<div class="bulk-actions" id="cp-bulk" hidden>
              <span>Đã chọn <strong data-selected>0</strong> mã</span>
              <button class="btn btn-sm btn-primary" type="button" data-bulk="active">Kích hoạt</button>
              <button class="btn btn-sm btn-outline" type="button" data-bulk="inactive">Tạm dừng</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-bulk="delete">Xoá</button>
            </div>`
          : `<span></span>`
      }
      <span class="result-count">Nhấn "Sao chép" để lấy mã cho khách</span>
    </div>

    <p class="result-count" id="cp-count" role="status"></p>

    <div class="table-wrap" id="cp-table">
      <table class="data-table">
        <thead>
          <tr>
            ${canManage() ? `<th class="cell-check"><input type="checkbox" id="cp-check-all" aria-label="Chọn tất cả"></th>` : ""}
            <th>Mã &amp; mô tả</th>
            <th>Loại &amp; mức</th>
            <th>Điều kiện</th>
            <th>Đã dùng</th>
            <th>Thời hạn</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="cp-rows"></tbody>
      </table>
    </div>
    <div class="coupon-cards" id="cp-cards" hidden></div>
    <div id="cp-page"></div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "promotions") return;
  const rowsBox = document.getElementById("cp-rows");
  if (!rowsBox) return;

  const controller = createListController({
    mount: "#cp-rows",
    count: "#cp-count",
    pageEl: "#cp-page",
    pageSize: 10,
    load: () => filterCoupons(listCoupons()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(row).join("")
        : `<tr><td colspan="${canManage() ? 8 : 7}" class="table-empty">Không có mã giảm giá nào.</td></tr>`,
  });
  controller.refresh();
  controller.bind();

  const selection = setupSelection({
    headCheckbox: "#cp-check-all",
    bodyBox: rowsBox,
    onChange: (ids) => {
      const bulk = document.getElementById("cp-bulk");
      const count = bulk?.querySelector("[data-selected]");
      if (bulk) bulk.hidden = ids.length === 0;
      if (count) count.textContent = ids.length;
    },
  });

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("cp-type", FILTERS.type);
  set("cp-state", FILTERS.state);
  set("cp-view", view);

  const applyView = () => {
    const table = document.getElementById("cp-table");
    const cards = document.getElementById("cp-cards");
    const pager = document.getElementById("cp-page");
    if (!table || !cards) return;

    const useCards = view === "card";
    table.hidden = useCards;
    cards.hidden = !useCards;
    if (pager) pager.hidden = useCards;

    if (useCards) {
      const list = filterCoupons(listCoupons());
      cards.innerHTML = list.length
        ? list.map(card).join("")
        : `<p class="table-empty">Không có mã giảm giá nào.</p>`;
    }
  };
  applyView();

  const bind = (id, event, handler) =>
    document.getElementById(id)?.addEventListener(event, handler);

  bind("cp-q", "input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
    applyView();
  });
  bind("cp-type", "change", (event) => {
    FILTERS.type = event.target.value;
    controller.reset();
    applyView();
  });
  bind("cp-state", "change", (event) => {
    FILTERS.state = event.target.value;
    controller.reset();
    applyView();
  });
  bind("cp-view", "change", (event) => {
    view = event.target.value;
    applyView();
  });

  bind("cp-add", "click", () => openCouponForm(null));

  bind("cp-export", "click", () => {
    downloadCsv(
      `khuyen-mai-${stamp()}`,
      ["Mã", "Mô tả", "Loại", "Mức giảm", "Đơn tối thiểu", "Giảm tối đa", "Đã dùng", "Giới hạn", "Bắt đầu", "Kết thúc", "Trạng thái"],
      filterCoupons(listCoupons()).map((item) => [
        item.code,
        item.description,
        COUPON_TYPE[item.type],
        item.value,
        item.minTotal,
        item.maxDiscount,
        item.usedCount,
        item.usageLimit,
        item.startDate,
        item.endDate,
        couponState(item).label,
      ])
    );
  });

  const onAction = (event) => {
    const button = event.target.closest("[data-coupon-action]");
    if (!button) return;
    const id = button.closest("[data-id]").dataset.id;
    const coupon = listCoupons().find((item) => item.id === id);
    if (!coupon) return;
    const action = button.dataset.couponAction;

    if (action === "copy") {
      navigator.clipboard
        ?.writeText(coupon.code)
        .then(() => toast(`Đã sao chép mã ${coupon.code}.`))
        .catch(() => toast("Trình duyệt không cho phép sao chép.", "error"));
      return;
    }
    if (action === "edit") return openCouponForm(coupon);
    if (!canManage()) return undefined;

    if (action === "toggle") {
      updateCoupon(id, { active: !coupon.active });
      logActivity("Cập nhật khuyến mãi", `${coupon.active ? "Tạm dừng" : "Kích hoạt"} mã ${coupon.code}`);
      toast(`Đã ${coupon.active ? "tạm dừng" : "kích hoạt"} mã ${coupon.code}.`);
      return refreshAdmin();
    }
    if (action === "delete") {
      if (!confirmAction(`Xoá mã ${coupon.code}?`)) return;
      removeCoupon(id);
      logActivity("Xoá khuyến mãi", `Xoá mã ${coupon.code}`);
      toast(`Đã xoá mã ${coupon.code}.`);
      return refreshAdmin();
    }
    return undefined;
  };

  rowsBox.addEventListener("click", onAction);
  document.getElementById("cp-cards")?.addEventListener("click", onAction);

  document.getElementById("cp-bulk")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bulk]");
    if (!button) return;
    const ids = selection.selected();
    if (!ids.length) return;
    const action = button.dataset.bulk;

    if (action === "delete") {
      if (!confirmAction(`Xoá ${ids.length} mã giảm giá?`)) return;
      ids.forEach(removeCoupon);
    } else {
      ids.forEach((id) => updateCoupon(id, { active: action === "active" }));
    }
    logActivity("Cập nhật khuyến mãi", `Cập nhật ${ids.length} mã giảm giá`);
    toast(`Đã cập nhật ${ids.length} mã.`);
    refreshAdmin();
  });
});
