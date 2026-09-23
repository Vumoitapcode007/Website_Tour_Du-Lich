const featured = document.getElementById("featuredTours");

if (featured) {
  featured.innerHTML = tours.slice(0,3).map(tour => `
    <article class="tour-card">
      <img src="${tour.image}" alt="${tour.name}">
      <div class="info">
        <span class="badge">${tour.location}</span>
        <h3>${tour.name}</h3>
        <p>${tour.time}</p>
        <p class="price">${formatPrice(tour.price)}</p>
        <a class="btn" href="pages/detail.html?id=${tour.id}">Xem chi tiết</a>
      </div>
    </article>
  `).join("");
}
