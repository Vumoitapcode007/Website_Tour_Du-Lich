import { demoBookings, demoCoupons, demoLogs, demoMessages, demoNotes, demoReviews } from "./demo-data.js";
import { contactInfo } from "./data.js";

const BOOKING_KEY = "travelgo.bookings";
const MESSAGE_KEY = "travelgo.messages";
const REVIEW_KEY = "travelgo.reviews";
const COUPON_KEY = "travelgo.coupons";
const LOG_KEY = "travelgo.logs";
const NOTE_KEY = "travelgo.notes";
const SETTINGS_KEY = "travelgo.settings";

export const BOOKING_STATUS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã huỷ",
};

export const MESSAGE_TOPICS = [
  "Tư vấn tour",
  "Đặt tour nhóm lớn",
  "Hợp đồng doanh nghiệp",
  "Góp ý/khiếu nại",
];

export const REVIEW_STATUS = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const COUPON_TYPE = {
  percent: "Phần trăm",
  fixed: "Số tiền cố định",
};

export const PAYMENT_STATUS = {
  unpaid: "Chưa thanh toán",
  deposit: "Đã cọc 50%",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

export const DEFAULT_SETTINGS = {
  siteName: "TravelGo",
  tagline: "Đồng hành cùng mọi chuyến đi của bạn",
  hotline: contactInfo.hotline,
  email: contactInfo.email,
  address: contactInfo.address,
  hours: contactInfo.hours,
  heroTitle: "Khám phá Việt Nam trong từng chuyến đi để đời",
  heroSubtitle: "Tour trọn gói giá tốt, xe đời mới, hướng dẫn viên tận tâm.",
  bookingNotice: "Bạn không cần thanh toán ngay. Chuyên viên sẽ gọi cho bạn trong 30 phút.",
  minPeople: 1,
  maxPeople: 20,
  allowOnlinePayment: false,
  bankName: "Ngân hàng TMCP Ngoại thương Việt Nam",
  bankAccount: "0123 4567 8901",
  bankHolder: "Công ty TNHH Du lịch TravelGo",
  requireAccount: false,
  autoConfirm: false,
  footerNote: "Website đặt tour du lịch - đồng hành cùng mọi chuyến đi của bạn.",
};

const clone = (value) =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse(key) {
  try {
    return JSON.parse(readRaw(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bộ nhớ trình duyệt bị chặn - bỏ qua */
  }
  return value;
}

function createCollection(key, seed = []) {
  return {
    all() {
      const saved = parse(key);
      if (Array.isArray(saved)) return saved;
      return write(key, clone(seed));
    },
    set: (list) => write(key, list),
    clear: () => write(key, []),
    reset: () => write(key, clone(seed)),
    seeded: () => parse(key) === null,
  };
}

const bookings = createCollection(BOOKING_KEY, demoBookings);
const messages = createCollection(MESSAGE_KEY, demoMessages);
const reviews = createCollection(REVIEW_KEY, demoReviews);
const coupons = createCollection(COUPON_KEY, demoCoupons);
const logs = createCollection(LOG_KEY, demoLogs);
const notes = createCollection(NOTE_KEY, demoNotes);

function ensureIds(collection, prefix) {
  const list = collection.all();
  let changed = false;
  const filled = list.map((item, index) => {
    if (item?.id) return item;
    changed = true;
    return { ...item, id: `${prefix}-legacy-${index + 1}` };
  });
  if (changed) collection.set(filled);
  return filled;
}

function nextId(list, prefix) {
  const max = list.reduce((acc, item) => {
    const match = String(item.id || "").match(/(\d+)$/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${prefix}${max + 1}`;
}

/* ---------- Đơn đặt tour ---------- */

export function listBookings() {
  return bookings.all();
}

export function getBooking(code) {
  return listBookings().find((item) => item.code === code) || null;
}

export function createBookingCode() {
  const taken = new Set(listBookings().map((item) => item.code));
  const seed = Date.now().toString(36).toUpperCase().slice(-5);

  for (let i = 0; i < 1000; i++) {
    const code = `TG${seed}${i ? i : ""}`;
    if (!taken.has(code)) return code;
  }
  return `TG${Date.now()}`;
}

export function saveBooking(booking) {
  const list = listBookings();
  const record = {
    payment: "unpaid",
    ...booking,
    code: createBookingCode(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  list.unshift(record);
  bookings.set(list.slice(0, 200));
  return record;
}

export function updateBooking(code, patch) {
  const list = listBookings().map((item) =>
    item.code === code ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  );
  return bookings.set(list);
}

export function removeBooking(code) {
  return bookings.set(listBookings().filter((item) => item.code !== code));
}

export function clearBookings() {
  return bookings.clear();
}

/* ---------- Tin nhắn liên hệ ---------- */

export function listMessages() {
  return ensureIds(messages, "ms");
}

export function getMessage(id) {
  return listMessages().find((item) => item.id === id) || null;
}

export function saveMessage(message) {
  const list = listMessages();
  const record = {
    read: false,
    ...message,
    id: nextId(list, "ms"),
    createdAt: new Date().toISOString(),
  };
  list.unshift(record);
  messages.set(list.slice(0, 200));
  return record;
}

export function updateMessage(id, patch) {
  return messages.set(
    listMessages().map((item) => (item.id === id ? { ...item, ...patch } : item))
  );
}

export function markMessageRead(id) {
  const message = getMessage(id);
  if (!message) return;
  updateMessage(id, { read: true, readAt: new Date().toISOString() });
}

export function markAllMessagesRead() {
  return messages.set(
    listMessages().map((item) => (item.read ? item : { ...item, read: true }))
  );
}

export function removeMessage(id) {
  return messages.set(listMessages().filter((item) => item.id !== id));
}

export function clearMessages() {
  return messages.clear();
}

export function countUnreadMessages() {
  return listMessages().filter((item) => !item.read).length;
}

/* ---------- Đánh giá tour ---------- */

export function listReviews() {
  return ensureIds(reviews, "rv");
}

export function getReview(id) {
  return listReviews().find((item) => item.id === id) || null;
}

export function saveReview(review) {
  const list = listReviews();
  const index = review?.id ? list.findIndex((item) => item.id === review.id) : -1;

  if (index >= 0) {
    list[index] = { ...list[index], ...review, updatedAt: new Date().toISOString() };
    reviews.set(list);
    return list[index];
  }

  const record = {
    status: "pending",
    ...review,
    id: nextId(list, "rv"),
    createdAt: new Date().toISOString(),
  };
  list.unshift(record);
  reviews.set(list);
  return record;
}

export function updateReview(id, patch) {
  return reviews.set(
    listReviews().map((item) =>
      item.id === id
        ? { ...item, ...patch, reviewedAt: new Date().toISOString() }
        : item
    )
  );
}

export function removeReview(id) {
  return reviews.set(listReviews().filter((item) => item.id !== id));
}

export function clearReviews() {
  return reviews.clear();
}

/* ---------- Mã giảm giá ---------- */

export function listCoupons() {
  return coupons.all();
}

export function getCoupon(id) {
  return listCoupons().find((item) => item.id === id) || null;
}

export function saveCoupon(coupon) {
  const list = listCoupons();
  const record = {
    active: true,
    type: "percent",
    usedCount: 0,
    usageLimit: 100,
    minTotal: 0,
    maxDiscount: 0,
    ...coupon,
  };
  const index = list.findIndex((item) => item.id === record.id);

  if (index >= 0) {
    list[index] = { ...list[index], ...record, id: list[index].id };
    return coupons.set(list)[index];
  }
  record.id = nextId(list, "cp");
  list.unshift(record);
  coupons.set(list);
  return record;
}

export function updateCoupon(id, patch) {
  return coupons.set(
    listCoupons().map((item) => (item.id === id ? { ...item, ...patch } : item))
  );
}

export function removeCoupon(id) {
  return coupons.set(listCoupons().filter((item) => item.id !== id));
}

/* ---------- Nhật ký hoạt động ---------- */

export function listLogs(limit = 200) {
  return logs.all().slice(0, limit);
}

export function logActivity(action, detail = "") {
  let actor = "Hệ thống";
  try {
    actor = JSON.parse(sessionStorage.getItem("travelgo.session"))?.name || actor;
  } catch {
    /* bỏ qua */
  }
  const list = listLogs(1000);
  logs.set([{ id: nextId(list, "lg"), user: actor, action, detail, createdAt: new Date().toISOString() }, ...list].slice(0, 300));
}

export function clearLogs() {
  return logs.clear();
}

/* ---------- Ghi chú khách hàng ---------- */

export function listNotes() {
  return notes.all();
}

export function getNote(phone) {
  return listNotes().find((item) => item.phone === phone) || null;
}

export function saveNote(phone, note) {
  const list = listNotes();
  const index = list.findIndex((item) => item.phone === phone);
  if (index >= 0) {
    list[index] = { ...list[index], note, createdAt: new Date().toISOString() };
  } else {
    list.unshift({ phone, note, createdAt: new Date().toISOString() });
  }
  return notes.set(list);
}

export function removeNote(phone) {
  return notes.set(listNotes().filter((item) => item.phone !== phone));
}

/* ---------- Cấu hình hệ thống ---------- */

export function getSettings() {
  const saved = parse(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(saved && typeof saved === "object" ? saved : {}) };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  for (const key of ["minPeople", "maxPeople"]) {
    next[key] = Math.max(Number(next[key]) || 1, 1);
  }
  return write(SETTINGS_KEY, next);
}

export function resetSettings() {
  return write(SETTINGS_KEY, clone(DEFAULT_SETTINGS));
}

/* ---------- Tiện ích dữ liệu ---------- */

export function resetDemoData() {
  bookings.reset();
  messages.reset();
  reviews.reset();
  coupons.reset();
  logs.reset();
  notes.reset();
  resetSettings();
}

export function clearAllData() {
  bookings.clear();
  messages.clear();
  reviews.clear();
  coupons.clear();
  logs.clear();
  notes.clear();
}
