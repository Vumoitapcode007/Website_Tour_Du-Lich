import {
  clearAllData,
  getSettings,
  logActivity,
  resetDemoData,
  resetSettings,
  saveSettings,
} from "../../store.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import { confirmAction, toast } from "../../components/admin-ui.js";
import { hasPermission } from "../../auth.js";
import { resetTours } from "../../tour-repository.js";
import { escapeHtml, isEmail, isPhone } from "../../validate.js";

const canManage = () => hasPermission("settings.manage");

const TABS = [
  { key: "general", label: "Thông tin chung" },
  { key: "booking", label: "Đặt tour" },
  { key: "appearance", label: "Hiển thị" },
  { key: "payment", label: "Thanh toán" },
  { key: "data", label: "Dữ liệu" },
];

let activeTab = "general";
let readOnly = false;

const disabledAttr = () => (readOnly ? " disabled" : "");

function saveActions(label) {
  return readOnly
    ? `<p class="form-hint" style="text-align:left">Bạn chỉ có quyền xem cấu hình này.</p>`
    : `<div class="success-actions">
      <button class="btn btn-primary" type="submit">${label}</button>
    </div>`;
}

function field({ id, label, value, type = "text", hint = "", required = false, attrs = "" }) {
  return `
  <div class="field">
    <label for="${id}">${escapeHtml(label)}${required ? ' <span class="req">*</span>' : ""}</label>
    <input id="${id}" name="${id}" type="${type}" value="${escapeHtml(value ?? "")}"${required ? " required" : ""}${disabledAttr()} ${attrs}>
    ${hint ? `<small class="form-hint" style="text-align:left">${escapeHtml(hint)}</small>` : ""}
  </div>`;
}

function area({ id, label, value, rows = 3, hint = "" }) {
  return `
  <div class="field">
    <label for="${id}">${escapeHtml(label)}</label>
    <textarea id="${id}" name="${id}" rows="${rows}"${disabledAttr()}>${escapeHtml(value ?? "")}</textarea>
    ${hint ? `<small class="form-hint" style="text-align:left">${escapeHtml(hint)}</small>` : ""}
  </div>`;
}

function toggle({ id, label, checked, hint = "" }) {
  return `
  <label class="switch-row" for="${id}">
    <input type="checkbox" id="${id}" name="${id}"${checked ? " checked" : ""}${disabledAttr()}>
    <span class="switch" aria-hidden="true"></span>
    <span class="switch-label"><strong>${escapeHtml(label)}</strong>${hint ? `<small>${escapeHtml(hint)}</small>` : ""}</span>
  </label>`;
}

function panelGeneral(settings) {
  return `
  <form class="settings-form" data-settings="general" novalidate>
    <h3>Thông tin doanh nghiệp</h3>
    <div class="form-grid">
      ${field({ id: "siteName", label: "Tên website", value: settings.siteName, required: true })}
      ${field({ id: "tagline", label: "Khẩu hiệu", value: settings.tagline })}
    </div>
    ${area({ id: "address", label: "Địa chỉ", value: settings.address, rows: 2 })}

    <h3>Thông tin liên hệ</h3>
    <div class="form-grid">
      ${field({ id: "hotline", label: "Hotline", value: settings.hotline, hint: "Hiển thị ở header, footer và trang liên hệ" })}
      ${field({ id: "email", label: "Email hỗ trợ", value: settings.email })}
      ${field({ id: "hours", label: "Giờ làm việc", value: settings.hours })}
    </div>
    ${saveActions("Lưu thông tin")}
    <p class="error" data-error></p>
  </form>`;
}

function panelBooking(settings) {
  return `
  <form class="settings-form" data-settings="booking" novalidate>
    <h3>Quy trình đặt tour</h3>
    ${area({ id: "bookingNotice", label: "Thông báo sau khi đặt tour", value: settings.bookingNotice, rows: 2, hint: "Hiển thị trên màn hình thành công và trang đặt tour" })}
    <div class="form-grid">
      ${field({ id: "minPeople", label: "Số khách tối thiểu", value: settings.minPeople, type: "number", attrs: 'min="1"' })}
      ${field({ id: "maxPeople", label: "Số khách tối đa / đơn", value: settings.maxPeople, type: "number", attrs: 'min="1"' })}
    </div>
    ${toggle({ id: "autoConfirm", label: "Tự động xác nhận đơn", checked: settings.autoConfirm, hint: "Đơn mới sẽ ở trạng thái Đã xác nhận ngay" })}
    ${toggle({ id: "requireAccount", label: "Yêu cầu đăng nhập khi đặt tour", checked: settings.requireAccount, hint: "Khách phải có tài khoản mới đặt được tour" })}
    ${saveActions("Lưu cấu hình")}
    <p class="error" data-error></p>
  </form>`;
}

function panelAppearance(settings) {
  return `
  <form class="settings-form" data-settings="appearance" novalidate>
    <h3>Nội dung trang chủ</h3>
    ${field({ id: "heroTitle", label: "Tiêu đề hero", value: settings.heroTitle, required: true })}
    ${area({ id: "heroSubtitle", label: "Mô tả hero", value: settings.heroSubtitle, rows: 2 })}
    ${area({ id: "footerNote", label: "Mô tả footer", value: settings.footerNote, rows: 2 })}
    ${saveActions("Lưu nội dung")}
    <p class="error" data-error></p>
  </form>`;
}

function panelPayment(settings) {
  return `
  <form class="settings-form" data-settings="payment" novalidate>
    <h3>Thanh toán</h3>
    ${toggle({ id: "allowOnlinePayment", label: "Cho phép thanh toán trực tuyến", checked: settings.allowOnlinePayment, hint: "Hiển thị nút thanh toán trên trang đặt tour" })}
    <h3>Thông tin chuyển khoản</h3>
    ${field({ id: "bankName", label: "Ngân hàng", value: settings.bankName })}
    ${field({ id: "bankAccount", label: "Số tài khoản", value: settings.bankAccount })}
    ${field({ id: "bankHolder", label: "Chủ tài khoản", value: settings.bankHolder })}
    ${saveActions("Lưu thông tin")}
    <p class="error" data-error></p>
  </form>`;
}

function panelData() {
  return `
  <form class="settings-form" data-settings="data" novalidate>
    <h3>Quản lý dữ liệu</h3>
    <p class="form-hint" style="text-align:left">Dữ liệu hiện được lưu trong trình duyệt của bạn. Hãy xuất bản sao lưu trước khi thao tác.</p>

    <div class="data-actions">
      <div>
        <strong>Xuất toàn bộ dữ liệu</strong>
        <small>Tải về file JSON chứa tour, đơn, tin nhắn, đánh giá, khuyến mãi và cấu hình.</small>
      </div>
      <button class="btn btn-outline" type="button" id="set-export"${disabledAttr()}>Tải bản sao lưu</button>
    </div>

    <div class="data-actions">
      <div>
        <strong>Khôi phục dữ liệu mẫu</strong>
        <small>Đưa toàn bộ danh mục tour, đơn, tin nhắn, đánh giá và khuyến mãi về trạng thái ban đầu.</small>
      </div>
      <button class="btn btn-outline" type="button" id="set-reset-demo"${disabledAttr()}>Khôi phục mẫu</button>
    </div>

    <div class="data-actions">
      <div>
        <strong>Khôi phục danh mục tour</strong>
        <small>Chỉ khôi phục danh sách tour về dữ liệu gốc, giữ nguyên đơn và tin nhắn.</small>
      </div>
      <button class="btn btn-outline" type="button" id="set-reset-tours"${disabledAttr()}>Khôi phục tour</button>
    </div>

    <div class="data-actions">
      <div>
        <strong>Về cấu hình mặc định</strong>
        <small>Đặt lại thông tin liên hệ, quy trình đặt tour và hiển thị.</small>
      </div>
      <button class="btn btn-outline" type="button" id="set-reset-config"${disabledAttr()}>Khôi phục cấu hình</button>
    </div>

    <div class="data-actions danger">
      <div>
        <strong>Xoá toàn bộ dữ liệu nghiệp vụ</strong>
        <small>Xoá đơn, tin nhắn, đánh giá, khuyến mãi, ghi chú và nhật ký. Không thể hoàn tác.</small>
      </div>
      <button class="btn btn-outline-danger" type="button" id="set-clear"${disabledAttr()}>Xoá tất cả</button>
    </div>
  </form>`;
}

const PANELS = {
  general: panelGeneral,
  booking: panelBooking,
  appearance: panelAppearance,
  payment: panelPayment,
  data: panelData,
};

export function Settings() {
  const denied = adminGuard("settings.view");
  if (denied) return denied;

  readOnly = !canManage();
  const settings = getSettings();

  return `
  <section class="panel">
    ${
      readOnly
        ? `<p class="form-hint" style="text-align:left;margin-bottom:12px">Tài khoản của bạn chỉ có quyền xem cấu hình. Liên hệ quản trị viên nếu cần thay đổi.</p>`
        : ""
    }
    <div class="settings-layout">
      <nav class="settings-nav">
        ${TABS.map(
          (tab) =>
            `<button class="settings-tab${tab.key === activeTab ? " active" : ""}" type="button" data-tab="${tab.key}">${escapeHtml(tab.label)}</button>`
        ).join("")}
      </nav>
      <div class="settings-body" id="settings-body">
        ${PANELS[activeTab](settings)}
      </div>
    </div>
  </section>`;
}

function validatePanel(form) {
  const error = form.querySelector("[data-error]");
  const value = (id) => form.elements[id]?.value;

  if (form.dataset.settings === "general") {
    if (!value("siteName")?.trim()) return "Vui lòng nhập tên website.";
    if (!isPhone(value("hotline") || "")) return "Hotline không hợp lệ.";
    if (value("email") && !isEmail(value("email"))) return "Email hỗ trợ không hợp lệ.";
  }
  if (form.dataset.settings === "payment" && value("email") && !isEmail(value("email"))) {
    return "Email không hợp lệ.";
  }
  error.textContent = "";
  return null;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "settings") return;
  const body = document.getElementById("settings-body");
  if (!body) return;

  const settings = getSettings();

  document.querySelector(".settings-nav")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    activeTab = button.dataset.tab;
    document.querySelectorAll(".settings-tab").forEach((item) =>
      item.classList.toggle("active", item === button)
    );
    body.innerHTML = PANELS[activeTab](settings);
  });

  body.addEventListener("submit", (event) => {
    const form = event.target.closest(".settings-form");
    if (!form || !canManage()) return;
    event.preventDefault();

    const message = validatePanel(form);
    if (message) {
      form.querySelector("[data-error]").textContent = message;
      return;
    }

    const patch = {};
    form.querySelectorAll("input, textarea").forEach((node) => {
      if (!node.name) return;
      if (node.type === "checkbox") patch[node.name] = node.checked;
      else if (node.type === "number") patch[node.name] = Number(node.value) || 0;
      else patch[node.name] = node.value.trim();
    });

    saveSettings(patch);
    logActivity("Cập nhật cấu hình", `Cập nhật nhóm cấu hình ${form.dataset.settings}`);
    toast("Đã lưu cấu hình hệ thống.");
    refreshAdmin();
  });

  body.addEventListener("click", (event) => {
    const id = event.target.closest("button")?.id;
    if (!id || !canManage()) return;

    if (id === "set-export") {
      const payload = {
        exportedAt: new Date().toISOString(),
        settings,
        bookings: JSON.parse(localStorage.getItem("travelgo.bookings") || "[]"),
        messages: JSON.parse(localStorage.getItem("travelgo.messages") || "[]"),
        reviews: JSON.parse(localStorage.getItem("travelgo.reviews") || "[]"),
        coupons: JSON.parse(localStorage.getItem("travelgo.coupons") || "[]"),
        tours: JSON.parse(localStorage.getItem("travelgo.tours") || "[]"),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `travelgo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      logActivity("Sao lưu dữ liệu", "Tải bản sao lưu toàn bộ dữ liệu");
      toast("Đã tải bản sao lưu dữ liệu.");
      return;
    }
    if (id === "set-reset-demo") {
      if (!confirmAction("Khôi phục toàn bộ dữ liệu mẫu? Mọi thay đổi hiện tại sẽ mất.")) return;
      resetDemoData();
      logActivity("Khôi phục dữ liệu", "Khôi phục toàn bộ dữ liệu mẫu");
      toast("Đã khôi phục dữ liệu mẫu.");
      return refreshAdmin();
    }
    if (id === "set-reset-tours") {
      if (!confirmAction("Khôi phục danh mục tour về dữ liệu gốc?")) return;
      resetTours();
      logActivity("Khôi phục dữ liệu", "Khôi phục danh mục tour gốc");
      toast("Đã khôi phục danh mục tour.");
      return refreshAdmin();
    }
    if (id === "set-reset-config") {
      if (!confirmAction("Đặt lại toàn bộ cấu hình về mặc định?")) return;
      resetSettings();
      logActivity("Cập nhật cấu hình", "Khôi phục cấu hình mặc định");
      toast("Đã khôi phục cấu hình mặc định.");
      return refreshAdmin();
    }
    if (id === "set-clear") {
      if (!confirmAction("Xoá toàn bộ đơn, tin nhắn, đánh giá, khuyến mãi và nhật ký? Không thể hoàn tác.")) return;
      clearAllData();
      logActivity("Xoá dữ liệu", "Xoá toàn bộ dữ liệu nghiệp vụ");
      toast("Đã xoá toàn bộ dữ liệu nghiệp vụ.");
      return refreshAdmin();
    }
    return undefined;
  });
});
