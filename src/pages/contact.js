import { contactInfo } from "../data.js";
import { getTourById } from "../tour-repository.js";
import { saveMessage } from "../store.js";
import { isEmail, isName, isPhone } from "../validate.js";

const infoCards = [
  {
    icon: "📞",
    title: "Hotline",
    lines: [contactInfo.hotline, contactInfo.workingHours],
    href: `tel:${contactInfo.hotlineDigits}`,
  },
  { icon: "✉️", title: "Email", lines: [contactInfo.email], href: `mailto:${contactInfo.email}` },
  { icon: "📍", title: "Văn phòng", lines: [contactInfo.address] },
  { icon: "🕘", title: "Giờ làm việc", lines: [contactInfo.hours] },
];

const faqs = [
  {
    q: "Tôi có được hoàn tiền nếu huỷ tour?",
    a: "Bạn được hoàn 100% khi huỷ trước ít nhất 7 ngày trước ngày khởi hành. Huỷ trong vòng 3 ngày sẽ được hoàn 50%.",
  },
  {
    q: "Tour có bao gồm vé máy bay không?",
    a: "Tùy từng tour. Các tour có ghi rõ 'Vé máy bay khứ hồi' trong danh mục Bao gồm. Vui lòng kiểm tra ở trang chi tiết từng tour hoặc gọi hotline để được tư vấn.",
  },
  {
    q: "Trẻ em có được tham gia tour không?",
    a: "Được. Trẻ em từ 2 tuổi trở lên đều có thể tham gia. Giá tour được tính theo giá trẻ em, bạn có thể ghi rõ trong phần ghi chú khi đặt tour.",
  },
  {
    q: "Tôi có thể đặt tour cho nhóm lớn?",
    a: "Hoàn toàn được. Với nhóm từ 10 người trở lên, chúng tôi sẽ bố trí xe riêng và hướng dẫn viên riêng. Liên hệ hotline để nhận báo giá tốt nhất.",
  },
];

export function Contact(path, params = {}, query = new URLSearchParams()) {
  const tour = getTourById(query.get("tour"));

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Hỗ trợ</span>
      <h1>Liên hệ với TravelGo</h1>
      <p>Đội ngũ tư vấn sẵn sàng hỗ trợ bạn 24/7, kể cả ngày lễ.</p>
    </div>
  </section>

  <section class="section container">
    <div class="info-grid">
      ${infoCards
        .map(
          (card) => `
        <div class="info-card">
          <div class="feature-icon">${card.icon}</div>
          <h3>${card.title}</h3>
          ${card.lines
            .map((line) =>
              card.href
                ? `<p><a href="${card.href}">${line}</a></p>`
                : `<p>${line}</p>`
            )
            .join("")}
        </div>`
        )
        .join("")}
    </div>
  </section>

  <section class="section contact-section">
    <div class="container contact-layout">
      <div class="contact-text">
        <h2>Gửi tin nhắn cho chúng tôi</h2>
        <p>
          Điền thông tin bên cạnh, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
          Nếu cần tư vấn ngay, hãy gọi hotline
          <a href="tel:${contactInfo.hotlineDigits}">${contactInfo.hotline}</a>.
        </p>
        <ul class="contact-points">
          <li>✔ Tư vấn miễn phí, không ràng buộc</li>
          <li>✔ Báo giá rõ ràng, không phát sinh</li>
          <li>✔ Hỗ trợ đổi lịch trước 7 ngày</li>
        </ul>
        <div class="map-placeholder">
          <strong>Văn phòng TravelGo</strong>
          <span>${contactInfo.address}</span>
          <a class="btn btn-outline btn-sm" target="_blank" rel="noopener"
            href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}">Xem trên bản đồ</a>
        </div>
      </div>

      <form class="form-card" id="contact-form" novalidate>
        <h2>${tour ? `Tư vấn tour ${tour.name}` : "Gửi lời nhắn"}</h2>
        ${tour ? `<p class="form-hint">Bạn đang hỏi về tour <strong>${tour.name}</strong> (${tour.time}).</p>` : ""}

        <div class="field-row">
          <div class="field">
            <label for="ct-name">Họ và tên <span class="req">*</span></label>
            <input id="ct-name" name="name" type="text" placeholder="Nguyễn Văn A" required>
            <p class="error" data-error="name"></p>
          </div>
          <div class="field">
            <label for="ct-phone">Số điện thoại <span class="req">*</span></label>
            <input id="ct-phone" name="phone" type="tel" placeholder="0909 888 777" required>
            <p class="error" data-error="phone"></p>
          </div>
        </div>

        <div class="field">
          <label for="ct-email">Email</label>
          <input id="ct-email" name="email" type="email" placeholder="email@example.com">
          <p class="error" data-error="email"></p>
        </div>

        <div class="field">
          <label for="ct-topic">Chủ đề <span class="req">*</span></label>
          <select id="ct-topic" name="topic" required>
            <option value="">-- Chọn chủ đề --</option>
            <option value="Tư vấn tour">Tư vấn tour</option>
            <option value="Đặt tour nhóm lớn">Đặt tour nhóm lớn</option>
            <option value="Hợp đồng doanh nghiệp">Hợp đồng doanh nghiệp</option>
            <option value="Góp ý/khiếu nại">Góp ý/khiếu nại</option>
          </select>
          <p class="error" data-error="topic"></p>
        </div>

        <div class="field">
          <label for="ct-message">Nội dung <span class="req">*</span></label>
          <textarea id="ct-message" name="message" rows="5" placeholder="Mô tả nhu cầu của bạn..." required></textarea>
          <p class="error" data-error="message"></p>
        </div>

        <button class="btn btn-primary btn-lg btn-block" type="submit">Gửi tin nhắn</button>
      </form>
    </div>
  </section>

  <section class="section container">
    <div class="section-title center">
      <h2>Câu hỏi thường gặp</h2>
      <p>Giải đáp nhanh những thắc mắc phổ biến</p>
    </div>
    <div class="faq-list">
      ${faqs
        .map(
          (item) => `
        <details class="faq-item">
          <summary>${item.q}</summary>
          <p>${item.a}</p>
        </details>`
        )
        .join("")}
    </div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "contact") return;
  const form = document.getElementById("contact-form");
  if (!form) return;

  function showErrors(errors) {
    form.querySelectorAll("[data-error]").forEach((node) => {
      node.textContent = errors[node.dataset.error] || "";
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const errors = {};

    if (!isName(name)) errors.name = "Vui lòng nhập họ và tên.";
    if (!isPhone(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
    if (email && !isEmail(email)) errors.email = "Email chưa hợp lệ.";
    if (!data.get("topic")) errors.topic = "Vui lòng chọn chủ đề.";
    if (message.length < 10) errors.message = "Vui lòng nhập nội dung từ 10 ký tự.";

    showErrors(errors);
    if (Object.keys(errors).length) return;

    saveMessage({
      name,
      phone,
      email,
      topic: data.get("topic"),
      message,
    });

    form.innerHTML = `
      <div class="form-success">
        <div class="success-icon">✓</div>
        <h2>Gửi tin nhắn thành công!</h2>
        <p>Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong 24 giờ.</p>
        <div class="success-actions">
          <a class="btn btn-primary" href="#/tours">Xem danh sách tour</a>
          <a class="btn btn-outline" href="#/">Về trang chủ</a>
        </div>
      </div>`;
  });
});
