import {
  BOOKING_STATUS,
  BOOKING_ORDER,
  PAYMENT_STATUS,
  isCancelledBooking,
} from "../store.js";
import { formatDate, formatPrice } from "../data.js";
import { getTourById, isSellableTour } from "../tour-repository.js";
import { escapeHtml } from "../validate.js";
import { passengerBreakdown, passengerLabel } from "../booking-rules.js";

/* formatDate chỉ nhận chuỗi ngày, nên thời điểm tạo đơn cần định dạng riêng */
const CREATED_AT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const createdAtLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : CREATED_AT.format(date);
};

const stampLabel = (value) => (value ? createdAtLabel(value) : "");

/* Số ngày còn lại trước ngày khởi hành (âm nghĩa là đã qua) */
export function daysToDeparture(date) {
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function departureCountdown(booking) {
  if (isCancelledBooking(booking) || booking.status === "completed") return "";
  const days = daysToDeparture(booking.date);
  if (days === null) return "";
  if (days < 0) return "Đã khởi hành";
  if (days === 0) return "Khởi hành hôm nay";
  if (days === 1) return "Khởi hành ngày mai";
  return `Còn ${days} ngày nữa khởi hành`;
}

/* Gợi ý riêng cho từng bước, chỉ hiện khi đơn chưa đi tới bước đó */
const STEP_NOTE = {
  pending: "Chuyên viên sẽ gọi bạn trong 30 phút",
  confirmed: "Đã xác nhận - chờ bước thanh toán",
  awaiting_payment: "Chuyển khoản để giữ chỗ cho bạn",
  paid: "Đã thanh toán - chờ phân công hướng dẫn viên",
  upcoming: "Hướng dẫn viên đã nhận chuyến",
  ongoing: "Chuyến đi đang diễn ra",
  completed: "",
};

/* Timeline đầy đủ 7 bước nghiệp vụ (bỏ nhánh huỷ - đơn huỷ hiển thị riêng) */
const FLOW_STEPS = [
  { key: "pending", label: "Đã gửi yêu cầu", stamp: (b) => createdAtLabel(b.createdAt) },
  { key: "confirmed", label: "Chuyên viên xác nhận", stamp: (b) => stampLabel(b.confirmedAt) },
  { key: "awaiting_payment", label: "Chờ thanh toán", stamp: (b) => stampLabel(b.awaitingPaymentAt) },
  { key: "paid", label: "Hoàn tất thanh toán", stamp: (b) => stampLabel(b.paidAt) },
  {
    key: "upcoming",
    label: "Sắp khởi hành",
    stamp: (b) => stampLabel(b.upcomingAt) || formatDate(b.date),
  },
  { key: "ongoing", label: "Chuyến đang diễn ra", stamp: (b) => stampLabel(b.startedAt) },
  { key: "completed", label: "Hoàn thành", stamp: (b) => stampLabel(b.completedAt) },
];

export function bookingSteps(booking) {
  const status = BOOKING_ORDER.includes(booking.status) ? booking.status : "pending";
  const currentIndex = FLOW_STEPS.findIndex((step) => step.key === status);

  return FLOW_STEPS.map((step, index) => {
    const stamp = step.stamp(booking);
    let state = "todo";
    let note = STEP_NOTE[step.key];

    if (index < currentIndex) {
      state = "done";
      note = stamp || "Đã hoàn tất";
    } else if (index === currentIndex) {
      state = "current";
      note = stamp || note || "Đang thực hiện";
    }

    /* Đơn đã thanh toán nhưng chưa có hướng dẫn viên vẫn dừng ở bước này */
    return { label: step.label, note, state };
  });
}

function stepsView(booking) {
  const list = bookingSteps(booking)
    .map(
      (step) => `
      <li class="track-step is-${step.state}">
        <span class="track-dot" aria-hidden="true"></span>
        <div class="track-body">
          <strong>${escapeHtml(step.label)}</strong>
          <small>${escapeHtml(step.note)}</small>
        </div>
      </li>`
    )
    .join("");

  return `<ol class="track-steps">${list}</ol>`;
}

/* Thẻ theo dõi một đơn: dùng chung cho trang "Đơn của tôi" và trang tài khoản */
export function bookingTracker(booking, { showActions = true } = {}) {
  const tour = getTourById(booking.tourId);
  const { adults, children, people } = passengerBreakdown(booking);
  const payment = booking.payment || "unpaid";
  const status = booking.status || "pending";
  const cancelled = isCancelledBooking(booking);
  const countdown = departureCountdown(booking);
  /* Tour đã ngừng bán: vẫn xem được nhưng không mở form đặt thêm */
  const bookable = tour && isSellableTour(tour);

  return `
  <li class="account-booking" data-code="${escapeHtml(booking.code)}">
    <div class="account-booking-head">
      <strong>${escapeHtml(booking.code)}</strong>
      <span class="account-booking-pills">
        <span class="status-pill status-${escapeHtml(status)}">${escapeHtml(
          BOOKING_STATUS[status] || status
        )}</span>
        ${
          payment === "paid"
            ? ""
            : `<span class="status-pill status-${escapeHtml(payment)}">${escapeHtml(
                PAYMENT_STATUS[payment] || payment
              )}</span>`
        }
      </span>
    </div>

    <a class="account-booking-tour" href="#/tour/${escapeHtml(booking.tourId)}">${escapeHtml(
      booking.tourName
    )}</a>

    <ul class="account-booking-meta">
      <li>Khởi hành: <strong>${formatDate(booking.date)}</strong></li>
      <li>Khách: <strong>${people} người</strong> (${escapeHtml(
        passengerLabel({ adults, children, people })
      )})</li>
      <li>Tổng tiền: <strong>${formatPrice(booking.total)}</strong></li>
      ${
        booking.guideName
          ? `<li>Hướng dẫn viên: <strong>${escapeHtml(booking.guideName)}</strong>${
              booking.guidePhone ? ` · <a href="tel:${escapeHtml(booking.guidePhone)}">${escapeHtml(booking.guidePhone)}</a>` : ""
            }</li>`
          : ""
      }
      ${countdown ? `<li class="account-countdown">${escapeHtml(countdown)}</li>` : ""}
    </ul>

    ${
      cancelled
        ? `<p class="account-note track-cancelled">Đơn đã được huỷ. Bạn có thể đặt lại bất cứ lúc nào.</p>`
        : stepsView(booking)
    }

    ${booking.note ? `<p class="account-note">Ghi chú của bạn: ${escapeHtml(booking.note)}</p>` : ""}

    ${
      showActions
        ? `<div class="account-booking-actions">
            ${
              bookable
                ? `<a class="btn btn-sm btn-outline" href="#/tour/${escapeHtml(tour.id)}">Xem tour</a>`
                : `<span class="account-note track-cancelled">Tour đã ngừng bán</span>`
            }
            <a class="btn btn-sm btn-ghost-soft" href="#/contact?tour=${escapeHtml(booking.tourId)}">Liên hệ hỗ trợ</a>
            ${
              status === "pending"
                ? `<button class="btn btn-sm btn-outline-danger" type="button" data-cancel-booking="${escapeHtml(booking.code)}">Huỷ đơn</button>`
                : ""
            }
          </div>`
        : ""
    }
  </li>`;
}