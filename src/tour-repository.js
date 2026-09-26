import { tours as seedTours } from "./data.js";

const TOUR_KEY = "travelgo.tours";
const SEED_VERSION = 2;

export const TOUR_STATUS = {
  open: "Đang nhận khách",
  limited: "Sắp hết chỗ",
  closed: "Tạm ngưng",
};

const clone = (value) =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const toArray = (value) =>
  Array.isArray(value) ? value.filter((item) => String(item ?? "").trim() !== "") : [];

export function normalizeTour(tour = {}) {
  const merged = {
    status: "open",
    oldPrice: 0,
    rating: 5,
    reviews: 0,
    seatsLeft: 10,
    days: 1,
    ...tour,
  };

  return {
    ...merged,
    price: Math.max(Number(merged.price) || 0, 0),
    oldPrice: Math.max(Number(merged.oldPrice) || 0, 0),
    seatsLeft: Math.max(Number(merged.seatsLeft) || 0, 0),
    days: Math.max(Number(merged.days) || 1, 1),
    name: String(merged.name || "Tour mới").trim(),
    location: String(merged.location || "").trim(),
    time: String(merged.time || `${merged.days} ngày`).trim(),
    description: String(merged.description || "").trim(),
    image: String(merged.image || seedTours[0].image),
    gallery: toArray(merged.gallery),
    highlights: toArray(merged.highlights),
    includes: toArray(merged.includes),
    excludes: toArray(merged.excludes),
    departures: toArray(merged.departures),
    itinerary: Array.isArray(merged.itinerary) ? merged.itinerary : [],
  };
}

function read() {
  try {
    const raw = localStorage.getItem(TOUR_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { list: parsed, customized: false, version: 0 };
    if (parsed && Array.isArray(parsed.list)) {
      return {
        list: parsed.list,
        customized: Boolean(parsed.customized),
        version: Number(parsed.version) || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function write(list, customized) {
  try {
    localStorage.setItem(
      TOUR_KEY,
      JSON.stringify({ version: SEED_VERSION, customized, list })
    );
  } catch {
    /* bộ nhớ không khả dụng - dùng dữ liệu trong phiên */
  }
  return list;
}

function seed() {
  return seedTours.map((tour) => normalizeTour(clone(tour)));
}

export function listTours() {
  const stored = read();
  if (!stored) return write(seed(), false);
  if (stored.version === SEED_VERSION) return stored.list.map(normalizeTour);

  if (!stored.customized) return write(seed(), false);

  // đã tự chỉnh danh sách: giữ thay đổi, chỉ bổ sung tour mới từ dữ liệu gốc
  const known = new Set(stored.list.map((tour) => String(tour.id)));
  const added = seed().filter((tour) => !known.has(String(tour.id)));
  return write([...added, ...stored.list], true);
}

export function getTourById(id) {
  if (id === null || id === undefined || id === "") return null;
  return listTours().find((tour) => String(tour.id) === String(id)) || null;
}

export function relatedTours(tour, limit = 3) {
  return listTours()
    .filter((item) => item.id !== tour.id)
    .sort((a, b) => Number(b.location === tour.location) - Number(a.location === tour.location))
    .slice(0, limit);
}

export function getDestinations() {
  return [...new Set(listTours().map((tour) => tour.location).filter(Boolean))];
}

export function saveTour(tour) {
  const list = listTours();
  const payload = normalizeTour(tour);
  const index = list.findIndex((item) => String(item.id) === String(payload.id));

  if (index >= 0) {
    const updated = { ...list[index], ...payload };
    list[index] = updated;
    write(list, true);
    return updated;
  }

  payload.id = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  list.unshift(payload);
  write(list, true);
  return payload;
}

export function removeTour(id) {
  return write(listTours().filter((tour) => String(tour.id) !== String(id)), true);
}

export function resetTours() {
  return write(seed(), false);
}
