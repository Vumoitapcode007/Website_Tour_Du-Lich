const FAVORITE_KEY = "travelgo.favorites";
const COMPARE_KEY = "travelgo.compare";

export const MAX_COMPARE = 3;

function readIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed.map(String).filter((id) => id !== "") : [];
  } catch {
    return [];
  }
}

function writeIds(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* bộ nhớ trình duyệt bị chặn - giữ trạng thái trong phiên */
  }
  document.dispatchEvent(
    new CustomEvent(key === FAVORITE_KEY ? "favorites:changed" : "compare:changed")
  );
  return list;
}

/* ---------- Tour yêu thích ---------- */

export function listFavorites() {
  return readIds(FAVORITE_KEY);
}

export function isFavorite(id) {
  return listFavorites().includes(String(id));
}

export function countFavorites() {
  return listFavorites().length;
}

export function toggleFavorite(id) {
  const key = String(id);
  const list = listFavorites();
  const next = list.includes(key) ? list.filter((item) => item !== key) : [key, ...list];
  writeIds(FAVORITE_KEY, next);
  return next.includes(key);
}

export function clearFavorites() {
  return writeIds(FAVORITE_KEY, []);
}

/* ---------- Danh sách so sánh ---------- */

export function listCompare() {
  return readIds(COMPARE_KEY).slice(0, MAX_COMPARE);
}

export function isCompared(id) {
  return listCompare().includes(String(id));
}

export function toggleCompare(id, active) {
  const key = String(id);
  const list = readIds(COMPARE_KEY);
  const has = list.includes(key);

  if (active === false || (active === undefined && has)) {
    return { ok: true, list: writeIds(COMPARE_KEY, list.filter((item) => item !== key)) };
  }
  if (has) return { ok: true, list };
  if (list.length >= MAX_COMPARE) return { ok: false, list };
  return { ok: true, list: writeIds(COMPARE_KEY, [...list, key]) };
}

export function clearCompare() {
  return writeIds(COMPARE_KEY, []);
}
