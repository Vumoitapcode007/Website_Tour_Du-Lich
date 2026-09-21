const list = document.getElementById("tourList");
const search = document.getElementById("search");
const locationSelect = document.getElementById("location");
const sort = document.getElementById("sort");

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("q")) search.value = urlParams.get("q");

[...new Set(tours.map(t => t.location))].forEach(location => {
  locationSelect.innerHTML += `<option value="${location}">${location}</option>`;
});

function renderTours() {
  let result = [...tours];
  const keyword = search.value.toLowerCase();
  const location = locationSelect.value;

  result = result.filter(t =>
    t.name.toLowerCase().includes(keyword) &&
    (!location || t.location === location)
  );

  if (sort.value === "asc") result.sort((a,b) => a.price-b.price);
  if (sort.value === "desc") result.sort((a,b) => b.price-a.price);

  list.innerHTML = result.length ? result.map(t => `
    <article class="tour-card">
      <img src="${t.image}" alt="${t.name}">
      <div class="info">
        <span class="badge">${t.location}</span>
        <h3>${t.name}</h3>
        <p>${t.time}</p>
        <p class="price">${formatPrice(t.price)}</p>
        <a class="btn" href="detail.html?id=${t.id}">Xem chi tiết</a>
      </div>
    </article>
  `).join("") : `<p class="empty">Không tìm thấy tour phù hợp.</p>`;
}

search.addEventListener("input", renderTours);
locationSelect.addEventListener("change", renderTours);
sort.addEventListener("change", renderTours);
renderTours();
