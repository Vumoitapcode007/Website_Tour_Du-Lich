import {
  BOOKING_STATUS,
  BOOKING_ORDER,
  PAYMENT_STATUS,
  isCancelledBooking,
  isPayToGuide,
  bookingCashDue,
} from "../store.js";
import { formatDate, formatPrice } from "../data.js";
import { getTourById, isSellableTour, TOUR_PROGRESS_STAGES } from "../tour-repository.js";
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

/**
 * Tạo danh sách 5 bước cho thanh trạng thái ngang (Horizontal Stepper)
 * 1. Gửi đơn -> 2. Xác nhận chỗ -> 3. Chuẩn bị đi -> 4. Đang đi tour -> 5. Hoàn thành
 */
export function horizontalSteps(booking) {
  const status = booking.status || "pending";
  const isPaid = booking.payment === "paid";
  const isCancelled = isCancelledBooking(booking);

  // Nhận diện kiểu thanh toán: Khách chọn trả tiền mặt cho HDV hay có tiền mặt đã thu
  const isCashType =
    isPayToGuide(booking) ||
    booking.paymentMethod === "cash" ||
    booking.paymentMethod === "direct" ||
    (booking.cashCollected || 0) > 0;

  // Bước 1: Gửi yêu cầu
  const step1 = {
    id: 1,
    icon: "📝",
    title: "Gửi đơn",
    sub: createdAtLabel(booking.createdAt) || "Đã tiếp nhận",
    state: isCancelled ? (status === "pending" ? "cancelled" : "done") : "done",
  };

  // Bước 2: Xác nhận giữ chỗ (Phân biệt rõ Đã thanh toán, Tiền mặt và Chờ thanh toán)
  let step2Title = "Xác nhận chỗ";
  let step2Sub = "Chờ nhà tour duyệt";
  let step2State = "todo";

  if (isCancelled && status === "pending") {
    step2State = "todo";
  } else if (isCancelled) {
    step2State = "cancelled";
    step2Title = "Đã huỷ đơn";
    step2Sub = booking.cancelledAt ? createdAtLabel(booking.cancelledAt) : "Đã dừng xử lý";
  } else if (status === "pending") {
    step2State = "current";
    step2Sub = booking.bookingType === "group" ? "Chờ duyệt chỗ & giá đoàn" : "Chuyên viên đang gọi";
  } else {
    // Đã được xác nhận (confirmed, awaiting_payment, paid, upcoming, ongoing, completed)
    if (isPaid) {
      step2State = "done";
      step2Title = "Đã thanh toán";
      step2Sub = booking.paidAt ? createdAtLabel(booking.paidAt) : "Đã thanh toán online";
    } else if (isCashType) {
      step2State = "done";
      step2Title = "Đã giữ chỗ";
      step2Sub = "Tiền mặt khi đón xe";
    } else {
      step2State = "current";
      step2Title = "Chờ thanh toán";
      step2Sub = "Cần chuyển khoản / MoMo";
    }
  }

  const step2 = {
    id: 2,
    icon: isPaid ? "💳" : isCashType ? "📋" : "⏳",
    title: step2Title,
    sub: step2Sub,
    state: step2State,
  };

  // Bước 3: Chuẩn bị khởi hành
  let step3State = "todo";
  let step3Sub = departureCountdown(booking) || "Chuẩn bị hành lý";

  if (!isCancelled) {
    if (status === "upcoming" || (status === "confirmed" && booking.guideName)) {
      // Chỉ thành bước đang diễn ra nếu đã thanh toán hoặc là trả tiền mặt
      step3State = (isPaid || isCashType) ? "current" : "todo";
      step3Sub = booking.guideName ? `HDV: ${booking.guideName}` : step3Sub;
    } else if (["ongoing", "completed"].includes(status)) {
      step3State = "done";
      step3Sub = "Đã tập trung lên xe";
    }
  }

  const step3 = {
    id: 3,
    icon: "🎒",
    title: "Chuẩn bị đi",
    sub: step3Sub,
    state: isCancelled ? "todo" : step3State,
  };

  // Bước 4: Đang đi tour
  let step4State = "todo";
  let step4Sub = "Đang trên hành trình";

  if (!isCancelled) {
    if (status === "ongoing") {
      step4State = "current";
      step4Sub = "Đang diễn ra";
    } else if (status === "completed") {
      step4State = "done";
      step4Sub = "Đã hoàn thành tour";
    }
  }

  const step4 = {
    id: 4,
    icon: "🚌",
    title: "Đang đi tour",
    sub: step4Sub,
    state: isCancelled ? "todo" : step4State,
  };

  // Bước 5: Hoàn tất chuyến đi
  let step5State = "todo";
  let step5Sub = "Kết thúc & Đánh giá";

  if (!isCancelled && status === "completed") {
    step5State = "done";
    step5Sub = "Hoàn tất an toàn";
  }

  const step5 = {
    id: 5,
    icon: "⭐",
    title: "Hoàn tất",
    sub: step5Sub,
    state: isCancelled ? "todo" : step5State,
  };

  return [step1, step2, step3, step4, step5];
}

/**
 * Render thanh trạng thái dạng ngang (Horizontal Stepper Bar)
 */
function horizontalStepperView(booking) {
  const steps = horizontalSteps(booking);
  const isCancelled = isCancelledBooking(booking);

  const stepsHtml = steps
    .map((step, idx) => {
      const isDone = step.state === "done";
      const isCurrent = step.state === "current";
      const isCancelledStep = step.state === "cancelled";

      return `
      <div class="stepper-step is-${step.state}">
        <div class="stepper-circle" aria-label="${escapeHtml(step.title)}">
          ${isDone ? "✓" : isCancelledStep ? "✕" : step.icon}
        </div>
        <div class="stepper-content">
          <strong class="stepper-title">${escapeHtml(step.title)}</strong>
          <span class="stepper-sub">${escapeHtml(step.sub)}</span>
        </div>
        ${idx < steps.length - 1 ? `<div class="stepper-line ${isDone ? "is-filled" : ""}"></div>` : ""}
      </div>`;
    })
    .join("");

  return `
    <div class="stepper-track-wrap ${isCancelled ? "is-cancelled" : ""}">
      <div class="stepper-track">${stepsHtml}</div>
    </div>`;
}

/**
 * Render Khung thông tin ngữ cảnh thông minh (Contextual Information Card)
 * Tách biệt rõ ràng cho 2 kiểu người dùng:
 * 1. Kiểu Online (đã thanh toán hoặc chuyển khoản QR)
 * 2. Kiểu Tiền mặt (trả trực tiếp cho HDV trước giờ di chuyển)
 */
function contextualInfoView(booking, tour) {
  const isPaid = booking.payment === "paid";
  const status = booking.status || "pending";
  const isCancelled = isCancelledBooking(booking);
  const collected = booking.cashCollected || 0;
  const remain = Math.max(0, booking.total - collected);

  // Nếu đơn đã huỷ
  if (isCancelled) {
    return `
    <div class="tracker-context-card is-cancelled">
      <div class="tracker-context-icon">❌</div>
      <div class="tracker-context-content">
        <div class="tracker-context-head">
          <strong>Đơn đặt tour đã được huỷ</strong>
          <span class="status-pill status-cancelled">Đã huỷ</span>
        </div>
        <p>Thời gian huỷ: <strong>${booking.cancelledAt ? createdAtLabel(booking.cancelledAt) : "Đã huỷ"}</strong> ${booking.cancelledBy ? `· Bởi: ${escapeHtml(booking.cancelledBy)}` : ""}</p>
        <small>${booking.cancelReason ? `Lý do: "${escapeHtml(booking.cancelReason)}"` : "Nếu cần hỗ trợ lại chuyến đi hoặc đặt tour mới, vui lòng liên hệ hotline 1900 6868."}</small>
      </div>
    </div>`;
  }

  // Nếu tour đang diễn ra (ongoing) -> Ưu tiên đưa tiến độ realtime lên đầu
  if (status === "ongoing" && tour?.progress && tour.progress.stage !== "not_started") {
    const p = tour.progress;
    const stageInfo = TOUR_PROGRESS_STAGES[p.stage] || { icon: "🚩", label: p.stage };

    return `
    <div class="tracker-context-card is-ongoing">
      <div class="tracker-context-icon">${stageInfo.icon || "📍"}</div>
      <div class="tracker-context-content">
        <div class="tracker-context-head">
          <strong>Tiến độ hành trình: ${escapeHtml(stageInfo.label)}</strong>
          <span class="status-pill status-ongoing">🔥 Tour đang diễn ra</span>
        </div>
        <p>Vị trí hiện tại: <strong>${escapeHtml(p.currentLocation || tour.location || "Đang trên hành trình")}</strong>${p.currentDay ? ` (Ngày ${p.currentDay}/${tour.days || 1})` : ""}</p>
        ${p.note ? `<small class="tracker-guide-msg">💬 Dặn dò từ HDV: <em>"${escapeHtml(p.note)}"</em></small>` : ""}
      </div>
      <div class="tracker-context-actions">
        <a class="btn btn-sm btn-primary" href="#/ticket/${escapeHtml(booking.code)}?mode=boarding">
          🎫 Vé & Mã QR
        </a>
      </div>
    </div>`;
  }

  // KIỂU 1: ĐÃ THANH TOÁN ONLINE THÀNH CÔNG
  if (isPaid) {
    return `
    <div class="tracker-context-card is-paid">
      <div class="tracker-context-icon">✅</div>
      <div class="tracker-context-content">
        <div class="tracker-context-head">
          <strong>Đã thanh toán trực tuyến thành công</strong>
          <span class="status-pill status-paid">✓ Đã thanh toán</span>
        </div>
        <p>Tổng tiền: <strong>${formatPrice(booking.total)}</strong> (${booking.paymentMethod === "bank" ? "VietQR Ngân hàng" : "Ví MoMo"})</p>
        <small>Vé điện tử của quý khách đã kích hoạt sẵn sàng. Vui lòng có mặt tại điểm hẹn trước 30 phút để lên xe.</small>
      </div>
      <div class="tracker-context-actions">
        <a class="btn btn-sm btn-primary" href="#/ticket/${escapeHtml(booking.code)}?mode=boarding">
          🎫 Mở vé điện tử lên xe
        </a>
      </div>
    </div>`;
  }

  // KIỂU 2: THANH TOÁN TIỀN MẶT TRỰC TIẾP CHO HDV (Khách chọn trả cho HDV hoặc đã thu một phần)
  if (isPayToGuide(booking) || collected > 0) {
    return `
    <div class="tracker-context-card is-cash">
      <div class="tracker-context-icon">💵</div>
      <div class="tracker-context-content">
        <div class="tracker-context-head">
          <strong>Hình thức thanh toán: Tiền mặt trực tiếp cho Hướng dẫn viên</strong>
          <span class="status-pill status-awaiting_payment">Thu tại điểm đón xe</span>
        </div>
        <p>Số tiền cần chuẩn bị: <strong class="text-danger" style="font-size: 1.05rem;">${formatPrice(remain)}</strong> ${collected > 0 ? `<span class="text-success">(Đã nộp trước: ${formatPrice(collected)})</span>` : ""}</p>
        <small>
          Hướng dẫn viên <strong>${escapeHtml(booking.guideName || "phụ trách")}</strong>
          ${booking.guidePhone ? `(SĐT: <a href="tel:${escapeHtml(booking.guidePhone)}">${escapeHtml(booking.guidePhone)}</a>)` : ""}
          sẽ đón đoàn, điểm danh và trực tiếp thu tiền mặt trước khi xe xuất phát.
        </small>
      </div>
      <div class="tracker-context-actions">
        <a class="btn btn-sm btn-outline" href="#/ticket/${escapeHtml(booking.code)}?mode=payment">
          📄 Quét VietQR (Nếu muốn CK trước)
        </a>
        <a class="btn btn-sm btn-primary" href="#/ticket/${escapeHtml(booking.code)}?mode=boarding">
          🎫 Xem thông tin xe đón
        </a>
      </div>
    </div>`;
  }

  // KIỂU 3: ĐƠN THEO ĐOÀN ĐANG CHỜ DUYỆT CHỖ VÀ GIÁ
  if (booking.bookingType === "group" && status === "pending") {
    return `
    <div class="tracker-context-card is-group-pending" style="background:#eef2ff; border-left:4px solid #4f46e5;">
      <div class="tracker-context-icon">👥</div>
      <div class="tracker-context-content">
        <div class="tracker-context-head">
          <strong>Yêu cầu đặt tour theo đoàn đang chờ duyệt</strong>
          <span class="status-pill status-pending">Chờ xác nhận</span>
        </div>
        <p>Quy mô đoàn: <strong>${booking.people} khách</strong>${booking.groupName ? ` · Tổ chức: <strong>${escapeHtml(booking.groupName)}</strong>` : ""} · Tạm tính: <strong>${formatPrice(booking.total)}</strong></p>
        <small>Chuyên viên tư vấn đoàn TravelGo đang kiểm tra số lượng chỗ và sẽ liên hệ trực tiếp với người đại diện (<strong>${escapeHtml(booking.phone)}</strong>) để tư vấn lịch trình và áp dụng chính sách giá đoàn ưu đãi trước khi thanh toán.</small>
      </div>
    </div>`;
  }

  // KIỂU 4: ĐƠN ĐÃ ĐƯỢC DUYỆT NHƯNG CHƯA THANH TOÁN (Trực tuyến qua MoMo / VietQR)
  if (status !== "pending") {
    return `
    <div class="tracker-context-card is-unpaid" style="background:#fffbeb; border-left:4px solid #f59e0b;">
      <div class="tracker-context-icon">💳</div>
      <div class="tracker-context-content">
        <div class="tracker-context-head">
          <strong>Đơn hàng đang chờ thanh toán</strong>
          <span class="status-pill status-awaiting_payment" style="background:#fef3c7; color:#b45309; font-weight:700;">Chưa thanh toán</span>
        </div>
        <p>Tổng tiền cần thanh toán: <strong class="text-danger" style="font-size: 1.05rem;">${formatPrice(booking.total)}</strong></p>
        <small>Đơn hàng đã được TravelGo xác nhận. Quý khách vui lòng thanh toán trực tuyến qua Ví MoMo hoặc Chuyển khoản VietQR để nhận vé điện tử lên xe.</small>
      </div>
      <div class="tracker-context-actions">
        <a class="btn btn-sm btn-outline" href="#/ticket/${escapeHtml(booking.code)}?mode=payment">
          📄 Xem mã QR VietQR
        </a>
        <a class="btn btn-sm btn-momo" href="#/payment?code=${escapeHtml(booking.code)}">
          Thanh toán MoMo
        </a>
      </div>
    </div>`;
  }

  // KIỂU 5: ĐƠN CHỜ XỬ LÝ (PENDING) CÁ NHÂN
  return `
  <div class="tracker-context-card is-pending">
    <div class="tracker-context-icon">⏳</div>
    <div class="tracker-context-content">
      <div class="tracker-context-head">
        <strong>Yêu cầu đặt tour đang được xử lý</strong>
        <span class="status-pill status-pending">Chờ xác nhận</span>
      </div>
      <p>Tổng tiền dự tính: <strong>${formatPrice(booking.total)}</strong> (${booking.people} khách)</p>
      <small>Chuyên viên TravelGo đang kiểm tra số lượng chỗ trống và sẽ gọi điện cho quý khách trong vòng 30 phút để chốt giữ chỗ.</small>
    </div>
  </div>`;
}

/**
 * Thẻ theo dõi một đơn: dùng chung cho trang "Đơn của tôi" và trang tài khoản
 */
export function bookingTracker(booking, { showActions = true } = {}) {
  const tour = getTourById(booking.tourId);
  const { adults, children, people } = passengerBreakdown(booking);
  const payment = booking.payment || "unpaid";
  const status = booking.status || "pending";
  const cancelled = isCancelledBooking(booking);
  const countdown = departureCountdown(booking);
  /* Khách chọn trả trực tiếp cho HDV trước giờ khởi hành */
  const payGuide = isPayToGuide(booking);
  const cashDue = bookingCashDue(booking);
  /* Tour đã ngừng bán: vẫn xem được nhưng không mở form đặt thêm */
  const bookable = tour && isSellableTour(tour);

  return `
  <li class="account-booking" data-code="${escapeHtml(booking.code)}">
    <div class="account-booking-head">
      <div class="account-booking-pnr-box">
        <span class="pnr-badge">MÃ ĐƠN</span>
        <strong>${escapeHtml(booking.code)}</strong>
      </div>
      <span class="account-booking-pills">
        ${
          booking.bookingType === "group"
            ? `<span class="status-pill status-group" style="background:#ede9fe;color:#5b21b6;font-weight:700;">👥 Đặt theo đoàn</span>`
            : ""
        }
        <span class="status-pill status-${escapeHtml(status)}">${escapeHtml(
          BOOKING_STATUS[status] || status
        )}</span>
        ${
          status === "paid" && payment === "paid"
            ? ""
            : `<span class="status-pill status-${escapeHtml(payment)}">${escapeHtml(
                PAYMENT_STATUS[payment] || (payment === "paid" ? "Đã thanh toán" : "Thu tiền mặt khi đón")
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
      )})${
        booking.bookingType === "group"
          ? ` <strong style="color:#5b21b6;">[Đoàn${booking.groupName ? `: ${escapeHtml(booking.groupName)}` : ""}]</strong>`
          : ""
      }</li>
      <li>Tổng chi phí: <strong>${formatPrice(booking.total)}</strong>${booking.bookingType === "group" && status === "pending" ? " <small style='color:var(--muted);'>(Tạm tính)</small>" : ""}</li>
      ${
        booking.guideName
          ? `<li>Hướng dẫn viên: <strong>${escapeHtml(booking.guideName)}</strong>${
              booking.guidePhone ? ` · <a href="tel:${escapeHtml(booking.guidePhone)}">${escapeHtml(booking.guidePhone)}</a>` : ""
            }</li>`
          : ""
      }
      ${
        payGuide && !cancelled && payment !== "paid"
          ? `<li class="account-countdown">Còn phải trả cho HDV trước khởi hành: <strong>${formatPrice(
              cashDue
            )}</strong></li>`
          : ""
      }
      ${countdown ? `<li class="account-countdown">${escapeHtml(countdown)}</li>` : ""}
    </ul>

    ${
      payGuide && !cancelled && payment !== "paid"
        ? `<p class="account-note">Bạn chọn thanh toán trực tiếp cho hướng dẫn viên${booking.guideName ? ` ${escapeHtml(booking.guideName)}` : ""} tại điểm tập trung trước giờ khởi hành. Vé lên xe được kích hoạt sau khi đã thu đủ tiền.</p>`
        : ""
    }

    <!-- Thanh tiến trình ngang 5 bước hiện đại -->
    ${horizontalStepperView(booking)}

    <!-- Khung thông tin ngữ cảnh cho từng kiểu khách (Online vs Tiền mặt) -->
    ${contextualInfoView(booking, tour)}

    ${booking.note ? `<p class="account-note">Ghi chú của bạn: ${escapeHtml(booking.note)}</p>` : ""}

    ${
      showActions
          ? `<div class="account-booking-actions">
            ${
              payment === "paid"
                ? `<a class="btn btn-sm btn-primary" href="#/ticket/${escapeHtml(booking.code)}">🎫 Vé điện tử lên xe</a>`
                : !cancelled
                  ? booking.bookingType === "group" && status === "pending"
                    ? `<span class="soft-chip" style="color:#5b21b6;background:#ede9fe;font-weight:600;padding:5px 10px;border-radius:6px;">⏳ Chờ chuyên viên duyệt số chỗ & giá</span>`
                    : payGuide
                    ? `<a class="btn btn-sm btn-primary" href="#/ticket/${escapeHtml(booking.code)}">📄 Vé giữ chỗ (Trả cho HDV)</a>
                       <a class="btn btn-sm btn-outline" href="#/payment?code=${escapeHtml(booking.code)}">Chuyển sang thanh toán online</a>`
                    : `<a class="btn btn-sm btn-primary" href="#/ticket/${escapeHtml(booking.code)}?mode=payment">📄 Vé thanh toán QR</a>
                       <a class="btn btn-sm btn-momo" href="#/payment?code=${escapeHtml(booking.code)}">Cổng MoMo</a>`
                  : ""
            }
            ${
              bookable
                ? `<a class="btn btn-sm btn-ghost-soft" href="#/tour/${escapeHtml(tour.id)}">Xem tour</a>`
                : `<span class="account-note track-cancelled">Tour đã ngừng bán</span>`
            }
            <a class="btn btn-sm btn-ghost-soft" href="#/contact?tour=${escapeHtml(booking.tourId)}">Hỗ trợ khẩn cấp</a>
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
