import { getTourById, relatedTours, formatPrice, formatDate, contactInfo } from "../data.js";
import { tourCard } from "../components/tour-card.js";

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function NotFoundTour() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Lỗi 404</span>
      <h1>Không tìm thấy tour</h1>
      <p>Tour bạn đang xem không còn tồn tại hoặc đã kết thúc.</p>
    </div>
  </section>
  <section class="section container center">
    <a class="btn btn-primary btn-lg" href="#/tours">Xem tất cả tour</a>
  </section>`;
}

export function TourDetail(path, params = {}) {
  const tour = getTourById(params.id);
  if (!tour) return NotFoundTour();

  const departures = tour.departures
    .map(
      (date) =>
        `<option value="${date}">${formatDate(date)} - còn ${tour.seatsLeft} chỗ</option>`
    )
    .join("");

  return `
  <section class="detail-top">
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/">Trang chủ</a> <span>/</span>
        <a href="#/tours">Danh sách tour</a> <span>/</span>
        <em>${tour.name}</em>
      </nav>
      <h1>${tour.name}</h1>
      <div class="detail-meta">
        <span class="chip">📍 ${tour.location}</span>
        <span class="chip">🗓️ ${tour.time}</span>
        <span class="chip">👥 Còn ${tour.seatsLeft} chỗ</span>
        <span class="chip rating-chip">${stars(tour.rating)} ${tour.rating} (${tour.reviews} đánh giá)</span>
      </div>
    </div>
  </section>

  <section class="section container detail-layout">
    <div class="detail-main">
      <div class="gallery">
        <div class="gallery-main">
          <img id="gallery-main-img" src="${tour.gallery[0]}" alt="${tour.name} - ảnh 1">
        </div>
        <div class="gallery-thumbs" id="gallery-thumbs">
          ${tour.gallery
            .map(
              (src, index) => `
            <button type="button" class="thumb${index === 0 ? " active" : ""}" data-src="${src}" data-index="${index}">
              <img src="${src}" alt="${tour.name} - ảnh ${index + 1}" loading="lazy">
            </button>`
            )
            .join("")}
        </div>
      </div>

      <div class="detail-block">
        <h2>Giới thiệu tour</h2>
        <p class="detail-desc">${tour.description}</p>
        <ul class="highlight-list">
          ${tour.highlights.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>

      <div class="detail-block">
        <h2>Lịch trình chi tiết</h2>
        <div class="timeline">
          ${tour.itinerary
            .map(
              (step) => `
            <div class="timeline-item">
              <span class="timeline-day">${step.day}</span>
              <div>
                <h3>${step.title}</h3>
                <ul>${step.items.map((item) => `<li>${item}</li>`).join("")}</ul>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>

      <div class="detail-block">
        <h2>Tour bao gồm</h2>
        <div class="include-grid">
          <div>
            <h3 class="include-title include-yes">✔ Bao gồm</h3>
            <ul class="include-list">${tour.includes.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div>
            <h3 class="include-title include-no">✖ Không bao gồm</h3>
            <ul class="include-list">${tour.excludes.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
    </div>

    <aside class="detail-aside">
      <form class="booking-card" id="quick-booking">
        <p class="booking-price">
          ${formatPrice(tour.price)}
          ${tour.oldPrice ? `<del>${formatPrice(tour.oldPrice)}</del>` : ""}
        </p>
        <p class="booking-note">${tour.time} · Đã gồm vé, ăn uống và hướng dẫn viên</p>

        <label for="quick-departure">Ngày khởi hành</label>
        <select id="quick-departure" name="departure">${departures}</select>

        <label for="quick-people">Số khách</label>
        <input id="quick-people" name="people" type="number" min="1" max="${tour.seatsLeft}" value="1">

        <div class="booking-total">
          <span>Tạm tính</span>
          <strong id="quick-total">${formatPrice(tour.price)}</strong>
        </div>

        <a class="btn btn-primary btn-block" id="quick-submit" href="#/booking?tour=${tour.id}">Đặt tour ngay</a>
        <a class="btn btn-outline btn-block" href="#/contact?tour=${tour.id}">Liên hệ tư vấn</a>
        <p class="booking-hotline">Hotline: <a href="tel:${contactInfo.hotlineDigits}">${contactInfo.hotline}</a></p>
      </form>
    </aside>
  </section>

  <section class="section related">
    <div class="container">
      <div class="section-title">
        <h2>Tour liên quan</h2>
        <p>Có thể bạn cũng thích những hành trình sau</p>
      </div>
      <div class="tour-grid">${relatedTours(tour).map(tourCard).join("")}</div>
    </div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (!detail.path.startsWith("tour/")) return;
  const form = document.getElementById("quick-booking");
  if (!form) return;

  const tour = getTourById(detail.params?.id);
  const totalEl = document.getElementById("quick-total");
  const peopleInput = form.elements.people;
  const submit = document.getElementById("quick-submit");
  const departure = form.elements.departure;

  function refresh() {
    if (!tour) return;
    const people = Math.min(Math.max(Number(peopleInput.value) || 1, 1), tour.seatsLeft);
    totalEl.textContent = formatPrice(tour.price * people);
    submit.href = `#/booking?tour=${tour.id}&date=${departure.value}&people=${people}`;
  }

  peopleInput.addEventListener("input", refresh);
  departure.addEventListener("change", refresh);
  refresh();

  const mainImg = document.getElementById("gallery-main-img");
  const thumbs = [...document.querySelectorAll("#gallery-thumbs .thumb")];
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      mainImg.src = thumb.dataset.src;
      thumbs.forEach((item) => item.classList.toggle("active", item === thumb));
    });
  });
});
