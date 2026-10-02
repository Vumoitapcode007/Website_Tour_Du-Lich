/* Quy tắc đặt tour dùng chung cho form, widget đặt nhanh và trang quản trị */

/* Mỗi chuyến chỉ nhận tối đa 10 khách */
export const MAX_PASSENGERS = 10;

/* Trẻ em tính một nửa giá người lớn */
export const CHILD_PRICE_RATE = 0.5;

const toCount = (value) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? number : 0;
};

/* Số khách tối đa còn nhận được: nhỏ hơn giới hạn chung và số chỗ còn lại của tour */
export function seatLimit(seatsLeft) {
  return Math.min(MAX_PASSENGERS, Math.max(toCount(seatsLeft), 1));
}

/* Chuẩn hoá số lượng khách nhập vào: luôn có ít nhất 1 người lớn và tổng không vượt giới hạn */
export function normalizePassengers(adults, children, seatsLeft) {
  const limit = seatLimit(seatsLeft);
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