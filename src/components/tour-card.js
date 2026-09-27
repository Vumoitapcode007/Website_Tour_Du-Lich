import { FALLBACK_IMAGE, formatPrice } from "../data.js";
import { isCompared, isFavorite } from "../favorites.js";
import { searchKey } from "../validate.js";

export const imgFallback = `this.onerror=null;this.src='${FALLBACK_IMAGE}'`;

export function tourCard(tour) {
  const searchText = searchKey(
    `${tour.name} ${tour.location} ${tour.description} ${(tour.highlights || []).join(" ")}`
  );
  const fav = isFavorite(tour.id);
  const cmp = isCompared(tour.id);

  return `
  <article class="tour-card" data-tour-id="${tour.id}" data-fav-state="${fav}" data-cmp-state="${cmp}" data-search="${searchText}">
    <div class="card-media">
      <a class="card-img" href="#/tour/${tour.id}" aria-label="Xem chi tiết ${tour.name}">
        <img src="${tour.image}" alt="${tour.name}" loading="lazy" onerror="${imgFallback}">
        ${tour.oldPrice ? `<span class="badge badge-sale">-${Math.round((1 - tour.price / tour.oldPrice) * 100)}%</span>` : ""}
        <span class="badge badge-place">${tour.location}</span>
      </a>
      <button
        type="button"
        class="fav-btn${fav ? " is-on" : ""}"
        data-fav="${tour.id}"
        aria-pressed="${fav}"
        aria-label="Yêu thích ${tour.name}"
        title="Yêu thích"
      ><span aria-hidden="true">♥</span></button>
    </div>
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
      <label class="cmp-check">
        <input type="checkbox" data-cmp="${tour.id}"${cmp ? " checked" : ""}>
        <span>So sánh</span>
      </label>
      <div class="card-actions">
        <a class="btn btn-ghost-soft" href="#/tour/${tour.id}">Xem chi tiết</a>
        <a class="btn btn-primary" href="#/booking?tour=${tour.id}">Đặt tour</a>
      </div>
    </div>
  </article>`;
}
