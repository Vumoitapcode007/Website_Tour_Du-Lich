const BOOKING_KEY = "travelgo.bookings";
const MESSAGE_KEY = "travelgo.messages";

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
  return `TG${Date.now().toString().slice(-6)}`;
}

export function saveBooking(booking) {
  const list = read(BOOKING_KEY);
  const record = { ...booking, code: createBookingCode(), createdAt: new Date().toISOString() };
  list.unshift(record);
  write(BOOKING_KEY, list.slice(0, 20));
  return record;
}

export function listBookings() {
  return read(BOOKING_KEY);
}

export function saveMessage(message) {
  const list = read(MESSAGE_KEY);
  const record = { ...message, createdAt: new Date().toISOString() };
  list.unshift(record);
  write(MESSAGE_KEY, list.slice(0, 20));
  return record;
}
