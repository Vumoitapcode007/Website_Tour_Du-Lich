import { formatPrice } from "../data.js";

export function tourCard(tour) {
  const searchText = `${tour.name} ${tour.location} ${tour.description} ${tour.highlights.join(" ")}`;

  return `
  <article class="tour-card" data-tour-id="${tour.id}" data-search="${searchText}">
    <a class="card-img" href="#/tour/${tour.id}" aria-label="Xem chi tiết ${tour.name}">
      <img src="${tour.image}" alt="${tour.name}" loading="lazy">
      ${tour.oldPrice ? `<span class="badge badge-sale">-${Math.round((1 - tour.price / tour.oldPrice) * 100)}%</span>` : ""}
      <span class="badge badge-place">${tour.location}</span>
    </a>
    <div class="card-info">
      <h3><a href="#/tour/${tour.id}">${tour.name}</a></h3>
      <p class="time">
        <span>${tour.time}</span>
        <span class="rating" data-value="${tour.rating}">★ ${tour.rating} <em>(${tour.reviews})</em></span>
      </p>
      <div class="price-row">
        <p class="price" data-value="${tour.price}">${formatPrice(tour.price)}</p>
        ${tour.oldPrice ? `<p class="price-old">${formatPrice(tour.oldPrice)}</p>` : ""}
      </div>
      <div class="card-actions">
        <a class="btn btn-ghost-soft" href="#/tour/${tour.id}">Xem chi tiết</a>
        <a class="btn btn-primary" href="#/booking?tour=${tour.id}">Đặt tour</a>
      </div>
    </div>
  </article>`;
}
