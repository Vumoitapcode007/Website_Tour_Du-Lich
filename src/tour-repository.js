import { tours as seedTours } from "./data.js";

const TOUR_KEY = "travelgo.tours";
const SEED_VERSION = 3;

/* Ảnh Unsplash đã hỏng (trả 404) - thay bằng ảnh trong dữ liệu gốc */
const DEAD_IMAGE_IDS = ["1556012018-50c5900c1935"];
const isDeadImage = (url) => DEAD_IMAGE_IDS.some((id) => String(url || "").includes(id));

export const TOUR_STATUS = {
  open: "Đang nhận khách",
  limited: "Sắp hết chỗ",
  ongoing: "Đang khởi hành",
  completed: "Đã hoàn thành",
  closed: "Tạm ngưng",
};

export const TOUR_PROGRESS_STAGES = {
  not_started: { key: "not_started", label: "Chưa khởi hành", icon: "📋", desc: "Chuẩn bị xe, đoàn và hướng dẫn viên" },
  gathering: { key: "gathering", label: "Đón khách & tập trung", icon: "🚐", desc: "Tập trung tại điểm hẹn, kiểm tra danh sách" },
  moving: { key: "moving", label: "Đang di chuyển", icon: "🚀", desc: "Trên đường đến điểm tham quan" },
  visiting: { key: "visiting", label: "Đang tham quan", icon: "🏞️", desc: "Đoàn đang trải nghiệm tại điểm đến" },
  resting: { key: "resting", label: "Nghỉ ngơi / Khách sạn", icon: "🏨", desc: "Đoàn về khách sạn dùng bữa và nghỉ ngơi" },
  returning: { key: "returning", label: "Đang trên đường về", icon: "🚌", desc: "Kết thúc các chặng, xe đưa đoàn về điểm xuất phát" },
  finished: { key: "finished", label: "Đã hoàn thành tour", icon: "🏁", desc: "Chuyến đi thành công tốt đẹp" },
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

  const rawProgress = tour.progress && typeof tour.progress === "object" ? tour.progress : {};
  const progress = {
    stage: rawProgress.stage || (merged.status === "ongoing" ? "visiting" : merged.status === "completed" ? "finished" : "not_started"),
    currentDay: Math.max(1, Number(rawProgress.currentDay) || 1),
    currentLocation: String(rawProgress.currentLocation || "").trim(),
    note: String(rawProgress.note || "").trim(),
    updatedAt: rawProgress.updatedAt || "",
  };

  return {
    ...merged,
    status: TOUR_STATUS[merged.status] ? merged.status : "open",
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
    progress,
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
  const seedProgressMap = {
    1: { stage: "not_started", currentDay: 1, currentLocation: "Hà Nội - Chuẩn bị xuất phát", note: "Xe và hướng dẫn viên sẵn sàng đón khách vào 06:30 sáng.", updatedAt: new Date().toISOString() },
    2: { stage: "gathering", currentDay: 1, currentLocation: "Cảng tàu khách quốc tế Tuần Châu", note: "Đoàn đang làm thủ tục check-in lên du thuyền ngắm vịnh.", updatedAt: new Date().toISOString() },
    3: { stage: "moving", currentDay: 1, currentLocation: "Cao tốc Nội Bài - Lào Cai (Km 120)", note: "Xe đang di chuyển thuận lợi, dự kiến đến Sa Pa lúc 12:30 trưa.", updatedAt: new Date().toISOString() },
    4: { stage: "visiting", currentDay: 2, currentLocation: "Đèo Mã Pí Lèng & Hẻm Tu Sản", note: "Đoàn đang trải nghiệm đi thuyền trên sông Nho Quế, thời tiết nắng đẹp.", updatedAt: new Date().toISOString() },
    5: { stage: "resting", currentDay: 2, currentLocation: "Khách sạn Phố Cổ Hội An", note: "Đoàn vừa kết thúc tour ngắm lồng đèn, về phòng nghỉ ngơi.", updatedAt: new Date().toISOString() },
    6: { stage: "finished", currentDay: 3, currentLocation: "Sân bay Quốc tế Phú Quốc", note: "Chuyến đi hoàn thành tốt đẹp, đoàn đã lên máy bay trở về.", updatedAt: new Date().toISOString() },
  };

  const seedStatusMap = {
    1: "open",
    2: "limited",
    3: "ongoing",
    4: "ongoing",
    5: "ongoing",
    6: "completed",
  };

  return seedTours.map((tour) => {
    const customizedTour = clone(tour);
    if (seedProgressMap[tour.id]) {
      customizedTour.progress = seedProgressMap[tour.id];
    }
    if (seedStatusMap[tour.id]) {
      customizedTour.status = seedStatusMap[tour.id];
    }
    return normalizeTour(customizedTour);
  });
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

export function updateTourProgress(id, patch = {}) {
  const list = listTours();
  const index = list.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const current = list[index];
  const updatedProgress = {
    ...(current.progress || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const updated = {
    ...current,
    progress: updatedProgress,
  };

  if (patch.stage && ["gathering", "moving", "visiting", "resting", "returning"].includes(patch.stage)) {
    if (current.status === "open" || current.status === "limited") {
      updated.status = "ongoing";
    }
  } else if (patch.stage === "finished") {
    updated.status = "completed";
  }

  list[index] = updated;
  write(list, true);
  return updated;
}

