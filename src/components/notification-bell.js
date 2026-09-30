import { getSession, isStaffRole } from "../auth.js";
import {
  NOTIFICATION_TYPE,
  countUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  myNotifications,
} from "../store.js";
import { escapeHtml } from "../validate.js";

const BELL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2A5.8 5.8 0 0 1 17.8 9v3.5l1.5 3a1 1 0 0 1-.9 1.5H5.6a1 1 0 0 1-.9-1.5l1.5-3V9A5.8 5.8 0 0 1 12 3.2Z"/><path d="M9.9 19.1a2.2 2.2 0 0 0 4.2 0"/></svg>`;

function relativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const minutes = Math.round((Date.now() - time) / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function itemHTML(item) {
  const type = NOTIFICATION_TYPE[item.type] || NOTIFICATION_TYPE.system;
  return `
  <li>
    <button class="notif-item${item.read ? "" : " is-unread"}" type="button" data-notif-item="${escapeHtml(item.id)}">
      <span class="notif-icon" aria-hidden="true">${type.icon}</span>
      <span class="notif-body">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="notif-text">${escapeHtml(item.body)}</span>
        <span class="notif-time">${escapeHtml(relativeTime(item.createdAt))}</span>
      </span>
    </button>
  </li>`;
}

function panelHTML(session) {
  const list = myNotifications(session, 5);
  return `
  <div class="notif-panel" data-notif-panel hidden>
    <div class="notif-head">
      <strong>Thông báo</strong>
      <button class="notif-read-all" type="button" data-notif-read-all>Đánh dấu đã đọc</button>
    </div>
    ${
      list.length
        ? `<ul class="notif-list">${list.map(itemHTML).join("")}</ul>`
        : `<p class="notif-empty">Bạn chưa có thông báo nào.</p>`
    }
    <a class="notif-more" href="#/account">Xem tất cả trong tài khoản</a>
  </div>`;
}

export function notificationBell() {
  const session = getSession();
  if (!session || isStaffRole(session.roleKey)) return "";

  const unread = countUnreadNotifications(session);

  return `
  <div class="notif" data-notif>
    <button class="notif-btn" type="button" data-notif-toggle aria-expanded="false" aria-label="Thông báo${unread ? `, ${unread} chưa đọc` : ""}">
      ${BELL_ICON}
      ${unread ? `<span class="notif-badge">${unread > 9 ? "9+" : unread}</span>` : ""}
    </button>
    ${panelHTML(session)}
  </div>`;
}

function closeAllPanels() {
  document.querySelectorAll("[data-notif-panel]").forEach((panel) => {
    panel.hidden = true;
  });
  document.querySelectorAll("[data-notif-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll("[data-notif].is-open").forEach((root) => root.classList.remove("is-open"));
}

function syncBadge() {
  const session = getSession();
  if (!session) return;

  const unread = countUnreadNotifications(session);
  const label = `Thông báo${unread ? `, ${unread} chưa đọc` : ""}`;

  document.querySelectorAll("[data-notif]").forEach((root) => {
    const button = root.querySelector("[data-notif-toggle]");
    if (button) button.setAttribute("aria-label", label);

    const badge = root.querySelector(".notif-badge");
    if (unread && !badge) {
      const node = document.createElement("span");
      node.className = "notif-badge";
      node.textContent = unread > 9 ? "9+" : String(unread);
      button?.append(node);
    } else if (unread && badge) {
      badge.textContent = unread > 9 ? "9+" : String(unread);
    } else if (!unread && badge) {
      badge.remove();
    }
  });

  const counter = document.querySelector('[data-stat="notif-unread"] strong');
  if (counter) counter.textContent = String(unread);
}

/* đồng bộ trạng thái đã đọc giữa khung thông báo và danh sách trong trang tài khoản */
function applyReadState(id) {
  const session = getSession();
  if (!session) return;
  if (id === "all") markAllNotificationsRead(session);
  else markNotificationRead(id);

  document.querySelectorAll("[data-notif-item], [data-notif-row]").forEach((node) => {
    const key = node.dataset.notifItem || node.dataset.notifRow;
    if (id === "all" || key === id) node.classList.remove("is-unread");
  });

  syncBadge();
}

document.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-notif-toggle]");
  if (toggle) {
    event.preventDefault();
    const root = toggle.closest("[data-notif]");
    const panel = root?.querySelector("[data-notif-panel]");
    if (!panel) return;
    const willOpen = panel.hidden;
    closeAllPanels();
    panel.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
    root.classList.toggle("is-open", willOpen);
    return;
  }

  const readAll = event.target.closest("[data-notif-read-all]");
  if (readAll) {
    applyReadState("all");
    return;
  }

  const item = event.target.closest("[data-notif-item]");
  if (item) {
    applyReadState(item.dataset.notifItem);
    return;
  }

  if (!event.target.closest("[data-notif]")) closeAllPanels();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllPanels();
});

export { closeAllPanels as closeNotificationPanels, syncBadge as syncNotificationBadge };
