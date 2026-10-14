import { getSettings } from "../store.js";
import { escapeHtml } from "../validate.js";

const FAQ_KNOWLEDGE = [
  {
    keywords: ["đặt tour", "cách đặt", "làm sao để đặt", "mua tour"],
    answer: "Để đặt tour rất đơn giản:\n1. Vào mục <strong>Danh sách tour</strong> chọn chuyến đi ưng ý.\n2. Chọn ngày khởi hành và số lượng người lớn/trẻ em.\n3. Điền thông tin người liên hệ và bấm <strong>Xác nhận đặt tour</strong>.\n4. Tiến hành thanh toán qua MoMo hoặc quét mã VietQR để nhận vé điện tử ngay tức thì!",
  },
  {
    keywords: ["hủy tour", "hoàn tiền", "chính sách hủy", "đổi ngày", "trả tiền"],
    answer: "Chính sách hủy tour & hoàn tiền của TravelGo:\n• Hủy trước ≥ 10 ngày: <strong>Hoàn 100% tiền cọc</strong>\n• Hủy từ 5 - 9 ngày: <strong>Hoàn 70%</strong>\n• Hủy từ 2 - 4 ngày: <strong>Hoàn 50%</strong>\n👉 Bạn có thể xem chi tiết tại trang <a href='#/policies?tab=refund'>Chính sách hoàn tiền</a>.",
  },
  {
    keywords: ["thanh toán", "momo", "chuyển khoản", "ngân hàng", "vietqr", "tiền mặt"],
    answer: "TravelGo hỗ trợ 2 hình thức thanh toán trực tuyến thuận tiện nhất:\n1. <strong>Ví điện tử MoMo</strong>: Quét mã QR MoMo gạch nợ tự động trong 5 giây.\n2. <strong>Chuyển khoản VietQR</strong>: Quét mã QR liên ngân hàng chuẩn Napas 24/7 không mất phí.\nSau khi thanh toán xong, hệ thống xuất ngay <strong>Vé điện tử (E-Ticket)</strong> có mã QR check-in lên xe.",
  },
  {
    keywords: ["giấy tờ", "cccd", "hộ chiếu", "mang theo", "hành lý", "chuẩn bị"],
    answer: "Quý khách cần chuẩn bị:\n• Bản gốc <strong>CCCD / Hộ chiếu</strong> (còn hạn trên 6 tháng nếu là tour bay/quốc tế).\n• Giấy khai sinh bản sao trích lục cho trẻ em dưới 14 tuổi.\n• Đơn vé điện tử (chụp lại trên điện thoại hoặc in ra).\n• Thuốc say xe/dị ứng cá nhân và kem chống nắng.",
  },
  {
    keywords: ["cẩm nang", "blog", "kinh nghiệm", "ăn gì", "chơi đâu"],
    answer: "Mời bạn ghé thăm chuyên mục <a href='#/blog'>Cẩm nang du lịch</a> của TravelGo! Tại đây có đầy đủ kinh nghiệm khám phá Đà Nẵng, Ninh Bình, Hạ Long, Sa Pa, Phú Quốc cùng các mẹo săn mây và quán ăn ngon.",
  },
  {
    keywords: ["hotline", "số điện thoại", "liên hệ", "tổng đài"],
    answer: "Tổng đài hỗ trợ 24/7 của TravelGo là: <a href='tel:19006868'><strong>1900 6868</strong></a> hoặc Hotline khẩn cấp: <a href='tel:0909888777'><strong>0909 888 777</strong></a>. Email: <a href='mailto:hotro@travelgo.vn'>hotro@travelgo.vn</a>.",
  },
];

let chatHistory = [
  {
    sender: "bot",
    text: "Xin chào! 👋 Mình là <strong>Trợ lý ảo TravelGo</strong>. Mình có thể giúp gì cho kế hoạch du lịch của bạn hôm nay?",
    time: "Vừa xong",
  },
];

function getBotReply(userMessage) {
  const query = userMessage.toLowerCase().trim();
  for (const item of FAQ_KNOWLEDGE) {
    if (item.keywords.some((kw) => query.includes(kw))) {
      return item.answer;
    }
  }
  return "Cảm ơn bạn đã nhắn tin! Để được giải đáp chi tiết nhất về yêu cầu này, bạn có thể gọi hotline <a href='tel:19006868'><strong>1900 6868</strong></a> hoặc chat trực tiếp qua Zalo của TravelGo nhé!";
}

export function chatWidget() {
  const settings = getSettings();
  const hotline = settings.hotline || "1900 6868";
  const cleanHotline = String(hotline).replace(/\D/g, "");

  return `
  <!-- Floating Live Chat Trigger -->
  <aside class="chat-widget-root no-print" id="chat-widget-root">
    <button type="button" class="chat-trigger-btn" id="btn-toggle-chat" aria-label="Mở khung hỗ trợ trực tuyến">
      <span class="chat-trigger-icon">💬</span>
      <span class="chat-trigger-text">Hỗ trợ 24/7</span>
      <span class="chat-pulse-ring"></span>
    </button>

    <!-- Khung Chat Modal -->
    <div class="chat-box-window" id="chat-box-window" style="display: none;">
      <div class="chat-box-header">
        <div class="chat-bot-avatar-group">
          <div class="bot-avatar-wrapper">
            <span class="bot-avatar-icon">🤖</span>
            <span class="bot-online-dot"></span>
          </div>
          <div>
            <strong>Trợ lý du lịch TravelGo</strong>
            <small>🟢 Trực tuyến 24/7 · Phản hồi tức thì</small>
          </div>
        </div>
        <button type="button" class="btn-close-chat" id="btn-close-chat" aria-label="Đóng chat">✕</button>
      </div>

      <!-- Tab điều hướng trong Chat -->
      <div class="chat-tabs-bar">
        <button type="button" class="chat-tab-btn active" data-chat-tab="bot">
          🤖 Chat với AI
        </button>
        <button type="button" class="chat-tab-btn" data-chat-tab="human">
          📞 Kênh liên hệ nhanh
        </button>
      </div>

      <!-- Panel 1: Chatbot AI -->
      <div class="chat-tab-panel active" id="chat-panel-bot">
        <div class="chat-messages-container" id="chat-messages-container">
          ${renderMessages()}
        </div>

        <div class="chat-quick-chips" id="chat-quick-chips">
          <button type="button" class="chat-chip" data-prompt="Làm sao để đặt tour?">
            📝 Cách đặt tour
          </button>
          <button type="button" class="chat-chip" data-prompt="Quy định hủy tour và hoàn tiền?">
            💳 Hủy tour & Hoàn tiền
          </button>
          <button type="button" class="chat-chip" data-prompt="Có những hình thức thanh toán nào?">
            💸 Hình thức thanh toán
          </button>
          <button type="button" class="chat-chip" data-prompt="Cần chuẩn bị giấy tờ gì khi đi tour?">
            🪪 Giấy tờ cần mang
          </button>
        </div>

        <form class="chat-input-form" id="chat-input-form">
          <input 
            type="text" 
            id="chat-user-input" 
            placeholder="Nhập câu hỏi của bạn tại đây..." 
            autocomplete="off"
            required
          >
          <button type="submit" class="btn-send-chat" aria-label="Gửi tin nhắn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>

      <!-- Panel 2: Kênh liên hệ trực tiếp người thật -->
      <div class="chat-tab-panel" id="chat-panel-human" style="display: none;">
        <div class="contact-channels-list">
          <a href="tel:${cleanHotline}" class="channel-item call-channel">
            <div class="channel-icon">📞</div>
            <div class="channel-info">
              <strong>Gọi Tổng đài Hotline: ${escapeHtml(hotline)}</strong>
              <span>Tư vấn viên sẵn sàng phục vụ 24/7 (Miễn phí cước)</span>
            </div>
            <span class="channel-arrow">→</span>
          </a>

          <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" class="channel-item zalo-channel">
            <div class="channel-icon">💬</div>
            <div class="channel-info">
              <strong>Chat qua Zalo Official Account</strong>
              <span>Nhận lịch trình tour chi tiết & hình ảnh qua Zalo</span>
            </div>
            <span class="channel-arrow">→</span>
          </a>

          <a href="https://m.me" target="_blank" rel="noopener noreferrer" class="channel-item fb-channel">
            <div class="channel-icon">⚡</div>
            <div class="channel-info">
              <strong>Nhắn tin Facebook Messenger</strong>
              <span>Phản hồi trong vòng 5 phút từ Fanpage</span>
            </div>
            <span class="channel-arrow">→</span>
          </a>

          <a href="#/contact" class="channel-item web-channel">
            <div class="channel-icon">✉️</div>
            <div class="channel-info">
              <strong>Gửi form yêu cầu tư vấn riêng</strong>
              <span>Thiết kế tour cho đoàn thể, doanh nghiệp</span>
            </div>
            <span class="channel-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  </aside>`;
}

function renderMessages() {
  return chatHistory
    .map((msg) => `
    <div class="chat-msg-row ${msg.sender === "user" ? "msg-user" : "msg-bot"}">
      ${msg.sender === "bot" ? `<span class="msg-avatar">🤖</span>` : ""}
      <div class="msg-bubble">
        <div class="msg-text">${msg.text}</div>
        <small class="msg-time">${msg.time}</small>
      </div>
    </div>`)
    .join("");
}

function scrollChatToBottom() {
  const container = document.getElementById("chat-messages-container");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// Global click & submit listeners for chat widget
document.addEventListener("click", (e) => {
  // Toggle Open/Close
  if (e.target.closest("#btn-toggle-chat")) {
    const win = document.getElementById("chat-box-window");
    if (win) {
      const isVisible = win.style.display !== "none";
      win.style.display = isVisible ? "none" : "flex";
      if (!isVisible) scrollChatToBottom();
    }
    return;
  }

  if (e.target.closest("#btn-close-chat")) {
    const win = document.getElementById("chat-box-window");
    if (win) win.style.display = "none";
    return;
  }

  // Switch tabs in chat
  const tabBtn = e.target.closest(".chat-tab-btn");
  if (tabBtn) {
    const target = tabBtn.dataset.chatTab;
    document.querySelectorAll(".chat-tab-btn").forEach((btn) => btn.classList.toggle("active", btn === tabBtn));
    const botPanel = document.getElementById("chat-panel-bot");
    const humanPanel = document.getElementById("chat-panel-human");
    if (botPanel && humanPanel) {
      botPanel.style.display = target === "bot" ? "flex" : "none";
      humanPanel.style.display = target === "human" ? "block" : "none";
    }
    return;
  }

  // Click on a Quick Chip
  const chip = e.target.closest(".chat-chip");
  if (chip) {
    const prompt = chip.dataset.prompt;
    handleSendMessage(prompt);
    return;
  }
});

document.addEventListener("submit", (e) => {
  if (e.target.id === "chat-input-form") {
    e.preventDefault();
    const input = document.getElementById("chat-user-input");
    const val = input?.value?.trim();
    if (val) {
      handleSendMessage(val);
      input.value = "";
    }
  }
});

function handleSendMessage(text) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  chatHistory.push({
    sender: "user",
    text: escapeHtml(text),
    time: timeStr,
  });

  const container = document.getElementById("chat-messages-container");
  if (container) container.innerHTML = renderMessages();
  scrollChatToBottom();

  // Bot typing simulation
  setTimeout(() => {
    const reply = getBotReply(text);
    chatHistory.push({
      sender: "bot",
      text: reply,
      time: timeStr,
    });
    if (container) container.innerHTML = renderMessages();
    scrollChatToBottom();
  }, 400);
}
