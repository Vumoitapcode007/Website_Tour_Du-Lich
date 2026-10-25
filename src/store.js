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
const GUIDE_DIARY_KEY = "travelgo.guide_diaries";
const GUIDE_EXPENSE_KEY = "travelgo.guide_expenses";
const GUIDE_INCIDENT_KEY = "travelgo.guide_incidents";
const GUIDE_CHECKLIST_KEY = "travelgo.guide_checklists";
const GUIDE_ANNOUNCEMENT_KEY = "travelgo.guide_announcements";

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
  "upcoming",
  "ongoing",
  "completed",
];

/* Nhánh huỷ chỉ mở từ các trạng thái trước khi tour bắt đầu chạy */
export const BOOKING_FLOW = {
  pending: ["confirmed", "awaiting_payment", "cancelled"],
  confirmed: ["awaiting_payment", "upcoming", "cancelled"],
  awaiting_payment: ["upcoming", "paid", "cancelled"],
  paid: ["upcoming", "cancelled"],
  upcoming: ["ongoing", "cancelled"],
  ongoing: ["completed"],
  completed: [],
  cancelled: [],
};

/* Trạng thái vận hành do Tour Guide cập nhật */
export const GUIDE_FLOW = {
  confirmed: ["upcoming", "ongoing"],
  awaiting_payment: ["upcoming", "ongoing"],
  paid: ["upcoming", "ongoing"],
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

export const PAYMENT_METHOD = {
  bank: "VietQR ngân hàng",
  momo: "Ví MoMo",
  cash: "Tiền mặt cho hướng dẫn viên",
};

/* Đơn khách chọn trả tiền mặt trực tiếp cho HDV trước giờ khởi hành.
   Đơn cũ (trước khi có tính năng) không có paymentIntent nên vẫn đi luồng QR như cũ.
   Nếu khách đã thanh toán trực tuyến hoặc Admin xác nhận paid thì không còn là đơn "trả cho HDV". */
export function isPayToGuide(booking) {
  if (booking?.paymentIntent !== "cash") return false;
  if (booking.payment === "paid" && booking.paymentMethod && booking.paymentMethod !== "cash") {
    return false;
  }
  return true;
}

/* Số tiền còn phải thu của một đơn: đã thanh toán/hoàn tiền thì 0 */
export function bookingCashDue(booking) {
  if (!booking || ["paid", "refunded"].includes(booking.payment)) return 0;
  const total = Number(booking.total) || 0;
  const collected = Number(booking.cashCollected) || 0;
  return Math.max(total - collected, 0);
}

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
  allowCashToGuide: true,
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

const demoGuideDiaries = [
  {
    id: "GD-1",
    tourId: "1",
    guideId: "huongdan",
    dayNumber: 1,
    date: "2026-10-15",
    title: "Đón đoàn tại Nhà Hát Lớn & Tham quan chùa Bái Đính",
    content: "Đoàn tập trung đông đủ và đúng giờ 07:00. Bác tài xe 29 chỗ nhiệt tình, lái xe êm ái. Buổi sáng thời tiết mát mẻ, đoàn lên chùa Bái Đính thắp hương và đi xe điện thuận lợi. Khách lớn tuổi được hỗ trợ xe điện chu đáo.",
    weather: "Nắng nhẹ, mát mẻ (26°C)",
    mood: "Hào hứng, vui vẻ",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-15T04:30:00.000Z",
  },
  {
    id: "GD-2",
    tourId: "1",
    guideId: "huongdan",
    dayNumber: 2,
    date: "2026-10-16",
    title: "Đi thuyền Tràng An & Khởi hành về Hà Nội",
    content: "Buổi sáng thuyền Tràng An tuyến 2 cảnh rất đẹp, đoàn chụp nhiều ảnh lưu niệm. Ăn trưa tại nhà hàng thịt dê Ninh Bình ngon miệng. 14:30 đoàn lên xe về Hà Nội an toàn, khách phản hồi 5 sao rất hài lòng.",
    weather: "Trời trong xanh, có gió nhẹ",
    mood: "Rất hài lòng, gắn kết",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-16T08:00:00.000Z",
  },
];

const demoGuideExpenses = [
  {
    id: "EXP-1",
    tourId: "1",
    guideId: "huongdan",
    category: "ticket",
    categoryLabel: "Vé thắng cảnh",
    title: "Vé xe điện chùa Bái Đính khứ hồi",
    amount: 300000,
    receiptNo: "HD-BD-882",
    date: "2026-10-15",
    note: "Mua vé cho cả đoàn 5 khách",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-15T02:15:00.000Z",
  },
  {
    id: "EXP-2",
    tourId: "1",
    guideId: "huongdan",
    category: "fnb",
    categoryLabel: "Ăn uống & Nước",
    title: "Nước khoáng Lavie 2 thùng & khăn lạnh cho đoàn",
    amount: 180000,
    receiptNo: "BL-CH-12",
    date: "2026-10-15",
    note: "Mua tại trạm dừng nghỉ cao tốc",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-15T01:30:00.000Z",
  },
  {
    id: "EXP-3",
    tourId: "1",
    guideId: "huongdan",
    category: "transport",
    categoryLabel: "Phí cầu đường & Xe",
    title: "Phí trạm BOT cao tốc Pháp Vân - Cầu Giẽ - Ninh Bình",
    amount: 210000,
    receiptNo: "ETC-VETC-912",
    date: "2026-10-15",
    note: "Thanh toán ETC chiều đi",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-15T03:00:00.000Z",
  },
  {
    id: "EXP-4",
    tourId: "1",
    guideId: "huongdan",
    category: "other",
    categoryLabel: "Chi phí phát sinh",
    title: "Trà giải khát & hoa quả đặc sản mời khách tại bến thuyền",
    amount: 150000,
    receiptNo: "",
    date: "2026-10-16",
    note: "Chiêu đãi khách sau khi chèo thuyền Tràng An",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-16T04:45:00.000Z",
  },
];

const demoGuideIncidents = [
  {
    id: "INC-1",
    tourId: "1",
    guideId: "huongdan",
    level: "low",
    levelLabel: "Nhẹ / Chú ý",
    title: "Khách bỏ quên kính râm tại nhà hàng trưa",
    description: "Khách anh Nguyễn Văn A quên kính râm tại bàn ăn nhà hàng Hoàng Giang. HDV đã gọi quản lý nhà hàng giữ lại và chuyển về khách sạn The Reed lúc 17:00 cùng ngày.",
    location: "Nhà hàng Hoàng Giang, Ninh Bình",
    status: "resolved",
    resolution: "Đã lấy lại kính và trao tận tay cho khách lúc 17:30.",
    resolvedAt: "2026-10-15T10:30:00.000Z",
    resolvedBy: "Ngô Thanh Sơn",
    by: "Ngô Thanh Sơn",
    createdAt: "2026-10-15T06:00:00.000Z",
  },
];

const demoGuideAnnouncements = [
  {
    id: "ANN-1",
    tourId: "1",
    guideId: "huongdan",
    title: "⏰ Dặn dò giờ tập trung & trang phục ngày thứ 2",
    message: "Kính chào quý khách! Ngày mai đoàn sẽ tham quan quần thể Tràng An và leo Hang Múa. Quý khách vui lòng ăn sáng tại khách sạn từ 06:30 và có mặt tại sảnh lúc 07:15. Nên đi giày thể thao có độ bám tốt và mang theo mũ nón, kem chống nắng.",
    priority: "important",
    by: "Ngô Thanh Sơn (HDV Trưởng)",
    createdAt: "2026-10-15T13:00:00.000Z",
  },
];

const DEFAULT_GUIDE_CHECKLIST = [
  { id: "chk-1", text: "In danh sách đoàn và số điện thoại liên hệ từng khách", category: "docs", checked: true },
  { id: "chk-2", text: "Gọi điện trước 24h xác nhận giờ và điểm đón khách", category: "contact", checked: true },
  { id: "chk-3", text: "Kiểm tra hợp đồng xe, xác nhận biển số xe & số hotline tài xế", category: "transport", checked: true },
  { id: "chk-4", text: "Xác nhận với khách sạn về giờ nhận phòng (early check-in nếu có)", category: "hotel", checked: true },
  { id: "chk-5", text: "Xác nhận thực đơn nhà hàng (lưu ý suất ăn chay / dị ứng hải sản)", category: "fnb", checked: false },
  { id: "chk-6", text: "Chuẩn bị cờ đoàn TravelGo, thẻ đeo đoàn và loa micro cầm tay", category: "tools", checked: true },
  { id: "chk-7", text: "Kiểm tra túi y tế sơ cấp cứu: thuốc say xe, hạ sốt, băng gạc, dầu gió", category: "medical", checked: true },
  { id: "chk-8", text: "Tạm ứng tiền mặt từ kế toán để chi tiêu vé và nước uống", category: "finance", checked: true },
];

const guideDiaries = createCollection(GUIDE_DIARY_KEY, demoGuideDiaries);
const guideExpenses = createCollection(GUIDE_EXPENSE_KEY, demoGuideExpenses);
const guideIncidents = createCollection(GUIDE_INCIDENT_KEY, demoGuideIncidents);
const guideChecklists = createCollection(GUIDE_CHECKLIST_KEY, []);
const guideAnnouncements = createCollection(GUIDE_ANNOUNCEMENT_KEY, demoGuideAnnouncements);

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
  const bookingType = booking.bookingType === "group" ? "group" : "individual";
  const groupName = String(booking.groupName || "");

  return {
    ...booking,
    bookingType,
    groupName,
    status: booking.code === "TGWVW9I" && booking.status === "paid" ? "confirmed" : (BOOKING_STATUS[booking.status] ? booking.status : "pending"),
    payment: booking.code === "TGWVW9I" ? "unpaid" : (PAYMENT_STATUS[booking.payment] ? booking.payment : "unpaid"),
    paidAt: booking.code === "TGWVW9I" ? "" : (booking.paidAt || ""),
    paymentTransId: booking.code === "TGWVW9I" ? "" : (booking.paymentTransId || ""),
    /* "cash" = khách chọn trả trực tiếp cho HDV trước khởi hành; đơn cũ để trống */
    paymentIntent: booking.paymentIntent === "cash" ? "cash" : String(booking.paymentIntent || ""),
    paymentMethod: String(booking.paymentMethod || ""),
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

  /* HDV chỉ được cho khách lên xe / xuất phát khi đơn đã thu đủ tiền.
     Đơn chưa thanh toán phải dừng lại để HDV ghi nhận thu tiền mặt trước. */
  if (guide && ["upcoming", "ongoing"].includes(to) && bookingCashDue(current) > 0) {
    return {
      error: `Khách chưa thanh toán đủ (còn thiếu ${bookingCashDue(current).toLocaleString("vi-VN")}đ). Hãy thu đủ tiền trước khi chuyển đơn sang "${BOOKING_STATUS[to]}".`,
    };
  }

  const now = new Date().toISOString();
  const patch = { status: to };
  const stampField = BOOKING_STAMP_FIELD[to];
  if (stampField) patch[stampField] = now;
  if (BOOKING_STATUS_FIELD[to]) patch[BOOKING_STATUS_FIELD[to]] = by;
  /* Xác nhận/chuyển trạng thái đơn không tự ý đổi thanh toán sang "paid".
     Thanh toán chỉ đổi khi khách thanh toán hoặc Admin chủ động gạch nợ. */

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

  const validStatuses = ["upcoming", "ongoing", "completed", "paid", "awaiting_payment", "confirmed"];
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

  /* Đơn đã thanh toán trực tuyến (MoMo/QR) hoặc Admin đã ghi nhận paid mà chưa thu tiền mặt
     thì không được ghi nhận thu tiền mặt nữa - tránh trùng lặp hai luồng thanh toán */
  if (current.payment === "paid" && (current.cashCollected || 0) === 0) {
    return { error: "Đơn này đã ở trạng thái Đã thanh toán (trực tuyến hoặc Admin xác nhận), không thu tiền mặt thêm." };
  }

  const already = current.cashCollected || 0;
  if (already >= current.total && current.total > 0) {
    return { error: "Đơn này đã thu đủ tiền rồi, không cần ghi nhận thêm." };
  }
  const remain = Math.max(current.total - already, 0);
  if (current.total > 0 && parsedAmount > remain) {
    return {
      error: `Số tiền thu vượt quá số còn phải thu (${remain.toLocaleString("vi-VN")}đ). Vui lòng kiểm tra lại.`,
    };
  }

  const now = new Date().toISOString();
  const entry = { amount: parsedAmount, by, at: now, note: String(note || "").trim() };
  const cashPayments = [...(current.cashPayments || []), entry];
  const newCollected = cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const patch = { cashPayments };

  /* Tự động cập nhật payment khi đã thu đủ hoặc vượt */
  if (newCollected >= current.total && current.total > 0 && current.payment !== "paid") {
    patch.payment = "paid";
    patch.paymentMethod = "cash";
    patch.paidAt = now;
    /* Nếu đơn ở awaiting_payment thì chuyển sang paid */
    if (current.status === "awaiting_payment" || current.status === "confirmed") {
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
  if (newCollected === 0) {
    patch.payment = "unpaid";
    if (current.paymentMethod === "cash") patch.paymentMethod = "";
  } else if (newCollected < current.total) {
    patch.payment = "deposit";
    if (current.paymentMethod === "cash") patch.paymentMethod = "";
  } else patch.payment = "paid";

  updateBooking(code, patch);
  return { booking: getBooking(code) };
}

/* ---------- Nhật ký hành trình (Tour Guide Diary) ---------- */

export function listTourLogs(tourId = "", guideId = "") {
  const gKey = String(guideId || "").trim().toLowerCase();
  const tKey = String(tourId || "").trim();
  return guideDiaries.all().filter((item) => {
    if (tKey && String(item.tourId) !== tKey) return false;
    if (gKey && String(item.guideId || "").toLowerCase() !== gKey) return false;
    return true;
  }).sort((a, b) => (Number(a.dayNumber) || 0) - (Number(b.dayNumber) || 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function addTourLog({ tourId, guideId = "", dayNumber = 1, date = "", title = "", content = "", weather = "", mood = "", by = "Hướng dẫn viên" } = {}) {
  const list = guideDiaries.all();
  const id = `GD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const record = {
    id,
    tourId: String(tourId || ""),
    guideId: String(guideId || ""),
    dayNumber: Number(dayNumber) || 1,
    date: date || new Date().toISOString().slice(0, 10),
    title: String(title || "").trim(),
    content: String(content || "").trim(),
    weather: String(weather || "").trim(),
    mood: String(mood || "").trim(),
    by: String(by || "Hướng dẫn viên").trim(),
    createdAt: new Date().toISOString(),
  };
  guideDiaries.set([record, ...list]);
  return { log: record };
}

export function deleteTourLog(id) {
  const list = guideDiaries.all();
  guideDiaries.set(list.filter((item) => item.id !== id));
  return { ok: true };
}

/* ---------- Chi tiêu & Quyết toán đoàn (Tour Guide Expenses) ---------- */

export const EXPENSE_CATEGORIES = {
  ticket: "Vé thắng cảnh & Tham quan",
  fnb: "Ăn uống & Nước uống đoàn",
  transport: "Xe, Vé cầu đường & Xăng xe",
  hotel: "Khách sạn & Phòng nghỉ",
  tip: "Tip tài xế / Hỗ trợ viên",
  medical: "Thuốc men & Y tế phát sinh",
  other: "Chi phí phát sinh khác",
};

export function listTourExpenses(tourId = "", guideId = "") {
  const gKey = String(guideId || "").trim().toLowerCase();
  const tKey = String(tourId || "").trim();
  return guideExpenses.all().filter((item) => {
    if (tKey && String(item.tourId) !== tKey) return false;
    if (gKey && String(item.guideId || "").toLowerCase() !== gKey) return false;
    return true;
  }).sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
}

export function addTourExpense({ tourId, guideId = "", category = "other", title = "", amount = 0, receiptNo = "", date = "", note = "", by = "Hướng dẫn viên" } = {}) {
  const parsedAmount = Math.max(0, Math.round(Number(amount) || 0));
  if (parsedAmount <= 0) return { error: "Số tiền chi tiêu phải lớn hơn 0." };
  if (!title.trim()) return { error: "Vui lòng nhập tên khoản chi." };

  const list = guideExpenses.all();
  const id = `EXP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const record = {
    id,
    tourId: String(tourId || ""),
    guideId: String(guideId || ""),
    category,
    categoryLabel: EXPENSE_CATEGORIES[category] || "Khác",
    title: String(title).trim(),
    amount: parsedAmount,
    receiptNo: String(receiptNo || "").trim(),
    date: date || new Date().toISOString().slice(0, 10),
    note: String(note || "").trim(),
    by: String(by || "Hướng dẫn viên").trim(),
    createdAt: new Date().toISOString(),
  };
  guideExpenses.set([record, ...list]);
  return { expense: record };
}

export function deleteTourExpense(id) {
  const list = guideExpenses.all();
  guideExpenses.set(list.filter((item) => item.id !== id));
  return { ok: true };
}

export function getTourExpenseSummary(tourId = "", guideId = "", advanceBudget = 5000000) {
  const expenses = listTourExpenses(tourId, guideId);
  const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Tiền mặt HDV đã thu từ khách của chuyến này
  const bookings = guideBookings(guideId).filter((b) => !tourId || String(b.tourId) === String(tourId));
  const cashCollected = bookings.reduce((sum, b) => sum + (Number(b.cashCollected) || 0), 0);

  // Phân loại chi tiêu
  const byCategory = {};
  for (const exp of expenses) {
    const cat = exp.category || "other";
    byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
  }

  // Cân đối tài chính: (Tạm ứng + Tiền mặt đã thu) - Tổng chi
  const totalFund = advanceBudget + cashCollected;
  const balance = totalFund - totalExpense;

  return {
    advanceBudget,
    cashCollected,
    totalFund,
    totalExpense,
    balance,
    count: expenses.length,
    byCategory,
  };
}

/* ---------- Báo cáo sự cố khẩn cấp (Incident / SOS) ---------- */

export const INCIDENT_LEVELS = {
  low: { label: "Nhẹ / Cần chú ý", color: "blue", badgeClass: "status-confirmed" },
  medium: { label: "Trung bình", color: "amber", badgeClass: "status-pending" },
  high: { label: "Nghiêm trọng", color: "orange", badgeClass: "status-deposit" },
  urgent: { label: "Khẩn cấp SOS", color: "red", badgeClass: "status-cancelled" },
};

export function listTourIncidents(tourId = "", guideId = "") {
  const gKey = String(guideId || "").trim().toLowerCase();
  const tKey = String(tourId || "").trim();
  return guideIncidents.all().filter((item) => {
    if (tKey && String(item.tourId) !== tKey) return false;
    if (gKey && String(item.guideId || "").toLowerCase() !== gKey) return false;
    return true;
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function addTourIncident({ tourId, guideId = "", level = "medium", title = "", description = "", location = "", by = "Hướng dẫn viên" } = {}) {
  if (!title.trim()) return { error: "Vui lòng nhập tiêu đề sự cố." };
  if (!description.trim()) return { error: "Vui lòng mô tả chi tiết sự cố." };

  const list = guideIncidents.all();
  const id = `INC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const record = {
    id,
    tourId: String(tourId || ""),
    guideId: String(guideId || ""),
    level,
    levelLabel: INCIDENT_LEVELS[level]?.label || "Trung bình",
    title: String(title).trim(),
    description: String(description).trim(),
    location: String(location || "").trim(),
    status: "open",
    resolution: "",
    resolvedAt: "",
    resolvedBy: "",
    by: String(by || "Hướng dẫn viên").trim(),
    createdAt: new Date().toISOString(),
  };
  guideIncidents.set([record, ...list]);
  return { incident: record };
}

export function resolveTourIncident(id, { resolution = "", by = "Hướng dẫn viên" } = {}) {
  const list = guideIncidents.all();
  const found = list.find((item) => item.id === id);
  if (!found) return { error: "Không tìm thấy sự cố." };

  found.status = "resolved";
  found.resolution = String(resolution || "Đã giải quyết xong.").trim();
  found.resolvedAt = new Date().toISOString();
  found.resolvedBy = by;

  guideIncidents.set([...list]);
  return { incident: found };
}

/* ---------- Thông báo dặn dò đoàn (Tour Announcements) ---------- */

export function listTourAnnouncements(tourId = "", guideId = "") {
  const gKey = String(guideId || "").trim().toLowerCase();
  const tKey = String(tourId || "").trim();
  return guideAnnouncements.all().filter((item) => {
    if (tKey && String(item.tourId) !== tKey) return false;
    if (gKey && String(item.guideId || "").toLowerCase() !== gKey) return false;
    return true;
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function addTourAnnouncement({ tourId, guideId = "", title = "", message = "", priority = "normal", by = "Hướng dẫn viên" } = {}) {
  if (!title.trim()) return { error: "Vui lòng nhập tiêu đề thông báo." };
  if (!message.trim()) return { error: "Vui lòng nhập nội dung dặn dò." };

  const list = guideAnnouncements.all();
  const id = `ANN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const record = {
    id,
    tourId: String(tourId || ""),
    guideId: String(guideId || ""),
    title: String(title).trim(),
    message: String(message).trim(),
    priority: priority === "urgent" ? "urgent" : priority === "important" ? "important" : "normal",
    by: String(by || "Hướng dẫn viên").trim(),
    createdAt: new Date().toISOString(),
  };
  guideAnnouncements.set([record, ...list]);
  return { announcement: record };
}

export function deleteTourAnnouncement(id) {
  const list = guideAnnouncements.all();
  guideAnnouncements.set(list.filter((item) => item.id !== id));
  return { ok: true };
}

/* ---------- Checklist chuẩn bị trước chuyến đi ---------- */

export function getTourChecklist(tourId = "1", guideId = "") {
  const savedAll = guideChecklists.all();
  const key = `${tourId}_${guideId}`;
  const found = savedAll.find((item) => item.key === key);
  if (found) return found.items;

  // Khởi tạo checklist mặc định
  const initial = DEFAULT_GUIDE_CHECKLIST.map((item) => ({ ...item }));
  savedAll.push({ key, items: initial });
  guideChecklists.set(savedAll);
  return initial;
}

export function toggleChecklistItem(tourId = "1", guideId = "", itemId = "") {
  const savedAll = guideChecklists.all();
  const key = `${tourId}_${guideId}`;
  let found = savedAll.find((item) => item.key === key);
  if (!found) {
    found = { key, items: DEFAULT_GUIDE_CHECKLIST.map((i) => ({ ...i })) };
    savedAll.push(found);
  }
  const target = found.items.find((i) => i.id === itemId);
  if (target) {
    target.checked = !target.checked;
    guideChecklists.set([...savedAll]);
  }
  return { items: found.items };
}

export function addChecklistItem(tourId = "1", guideId = "", text = "", category = "custom") {
  if (!text.trim()) return { error: "Nội dung checklist không được trống." };
  const savedAll = guideChecklists.all();
  const key = `${tourId}_${guideId}`;
  let found = savedAll.find((item) => item.key === key);
  if (!found) {
    found = { key, items: DEFAULT_GUIDE_CHECKLIST.map((i) => ({ ...i })) };
    savedAll.push(found);
  }
  const newItem = {
    id: `chk-custom-${Date.now()}`,
    text: text.trim(),
    category,
    checked: false,
  };
  found.items.push(newItem);
  guideChecklists.set([...savedAll]);
  return { item: newItem, items: found.items };
}

export function resetTourChecklist(tourId = "1", guideId = "") {
  const savedAll = guideChecklists.all();
  const key = `${tourId}_${guideId}`;
  const filtered = savedAll.filter((item) => item.key !== key);
  const fresh = { key, items: DEFAULT_GUIDE_CHECKLIST.map((i) => ({ ...i })) };
  filtered.push(fresh);
  guideChecklists.set(filtered);
  return { items: fresh.items };
}

/* ---------- Check-in nhanh theo mã vé ---------- */

export function quickCheckIn(inputCode = "", { guideId = "", by = "Hướng dẫn viên" } = {}) {
  const cleanCode = String(inputCode || "").trim().toUpperCase();
  if (!cleanCode) return { error: "Vui lòng nhập mã vé hoặc mã đơn đặt tour." };

  const all = listBookings();
  const booking = all.find((b) => b.code.toUpperCase() === cleanCode);
  if (!booking) {
    return { error: `Không tìm thấy đơn hoặc vé nào có mã "${cleanCode}".` };
  }

  // Kiểm tra quyền của HDV nếu có phân công
  const gKey = String(guideId || "").trim().toLowerCase();
  if (gKey && booking.guideId && booking.guideId.toLowerCase() !== gKey) {
    return { error: `Đơn này được phân công cho HDV khác (${booking.guideName || booking.guideId}).` };
  }

  if (["cancelled", "pending"].includes(booking.status)) {
    return { error: `Đơn "${cleanCode}" đang ở trạng thái "${BOOKING_STATUS[booking.status]}", không thể check-in.` };
  }

  /* Vé lên xe chỉ có hiệu lực khi đã thu đủ tiền - đơn còn thiếu phải ghi nhận thu trước */
  if (booking.status !== "completed" && bookingCashDue(booking) > 0) {
    return {
      error: `Khách của đơn "${cleanCode}" chưa thanh toán đủ (còn thiếu ${bookingCashDue(booking).toLocaleString("vi-VN")}đ). Vui lòng thu đủ tiền trước khi cho khách lên xe.`,
    };
  }

  const alreadyChecked = booking.attendance === "present";
  const now = new Date().toISOString();

  if (!alreadyChecked) {
    updateBooking(booking.code, {
      attendance: "present",
      attendanceAt: now,
      attendanceBy: by,
    });
  }

  const updated = getBooking(booking.code);
  return {
    success: true,
    alreadyChecked,
    booking: updated,
  };
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

/* Chuyển trạng thái đồng loạt cho CẢ CHUYẾN ĐI (toàn bộ khách trong chuyến) */
export function advanceTripStatus(tourId, to, { guideId = "", by = "Hướng dẫn viên", note = "" } = {}) {
  const guideKey = String(guideId || "").trim().toLowerCase();
  const allRows = listBookings();
  const tripRows = allRows.filter((b) => {
    if (String(b.tourId) !== String(tourId)) return false;
    if (guideKey && b.guideId.toLowerCase() !== guideKey) return false;
    if (["cancelled", "completed"].includes(b.status)) return false;
    return true;
  });

  if (!tripRows.length) {
    return { error: "Không tìm thấy đơn hợp lệ nào trong chuyến để cập nhật." };
  }

  const now = new Date().toISOString();
  let updatedCount = 0;
  let skipped = 0;

  for (const b of tripRows) {
    /* Bỏ qua đơn chưa thu đủ tiền: chỉ chuyển cả chuyến khi khách đã thanh toán.
       Đơn thiếu tiền nằm lại để HDV ghi nhận thu trước khi xuất phát. */
    if (to !== "completed" && bookingCashDue(b) > 0) {
      skipped++;
      continue;
    }
    const allowed = GUIDE_FLOW[b.status] || [];
    if (allowed.includes(to) || (to === "ongoing" && ["confirmed", "paid", "upcoming"].includes(b.status)) || (to === "completed" && b.status === "ongoing")) {
      const patch = { status: to };
      const stampField = BOOKING_STAMP_FIELD[to];
      if (stampField) patch[stampField] = now;
      if (BOOKING_STATUS_FIELD[to]) patch[BOOKING_STATUS_FIELD[to]] = by;
      patch.statusHistory = [
        ...(b.statusHistory || []),
        { status: to, at: now, by, note: note || `Cập nhật cả chuyến sang ${BOOKING_STATUS[to] || to}` }
      ];
      updateBooking(b.code, patch);
      updatedCount++;
    }
  }

  return { ok: true, count: updatedCount, skipped };
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
    bookingCode: String(payload.bookingCode || "").trim().toUpperCase(),
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
  guideDiaries.reset();
  guideExpenses.reset();
  guideIncidents.reset();
  guideChecklists.reset();
  guideAnnouncements.reset();
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
  guideDiaries.clear();
  guideExpenses.clear();
  guideIncidents.clear();
  guideChecklists.clear();
  guideAnnouncements.clear();
}

export function getLocalStorageStats() {
  const keys = [
    { key: BOOKING_KEY, label: "Đơn đặt tour", count: listBookings().length },
    { key: "travelgo.tours", label: "Danh mục tour", count: (JSON.parse(localStorage.getItem("travelgo.tours") || "{}").list || []).length },
    { key: "travelgo.users", label: "Tài khoản khách", count: (JSON.parse(localStorage.getItem("travelgo.users") || "[]")).length },
    { key: LOG_KEY, label: "Nhật ký hệ thống", count: listLogs().length },
    { key: NOTIFICATION_KEY, label: "Thông báo", count: listNotifications().length },
    { key: GUIDE_DIARY_KEY, label: "Nhật ký HDV", count: guideDiaries.all().length },
    { key: GUIDE_EXPENSE_KEY, label: "Chi tiêu đoàn", count: guideExpenses.all().length },
    { key: GUIDE_INCIDENT_KEY, label: "Sự cố đoàn", count: guideIncidents.all().length },
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
