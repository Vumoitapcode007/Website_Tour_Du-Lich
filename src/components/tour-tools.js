import { isFavorite, toggleCompare, toggleFavorite, MAX_COMPARE } from "../favorites.js";
import { showCompareHint } from "./compare-bar.js";

/* đồng bộ nút yêu thích của mọi thẻ đang hiện (một tour có thể xuất hiện nhiều nơi) */
function syncFavorite(id, active) {
  document.querySelectorAll(`[data-fav="${id}"]`).forEach((button) => {
    button.classList.toggle("is-on", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(`[data-tour-id="${id}"]`).forEach((card) => {
    card.dataset.favState = String(active);
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-fav]");
  if (!button) return;

  event.preventDefault();
  const id = button.dataset.fav;
  /* cập nhật giao diện trước, rồi mới lưu để bộ lọc áp dụng đúng trạng thái mới */
  syncFavorite(id, !isFavorite(id));
  toggleFavorite(id);
});

document.addEventListener("change", (event) => {
  const box = event.target.closest("[data-cmp]");
  if (!box) return;

  const result = toggleCompare(box.dataset.cmp, box.checked);
  if (!result.ok) {
    box.checked = false;
    showCompareHint(`Chỉ so sánh tối đa ${MAX_COMPARE} tour.`);
  }
});
