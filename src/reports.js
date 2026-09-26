import { listNotes, listReviews } from "./store.js";
import { listTours } from "./tour-repository.js";

const MONTH_LABELS = [
  "Th01", "Th02", "Th03", "Th04", "Th05", "Th06",
  "Th07", "Th08", "Th09", "Th10", "Th11", "Th12",
];

const DAY = 86400000;

function isRevenue(booking) {
  return booking.status !== "cancelled";
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthKey(value) {
  const date = toDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "";
}

export function monthLabel(key) {
  return MONTH_LABELS[Number(key.slice(5, 7)) - 1] + "/" + key.slice(2, 4);
}

export function shortDate(value) {
  const date = toDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(value) {
  const date = toDate(value);
  if (!date) return "-";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDateTime(value);
}

export function bookingSummary(bookings) {
  const total = bookings.length;
  const byStatus = { pending: 0, confirmed: 0, cancelled: 0 };
  let revenue = 0;
  let cancelledValue = 0;
  let people = 0;

  bookings.forEach((item) => {
    if (byStatus[item.status] !== undefined) byStatus[item.status] += 1;
    if (isRevenue(item)) {
      revenue += Number(item.total) || 0;
      people += Number(item.people) || 0;
    } else {
      cancelledValue += Number(item.total) || 0;
    }
  });

  const valid = total - byStatus.cancelled;
  return {
    total,
    ...byStatus,
    revenue,
    cancelledValue,
    people,
    customers: new Set(bookings.map((item) => item.phone)).size,
    avgOrder: valid ? Math.round(revenue / valid) : 0,
    conversion: total ? Math.round((valid / total) * 100) : 0,
  };
}

export function revenueByMonth(bookings, months = 6) {
  const buckets = new Map();
  const now = new Date();

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { key, label: monthLabel(key), revenue: 0, orders: 0, people: 0 });
  }

  bookings.forEach((item) => {
    if (!isRevenue(item)) return;
    const key = monthKey(item.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.revenue += Number(item.total) || 0;
    bucket.orders += 1;
    bucket.people += Number(item.people) || 0;
  });

  return [...buckets.values()];
}

export function revenueByDay(bookings, days = 14) {
  const buckets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * DAY);
    buckets.push({
      key: date.toISOString().slice(0, 10),
      label: shortDate(date),
      revenue: 0,
      orders: 0,
    });
  }

  bookings.forEach((item) => {
    if (!isRevenue(item)) return;
    const date = toDate(item.createdAt);
    if (!date) return;
    const bucket = buckets.find((entry) => entry.key === date.toISOString().slice(0, 10));
    if (!bucket) return;
    bucket.revenue += Number(item.total) || 0;
    bucket.orders += 1;
  });

  return buckets;
}

export function topTours(bookings, limit = 5) {
  const tours = listTours();
  const map = new Map();

  bookings.forEach((item) => {
    if (!isRevenue(item)) return;
    const id = String(item.tourId ?? item.tourName);
    const tour = tours.find((entry) => String(entry.id) === id);
    const current =
      map.get(id) ||
      {
        id: item.tourId,
        name: tour?.name || item.tourName,
        location: tour?.location || "Khác",
        image: tour?.image || "",
        orders: 0,
        people: 0,
        revenue: 0,
      };
    current.orders += 1;
    current.people += Number(item.people) || 0;
    current.revenue += Number(item.total) || 0;
    map.set(id, current);
  });

  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function revenueByDestination(bookings) {
  const tours = listTours();
  const map = new Map();

  bookings.forEach((item) => {
    if (!isRevenue(item)) return;
    const tour = tours.find((entry) => String(entry.id) === String(item.tourId));
    const location = tour?.location || "Khác";
    const current = map.get(location) || { name: location, revenue: 0, orders: 0, people: 0 };
    current.revenue += Number(item.total) || 0;
    current.orders += 1;
    current.people += Number(item.people) || 0;
    map.set(location, current);
  });

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function tourLoad() {
  return listTours()
    .map((tour) => {
      const seatsLeft = Math.max(Number(tour.seatsLeft) || 0, 0);
      return {
        ...tour,
        seatsLeft,
        departures: tour.departures?.length || 1,
        pressure: seatsLeft <= 2 ? "critical" : seatsLeft <= 4 ? "warning" : "normal",
      };
    })
    .sort((a, b) => a.seatsLeft - b.seatsLeft);
}

export function listCustomers(bookings) {
  const map = new Map();

  bookings.forEach((item) => {
    if (!item.phone) return;
    const current = map.get(item.phone) || {
      phone: item.phone,
      name: item.name,
      email: item.email || "",
      orders: 0,
      confirmed: 0,
      cancelled: 0,
      total: 0,
      people: 0,
      firstOrder: item.createdAt,
      lastOrder: item.createdAt,
      tours: new Set(),
    };
    current.name = item.name || current.name;
    if (item.email) current.email = item.email;
    current.orders += 1;
    current.people += Number(item.people) || 0;
    if (item.status === "confirmed") current.confirmed += 1;
    if (item.status === "cancelled") current.cancelled += 1;
    if (isRevenue(item)) current.total += Number(item.total) || 0;
    current.tours.add(item.tourName);
    if (new Date(item.createdAt) < new Date(current.firstOrder)) current.firstOrder = item.createdAt;
    if (new Date(item.createdAt) > new Date(current.lastOrder)) current.lastOrder = item.createdAt;
    map.set(item.phone, current);
  });

  const notes = new Map(listNotes().map((item) => [item.phone, item]));

  return [...map.values()]
    .map((item) => {
      const note = notes.get(item.phone);
      return {
        ...item,
        tours: [...item.tours],
        note: note?.note || "",
        noteAt: note?.createdAt || "",
        tier: customerTier(item),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function customerTier(customer) {
  if (customer.total >= 10000000) return { key: "vip", label: "VIP" };
  if (customer.total >= 5000000) return { key: "gold", label: "Vàng" };
  if (customer.orders >= 2) return { key: "silver", label: "Bạc" };
  return { key: "new", label: "Mới" };
}

export function customerGrowth(bookings, months = 6) {
  const byMonth = revenueByMonth(bookings, months);
  const map = new Map();
  bookings.forEach((item) => {
    if (!item.createdAt) return;
    const key = monthKey(item.createdAt);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return byMonth.map((item) => ({ ...item, customers: map.get(item.key) || 0 }));
}

export function pendingAttention(bookings, messages) {
  return {
    bookings: bookings.filter((item) => item.status === "pending").length,
    messages: messages.filter((item) => !item.read).length,
    tours: listTours().filter((tour) => (tour.seatsLeft || 0) <= 4).length,
    reviews: listReviews().filter((item) => item.status === "pending").length,
  };
}
