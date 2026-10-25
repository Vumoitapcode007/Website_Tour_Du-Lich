import { getSession } from "../auth.js";
import { myNotifications, NOTIFICATION_TYPE, markNotificationRead, markAllNotificationsRead, removeNotification } from "../store.js";
import { escapeHtml } from "../validate.js";
import { syncNotificationBadge } from "../components/notification-bell.js";

function groupNotifications(items) {
  const groups = new Map();
  items.forEach((item) => {
    const code = item.bookingCode || item.title?.match(/(?:đơn|vé)\s+([A-Z0-9-]{4,})/i)?.[1] || "";
    const key = item.type === "booking" && code ? `booking:${code.toUpperCase()}` : `notification:${item.id}`;
    if (!groups.has(key)) groups.set(key, { ...item, bookingCode: code.toUpperCase(), notifications: [] });
    const group = groups.get(key);
    group.notifications.push(item);
    group.read = group.read && item.read;
    if (group.notifications.length > 1) {
      group.title = `Cập nhật đơn ${group.bookingCode}`;
      group.body = `${group.notifications.length} thông báo liên quan đến đơn đặt vé này. ${item.body}`;
    }
  });
  return [...groups.values()];
}

function renderNotification(item) {
  const ids = item.notifications.map(({ id }) => id);
  const type = NOTIFICATION_TYPE[item.type] || NOTIFICATION_TYPE.system;
  const time = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt));
  return `<li class="account-notif${item.read ? "" : " is-unread"}" data-notif-ids="${escapeHtml(ids.join(","))}">
    <span class="account-notif-icon" aria-hidden="true">${type.icon}</span>
    <div class="account-notif-body"><div class="account-notif-head"><strong>${escapeHtml(item.title)}</strong><span class="account-notif-type">${escapeHtml(type.label)}</span></div>
      <p>${escapeHtml(item.body)}</p><small>${escapeHtml(time)}</small>
      ${item.bookingCode ? `<a class="account-notif-link" href="#/ticket/${encodeURIComponent(item.bookingCode)}">Xem vé/đơn ${escapeHtml(item.bookingCode)}</a>` : ""}
    </div>
    ${item.read ? "" : `<button class="btn btn-sm btn-ghost-soft" type="button" data-read-notif="${escapeHtml(ids.join(","))}">Đánh dấu đã đọc</button>`}
    <button class="btn btn-sm btn-ghost-soft" type="button" data-remove-notif="${escapeHtml(ids.join(","))}">Xóa</button>
  </li>`;
}

export function Notifications() {
  const session = getSession();
  if (!session) return `<section class="section container"><div class="form-card center"><h1>Vui lòng đăng nhập</h1><a class="btn btn-primary" href="#/login?next=notifications">Đăng nhập</a></div></section>`;
  const items = groupNotifications(myNotifications(session));
  const unread = items.filter((item) => !item.read).length;
  return `<section class="page-hero"><div class="container"><span class="hero-eyebrow">Tài khoản của tôi</span><h1>Thông báo</h1><p>${unread ? `Bạn có ${unread} thông báo chưa đọc.` : "Bạn đã đọc hết thông báo."}</p></div></section>
    <section class="section container"><div class="notifications-toolbar"><a class="btn btn-outline" href="#/account">Quay lại tài khoản</a>${unread ? `<button class="btn btn-primary" type="button" data-read-all>Đánh dấu tất cả đã đọc</button>` : ""}</div>
      ${items.length ? `<ul class="account-notif-list">${items.map(renderNotification).join("")}</ul>` : `<p class="search-empty">Chưa có thông báo nào.</p>`}
    </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "notifications" || !getSession()) return;
  document.querySelector(".account-notif-list")?.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-notif]");
    if (remove) {
      remove.dataset.removeNotif.split(",").forEach(removeNotification);
      document.dispatchEvent(new CustomEvent("app:refresh"));
      return;
    }
    const button = event.target.closest("[data-read-notif]");
    if (!button) return;
    button.dataset.readNotif.split(",").forEach(markNotificationRead);
    syncNotificationBadge();
    document.dispatchEvent(new CustomEvent("app:refresh"));
  });
  document.querySelector("[data-read-all]")?.addEventListener("click", () => {
    markAllNotificationsRead(getSession());
    syncNotificationBadge();
    document.dispatchEvent(new CustomEvent("app:refresh"));
  });
});
