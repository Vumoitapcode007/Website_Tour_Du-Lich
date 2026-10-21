/* Quy tắc đặt tour dùng chung cho form, widget đặt nhanh và trang quản trị */

/* Mỗi chuyến chỉ nhận tối đa 10 khách đối với đặt cá nhân */
export const MAX_PASSENGERS = 10;

/* Đặt theo đoàn yêu cầu từ 11 khách trở lên */
export const GROUP_MIN_PASSENGERS = 11;

/* Trẻ em tính một nửa giá người lớn */
export const CHILD_PRICE_RATE = 0.5;

const toCount = (value) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? number : 0;
};

/* Số khách tối đa còn nhận được:
   - Cá nhân: nhỏ hơn giới hạn MAX_PASSENGERS và số chỗ còn lại của tour
   - Theo đoàn: cho phép số khách lớn hơn 10 để công ty điều phối xe và dịch vụ riêng */
export function seatLimit(seatsLeft, bookingType = "individual") {
  if (bookingType === "group") return 999;
  return Math.min(MAX_PASSENGERS, Math.max(toCount(seatsLeft), 1));
}

/* Chuẩn hoá số lượng khách nhập vào:
   - Cá nhân: luôn có ít nhất 1 người lớn và tổng không vượt giới hạn
   - Theo đoàn: cho phép số khách lớn hơn 10 mà không bị ép trần */
export function normalizePassengers(adults, children, seatsLeft, bookingType = "individual") {
  if (bookingType === "group") {
    const adultsCount = Math.max(toCount(adults), 0);
    const childrenCount = Math.max(toCount(children), 0);
    return { adults: adultsCount, children: childrenCount, people: adultsCount + childrenCount };
  }
  const limit = seatLimit(seatsLeft, "individual");
  const adultsCount = Math.min(Math.max(toCount(adults), 1), limit);
  const childrenCount = Math.min(Math.max(toCount(children), 0), limit - adultsCount);
  return { adults: adultsCount, children: childrenCount, people: adultsCount + childrenCount };
}

/* Tách loại khách từ một đơn đã lưu - đơn cũ chỉ có "people" nên coi là người lớn */
export function passengerBreakdown(booking = {}) {
  const people = Math.max(toCount(booking.people), 0);
  const children = Math.min(Math.max(toCount(booking.children), 0), people);
  const adults = Math.min(Math.max(toCount(booking.adults), people - children), people - children);
  return { adults, children, people: adults + children };
}

export function childPrice(price) {
  return Math.round((Number(price) || 0) * CHILD_PRICE_RATE);
}

export function bookingTotal(price, counts = {}) {
  const unit = Math.round(Number(price) || 0);
  return unit * (toCount(counts.adults) || 0) + childPrice(unit) * (toCount(counts.children) || 0);
}

export function passengerLabel(booking = {}) {
  const { adults, children } = passengerBreakdown(booking);
  return children ? `${adults} người lớn, ${children} trẻ em` : `${adults} người lớn`;
}

/* Ngày hôm nay theo múi giờ máy khách - dạng YYYY-MM-DD để so sánh chuỗi */
export function todayKey(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* Khách hàng chỉ được đặt ngày ở tương lai - không nhận hôm nay lẫn quá khứ */
export function isFutureDeparture(date) {
  const key = String(date || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && key > todayKey();
}

export function futureDepartures(departures = []) {
  return (Array.isArray(departures) ? departures : []).filter(isFutureDeparture);
}
