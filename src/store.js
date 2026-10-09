import {
  demoBookings,
  demoCoupons,
  demoLogs,
  demoMessages,
  demoNotes,
  demoNotifications,
  demoReviews,
} from "./demo-data.js";
import { contactInfo } from "./data.js";

const BOOKING_KEY = "travelgo.bookings";
const MESSAGE_KEY = "travelgo.messages";
const REVIEW_KEY = "travelgo.reviews";
const COUPON_KEY = "travelgo.coupons";
const LOG_KEY = "travelgo.logs";
const NOTE_KEY = "travelgo.notes";
const NOTIFICATION_KEY = "travelgo.notifications";
const SETTINGS_KEY = "travelgo.settings";

export const BOOKING_STATUS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  awaiting_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  upcoming: "Sắp khởi hành",
  ongoing: "Đang diễn ra",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

/* Thứ tự đi của đơn: không được nhảy cóc, chỉ chuyển sang trạng thái kế tiếp hợp lệ */
export const BOOKING_ORDER = [
  "pending",
  "confirmed",
  "awaiting_payment",
  "paid",
  "upcoming",
  "ongoing",
  "completed",
];

/* Nhánh huỷ chỉ mở từ các trạng thái trước khi tour bắt đầu chạy */
export const BOOKING_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["upcoming", "cancelled"],
  upcoming: ["ongoing", "cancelled"],
  ongoing: ["completed"],
  completed: [],
  cancelled: [],
};

/* Trạng thái vận hành do Tour Guide cập nhật - chỉ đi tiếp từ "đã thanh toán" trở đi */
export const GUIDE_FLOW = {
  paid: ["upcoming"],
  upcoming: ["ongoing"],
  ongoing: ["completed"],
};

/* Mốc thời gian lưu kèm theo từng bước */
export const BOOKING_STAMP_FIELD = {
  pending: "createdAt",
  confirmed: "confirmedAt",
  awaiting_payment: "awaitingPaymentAt",
  paid: "paidAt",
  upcoming: "upcomingAt",
  ongoing: "startedAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
};

export const BOOKING_STATUS_FIELD = { pending: "createdBy", confirmed: "confirmedBy", cancelled: "cancelledBy" };

export function isCancelledBooking(booking) {
  return booking?.status === "cancelled";
}

/* Đơn còn "sống": chưa huỷ và chưa kết thúc - dùng cho doanh thu, lịch sử khách */
export function isActiveBooking(booking) {
  return Boolean(booking) && !["cancelled", "completed"].includes(booking.status);
}

/* Đơn đã được khách hoàn thành chuyến đi */
export function isCompletedBooking(booking) {
  return booking?.status === "completed";
}

export function canTransitionBooking(from, to) {
  return (BOOKING_FLOW[from] || []).includes(to);
}

/* Trạng thái kế tiếp hợp lệ của một đơn (bỏ qua nhánh huỷ) */
export function nextBookingStatus(status, { guide = false } = {}) {
  if (guide) return GUIDE_FLOW[status]?.[0] || null;
  const current = BOOKING_ORDER.indexOf(status);
  if (current < 0) return null;
  return BOOKING_ORDER[current + 1] || null;
}

/* Danh sách trạng thái đơn còn sống, dùng cho bộ lọc và thống kê */
export function activeBookingStatusList() {
  return BOOKING_ORDER;
}

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
  allowOnlinePayment: true,
  bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
  bankAccount: "0123 4567 8901",
  bankHolder: "Công ty TNHH Du lịch TravelGo",
  momoPhone: "0909 888 777",
  momoHolder: "TRAVELGO TOURIST VIETNAM",
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
const notifications = createCollection(NOTIFICATION_KEY, demoNotifications);

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

/* Chuẩn hoá đơn khi đọc: đơn cũ thiếu snapshot vẫn hiển thị được,
   và đơn không còn tour trong danh mục vẫn giữ đúng tên/giá tại lúc đặt */
export function normalizeBooking(booking = {}) {
  const people = Math.max(Number(booking.people) || 0, 0);
  const hasBreakdown = booking.adults !== undefined || booking.children !== undefined;
  const adults = hasBreakdown ? Math.max(Number(booking.adults) || 0, 0) : people;
  const children = hasBreakdown ? Math.max(Number(booking.children) || 0, 0) : 0;

  return {
    ...booking,
    status: BOOKING_STATUS[booking.status] ? booking.status : "pending",
    payment: PAYMENT_STATUS[booking.payment] ? booking.payment : "unpaid",
    tourId: booking.tourId ?? "",
    tourName: String(booking.tourName || "Tour không còn trong danh mục"),
    /* giá tham chiếu tại thời điểm đặt - không bị thay đổi khi Admin sửa giá tour */
    tourPrice: Math.max(Number(booking.tourPrice) || 0, 0),
    tourLocation: String(booking.tourLocation || ""),
    tourTime: String(booking.tourTime || ""),
    date: String(booking.date || ""),
    adults,
    children,
    people: people || adults + children,
    total: Math.max(Number(booking.total) || 0, 0),
    guideId: String(booking.guideId || ""),
    guideName: String(booking.guideName || ""),
    guidePhone: String(booking.guidePhone || ""),
    statusHistory: Array.isArray(booking.statusHistory) ? booking.statusHistory : [],
    note: String(booking.note || ""),
    /* Điểm danh: "present" | "absent" | "" (chưa xác nhận) - do Tour Guide cập nhật */
    attendance: ["present", "absent"].includes(booking.attendance) ? booking.attendance : "",
    attendanceAt: String(booking.attendanceAt || ""),
    attendanceBy: String(booking.attendanceBy || ""),
    /* Thu tiền mặt: mảng {amount, by, at, note} - chỉ áp dụng khi thanh toán trực tiếp qua HDV */
    cashPayments: Array.isArray(booking.cashPayments) ? booking.cashPayments : [],
    /* Tổng tiền mặt đã thu (tính từ cashPayments) */
    cashCollected: Array.isArray(booking.cashPayments)
      ? booking.cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      : 0,
  };
}

export function listBookings() {
  return bookings.all().map(normalizeBooking);
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

/* Đơn mới luôn lưu snapshot thông tin tour tại thời điểm đặt:
   sau này Admin đổi giá / ngừng bán / xoá tour thì đơn vẫn hiển thị đúng */
export function saveBooking(booking) {
  const list = listBookings();
  const now = new Date().toISOString();
  const record = normalizeBooking({
    payment: "unpaid",
    ...booking,
    code: createBookingCode(),
    status: "pending",
    createdAt: now,
    statusHistory: [{ status: "pending", at: now, by: booking.accountUsername || "Khách hàng" }],
  });
  list.unshift(record);
  bookings.set(list.slice(0, 200));
  return record;
}

const digits = (value) => String(value || "").replace(/\D/g, "");

export function myBookings(profile = {}) {
  const phone = digits(profile.phone);
  const email = String(profile.email || "").trim().toLowerCase();
  const username = String(profile.username || "").trim().toLowerCase();

  return listBookings().filter((item) => {
    const sameAccount =
      username && String(item.accountUsername || "").trim().toLowerCase() === username;
    const samePhone = phone && digits(item.phone) === phone;
    const sameEmail = email && String(item.email || "").trim().toLowerCase() === email;
    return sameAccount || samePhone || sameEmail;
  });
}

export function updateBooking(code, patch) {
  const list = listBookings().map((item) =>
    item.code === code ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  );
  return bookings.set(list);
}

export function recordBookingPayment(code, { method = "momo", transId } = {}) {
  const booking = getBooking(code);
  if (!booking) return null;
  const paymentTransId = transId || `MM${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
  const patch = {
    payment: "paid",
    paymentMethod: method,
    paymentTransId,
    paidAt: new Date().toISOString(),
    status: booking.status === "cancelled" ? "cancelled" : "confirmed",
  };
  updateBooking(code, patch);
  return { booking: getBooking(code) };
}

/* Chuyển đơn sang trạng thái kế tiếp theo đúng luồng nghiệp vụ.
   - Chỉ chấp nhận trạng thái hợp lệ từ trạng thái hiện tại (không nhảy cóc).
   - Ghi mốc thời gian + lịch sử để tra cứu về sau.
   - Khi đơn sang "đã thanh toán" thì payment được đồng bộ sang "paid". */
export function advanceBooking(code, to, { guide = false, by = "Hệ thống", note = "" } = {}) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };

  const allowed = guide ? GUIDE_FLOW[current.status] || [] : BOOKING_FLOW[current.status] || [];

  if (!allowed.includes(to)) {
    return {
      error: `Không thể chuyển đơn từ "${BOOKING_STATUS[current.status]}" sang "${
        BOOKING_STATUS[to] || to
      }".`,
    };
  }

  const now = new Date().toISOString();
  const patch = { status: to };
  const stampField = BOOKING_STAMP_FIELD[to];
  if (stampField) patch[stampField] = now;
  if (BOOKING_STATUS_FIELD[to]) patch[BOOKING_STATUS_FIELD[to]] = by;
  if (to === "paid") patch.payment = "paid";

  updateBooking(code, {
    ...patch,
    statusHistory: [
      ...current.statusHistory,
      { status: to, at: now, by, note },
    ],
  });

  return { booking: getBooking(code) };
}

/* Huỷ đơn theo nghiệp vụ: chỉ huỷ được trước khi tour chạy, có ghi lý do */
export function cancelBooking(code, { by = "Hệ thống", reason = "" } = {}) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };
  if (!canTransitionBooking(current.status, "cancelled")) {
    return { error: `Đơn đang "${BOOKING_STATUS[current.status]}" không thể huỷ.` };
  }
  const now = new Date().toISOString();
  updateBooking(code, {
    status: "cancelled",
    cancelledAt: now,
    cancelledBy: by,
    cancelReason: reason,
    statusHistory: [...current.statusHistory, { status: "cancelled", at: now, by, note: reason }],
  });
  return { booking: getBooking(code) };
}

/* Admin phân công Tour Guide. Nếu đơn đã thanh toán thì tự chuyển sang
   "sắp khởi hành" để Tour Guide nhận việc theo luồng nghiệp vụ. */
export function assignBookingGuide(code, guide) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };
  if (current.status === "cancelled" || current.status === "completed") {
    return { error: "Đơn đã kết thúc hoặc huỷ, không thể phân công hướng dẫn viên." };
  }

  const guideId = String(guide?.username || "").trim();
  const patch = {
    guideId,
    guideName: String(guide?.name || ""),
    guidePhone: String(guide?.phone || ""),
  };

  if (guideId && current.status === "paid") {
    const now = new Date().toISOString();
    patch.status = "upcoming";
    patch.upcomingAt = now;
    patch.statusHistory = [
      ...current.statusHistory,
      { status: "upcoming", at: now, by: "Admin", note: `Phân công ${guide.name}` },
    ];
  }

  updateBooking(code, patch);
  return { booking: getBooking(code) };
}

export function guideBookings(guideId) {
  const key = String(guideId || "").trim().toLowerCase();
  if (!key) return [];
  return listBookings().filter((item) => item.guideId.toLowerCase() === key);
}

/* Danh sách khách của một tour mà Tour Guide được phép xem.
   Guide không có "bookings.view" nên phải lọc theo guideId của chính mình. */
export function tourGuests(tourId, guideId = "") {
  const key = String(guideId || "").trim().toLowerCase();
  return listBookings().filter((item) => {
    if (String(item.tourId) !== String(tourId)) return false;
    if (["cancelled", "pending"].includes(item.status)) return false;
    if (key && item.guideId.toLowerCase() !== key) return false;
    return true;
  });
}

/* ---------- Điểm danh (Tour Guide) ---------- */

/* Xác nhận trạng thái điểm danh cho một đơn.
   - guideId phải trùng với booking.guideId để tránh HDV chỉnh đơn khác.
   - status: "present" | "absent"
   - Chỉ cho phép cập nhật khi tour ở trạng thái upcoming/ongoing/completed. */
export function markAttendance(code, status, { guideId = "", by = "Hướng dẫn viên" } = {}) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };

  const validStatuses = ["upcoming", "ongoing", "completed"];
  if (!validStatuses.includes(current.status)) {
    return { error: `Đơn ở trạng thái "${BOOKING_STATUS[current.status]}" chưa thể điểm danh.` };
  }

  /* Kiểm tra HDV chỉ điểm danh đơn của mình */
  const key = String(guideId || "").trim().toLowerCase();
  if (key && current.guideId.toLowerCase() !== key) {
    return { error: "Bạn không có quyền điểm danh đơn này." };
  }

  if (!["present", "absent"].includes(status)) {
    return { error: "Trạng thái điểm danh không hợp lệ." };
  }

  const now = new Date().toISOString();
  updateBooking(code, { attendance: status, attendanceAt: now, attendanceBy: by });
  return { booking: getBooking(code) };
}

/* Xóa điểm danh (chỉ khi tour chưa hoàn thành) */
export function clearAttendance(code, { guideId = "" } = {}) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };
  if (current.status === "completed") {
    return { error: "Không thể xóa điểm danh sau khi tour đã hoàn thành." };
  }
  const key = String(guideId || "").trim().toLowerCase();
  if (key && current.guideId.toLowerCase() !== key) {
    return { error: "Bạn không có quyền thao tác đơn này." };
  }
  updateBooking(code, { attendance: "", attendanceAt: "", attendanceBy: "" });
  return { booking: getBooking(code) };
}

/* ---------- Thu tiền mặt (Tour Guide) ---------- */

/* Ghi nhận HDV đã thu tiền mặt từ khách.
   - Không tự động đổi payment sang "paid"; Admin/Guide tự quyết định dựa trên dữ liệu thu.
   - Chống xác nhận trùng bằng kiểm tra tổng đã thu + số tiền mới không vượt quá total.
   - Khi cashCollected + amount >= total thì tự cập nhật payment="paid". */
export function addCashPayment(code, amount, { guideId = "", by = "Hướng dẫn viên", note = "" } = {}) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };

  const validStatuses = ["upcoming", "ongoing", "completed", "paid", "awaiting_payment"];
  if (!validStatuses.includes(current.status)) {
    return { error: `Đơn ở trạng thái "${BOOKING_STATUS[current.status]}" không thể ghi nhận tiền mặt.` };
  }

  /* Kiểm tra HDV chỉ thu tiền đơn của mình */
  const key = String(guideId || "").trim().toLowerCase();
  if (key && current.guideId.toLowerCase() !== key) {
    return { error: "Bạn không có quyền ghi nhận thanh toán đơn này." };
  }

  const parsedAmount = Math.round(Number(amount) || 0);
  if (parsedAmount <= 0) return { error: "Số tiền thu phải lớn hơn 0." };

  const already = current.cashCollected || 0;
  if (already >= current.total && current.total > 0) {
    return { error: "Đơn này đã thu đủ tiền rồi, không cần ghi nhận thêm." };
  }

  const now = new Date().toISOString();
  const entry = { amount: parsedAmount, by, at: now, note: String(note || "").trim() };
  const cashPayments = [...(current.cashPayments || []), entry];
  const newCollected = cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const patch = { cashPayments };

  /* Tự động cập nhật payment khi đã thu đủ hoặc vượt */
  if (newCollected >= current.total && current.total > 0 && current.payment !== "paid") {
    patch.payment = "paid";
    patch.paidAt = now;
    /* Nếu đơn ở awaiting_payment thì chuyển sang paid */
    if (current.status === "awaiting_payment") {
      patch.status = "paid";
      patch.statusHistory = [
        ...current.statusHistory,
        { status: "paid", at: now, by, note: `Thu tiền mặt đủ ${newCollected.toLocaleString("vi-VN")}đ` },
      ];
    }
  } else if (newCollected > 0 && current.payment === "unpaid") {
    /* Đã thu một phần, cập nhật thành deposit */
    patch.payment = "deposit";
  }

  updateBooking(code, patch);
  return { booking: getBooking(code) };
}

/* Xóa một bản ghi thu tiền mặt theo index (chỉ khi tour chưa hoàn thành) */
export function removeCashPayment(code, index, { guideId = "" } = {}) {
  const current = getBooking(code);
  if (!current) return { error: "Không tìm thấy đơn." };
  if (current.status === "completed") {
    return { error: "Không thể xóa giao dịch sau khi tour đã hoàn thành." };
  }
  const key = String(guideId || "").trim().toLowerCase();
  if (key && current.guideId.toLowerCase() !== key) {
    return { error: "Bạn không có quyền thao tác đơn này." };
  }

  const cashPayments = (current.cashPayments || []).filter((_, i) => i !== index);
  const newCollected = cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const patch = { cashPayments };
  /* Đồng bộ lại trạng thái thanh toán */
  if (newCollected === 0) patch.payment = "unpaid";
  else if (newCollected < current.total) patch.payment = "deposit";
  else patch.payment = "paid";

  updateBooking(code, patch);
  return { booking: getBooking(code) };
}

/* Thống kê điểm danh cho một nhóm đơn */
export function attendanceStats(bookingList) {
  const total = bookingList.reduce((sum, b) => sum + (Number(b.people) || 0), 0);
  const present = bookingList
    .filter((b) => b.attendance === "present")
    .reduce((sum, b) => sum + (Number(b.people) || 0), 0);
  const absent = bookingList
    .filter((b) => b.attendance === "absent")
    .reduce((sum, b) => sum + (Number(b.people) || 0), 0);
  const unchecked = total - present - absent;
  return { total, present, absent, unchecked };
}

export function bookingTourStats(tourId) {
  const rows = listBookings().filter((item) => String(item.tourId) === String(tourId));
  return {
    orders: rows.length,
    guests: rows.reduce((sum, item) => sum + (Number(item.people) || 0), 0),
    revenue: rows
      .filter((item) => item.status !== "cancelled")
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    rows,
  };
}

/* Đơn đã phát sinh giao dịch (đã thanh toán / đã hoàn thành) thì không được xoá vật lý,
   chỉ được huỷ hoặc giữ lại để tra cứu lịch sử. */
export function isProtectedBooking(booking) {
  return ["paid", "upcoming", "ongoing", "completed"].includes(booking?.status);
}

export function removeBooking(code) {
  const current = getBooking(code);
  if (current && isProtectedBooking(current)) {
    return {
      error: `Đơn ${code} đã có giao dịch thanh toán, không thể xoá. Hãy chuyển sang trạng thái huỷ nếu cần.`,
    };
  }
  bookings.set(listBookings().filter((item) => item.code !== code));
  return { ok: true };
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

/* ---------- Thông báo cho khách ---------- */

export const NOTIFICATION_TYPE = {
  booking: { label: "Đơn đặt tour", icon: "🎫" },
  promotion: { label: "Khuyến mãi", icon: "🎁" },
  system: { label: "Hệ thống", icon: "🔔" },
};

export function listNotifications() {
  return ensureIds(notifications, "nt");
}

const belongsTo = (item, profile) => {
  const phone = digits(profile.phone);
  const email = String(profile.email || "").trim().toLowerCase();
  const username = String(profile.username || "").trim().toLowerCase();
  const sameAccount =
    username && String(item.accountUsername || "").trim().toLowerCase() === username;
  const samePhone = phone && digits(item.phone) === phone;
  const sameEmail = email && String(item.email || "").trim().toLowerCase() === email;
  const forEveryone = !item.phone && !item.email && !item.accountUsername;
  return forEveryone || sameAccount || samePhone || sameEmail;
};

export function myNotifications(profile = {}, limit = 0) {
  const list = listNotifications()
    .filter((item) => belongsTo(item, profile))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return limit > 0 ? list.slice(0, limit) : list;
}

export function countUnreadNotifications(profile = {}) {
  return myNotifications(profile).filter((item) => !item.read).length;
}

export function saveNotification(payload = {}) {
  const list = listNotifications();
  const record = {
    id: nextId(list, "nt"),
    type: payload.type || "system",
    title: payload.title || "Thông báo mới",
    body: payload.body || "",
    phone: digits(payload.phone),
    email: String(payload.email || "").trim().toLowerCase(),
    accountUsername: String(payload.accountUsername || "").trim(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.set([record, ...list].slice(0, 100));
  return record;
}

export function markNotificationRead(id) {
  return notifications.set(
    listNotifications().map((item) => (item.id === id ? { ...item, read: true } : item))
  );
}

export function markAllNotificationsRead(profile = {}) {
  const targets = new Set(myNotifications(profile).map((item) => item.id));
  return notifications.set(
    listNotifications().map((item) => (targets.has(item.id) ? { ...item, read: true } : item))
  );
}

export function removeNotification(id) {
  return notifications.set(listNotifications().filter((item) => item.id !== id));
}

export function clearNotifications() {
  return notifications.clear();
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
  notifications.reset();
  resetSettings();
}

export function clearAllData() {
  bookings.clear();
  messages.clear();
  reviews.clear();
  coupons.clear();
  logs.clear();
  notes.clear();
  notifications.clear();
}

export function getLocalStorageStats() {
  const keys = [
    { key: BOOKING_KEY, label: "Đơn đặt tour", count: listBookings().length },
    { key: "travelgo.tours", label: "Danh mục tour", count: (JSON.parse(localStorage.getItem("travelgo.tours") || "{}").list || []).length },
    { key: "travelgo.users", label: "Tài khoản khách", count: (JSON.parse(localStorage.getItem("travelgo.users") || "[]")).length },
    { key: LOG_KEY, label: "Nhật ký hệ thống", count: listLogs().length },
    { key: NOTIFICATION_KEY, label: "Thông báo", count: listNotifications().length },
  ];
  let totalBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("travelgo.")) {
        totalBytes += (localStorage.getItem(k) || "").length * 2;
      }
    }
  } catch {}
  return { keys, totalBytes, totalKb: (totalBytes / 1024).toFixed(1) };
}
