import { listCompare, clearCompare, toggleCompare, isCompared, MAX_COMPARE } from "../favorites.js";
import { listTours } from "../tour-repository.js";
import { imgFallback } from "./tour-card.js";

export function compareBar() {
  return `
  <div class="compare-bar" id="compare-bar" hidden>
    <div class="container compare-bar-inner">
      <div class="compare-bar-list" id="compare-bar-list"></div>
      <div class="compare-bar-side">
        <p class="compare-bar-hint" id="compare-bar-hint" role="status"></p>
        <div class="compare-bar-actions">
          <button type="button" class="btn btn-ghost-soft" data-compare-clear>Xóa</button>
          <a class="btn btn-primary" id="compare-bar-go" href="#/compare">So sánh</a>
        </div>
      </div>
    </div>
  </div>`;
}

function selectedTours() {
  const all = listTours();
  return listCompare()
    .map((id) => all.find((tour) => String(tour.id) === id))
    .filter(Boolean);
}

export function syncCompareBar() {
  const bar = document.getElementById("compare-bar");
  if (!bar) return;

  const tours = selectedTours();
  const list = document.getElementById("compare-bar-list");
  const go = document.getElementById("compare-bar-go");
  const hint = document.getElementById("compare-bar-hint");

  bar.hidden = tours.length === 0;
  document.body.classList.toggle("has-compare-bar", tours.length > 0);
  if (tours.length === 0) return;

  list.innerHTML = tours
    .map(
      (tour) => `
    <div class="compare-chip" data-cmp-item="${tour.id}">
      <img src="${tour.image}" alt="${tour.name}" onerror="${imgFallback}">
      <span>${tour.name}</span>
      <button type="button" class="compare-chip-x" data-cmp-remove="${tour.id}" aria-label="Bỏ ${tour.name} khỏi so sánh">✕</button>
    </div>`
    )
    .join("");

  go.textContent = `So sánh (${tours.length})`;
  hint.textContent =
    tours.length < 2 ? `Chọn thêm ${2 - tours.length} tour để so sánh` : `Tối đa ${MAX_COMPARE} tour`;
}

export function showCompareHint(message) {
  const hint = document.getElementById("compare-bar-hint");
  if (!hint) return;
  hint.textContent = message;
  hint.classList.add("is-warning");
  window.setTimeout(() => {
    hint.classList.remove("is-warning");
    syncCompareBar();
  }, 2600);
}

document.addEventListener("compare:changed", () => {
  syncCompareBar();
  document.querySelectorAll("[data-cmp]").forEach((box) => {
    box.checked = isCompared(box.dataset.cmp);
  });
  document.querySelectorAll("[data-cmp-state]").forEach((card) => {
    card.dataset.cmpState = String(isCompared(card.dataset.tourId));
  });
});

document.addEventListener("route:changed", () => syncCompareBar());

document.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-cmp-remove]");
  if (remove) {
    event.preventDefault();
    toggleCompare(remove.dataset.cmpRemove, false);
    return;
  }

  if (event.target.closest("[data-compare-clear]")) clearCompare();
});
