import {
  MESSAGE_TOPICS,
  clearMessages,
  getSettings,
  listMessages,
  logActivity,
  markAllMessagesRead,
  markMessageRead,
  removeMessage,
  updateMessage,
} from "../../store.js";
import { formatDateTime, formatRelative } from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  createListController,
  downloadCsv,
  emptyState,
  initials,
  stamp,
  toast,
} from "../../components/admin-ui.js";
import { hasPermission } from "../../auth.js";
import { escapeHtml, searchKey } from "../../validate.js";

const canManage = () => hasPermission("messages.manage");

const FILTERS = { q: "", topic: "", read: "" };

function filterMessages(list) {
  const query = searchKey(FILTERS.q);
  return list.filter((item) => {
    if (FILTERS.topic && item.topic !== FILTERS.topic) return false;
    if (FILTERS.read === "unread" && item.read) return false;
    if (FILTERS.read === "read" && !item.read) return false;
    if (query && !searchKey(`${item.name} ${item.phone} ${item.email} ${item.topic} ${item.message}`).includes(query))
      return false;
    return true;
  });
}

let activeId = null;

function messageCard(item) {
  const active = item.id === activeId;
  return `
  <button class="msg-item${active ? " active" : ""}${item.read ? "" : " unread"}" type="button" data-msg="${escapeHtml(item.id)}">
    <span class="avatar-sm">${initials(item.name)}</span>
    <span class="msg-item-body">
      <span class="msg-item-top">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${formatRelative(item.createdAt)}</small>
      </span>
      <span class="msg-item-topic">${escapeHtml(item.topic)}</span>
      <span class="msg-item-text">${escapeHtml(item.message.slice(0, 110))}${item.message.length > 110 ? "…" : ""}</span>
    </span>
    ${item.read ? "" : '<span class="msg-dot" aria-label="Chưa đọc"></span>'}
  </button>`;
}

function detailPane(item) {
  if (!item) {
    return `<div class="msg-detail-empty">${emptyState("Chọn một tin nhắn bên trái để xem nội dung.")}</div>`;
  }
  return `
  <article class="msg-detail">
    <header class="msg-detail-head">
      <div>
        <h2>${escapeHtml(item.name)}</h2>
        <p><span class="soft-chip">${escapeHtml(item.topic)}</span></p>
      </div>
      <span class="msg-detail-time">${formatDateTime(item.createdAt)}</span>
    </header>

    <ul class="summary-list">
      <li><span>Điện thoại</span><strong><a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a></strong></li>
      <li><span>Email</span><strong>${item.email ? `<a href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email)}</a>` : "Không có"}</strong></li>
      <li><span>Trạng thái</span><strong>${item.read ? "Đã đọc" : "<span class='status-pill status-pending'>Chưa đọc</span>"}</strong></li>
    </ul>

    <h3>Nội dung</h3>
    <p class="msg-body">${escapeHtml(item.message)}</p>

    <div class="msg-actions">
      <a class="btn btn-sm btn-primary" href="tel:${escapeHtml(item.phone)}">Gọi ngay</a>
      ${
        item.email
          ? `<a class="btn btn-sm btn-ghost-soft" href="mailto:${escapeHtml(item.email)}?subject=${encodeURIComponent(
              `[${item.topic}] Phản hồi từ TravelGo`
            )}&body=${encodeURIComponent(`Chào ${item.name},\n\nCảm ơn bạn đã liên hệ TravelGo về "${item.topic}".\n\n`)}">Trả lời qua email</a>`
          : ""
      }
      ${
        canManage()
          ? `<button class="btn btn-sm btn-outline" type="button" data-msg-action="toggle">${item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}</button>
             <button class="btn btn-sm btn-outline" type="button" data-msg-action="copy">Sao chép nội dung</button>
             <button class="btn btn-sm btn-outline-danger" type="button" data-msg-action="delete">Xoá</button>`
          : ""
      }
    </div>

    ${
      canManage()
        ? `<label class="field">
            <span class="msg-reply-label">Soạn trả lời nhanh (gửi tới ${escapeHtml(getSettings().email || "email chưa cấu hình")})</span>
            <textarea id="msg-reply" rows="4" placeholder="Cảm ơn quý khách đã liên hệ TravelGo..."></textarea>
          </label>
          <button class="btn btn-outline" type="button" data-msg-action="send">Mở trình soạn thư</button>`
        : ""
    }
  </article>`;
}

export function Messages() {
  const denied = adminGuard("messages.view");
  if (denied) return denied;

  const messages = listMessages();
  const unread = messages.filter((item) => !item.read).length;
  if (!messages.some((item) => item.id === activeId)) activeId = messages[0]?.id || null;

  const topics = [...new Set([...MESSAGE_TOPICS, ...messages.map((item) => item.topic).filter(Boolean)])];

  return `
  <section class="kpi-grid kpi-grid-4">
    <article class="kpi kpi-blue"><p class="kpi-label">Tổng tin nhắn</p><strong class="kpi-value">${messages.length}</strong><span class="kpi-hint">Từ biểu mẫu liên hệ</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Chưa đọc</p><strong class="kpi-value">${unread}</strong><span class="kpi-hint">Cần phản hồi sớm</span></article>
    <article class="kpi kpi-green"><p class="kpi-label">Đã xử lý</p><strong class="kpi-value">${messages.length - unread}</strong><span class="kpi-hint">Đã đọc</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Chủ đề nổi bật</p><strong class="kpi-value kpi-value-sm">${escapeHtml(
      topics.reduce((acc, topic) => {
        const count = messages.filter((item) => item.topic === topic).length;
        return count > acc.count ? { topic, count } : acc;
      }, { topic: "-", count: 0 }).topic
    )}</strong><span class="kpi-hint">${escapeHtml(topics.map((topic) => `${topic} (${messages.filter((i) => i.topic === topic).length})`).slice(0, 3).join(" · "))}</span></article>
  </section>

  <section class="panel">
    <div class="filter-bar">
      <div class="filter-field filter-grow">
        <label for="ms-q">Tìm tin nhắn</label>
        <input id="ms-q" type="search" value="${escapeHtml(FILTERS.q)}" placeholder="Tên, SĐT, nội dung..." autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="ms-topic">Chủ đề</label>
        <select id="ms-topic">
          <option value="">Tất cả chủ đề</option>
          ${topics.map((topic) => `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="ms-read">Trạng thái</label>
        <select id="ms-read">
          <option value="">Tất cả</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
      </div>
      <div class="filter-actions">
        ${canManage() ? `<button class="btn btn-ghost-soft" type="button" id="ms-read-all">Đánh dấu đã đọc tất cả</button>` : ""}
        <button class="btn btn-outline" type="button" id="ms-export">Xuất CSV</button>
        ${canManage() ? `<button class="btn btn-outline-danger" type="button" id="ms-clear">Xoá tất cả</button>` : ""}
      </div>
    </div>

    <p class="result-count" id="ms-count" role="status"></p>

    <div class="inbox">
      <div class="inbox-list" id="ms-list"></div>
      <div class="inbox-detail" id="ms-detail">${detailPane(listMessages().find((item) => item.id === activeId))}</div>
    </div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "messages") return;
  const listBox = document.getElementById("ms-list");
  const detailBox = document.getElementById("ms-detail");
  if (!listBox || !detailBox) return;

  const current = () => listMessages().find((item) => item.id === activeId) || null;

  const controller = createListController({
    mount: "#ms-list",
    count: "#ms-count",
    pageSize: 20,
    load: () => filterMessages(listMessages()),
    onReset: () => FILTERS.q,
    render: (page) =>
      page.length
        ? page.map(messageCard).join("")
        : `<p class="table-empty">Không có tin nhắn nào khớp bộ lọc.</p>`,
  });
  controller.refresh();

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.value = value;
  };
  set("ms-topic", FILTERS.topic);
  set("ms-read", FILTERS.read);

  const repaint = () => {
    controller.refresh();
    detailBox.innerHTML = detailPane(current());
  };

  document.getElementById("ms-q")?.addEventListener("input", (event) => {
    FILTERS.q = event.target.value;
    controller.reset();
  });
  document.getElementById("ms-topic")?.addEventListener("change", (event) => {
    FILTERS.topic = event.target.value;
    controller.reset();
  });
  document.getElementById("ms-read")?.addEventListener("change", (event) => {
    FILTERS.read = event.target.value;
    controller.reset();
  });

  document.getElementById("ms-read-all")?.addEventListener("click", () => {
    markAllMessagesRead();
    logActivity("Đọc tin nhắn", "Đánh dấu đã đọc toàn bộ tin nhắn");
    toast("Đã đánh dấu đọc tất cả tin nhắn.");
    refreshAdmin();
  });

  document.getElementById("ms-clear")?.addEventListener("click", () => {
    if (!window.confirm("Xoá toàn bộ tin nhắn liên hệ?")) return;
    clearMessages();
    logActivity("Xoá tin nhắn", "Xoá toàn bộ tin nhắn liên hệ");
    toast("Đã xoá tất cả tin nhắn.");
    activeId = null;
    refreshAdmin();
  });

  document.getElementById("ms-export")?.addEventListener("click", () => {
    downloadCsv(
      `tin-nhan-${stamp()}`,
      ["Thời gian", "Họ tên", "SĐT", "Email", "Chủ đề", "Trạng thái", "Nội dung"],
      filterMessages(listMessages()).map((item) => [
        item.createdAt,
        item.name,
        item.phone,
        item.email || "",
        item.topic,
        item.read ? "Đã đọc" : "Chưa đọc",
        item.message,
      ])
    );
  });

  listBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-msg]");
    if (!button) return;
    activeId = button.dataset.msg;
    const item = current();
    if (item && !item.read) markMessageRead(item.id);
    repaint();
  });

  detailBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-msg-action]");
    if (!button) return;
    const item = current();
    if (!item || !canManage()) return;
    const action = button.dataset.msgAction;

    if (action === "toggle") {
      updateMessage(item.id, { read: !item.read });
      toast(item.read ? "Đã đánh dấu chưa đọc." : "Đã đánh dấu đã đọc.");
      return repaint();
    }
    if (action === "copy") {
      navigator.clipboard
        ?.writeText(`${item.name} (${item.phone})\n${item.message}`)
        .then(() => toast("Đã sao chép nội dung tin nhắn."))
        .catch(() => toast("Trình duyệt không cho phép sao chép.", "error"));
      return undefined;
    }
    if (action === "delete") {
      if (!window.confirm(`Xoá tin nhắn của ${item.name}?`)) return;
      removeMessage(item.id);
      logActivity("Xoá tin nhắn", `Xoá tin nhắn của ${item.name}`);
      toast("Đã xoá tin nhắn.");
      activeId = listMessages()[0]?.id || null;
      return refreshAdmin();
    }
    if (action === "send") {
      const text = document.getElementById("msg-reply")?.value.trim();
      if (!text) return toast("Nhập nội dung trả lời trước khi mở trình soạn thư.", "warning");
      const target = item.email || getSettings().email;
      window.open(
        `mailto:${target}?subject=${encodeURIComponent(`Phản hồi: ${item.topic}`)}&body=${encodeURIComponent(text)}`
      );
      return undefined;
    }
    return undefined;
  });
});
