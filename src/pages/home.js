import { tours, formatPrice } from "../data.js";

function tourCard(tour) {
  return `
  <article class="tour-card">
    <div class="card-img">
      <img src="${tour.image}" alt="${tour.name}" loading="lazy">
      <span class="badge">${tour.location}</span>
    </div>
    <div class="card-info">
      <h3>${tour.name}</h3>
      <p class="time">${tour.time}</p>
      <p class="price">${formatPrice(tour.price)}</p>
      <a class="btn btn-primary btn-block" href="#/about">Xem chi tiết</a>
    </div>
  </article>`;
}

export function Home() {
  return `
  <section class="hero">
    <div class="hero-content container">
      <span class="hero-eyebrow">Du lịch Việt Nam</span>
      <h1>Khám phá Việt Nam cùng TravelGo</h1>
      <p>Đặt tour nhanh chóng - Lịch trình rõ ràng - Chi phí hợp lý</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="#/about">Xem tour ngay</a>
        <a class="btn btn-ghost btn-lg" href="#/about">Tìm hiểu thêm</a>
      </div>
    </div>
    <div class="hero-stats container">
      <div class="stat"><strong>10+</strong><span>Năm kinh nghiệm</span></div>
      <div class="stat"><strong>500+</strong><span>Tour mỗi năm</span></div>
      <div class="stat"><strong>50K+</strong><span>Khách hàng</span></div>
      <div class="stat"><strong>99%</strong><span>Khách hài lòng</span></div>
    </div>
  </section>

  <section class="section container">
    <div class="section-title">
      <h2>Tour nổi bật</h2>
      <p>Những hành trình được yêu thích nhất</p>
    </div>
    <div class="tour-grid">
      ${tours.slice(0, 3).map(tourCard).join("")}
    </div>
  </section>

  <section class="section features container">
    <div class="feature-item">
      <div class="feature-icon">🛡️</div>
      <h3>Tour chất lượng</h3>
      <p>Lịch trình chuẩn, dịch vụ tận tâm và hướng dẫn viên giàu kinh nghiệm.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">💰</div>
      <h3>Giá hợp lý</h3>
      <p>Chi phí minh bạch, không phát sinh, nhiều ưu đãi theo nhóm.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">📞</div>
      <h3>Hỗ trợ 24/7</h3>
      <p>Đội ngũ tư vấn luôn sẵn sàng hỗ trợ bạn trước và trong tour.</p>
    </div>
  </section>

  <section class="cta">
    <div class="container cta-inner">
      <h2>Bạn đã sẵn sàng cho chuyến đi tiếp theo?</h2>
      <p>Đặt tour ngay để nhận ưu đãi đặc biệt trong tháng này.</p>
      <a class="btn btn-light btn-lg" href="#/about">Liên hệ với chúng tôi</a>
    </div>
  </section>`;
}