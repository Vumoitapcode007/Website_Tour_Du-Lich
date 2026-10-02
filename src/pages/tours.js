import { listTours, getDestinations, sellableTours } from "../tour-repository.js";
import { tourCard } from "../components/tour-card.js";
import { countFavorites, isFavorite } from "../favorites.js";
import { searchKey } from "../validate.js";

const PRICE_BANDS = [
  { value: "budget", label: "Dưới 3 triệu", test: (price) => price < 3000000 },
  { value: "mid", label: "3 – 6 triệu", test: (price) => price >= 3000000 && price <= 6000000 },
  { value: "premium", label: "Trên 6 triệu", test: (price) => price > 6000000 },
];

const DURATION_BANDS = [
  { value: "short", label: "1 – 2 ngày", test: (days) => days <= 2 },
  { value: "medium", label: "3 – 4 ngày", test: (days) => days >= 3 && days <= 4 },
  { value: "long", label: "Từ 5 ngày", test: (days) => days >= 5 },
];

const SORTS = {
  featured: { label: "Tour nổi bật" },
  asc: { label: "Giá thấp đến cao" },
  desc: { label: "Giá cao đến thấp" },
  soon: { label: "Khởi hành sớm nhất" },
  rating: { label: "Đánh giá cao nhất" },
  reviews: { label: "Nhiều đánh giá nhất" },
  seats: { label: "Còn nhiều chỗ nhất" },
  duration: { label: "Thời lượng ngắn nhất" },
};

const firstDeparture = (tour) =>
  (tour.departures || [])
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()[0] || "9999-12-31";

function monthsWithDepartures(tours) {
  const months = new Map();
  tours.forEach((tour) => {
    const seen = new Set();
    (tour.departures || []).forEach((date) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      const key = date.slice(0, 7);
      if (seen.has(key)) return;
      seen.add(key);
      months.set(key, (months.get(key) || 0) + 1);
    });
  });

  return [...months.keys()]
    .sort()
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { value: key, label: `Tháng ${month}/${year}`, count: months.get(key) };
    });
}

function readFilters(form) {
  return {
    q: searchKey(form.elements.q.value),
    location: form.elements.location.value,
    price: form.elements.price.value,
    days: form.elements.days.value,
    month: form.elements.month.value,
    minRating: Number(form.elements.rating.value) || 0,
    seats: form.elements.seats.checked,
    popular: form.elements.popular.checked,
    sort: form.elements.sort.value,
  };
}

function matchTour(tour, filters) {
  const search = searchKey(
    `${tour.name} ${tour.location} ${tour.description} ${(tour.highlights || []).join(" ")}`
  );

  if (filters.q && !search.includes(filters.q)) return false;
  if (filters.location && tour.location !== filters.location) return false;

  const band = PRICE_BANDS.find((item) => item.value === filters.price);
  if (band && !band.test(tour.price)) return false;

  const duration = DURATION_BANDS.find((item) => item.value === filters.days);
  if (duration && !duration.test(tour.days)) return false;

  if (filters.month && !(tour.departures || []).some((date) => date.startsWith(filters.month)))
    return false;
  if (filters.minRating && tour.rating < filters.minRating) return false;
  if (filters.seats && tour.seatsLeft <= 0) return false;
  if (filters.popular && tour.reviews < 100) return false;

  return true;
}

const SORTERS = {
  asc: (a, b) => a.price - b.price,
  desc: (a, b) => b.price - a.price,
  soon: (a, b) => firstDeparture(a).localeCompare(firstDeparture(b)),
  rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  reviews: (a, b) => b.reviews - a.reviews,
  seats: (a, b) => b.seatsLeft - a.seatsLeft,
  duration: (a, b) => a.days - b.days,
};

export function Tours() {
  /* Chỉ tour còn nhận khách mới hiển thị; tour đã ngừng bán vẫn tồn tại
     trong hệ thống để phục vụ đơn cũ, thống kê và đánh giá */
  const allTours = sellableTours();
  const locationOptions = getDestinations()
    .map((place) => `<option value="${place}">${place}</option>`)
    .join("");
  const monthOptions = monthsWithDepartures(allTours)
    .map(
      (item) => `<option value="${item.value}">${item.label} (${item.count})</option>`
    )
    .join("");
  const sortOptions = Object.entries(SORTS)
    .map(([value, item]) => `<option value="${value}">${item.label}</option>`)
    .join("");

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">Danh mục tour</span>
      <h1>Danh sách tour du lịch</h1>
      <p>Chọn điểm đến, so sánh giá và đặt tour chỉ trong vài phút.</p>
    </div>
  </section>

  <section class="section container">
    <form class="toolbar toolbar-filters" id="tour-filter" role="search">
      <div class="toolbar-row">
        <div class="toolbar-field toolbar-grow">
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
          <label for="filter-month">Tháng khởi hành</label>
          <select id="filter-month" name="month">
            <option value="">Mọi tháng</option>
            ${monthOptions}
          </select>
        </div>
        <div class="toolbar-field">
          <label for="filter-sort">Sắp xếp</label>
          <select id="filter-sort" name="sort">
            ${sortOptions}
          </select>
        </div>
      </div>

      <div class="toolbar-row">
        <div class="toolbar-field">
          <label for="filter-price">Khoảng giá</label>
          <select id="filter-price" name="price">
            <option value="">Mọi mức giá</option>
            ${PRICE_BANDS.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
          </select>
        </div>
        <div class="toolbar-field">
          <label for="filter-days">Thời lượng</label>
          <select id="filter-days" name="days">
            <option value="">Mọi thời lượng</option>
            ${DURATION_BANDS.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
          </select>
        </div>
        <div class="toolbar-field">
          <label for="filter-rating">Đánh giá từ</label>
          <select id="filter-rating" name="rating">
            <option value="">Tất cả</option>
            <option value="4.5">4.5 ★ trở lên</option>
            <option value="4.8">4.8 ★ trở lên</option>
            <option value="4.9">4.9 ★ trở lên</option>
          </select>
        </div>
        <div class="toolbar-field toolbar-checks">
          <label>Tiêu chí khác</label>
          <label class="check-inline">
            <input type="checkbox" id="filter-seats" name="seats">
            <span>Còn chỗ</span>
          </label>
          <label class="check-inline">
            <input type="checkbox" id="filter-popular" name="popular">
            <span>Được đánh giá nhiều</span>
          </label>
          <label class="fav-switch">
            <input type="checkbox" id="filter-fav" name="fav">
            <span>Chỉ xem yêu thích (<b id="fav-count">${countFavorites()}</b>)</span>
          </label>
        </div>
        <button class="btn btn-ghost-soft toolbar-reset" type="reset">Xóa lọc</button>
      </div>

      <p class="filter-active" id="filter-active" hidden></p>
    </form>

    <p class="result-count" id="tour-count" role="status"></p>
    <div class="tour-grid" id="tour-list">${allTours.map(tourCard).join("")}</div>
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

let applyFilters = null;

const FILTER_KEYS = ["q", "location", "price", "days", "month", "rating", "sort", "seats", "popular", "fav"];

/* lưu bộ lọc vào thanh địa chỉ để tải lại hoặc chia sẻ vẫn giữ nguyên.
   ghi vào location.search (không phải hash) nên không kích hoạt router render lại */
function pushUrl(form) {
  const params = new URLSearchParams();

  ["q", "location", "price", "days", "month", "sort"].forEach((key) => {
    const value = form.elements[key]?.value;
    if (value && value !== (key === "sort" ? "featured" : "")) params.set(key, value);
  });
  const minRating = form.elements.rating.value;
  if (minRating) params.set("rating", minRating);
  ["seats", "popular", "fav"].forEach((key) => {
    if (form.elements[key].checked) params.set(key, "1");
  });

  const query = params.toString();
  const current = window.location.search;

  if (query) {
    if (`?${query}` === current) return;
  } else {
    /* không có bộ lọc nào thì đừng đụng vào tham số khác của trang */
    const hasFilter = [...new URLSearchParams(current).keys()].some((key) =>
      FILTER_KEYS.includes(key)
    );
    if (!hasFilter) return;
  }

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
  );
}

function readUrl(form) {
  const params = new URLSearchParams(window.location.search);

  ["q", "location", "price", "days", "month", "rating", "sort"].forEach((key) => {
    const value = params.get(key);
    if (value !== null && form.elements[key]) form.elements[key].value = value;
  });
  ["seats", "popular", "fav"].forEach((key) => {
    form.elements[key].checked = params.get(key) === "1";
  });
}

function describeActive(form, filters) {
  const chips = [];
  if (filters.q) chips.push(`từ khoá "${form.elements.q.value.trim()}"`);
  if (filters.location) chips.push(filters.location);
  if (filters.price) chips.push(PRICE_BANDS.find((item) => item.value === filters.price).label);
  if (filters.days) chips.push(DURATION_BANDS.find((item) => item.value === filters.days).label);
  if (filters.month) chips.push(`khởi hành ${form.elements.month.selectedOptions[0]?.textContent.trim()}`);
  if (filters.minRating) chips.push(`từ ${filters.minRating} ★`);
  if (filters.seats) chips.push("còn chỗ");
  if (filters.popular) chips.push("được đánh giá nhiều");
  if (form.elements.fav.checked) chips.push("yêu thích");
  return chips;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "tours") return;
  const form = document.getElementById("tour-filter");
  if (!form) return;

  const list = document.getElementById("tour-list");
  const count = document.getElementById("tour-count");
  const empty = document.getElementById("tour-empty");
  const active = document.getElementById("filter-active");
  const cards = [...list.querySelectorAll(".tour-card")];

  const byId = new Map(listTours().map((tour) => [String(tour.id), tour]));

  function apply() {
    const filters = readFilters(form);
    const sort = SORTERS[filters.sort];
    const favOnly = form.elements.fav.checked;

    const visible = [];
    cards.forEach((card) => {
      const tour = byId.get(card.dataset.tourId);
      const ok =
        tour &&
        (isFavorite(tour.id) || !favOnly) &&
        matchTour(tour, filters);
      card.hidden = !ok;
      if (ok) visible.push(card);
    });

    if (sort) visible.sort((a, b) => sort(byId.get(a.dataset.tourId), byId.get(b.dataset.tourId)));
    visible.forEach((card) => list.appendChild(card));

    count.textContent = `Hiển thị ${visible.length}/${cards.length} tour`;
    empty.hidden = visible.length > 0;

    const chips = describeActive(form, filters);
    active.hidden = chips.length === 0;
    active.innerHTML = chips.length
      ? `Đang lọc: ${chips.map((chip) => `<span class="filter-chip">${chip}</span>`).join("")}
         <button class="filter-clear" type="button" data-clear-filter>Xóa lọc</button>`
      : "";

    pushUrl(form);
  }

  let clearing = false;

  function clearFilters() {
    if (clearing) return;
    clearing = true;
    form.reset();
    clearing = false;
    apply();
  }

  form.addEventListener("input", apply);
  form.addEventListener("change", apply);
  /* sự kiện reset có thể do code bắn tay nên tự đặt lại giá trị, tránh lặp vô hạn */
  form.addEventListener("reset", () => {
    if (!clearing) window.setTimeout(clearFilters, 0);
  });
  active?.addEventListener("click", (event) => {
    if (event.target.closest("[data-clear-filter]")) clearFilters();
  });

  applyFilters = apply;
  readUrl(form);
  apply();
});

/* bật/tắt yêu thích ngay trên trang danh sách thì bộ lọc cũng cập nhật theo */
document.addEventListener("favorites:changed", () => {
  const badge = document.getElementById("fav-count");
  if (badge) badge.textContent = String(countFavorites());
  applyFilters?.();
});
