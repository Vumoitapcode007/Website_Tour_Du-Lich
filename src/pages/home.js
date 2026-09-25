import { tours } from "../data.js";
import { tourCard } from "../components/tour-card.js";

export function Home() {
  return `
  <section class="hero">
    <div class="hero-content container">
      <span class="hero-eyebrow">Du lịch Việt Nam</span>
      <h1>Khám phá Việt Nam cùng TravelGo</h1>
      <p>Đặt tour nhanh chóng - Lịch trình rõ ràng - Chi phí hợp lý</p>
      <form class="home-search" id="tour-search" role="search">
        <label class="sr-only" for="tour-query">Tìm điểm đến hoặc tên tour</label>
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input id="tour-query" name="q" type="search" placeholder="Bạn muốn đi đâu? (Đà Nẵng, Đà Lạt...)" autocomplete="off">
        <button class="btn btn-primary" type="submit">Tìm tour</button>
      </form>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="#/tours">Xem tour ngay</a>
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
      <a class="section-link" href="#/tours">Xem tất cả tour →</a>
    </div>
    <div class="tour-grid" id="tour-results">
      ${tours.slice(0, 6).map(tourCard).join("")}
    </div>
    <p class="search-empty" id="search-empty" role="status" hidden>Không tìm thấy tour phù hợp. Hãy thử điểm đến khác nhé.</p>
  </section>

  <section class="section why-us">
    <div class="container">
      <div class="section-title center">
        <h2>Vì sao chọn TravelGo?</h2>
        <p>Những lý do khách hàng tin tưởng chúng tôi</p>
      </div>
      <div class="features">
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
      </div>
    </div>
  </section>

  <section class="section container">
    <div class="section-title center">
      <h2>Các điểm đến nổi tiếng</h2>
      <p>Ghé thăm những miền đất đẹp nhất Việt Nam</p>
    </div>
    <div class="dest-grid">
      ${[
        { name: "Ninh Bình", note: "Tràng An - Hang Múa", img: tours[0].image },
        { name: "Đà Nẵng", note: "Bà Nà Hills - biển Mỹ Khê", img: tours[1].image },
        { name: "Quảng Ninh", note: "Vịnh Hạ Long", img: tours[2].image },
        { name: "Đà Lạt", note: "Thành phố ngàn hoa", img: tours[3].image },
        { name: "Sa Pa", note: "Ruộng bậc thang Tây Bắc", img: tours[4].image },
        { name: "Phú Quốc", note: "Đảo ngọc biển xanh", img: tours[5].image },
      ]
        .map(
          (dest) => `
        <a class="dest-card" href="#/tours">
          <img src="${dest.img}" alt="${dest.name}" loading="lazy">
          <span class="dest-info">
            <strong>${dest.name}</strong>
            <em>${dest.note}</em>
          </span>
        </a>`
        )
        .join("")}
    </div>
  </section>

  <section class="section testimonials">
    <div class="container">
      <div class="section-title center">
        <h2>Khách hàng nói gì?</h2>
        <p>Cảm nhận từ những người đã đi cùng TravelGo</p>
      </div>
      <div class="testimonial-grid">
        <div class="testimonial">
          <p>"Tour Ninh Bình đi rất hài lòng, hướng dẫn viên nhiệt tình và lịch trình vừa sức."</p>
          <div class="testimonial-user"><span class="avatar-sm">LH</span><span>Nguyễn Lan Hương<em>Khách hàng thường xuyên</em></span></div>
        </div>
        <div class="testimonial">
          <p>"Đặt tour qua website rất nhanh, nhân viên gọi xác nhận trong 15 phút. Rất đáng tin cậy."</p>
          <div class="testimonial-user"><span class="avatar-sm">TQ</span><span>Trần Quốc Bảo<em>Đặt tour Đà Nẵng</em></span></div>
        </div>
        <div class="testimonial">
          <p>"Tour Sa Pa mùa lúa chín tuyệt đẹp, giá hợp lý so với chất lượng nhận được."</p>
          <div class="testimonial-user"><span class="avatar-sm">MT</span><span>Phạm Minh Thành<em>Đặt tour Sa Pa</em></span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="container cta-inner">
      <h2>Bạn đã sẵn sàng cho chuyến đi tiếp theo?</h2>
      <p>Đặt tour ngay để nhận ưu đãi đặc biệt trong tháng này.</p>
      <a class="btn btn-light btn-lg" href="#/booking">Đặt tour ngay</a>
    </div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "") return;
  const form = document.getElementById("tour-search");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = form.elements.q.value.trim().toLocaleLowerCase("vi");
    const cards = [...document.querySelectorAll("#tour-results .tour-card")];
    let visibleCount = 0;
    cards.forEach((card) => {
      const text = (card.dataset.search || card.textContent).toLocaleLowerCase("vi");
      const matches = !query || text.includes(query);
      card.hidden = !matches;
      if (matches) visibleCount++;
    });
    document.getElementById("search-empty").hidden = visibleCount > 0;
    document.getElementById("tour-results").scrollIntoView?.({ behavior: "smooth", block: "start" });
  });
});
