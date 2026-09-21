const id = Number(new URLSearchParams(location.search).get("id"));
const tour = tours.find(t => t.id === id);
const detail = document.getElementById("detail");

if (!tour) {
  detail.innerHTML = '<div class="form"><h2>Không tìm thấy tour.</h2></div>';
} else {
  detail.innerHTML = `
    <div class="form">
      <img src="${tour.image}" alt="${tour.name}" style="width:100%;max-height:420px;object-fit:cover;border-radius:10px">
      <h1>${tour.name}</h1>
      <p><b>Địa điểm:</b> ${tour.location}</p>
      <p><b>Thời gian:</b> ${tour.time}</p>
      <p class="price">${formatPrice(tour.price)}</p>
      <p>${tour.description}</p>
      <br>
      <a class="btn" href="booking.html?id=${tour.id}">Đặt tour</a>
    </div>`;
}
