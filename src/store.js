const BOOKING_KEY = "travelgo.bookings";
const MESSAGE_KEY = "travelgo.messages";

export const BOOKING_STATUS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã huỷ",
};

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
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
  const list = read(BOOKING_KEY);
  const record = {
    ...booking,
    code: createBookingCode(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  list.unshift(record);
  write(BOOKING_KEY, list.slice(0, 50));
  return record;
}

export function listBookings() {
  return read(BOOKING_KEY);
}

export function updateBooking(code, patch) {
  const list = listBookings().map((item) =>
    item.code === code ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  );
  write(BOOKING_KEY, list);
  return list;
}

export function removeBooking(code) {
  return write(
    BOOKING_KEY,
    listBookings().filter((item) => item.code !== code)
  );
}

export function clearBookings() {
  return write(BOOKING_KEY, []);
}

export function saveMessage(message) {
  const list = read(MESSAGE_KEY);
  const record = { ...message, createdAt: new Date().toISOString() };
  list.unshift(record);
  write(MESSAGE_KEY, list.slice(0, 50));
  return record;
}

export function listMessages() {
  return read(MESSAGE_KEY);
}
