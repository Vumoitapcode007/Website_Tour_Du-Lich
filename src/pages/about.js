import { team, contactInfo } from "../data.js";

export function About() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Về chúng tôi</span>
      <h1>Giới thiệu TravelGo</h1>
      <p>Đồng hành cùng bạn trên mọi hành trình khám phá.</p>
    </div>
  </section>

  <section class="section container about-story">
    <div class="story-text">
      <h2>Câu chuyện của chúng tôi</h2>
      <p>
        TravelGo được thành lập với sứ mệnh đưa những trải nghiệm du lịch chất
        lượng đến gần hơn với mọi người. Từ những chuyến đi nhỏ lẻ đến các tour
        trọn gói, chúng tôi luôn đặt sự hài lòng và an toàn của khách hàng lên
        hàng đầu.
      </p>
      <p>
        Dự án bắt đầu từ anh <strong>Trịnh Minh Vũ</strong> - Giám đốc điều hành,
        người luôn tin rằng mỗi chuyến đi đáng nhớ đều bắt đầu bằng một kế hoạch
        tử tế. Bên anh là đội ngũ nhỏ nhưng tận tâm gồm những người không ngừng học
        hỏi để mỗi tour ngày một hoàn thiện hơn.
      </p>
      <p>
        Với hơn 10 năm kinh nghiệm trong lĩnh vực lữ hành, chúng tôi tự hào là
        điểm đến tin cậy của hàng chục nghìn khách hàng trên khắp cả nước.
      </p>
      <a class="btn btn-primary" href="#/tours">Khám phá tour</a>
    </div>
    <div class="story-img">
      <img
        src="https://images.unsplash.com/photo-1556012018-50c5900c1935?auto=format&fit=crop&w=800&q=80"
        alt="Đội ngũ TravelGo"
        loading="lazy"
      >
    </div>
  </section>

  <section class="section values">
    <div class="container">
      <div class="section-title center">
        <h2>Giá trị cốt lõi</h2>
        <p>Những điều chúng tôi luôn giữ vững</p>
      </div>
      <div class="value-grid">
        <div class="value-item">
          <div class="feature-icon">🤝</div>
          <h3>Uy tín</h3>
          <p>Cam kết đúng lịch trình, đúng dịch vụ đã thỏa thuận.</p>
        </div>
        <div class="value-item">
          <div class="feature-icon">🌟</div>
          <h3>Chất lượng</h3>
          <p>Chọn lọc kỹ các dịch vụ lưu trú, di chuyển và hướng dẫn viên.</p>
        </div>
        <div class="value-item">
          <div class="feature-icon">💡</div>
          <h3>Sáng tạo</h3>
          <p>Liên tục đổi mới các tour tuyến, trải nghiệm mới mẻ.</p>
        </div>
        <div class="value-item">
          <div class="feature-icon">🌱</div>
          <h3>Bền vững</h3>
          <p>Du lịch có trách nhiệm, bảo vệ thiên nhiên và cộng đồng.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section container stats-band">
    <div class="stat"><strong>10+</strong><span>Năm kinh nghiệm</span></div>
    <div class="stat"><strong>500+</strong><span>Tour mỗi năm</span></div>
    <div class="stat"><strong>50K+</strong><span>Khách hàng</span></div>
    <div class="stat"><strong>99%</strong><span>Khách hài lòng</span></div>
  </section>

  <section class="section container">
    <div class="section-title center">
      <h2>Đội ngũ của chúng tôi</h2>
      <p>Những con người làm nên TravelGo</p>
    </div>
    <div class="team-grid">
      ${team
        .map(
          (member) => `
        <div class="team-card">
          <div class="avatar">${member.initials}</div>
          <h3>${member.name}</h3>
          <p>${member.role}</p>
        </div>`
        )
        .join("")}
    </div>
  </section>

  <section class="section contact-band">
    <div class="container contact-band-inner">
      <div>
        <h2>Ghé thăm văn phòng của chúng tôi</h2>
        <p>${contactInfo.address}</p>
      </div>
      <div class="contact-band-actions">
        <a class="btn btn-light" href="tel:${contactInfo.hotlineDigits}">Gọi ${contactInfo.hotline}</a>
        <a class="btn btn-ghost" href="#/contact">Gửi tin nhắn</a>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="container cta-inner">
      <h2>Vẫn còn thắc mắc?</h2>
      <p>Liên hệ ngay để được tư vấn miễn phí.</p>
      <a class="btn btn-light btn-lg" href="#/contact">Liên hệ ngay</a>
    </div>
  </section>`;
}