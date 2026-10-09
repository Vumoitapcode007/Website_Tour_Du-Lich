import { formatDate, formatPrice } from "../data.js";
import { getTourById } from "../tour-repository.js";
import {
  getBooking,
  getCoupon,
  getSettings,
  listBookings,
  listCoupons,
  myBookings,
  recordBookingPayment,
} from "../store.js";
import { getSession } from "../auth.js";
import { syncNotificationBadge } from "../components/notification-bell.js";
import { escapeHtml } from "../validate.js";
import { imgFallback } from "../components/tour-card.js";

// MoMo SVG Icon
export const momoLogoSvg = `
<svg class="momo-icon-svg" viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#A50064"/>
  <path d="M12.5 14C10.567 14 9 15.567 9 17.5V26.5C9 28.433 10.567 30 12.5 30C14.433 30 16 28.433 16 26.5V17.5C16 15.567 14.433 14 12.5 14ZM12.5 26.5C11.6716 26.5 11 25.8284 11 25V19C11 18.1716 11.6716 17.5 12.5 17.5C13.3284 17.5 14 18.1716 14 19V25C14 25.8284 13.3284 26.5 12.5 26.5Z" fill="#FFFFFF"/>
  <path d="M27.5 14C25.567 14 24 15.567 24 17.5V26.5C24 28.433 25.567 30 27.5 30C29.433 30 31 28.433 31 26.5V17.5C31 15.567 29.433 14 27.5 14ZM27.5 26.5C26.6716 26.5 26 25.8284 26 25V19C26 18.1716 26.6716 17.5 27.5 17.5C28.3284 17.5 29 18.1716 29 19V25C29 25.8284 28.3284 26.5 27.5 26.5Z" fill="#FFFFFF"/>
  <circle cx="20" cy="19.5" r="3.5" fill="#FFFFFF"/>
</svg>
`;

let timerInterval = null;
let appliedDiscount = 0;
let appliedCouponCode = "";

export function Payment(path, params = {}, query = new URLSearchParams()) {
  const code = (params.code || query.get("code") || query.get("booking") || "").trim().toUpperCase();
  const session = getSession();
  const settings = getSettings();
  appliedDiscount = 0;
  appliedCouponCode = "";

  if (!code) {
    return renderLookupView(session);
  }

  const booking = getBooking(code);
  if (!booking) {
    return renderNotFoundView(code, session);
  }

  if (booking.payment === "paid") {
    return renderReceiptView(booking);
  }

  return renderCheckoutView(booking, settings);
}

// 1. Màn hình Tra cứu đơn hàng khi chưa chọn mã đơn
function renderLookupView(session) {
  const userBookings = session ? myBookings(session) : [];
  const unpaidUserBookings = userBookings.filter((b) => b.payment !== "paid" && b.status !== "cancelled");
  const allBookings = listBookings();
  const sampleBookings = allBookings
    .filter((b) => b.payment !== "paid" && b.status !== "cancelled")
    .slice(0, 4);

  return `
  <section class="page-hero payment-hero">
    <div class="container center">
      <div class="momo-badge-hero">
        ${momoLogoSvg}
        <span>Cổng Thanh Toán Trực Tuyến MoMo</span>
      </div>
      <h1>Thanh toán đơn đặt tour</h1>
      <p>Nhập mã đơn hàng (bắt đầu bằng TG...) để tiến hành thanh toán an toàn qua Ví điện tử MoMo.</p>
    </div>
  </section>

  <section class="section container payment-lookup-wrap">
    <div class="payment-lookup-card">
      <form class="lookup-form" id="payment-search-form">
        <label for="lookup-code"><strong>Nhập mã đơn tour của bạn:</strong></label>
        <div class="lookup-input-group">
          <input type="text" id="lookup-code" name="code" placeholder="Ví dụ: TGDEMO01, TG..." autocomplete="off" required>
          <button type="submit" class="btn btn-momo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Tra cứu & Thanh toán
          </button>
        </div>
        <p class="error lookup-error" id="lookup-error"></p>
      </form>

      ${
        unpaidUserBookings.length > 0
          ? `
        <div class="lookup-my-bookings">
          <h3>Đơn tour của bạn chưa thanh toán:</h3>
          <div class="quick-order-list">
            ${unpaidUserBookings
              .map(
                (b) => `
              <div class="quick-order-item">
                <div class="quick-order-info">
                  <strong>${escapeHtml(b.code)}</strong> - ${escapeHtml(b.tourName)}
                  <small>${formatDate(b.date)} · ${b.people} khách · <strong>${formatPrice(b.total)}</strong></small>
                </div>
                <a href="#/payment?code=${escapeHtml(b.code)}" class="btn btn-sm btn-momo">Thanh toán MoMo</a>
              </div>`
              )
              .join("")}
          </div>
        </div>`
          : ""
      }

      <div class="lookup-samples">
        <span class="lookup-samples-label">⚡ Hoặc chọn nhanh đơn mẫu để kiểm tra thanh toán MoMo:</span>
        <div class="sample-pills">
          ${sampleBookings
            .map(
              (b) => `
            <a href="#/payment?code=${escapeHtml(b.code)}" class="sample-pill">
              <strong>${escapeHtml(b.code)}</strong> (${formatPrice(b.total)})
            </a>`
            )
            .join("")}
        </div>
      </div>
    </div>
  </section>`;
}

// 2. Không tìm thấy mã đơn
function renderNotFoundView(code, session) {
  return `
  <section class="page-hero payment-hero">
    <div class="container center">
      <div class="momo-badge-hero">
        ${momoLogoSvg}
        <span>Cổng Thanh Toán MoMo</span>
      </div>
      <h1>Không tìm thấy đơn hàng</h1>
      <p>Mã đơn <strong>${escapeHtml(code)}</strong> không tồn tại trong hệ thống.</p>
    </div>
  </section>

  <section class="section container center">
    <div class="payment-lookup-card not-found-card">
      <p>Vui lòng kiểm tra lại mã đơn trong tin nhắn/email hoặc chọn đơn từ tài khoản.</p>
      <div class="not-found-actions">
        <a href="#/payment" class="btn btn-momo">Tra cứu mã khác</a>
        <a href="#/account" class="btn btn-outline">Xem lịch sử đặt tour</a>
        <a href="#/booking" class="btn btn-light">Đặt tour mới</a>
      </div>
    </div>
  </section>`;
}

// 3. Màn hình thanh toán chính qua MoMo
function renderCheckoutView(booking, settings) {
  const tour = getTourById(booking.tourId);
  const momoPhone = settings.momoPhone || "0909 888 777";
  const momoHolder = settings.momoHolder || "TRAVELGO TOURIST VIETNAM";
  const cleanPhone = momoPhone.replace(/\s+/g, "");

  // Link QR code VietQR/MoMo
  const qrData = `2|99|${cleanPhone}|${momoHolder}||0|0|${booking.total}|${booking.code}|transfer_myqr`;
  const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrData)}`;
  const vietQrUrl = `https://img.vietqr.io/image/970422-${cleanPhone}-compact2.png?amount=${booking.total}&addInfo=${encodeURIComponent(booking.code)}&accountName=${encodeURIComponent(momoHolder)}`;

  return `
  <section class="payment-checkout-header">
    <div class="container">
      <div class="checkout-breadcrumbs">
        <a href="#/">Trang chủ</a> <span>/</span>
        <a href="#/booking">Đặt tour</a> <span>/</span>
        <strong>Thanh toán đơn ${escapeHtml(booking.code)}</strong>
      </div>

      <div class="stepper">
        <div class="step is-done">
          <div class="step-circle">✓</div>
          <div class="step-label">1. Đặt tour</div>
        </div>
        <div class="step-line is-done"></div>
        <div class="step is-active">
          <div class="step-circle">2</div>
          <div class="step-label">2. Thanh toán MoMo</div>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <div class="step-circle">3</div>
          <div class="step-label">3. Nhận vé xác nhận</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section container payment-layout">
    <!-- Cột trái: Cổng MoMo & QR Code -->
    <div class="payment-main-card">
      <div class="momo-card-header">
        <div class="momo-brand">
          ${momoLogoSvg}
          <div>
            <h2>Thanh toán an toàn qua Ví MoMo</h2>
            <p>Xác thực giao dịch tự động 24/7 · Không mất phí thanh toán</p>
          </div>
        </div>
        <div class="momo-secure-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          SSL 256-Bit
        </div>
      </div>

      <!-- Banner đếm ngược hạn thanh toán -->
      <div class="payment-timer-banner">
        <div class="timer-icon">⏳</div>
        <div class="timer-text">
          <span>Thời gian giữ vé & hiệu lực thanh toán:</span>
          <strong id="momo-countdown" class="timer-display">15:00</strong>
        </div>
        <span class="timer-note">Vui lòng hoàn tất trong thời gian này</span>
      </div>

      <!-- Tab chuyển đổi phương thức thanh toán -->
      <div class="payment-tabs">
        <button type="button" class="pay-tab active" data-tab="momo-qr">
          ${momoLogoSvg}
          <span>Quét mã QR MoMo (Nhanh nhất)</span>
        </button>
        <button type="button" class="pay-tab" data-tab="momo-bank">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <span>Chuyển khoản Ngân hàng (VietQR)</span>
        </button>
      </div>

      <!-- Panel 1: Quét mã MoMo QR -->
      <div class="tab-panel active" id="panel-momo-qr">
        <div class="momo-qr-grid">
          <div class="qr-col">
            <div class="qr-frame momo-border">
              <div class="qr-badge-top">
                <span class="qr-brand-tag">MoMo Pay</span>
              </div>
              <div class="qr-image-wrap">
                <img id="momo-qr-img" src="${vietQrUrl}" alt="Mã QR MoMo" onerror="this.onerror=null;this.src='${qrServerUrl}';">
                <div class="qr-center-logo">
                  ${momoLogoSvg}
                </div>
              </div>
              <div class="qr-pulse-scan">
                <span class="scan-dot"></span> Quét bằng App MoMo hoặc Ngân hàng
              </div>
            </div>
            <a href="momo://?action=pay&amount=${booking.total}" class="btn btn-momo-deep-link" target="_blank" rel="noopener">
              📱 Mở App MoMo trên điện thoại
            </a>
          </div>

          <div class="info-col">
            <h3 class="info-heading">Thông tin chuyển khoản MoMo</h3>
            <p class="info-guide">Mở App MoMo &gt; Chọn <strong>Quét Mã</strong> hoặc chuyển tiền đến số điện thoại dưới đây:</p>

            <div class="transfer-info-list">
              <div class="transfer-row">
                <span class="t-label">Số điện thoại MoMo:</span>
                <div class="t-value-group">
                  <strong class="t-value" id="val-phone">${escapeHtml(momoPhone)}</strong>
                  <button type="button" class="btn-copy" data-copy="${escapeHtml(cleanPhone)}" title="Sao chép">
                    Sao chép
                  </button>
                </div>
              </div>

              <div class="transfer-row">
                <span class="t-label">Người nhận MoMo:</span>
                <div class="t-value-group">
                  <strong class="t-value" id="val-holder">${escapeHtml(momoHolder)}</strong>
                  <button type="button" class="btn-copy" data-copy="${escapeHtml(momoHolder)}" title="Sao chép">
                    Sao chép
                  </button>
                </div>
              </div>

              <div class="transfer-row">
                <span class="t-label">Số tiền:</span>
                <div class="t-value-group">
                  <strong class="t-value t-price" id="val-amount">${formatPrice(booking.total)}</strong>
                  <button type="button" class="btn-copy" data-copy="${booking.total}" title="Sao chép">
                    Sao chép
                  </button>
                </div>
              </div>

              <div class="transfer-row highlight-row">
                <span class="t-label">Nội dung chuyển tiền:</span>
                <div class="t-value-group">
                  <strong class="t-value t-code" id="val-code">${escapeHtml(booking.code)}</strong>
                  <button type="button" class="btn-copy btn-copy-primary" data-copy="${escapeHtml(booking.code)}" title="Sao chép">
                    Sao chép mã
                  </button>
                </div>
              </div>
            </div>

            <div class="transfer-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span><strong>Lưu ý:</strong> Vui lòng giữ nguyên mã <code>${escapeHtml(booking.code)}</code> trong lời nhắn chuyển khoản để hệ thống xác nhận thanh toán tự động trong 3 giây.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 2: Chuyển khoản VietQR Ngân hàng -->
      <div class="tab-panel" id="panel-momo-bank">
        <div class="bank-info-box">
          <h3>Chuyển khoản qua Ngân hàng TMCP (VietQR 24/7)</h3>
          <p>Nếu bạn không sử dụng ví MoMo, có thể chuyển khoản trực tiếp qua ngân hàng:</p>

          <div class="transfer-info-list">
            <div class="transfer-row">
              <span class="t-label">Ngân hàng:</span>
              <strong class="t-value">${escapeHtml(settings.bankName || "Vietcombank")}</strong>
            </div>
            <div class="transfer-row">
              <span class="t-label">Số tài khoản:</span>
              <div class="t-value-group">
                <strong class="t-value">${escapeHtml(settings.bankAccount || "0123 4567 8901")}</strong>
                <button type="button" class="btn-copy" data-copy="${escapeHtml(settings.bankAccount || "012345678901")}">Sao chép</button>
              </div>
            </div>
            <div class="transfer-row">
              <span class="t-label">Chủ tài khoản:</span>
              <strong class="t-value">${escapeHtml(settings.bankHolder || "CÔNG TY DU LỊCH TRAVELGO")}</strong>
            </div>
            <div class="transfer-row highlight-row">
              <span class="t-label">Nội dung CK:</span>
              <div class="t-value-group">
                <strong class="t-value t-code">${escapeHtml(booking.code)}</strong>
                <button type="button" class="btn-copy btn-copy-primary" data-copy="${escapeHtml(booking.code)}">Sao chép mã</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Nút hành động thanh toán -->
      <div class="payment-actions-bar">
        <button type="button" class="btn btn-momo btn-lg" id="btn-verify-payment" data-code="${escapeHtml(booking.code)}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Xác nhận tôi đã chuyển tiền qua MoMo
        </button>

        <button type="button" class="btn btn-demo-pay" id="btn-demo-pay" data-code="${escapeHtml(booking.code)}">
          ⚡ Thử nghiệm: Giả lập MoMo thanh toán thành công (1-Click)
        </button>
      </div>

      <div class="payment-guarantee-row">
        <div class="guarantee-item">
          <span class="g-icon">🛡️</span>
          <span>Bảo vệ quyền lợi khách hàng 100%</span>
        </div>
        <div class="guarantee-item">
          <span class="g-icon">⚡</span>
          <span>Hệ thống gạch nợ tự động 24/7</span>
        </div>
        <div class="guarantee-item">
          <span class="g-icon">📞</span>
          <span>Hotline hỗ trợ: ${escapeHtml(settings.hotline || "1900 6868")}</span>
        </div>
      </div>
    </div>

    <!-- Cột phải: Tóm tắt đơn tour -->
    <aside class="payment-summary-aside">
      <div class="order-summary-card">
        <h3>Tóm tắt đơn tour</h3>

        ${
          tour
            ? `
          <div class="tour-mini-card">
            <img src="${tour.image}" alt="${escapeHtml(tour.name)}" onerror="${imgFallback}">
            <div class="tour-mini-info">
              <h4>${escapeHtml(tour.name)}</h4>
              <span class="tour-loc">📍 ${escapeHtml(tour.location)}</span>
              <span class="tour-duration">⏱️ ${escapeHtml(tour.time)}</span>
            </div>
          </div>`
            : `<h4>${escapeHtml(booking.tourName)}</h4>`
        }

        <div class="order-specs">
          <div class="spec-row">
            <span>Mã đơn hàng:</span>
            <strong class="code">${escapeHtml(booking.code)}</strong>
          </div>
          <div class="spec-row">
            <span>Khách hàng:</span>
            <strong>${escapeHtml(booking.name)}</strong>
          </div>
          <div class="spec-row">
            <span>Số điện thoại:</span>
            <strong>${escapeHtml(booking.phone)}</strong>
          </div>
          <div class="spec-row">
            <span>Khởi hành:</span>
            <strong>${formatDate(booking.date)}</strong>
          </div>
          <div class="spec-row">
            <span>Số lượng khách:</span>
            <strong>${booking.people} người</strong>
          </div>
        </div>

        <!-- Khung áp dụng Coupon -->
        <div class="coupon-box" id="coupon-section">
          <div class="coupon-input-group">
            <input type="text" id="coupon-code-input" placeholder="Mã giảm giá (VD: CHAOBAN10)" uppercase>
            <button type="button" class="btn btn-sm btn-outline" id="btn-apply-coupon">Áp dụng</button>
          </div>
          <p class="coupon-message" id="coupon-msg"></p>
        </div>

        <div class="price-breakdown">
          <div class="price-row">
            <span>Tạm tính:</span>
            <span id="price-subtotal">${formatPrice(booking.total)}</span>
          </div>
          <div class="price-row discount-row" id="row-discount" style="display:none">
            <span>Khuyến mại:</span>
            <strong class="text-success" id="price-discount">-0đ</strong>
          </div>
          <div class="price-row">
            <span>Phí thanh toán MoMo:</span>
            <span class="text-success">Miễn phí (0đ)</span>
          </div>
          <div class="price-total-row">
            <span>Tổng thanh toán:</span>
            <strong class="momo-total-price" id="price-final">${formatPrice(booking.total)}</strong>
          </div>
        </div>

        <div class="payment-policy-box">
          <small>
            ✓ Xác nhận giữ chỗ ngay sau khi thanh toán<br>
            ✓ Miễn phí hoàn huỷ theo chính sách trước 7 ngày<br>
            ✓ Cần hỗ trợ? Gọi hotline: <strong>${escapeHtml(settings.hotline || "1900 6868")}</strong>
          </small>
        </div>
      </div>
    </aside>
  </section>

  <!-- Modal xác thực thanh toán đang xử lý -->
  <div class="momo-modal-backdrop" id="momo-modal" style="display:none;">
    <div class="momo-modal-content">
      <div class="momo-spinner"></div>
      <h3 id="modal-title">Đang xác thực giao dịch MoMo...</h3>
      <p id="modal-desc">Vui lòng chờ trong giây lát trong khi chúng tôi kiểm tra giao dịch của đơn <strong>${escapeHtml(booking.code)}</strong> từ Ví MoMo.</p>
    </div>
  </div>`;
}

// 4. Màn hình Biên lai thanh toán thành công
function renderReceiptView(booking) {
  const tour = getTourById(booking.tourId);
  const paidTime = booking.paidAt ? new Date(booking.paidAt) : new Date();
  const formattedPaidTime = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(paidTime);

  return `
  <section class="page-hero receipt-hero">
    <div class="container center">
      <div class="success-badge-circle">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1>Thanh toán MoMo thành công!</h1>
      <p>Cảm ơn quý khách. Đơn đặt tour của bạn đã được xác nhận thanh toán trực tuyến qua Ví MoMo.</p>
    </div>
  </section>

  <section class="section container receipt-wrap">
    <div class="receipt-card" id="printable-receipt">
      <div class="receipt-header">
        <div class="receipt-brand">
          ${momoLogoSvg}
          <div>
            <h3>BIÊN LAI ĐIỆN TỬ MOMO</h3>
            <span class="text-muted">Cổng thanh toán TravelGo x MoMo Pay</span>
          </div>
        </div>
        <div class="receipt-status-pill">
          ✓ ĐÃ THANH TOÁN
        </div>
      </div>

      <div class="receipt-amount-banner">
        <span>Số tiền đã thanh toán</span>
        <strong class="receipt-amount">${formatPrice(booking.total)}</strong>
        <small class="receipt-time">Thời gian: ${formattedPaidTime}</small>
      </div>

      <div class="receipt-grid">
        <div class="receipt-col">
          <h4>Thông tin giao dịch</h4>
          <ul class="receipt-details">
            <li><span>Mã giao dịch MoMo:</span><strong>${escapeHtml(booking.paymentTransId || `MM${Date.now().toString().slice(-8)}`)}</strong></li>
            <li><span>Phương thức:</span><strong>Ví điện tử MoMo (Online)</strong></li>
            <li><span>Mã đơn đặt tour:</span><strong class="code">${escapeHtml(booking.code)}</strong></li>
            <li><span>Trạng thái đơn:</span><span class="status-pill status-confirmed">Đã xác nhận</span></li>
          </ul>
        </div>

        <div class="receipt-col">
          <h4>Thông tin khách hàng</h4>
          <ul class="receipt-details">
            <li><span>Họ và tên:</span><strong>${escapeHtml(booking.name)}</strong></li>
            <li><span>Số điện thoại:</span><strong>${escapeHtml(booking.phone)}</strong></li>
            <li><span>Email:</span><strong>${escapeHtml(booking.email || "Chưa cung cấp")}</strong></li>
          </ul>
        </div>
      </div>

      <div class="receipt-tour-box">
        <h4>Chi tiết chuyến đi</h4>
        <div class="receipt-tour-info">
          <strong>${escapeHtml(booking.tourName)}</strong>
          <span>Khởi hành: <strong>${formatDate(booking.date)}</strong></span>
          <span>Số khách: <strong>${booking.people} người</strong></span>
          ${tour ? `<span>Thời lượng: <strong>${escapeHtml(tour.time)}</strong></span>` : ""}
        </div>
      </div>

      <div class="receipt-notice">
        <p>✓ Hướng dẫn viên và chuyên viên chăm sóc sẽ liên hệ trước ngày khởi hành để gửi lịch trình chi tiết và thông tin xe đón.</p>
        <p>✓ Mọi thắc mắc vui lòng liên hệ hotline 24/7: <strong>1900 6868</strong></p>
      </div>

      <div class="receipt-actions no-print">
        <button type="button" class="btn btn-outline" id="btn-print-receipt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          In biên lai / Lưu PDF
        </button>
        <a href="#/account" class="btn btn-primary">Xem trong Tài khoản</a>
        <a href="#/tours" class="btn btn-light">Khám phá tour khác</a>
      </div>
    </div>
  </section>`;
}

// Thiết lập đồng hồ đếm ngược 15 phút
function startCountdown(totalSeconds = 900) {
  if (timerInterval) clearInterval(timerInterval);
  const display = document.getElementById("momo-countdown");
  if (!display) return;

  let remaining = totalSeconds;
  timerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      display.textContent = "00:00 (Hết hạn)";
      display.classList.add("text-danger");
      return;
    }
    const mins = Math.floor(remaining / 60).toString().padStart(2, "0");
    const secs = (remaining % 60).toString().padStart(2, "0");
    display.textContent = `${mins}:${secs}`;
    if (remaining < 180) {
      display.classList.add("timer-urgent");
    }
  }, 1000);
}

// Thực hiện xác thực & hoàn tất thanh toán
function processPayment(code, isDemo = false) {
  const modal = document.getElementById("momo-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  if (modal) modal.style.display = "flex";

  const transId = `MM${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

  setTimeout(() => {
    if (modalTitle) modalTitle.textContent = "MoMo xác nhận thanh toán thành công!";
    if (modalDesc) modalDesc.textContent = `Mã giao dịch MoMo: ${transId}. Đang tạo biên lai...`;

    setTimeout(() => {
      recordBookingPayment(code, {
        method: "momo",
        transId,
      });
      syncNotificationBadge();
      if (timerInterval) clearInterval(timerInterval);
      window.location.hash = `#/payment?code=${encodeURIComponent(code)}`;
    }, 1000);
  }, isDemo ? 600 : 1800);
}

// Lắng nghe sự kiện route thay đổi để gắn tương tác cho trang thanh toán
document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "payment" && !detail.path.startsWith("payment/")) {
    if (timerInterval) clearInterval(timerInterval);
    return;
  }

  // 1. Đồng hồ đếm ngược
  startCountdown(900);

  // 2. Chuyển Tab phương thức (QR vs Ngân hàng)
  const tabs = document.querySelectorAll(".pay-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      document.getElementById(`panel-${target}`)?.classList.add("active");
    });
  });

  // 3. Nút sao chép nội dung
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.copy;
      if (!text) return;
      navigator.clipboard?.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = "✓ Đã chép";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("copied");
        }, 2000);
      });
    });
  });

  // 4. Form tra cứu mã đơn
  const searchForm = document.getElementById("payment-search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("lookup-code");
      const code = (input?.value || "").trim().toUpperCase();
      if (code) {
        window.location.hash = `#/payment?code=${encodeURIComponent(code)}`;
      }
    });
  }

  // 5. Nút Xác nhận đã chuyển tiền MoMo
  const verifyBtn = document.getElementById("btn-verify-payment");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", () => {
      const code = verifyBtn.dataset.code;
      processPayment(code, false);
    });
  }

  // 6. Nút Demo thanh toán 1-click
  const demoBtn = document.getElementById("btn-demo-pay");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      const code = demoBtn.dataset.code;
      processPayment(code, true);
    });
  }

  // 7. Nút In biên lai
  const printBtn = document.getElementById("btn-print-receipt");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // 8. Xử lý mã giảm giá Coupon
  const couponBtn = document.getElementById("btn-apply-coupon");
  const couponInput = document.getElementById("coupon-code-input");
  const couponMsg = document.getElementById("coupon-msg");
  if (couponBtn && couponInput) {
    couponBtn.addEventListener("click", () => {
      const inputCode = couponInput.value.trim().toUpperCase();
      if (!inputCode) {
        if (couponMsg) {
          couponMsg.className = "coupon-message text-danger";
          couponMsg.textContent = "Vui lòng nhập mã giảm giá.";
        }
        return;
      }
      const coupons = listCoupons();
      const matched = coupons.find((c) => c.code.toUpperCase() === inputCode && c.active);
      if (!matched) {
        if (couponMsg) {
          couponMsg.className = "coupon-message text-danger";
          couponMsg.textContent = "Mã giảm giá không hợp lệ hoặc đã hết hạn.";
        }
        return;
      }

      const totalEl = document.getElementById("val-amount");
      const finalPriceEl = document.getElementById("price-final");
      const discountRow = document.getElementById("row-discount");
      const discountEl = document.getElementById("price-discount");
      const bookingCode = verifyBtn?.dataset.code;
      const b = bookingCode ? getBooking(bookingCode) : null;
      if (!b) return;

      let discount = 0;
      if (matched.type === "percent") {
        discount = Math.round((b.total * matched.value) / 100);
        if (matched.maxDiscount) discount = Math.min(discount, matched.maxDiscount);
      } else {
        discount = matched.value;
      }

      appliedDiscount = discount;
      const newTotal = Math.max(b.total - discount, 0);

      if (discountRow) discountRow.style.display = "flex";
      if (discountEl) discountEl.textContent = `-${formatPrice(discount)}`;
      if (finalPriceEl) finalPriceEl.textContent = formatPrice(newTotal);
      if (totalEl) totalEl.textContent = formatPrice(newTotal);
      if (couponMsg) {
        couponMsg.className = "coupon-message text-success";
        couponMsg.textContent = `✓ Đã áp dụng mã "${matched.code}": Giảm ${formatPrice(discount)}!`;
      }
      couponBtn.disabled = true;
      couponInput.disabled = true;
    });
  }
});
