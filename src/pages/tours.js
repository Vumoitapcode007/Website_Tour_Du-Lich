import { tours, destinations } from "../data.js";
import { tourCard } from "../components/tour-card.js";

const locationOptions = destinations
  .map((place) => `<option value="${place}">${place}</option>`)
  .join("");

export function Tours() {
  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Danh mục tour</span>
      <h1>Danh sách tour du lịch</h1>
      <p>Chọn điểm đến, so sánh giá và đặt tour chỉ trong vài phút.</p>
    </div>
  </section>

  <section class="section container">
    <form class="toolbar" id="tour-filter" role="search">
      <div class="toolbar-field">
        <label for="filter-keyword">Tìm tour</label>
        <input id="filter-keyword" name="q" type="search" placeholder="Tên tour, điểm đến..." autocomplete="off">
      </div>
      <div class="toolbar-field">
        <label for="filter-location">Điểm đến</label>
        <select id="filter-location" name="location">
          <option value="">Tất cả điểm đến</option>
          ${locationOptions}
        </select>
      </div>
      <div class="toolbar-field">
        <label for="filter-sort">Sắp xếp</label>
        <select id="filter-sort" name="sort">
          <option value="featured">Tour nổi bật</option>
          <option value="asc">Giá thấp đến cao</option>
          <option value="desc">Giá cao đến thấp</option>
          <option value="rating">Đánh giá cao nhất</option>
        </select>
      </div>
      <button class="btn btn-primary toolbar-reset" type="reset">Xóa lọc</button>
    </form>

    <p class="result-count" id="tour-count" role="status"></p>
    <div class="tour-grid" id="tour-list">${tours.map(tourCard).join("")}</div>
    <p class="search-empty" id="tour-empty" hidden>
      Không tìm thấy tour phù hợp. Hãy thử điểm đến khác hoặc xóa bộ lọc nhé.
    </p>
  </section>

  <section class="cta">
    <div class="container cta-inner">
      <h2>Chưa biết chọn tour nào?</h2>
      <p>Để lại thông tin, đội ngũ tư vấn sẽ gọi cho bạn trong 30 phút.</p>
      <a class="btn btn-light btn-lg" href="#/contact">Tư vấn miễn phí</a>
    </div>
  </section>`;
}

function normalize(value) {
  return value.trim().toLocaleLowerCase("vi");
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "tours") return;
  const form = document.getElementById("tour-filter");
  if (!form) return;

  const list = document.getElementById("tour-list");
  const count = document.getElementById("tour-count");
  const empty = document.getElementById("tour-empty");
  const cards = [...list.querySelectorAll(".tour-card")];

  function apply() {
    const keyword = normalize(form.elements.q.value);
    const location = form.elements.location.value;
    const sort = form.elements.sort.value;

    const visible = cards.filter((card) => {
      const matchText = !keyword || normalize(card.dataset.search).includes(keyword);
      const matchPlace = !location || card.querySelector(".badge-place").textContent === location;
      card.hidden = !(matchText && matchPlace);
      return matchText && matchPlace;
    });

    visible.sort((a, b) => {
      if (sort === "asc") return price(a) - price(b);
      if (sort === "desc") return price(b) - price(a);
      if (sort === "rating") return rating(b) - rating(a);
      return 0;
    });

    visible.forEach((card) => list.appendChild(card));
    count.textContent = `Hiển thị ${visible.length}/${cards.length} tour`;
    empty.hidden = visible.length > 0;
  }

  function price(card) {
    return Number(card.querySelector(".price").dataset.value || 0);
  }

  function rating(card) {
    return Number(card.querySelector(".rating").dataset.value || 0);
  }

  form.addEventListener("input", apply);
  form.addEventListener("change", apply);
  form.addEventListener("reset", () => setTimeout(apply, 0));
  apply();
});
