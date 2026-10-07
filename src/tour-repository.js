import { tours as seedTours } from "./data.js";
import { listBookings } from "./store.js";

const TOUR_KEY = "travelgo.tours";
const SEED_VERSION = 3;

/* Ảnh Unsplash đã hỏng (trả 404) - thay bằng ảnh trong dữ liệu gốc */
const DEAD_IMAGE_IDS = ["1556012018-50c5900c1935"];
const isDeadImage = (url) => DEAD_IMAGE_IDS.some((id) => String(url || "").includes(id));

export const TOUR_STATUS = {
  open: "Đang bán",
  limited: "Sắp hết chỗ",
  closed: "Ngừng bán",
  finished: "Đã kết thúc",
};

/* Tour chỉ còn nhận khách mới khi đang bán hoặc sắp hết chỗ */
const SELLABLE_STATUS = ["open", "limited"];

/* Tour không hiển thị cho khách đặt mới nhưng vẫn giữ lịch sử */
export function isSellableTour(tour) {
  return SELLABLE_STATUS.includes(tour?.status);
}

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

/* Tour đã lưu trước đây vẫn giữ link ảnh hỏng, kể cả khi người dùng đã tự chỉnh danh sách */
function fixDeadImages(tour) {
  if (!isDeadImage(tour.image) && !tour.gallery.some(isDeadImage)) return tour;

  const fresh = seedTours.find((item) => String(item.id) === String(tour.id)) || {};
  const candidates = toArray(fresh.gallery).filter((url) => !isDeadImage(url));
  const gallery = [];

  tour.gallery.forEach((url) => {
    if (!isDeadImage(url)) {
      gallery.push(url);
      return;
    }
    const next = candidates.find((item) => !gallery.includes(item) && item !== tour.image);
    gallery.push(next || candidates[0] || tour.image);
  });

  return {
    ...tour,
    image: isDeadImage(tour.image) ? fresh.image || tour.image : tour.image,
    gallery,
  };
}

/* Trả về đúng mảng cũ nếu không có gì cần sửa, để không ghi localStorage mỗi lần render */
function repairList(list) {
  const repaired = list.map((tour) => fixDeadImages(normalizeTour(tour)));
  const changed = repaired.some((tour, index) => {
    const source = list[index] || {};
    return (
      source.image !== tour.image || toArray(source.gallery).join("|") !== tour.gallery.join("|")
    );
  });

  return changed ? repaired : list;
}

export function listTours() {
  const stored = read();
  if (!stored) return write(seed(), false);
  if (stored.version === SEED_VERSION) {
    const list = repairList(stored.list);
    return list === stored.list ? list : write(list, stored.customized);
  }

  if (!stored.customized) return write(seed(), false);

  // đã tự chỉnh danh sách: giữ thay đổi, chỉ bổ sung tour mới từ dữ liệu gốc
  const known = new Set(stored.list.map((tour) => String(tour.id)));
  const added = seed().filter((tour) => !known.has(String(tour.id)));
  return write([...added, ...stored.list].map((tour) => fixDeadImages(normalizeTour(tour))), true);
}

export function getTourById(id) {
  if (id === null || id === undefined || id === "") return null;
  return listTours().find((tour) => String(tour.id) === String(id)) || null;
}

export function relatedTours(tour, limit = 3) {
  return listTours()
    .filter((item) => item.id !== tour.id && isSellableTour(item))
    .sort((a, b) => Number(b.location === tour.location) - Number(a.location === tour.location))
    .slice(0, limit);
}

export function getDestinations() {
  return [...new Set(listTours().map((tour) => tour.location).filter(Boolean))];
}

/* Danh sách tour còn nhận khách - trang khách chỉ dùng hàm này */
export function sellableTours() {
  return listTours().filter(isSellableTour);
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

/* Ngừng bán / mở bán lại - thao tác an toàn, không mất dữ liệu đơn hàng */
export function setTourStatus(id, status) {
  const current = getTourById(id);
  if (!current) return null;
  if (!TOUR_STATUS[status]) return null;
  return saveTour({ ...current, status });
}

/* Số đơn đang gắn với tour - quyết định có được xoá vật lý hay không */
export function tourOrderCount(id) {
  const key = String(id);
  return listBookings().filter((item) => String(item.tourId) === key).length;
}

/* Tour đã có đơn / giao dịch thì tuyệt đối không xoá vật lý.
   Hệ thống chỉ chuyển tour sang "Ngừng bán" để giữ lịch sử. */
export function checkTourDelete(id) {
  const tour = getTourById(id);
  if (!tour) return { ok: false, error: "Không tìm thấy tour." };

  const orders = tourOrderCount(id);
  if (orders > 0) {
    return {
      ok: false,
      orders,
      error: `Tour "${tour.name}" đang có ${orders} đơn đặt. Không thể xoá vì sẽ mất dữ liệu đơn hàng và lịch sử thanh toán. Hãy chuyển sang trạng thái "Ngừng bán".`,
    };
  }

  return { ok: true, orders: 0 };
}

export function removeTour(id) {
  const check = checkTourDelete(id);
  if (!check.ok) return check;
  write(listTours().filter((tour) => String(tour.id) !== String(id)), true);
  return { ok: true };
}

export function resetTours() {
  return write(seed(), false);
}
