import { listCompare, clearCompare, MAX_COMPARE } from "../favorites.js";
import { getTourById } from "../tour-repository.js";
import { formatPrice, formatDate } from "../data.js";
import { imgFallback } from "../components/tour-card.js";

const nextDeparture = (tour) => (tour.departures || [])[0] || "";

function extreme(tours, pick, mode) {
  const values = tours.map(pick).filter((value) => Number.isFinite(value));
  if (values.length === 0) return null;
  return mode === "max" ? Math.max(...values) : Math.min(...values);
}

function list(items = []) {
  if (items.length === 0) return "<span class=\"cmp-muted\">—</span>";
  return `<ul class="cmp-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function saving(tour) {
  if (!tour.oldPrice || tour.oldPrice <= tour.price) return "<span class=\"cmp-muted\">—</span>";
  const percent = Math.round((1 - tour.price / tour.oldPrice) * 100);
  return `<span class="cmp-saving">${formatPrice(tour.oldPrice)} (-${percent}%)</span>`;
}

const ROWS = [
  {
    label: "Giá",
    value: (tour) => `<strong class="cmp-price">${formatPrice(tour.price)}</strong>`,
    pick: (tour) => Number(tour.price) || 0,
    mode: "min",
  },
  { label: "Giá cũ", value: (tour) => `<span class="cmp-muted">${tour.oldPrice ? formatPrice(tour.oldPrice) : "—"}</span>` },
  { label: "Tiết kiệm", value: saving },
  { label: "Điểm đến", value: (tour) => tour.location },
  { label: "Thời lượng", value: (tour) => tour.time },
  {
    label: "Khởi hành gần nhất",
    value: (tour) => (nextDeparture(tour) ? formatDate(nextDeparture(tour)) : "<span class=\"cmp-muted\">—</span>"),
    pick: (tour) => (nextDeparture(tour) ? Date.parse(nextDeparture(tour)) : NaN),
    mode: "min",
  },
  {
    label: "Đánh giá",
    value: (tour) => `★ ${tour.rating} <em class="cmp-muted">(${tour.reviews} đánh giá)</em>`,
    pick: (tour) => Number(tour.rating) || 0,
    mode: "max",
  },
  {
    label: "Còn chỗ",
    value: (tour) => `${tour.seatsLeft} chỗ`,
    pick: (tour) => Number(tour.seatsLeft) || 0,
    mode: "max",
  },
  { label: "Điểm nổi bật", value: (tour) => list(tour.highlights) },
  { label: "Bao gồm", value: (tour) => list(tour.includes) },
];

function head(tour) {
  return `
  <th scope="col">
    <a class="cmp-head" href="#/tour/${tour.id}">
      <img src="${tour.image}" alt="${tour.name}" onerror="${imgFallback}">
      <strong>${tour.name}</strong>
    </a>
    <div class="cmp-head-actions">
      <a class="btn btn-ghost-soft" href="#/tour/${tour.id}">Chi tiết</a>
      <a class="btn btn-primary" href="#/booking?tour=${tour.id}">Đặt tour</a>
      <button type="button" class="btn btn-link" data-cmp-remove="${tour.id}">Bỏ chọn</button>
    </div>
  </th>`;
}

function table(tours) {
  const rows = ROWS.map((row) => {
    const best = row.pick ? extreme(tours, row.pick, row.mode) : null;

    return `
    <tr>
      <th scope="row">${row.label}</th>
      ${tours
        .map((tour) => {
          const isBest = best !== null && row.pick(tour) === best;
          return `<td class="${isBest ? "is-best" : ""}">${row.value(tour)}${
            isBest ? '<span class="cmp-flag">Tốt nhất</span>' : ""
          }</td>`;
        })
        .join("")}
    </tr>`;
  }).join("");

  return `
  <div class="cmp-scroll">
    <table class="cmp-table">
      <thead>
        <tr>
          <th scope="col" class="cmp-row-head">Tiêu chí</th>
          ${tours.map(head).join("")}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function body(tours) {
  if (tours.length < 2) {
    return `
    <div class="cmp-empty">
      <p>${tours.length === 1 ? "Đang chọn 1 tour, hãy chọn thêm một tour nữa." : "Bấm vào ô “So sánh” trên thẻ tour để bắt đầu."}</p>
      <div class="cmp-empty-actions">
        <a class="btn btn-primary" href="#/tours">Chọn tour</a>
        ${tours.length === 1 ? '<button type="button" class="btn btn-ghost-soft" data-compare-clear>Xóa danh sách</button>' : ""}
      </div>
    </div>`;
  }

  return `
  ${table(tours)}
  <div class="cmp-footer">
    <button type="button" class="btn btn-ghost-soft" data-compare-clear>Xóa danh sách so sánh</button>
    <a class="btn btn-primary" href="#/tours">Chọn thêm tour</a>
  </div>`;
}

function selected() {
  return listCompare()
    .map((id) => getTourById(id))
    .filter(Boolean);
}

export function Compare() {
  const tours = selected();

  return `
  <section class="page-hero">
    <div class="container">
      <span class="hero-eyebrow">So sánh tour</span>
      <h1>${tours.length < 2 ? "Chọn ít nhất 2 tour để so sánh" : `So sánh ${tours.length} tour`}</h1>
      <p>${tours.length < 2 ? "Đánh dấu ô So sánh trên thẻ tour để thêm vào danh sách." : "Giá, lịch trình và dịch vụ để bạn chọn nhanh hơn."} Tối đa ${MAX_COMPARE} tour.</p>
    </div>
  </section>

  <section class="section container" id="compare-body">${body(tours)}</section>`;
}

/* bỏ tour ngay trên trang này thì bảng so sánh cập nhật liền */
document.addEventListener("compare:changed", () => {
  const container = document.getElementById("compare-body");
  if (!container) return;

  const tours = selected();
  container.innerHTML = body(tours);
  const title = document.querySelector(".page-hero h1");
  if (title) {
    title.textContent = tours.length < 2 ? "Chọn ít nhất 2 tour để so sánh" : `So sánh ${tours.length} tour`;
  }
});
