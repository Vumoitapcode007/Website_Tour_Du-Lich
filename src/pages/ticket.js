import { getBooking, getSettings, recordBookingPayment, isPayToGuide, bookingCashDue, PAYMENT_METHOD } from "../store.js";
import { getTourById } from "../tour-repository.js";
import { formatDate, formatPrice } from "../data.js";
import { escapeHtml } from "../validate.js";
import { passengerBreakdown, passengerLabel } from "../booking-rules.js";
import { syncNotificationBadge } from "../components/notification-bell.js";

export function Ticket(path, params = {}, query = new URLSearchParams()) {
  const code = (params.code || query.get("code") || "").trim().toUpperCase();
  const settings = getSettings();

  if (!code) {
    return `
    <section class="page-hero">
      <div class="container center">
        <h1>Tra cứu vé điện tử</h1>
        <p>Vui lòng cung cấp mã đơn tour hợp lệ để xem vé điện tử.</p>
        <a class="btn btn-primary" href="#/my-bookings">Quay lại danh sách đơn</a>
      </div>
    </section>`;
  }

  const booking = getBooking(code);
  if (!booking) {
    return `
    <section class="page-hero">
      <div class="container center">
        <h1>Không tìm thấy vé</h1>
        <p>Không có đơn tour nào khớp với mã <strong>${escapeHtml(code)}</strong>.</p>
        <a class="btn btn-primary" href="#/my-bookings">Danh sách đơn của tôi</a>
      </div>
    </section>`;
  }

  const isPaid = booking.payment === "paid";
  const cancelled = booking.status === "cancelled";
  /* Đơn khách chọn trả trực tiếp cho HDV - chưa thanh toán thì hiển thị vé giữ chỗ,
     không hiện mã QR chuyển khoản để tránh nhầm lẫn với thanh toán trực tuyến */
  const cashIntent = isPayToGuide(booking);
  const payToGuide = cashIntent && !isPaid;
  const cashDue = bookingCashDue(booking);
  const cashCollected = Number(booking.cashCollected) || 0;
  // Nếu chưa thanh toán, mặc định hiển thị Vé thanh toán trực tiếp (QR chuyển tiền)
  const mode = query.get("mode") || (isPaid ? "boarding" : "payment");
  const isPaymentMode = mode === "payment";
  /* Vé lên xe chỉ phát hành khi đã thanh toán đủ - chưa đủ tiền chỉ xem được vé giữ chỗ */
  const boardingLocked = !isPaymentMode && !isPaid;

  const tour = getTourById(booking.tourId);
  const { adults, children, people } = passengerBreakdown(booking);
  const paidTime = booking.paidAt ? new Date(booking.paidAt) : new Date(booking.createdAt || Date.now());
  const formattedPaidTime = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(paidTime);

  // Thông tin ngân hàng & QR Chuyển tiền đúng mệnh giá
  const cleanAccount = String(settings.bankAccount || "012345678901").replace(/\s+/g, "");
  const bankHolder = settings.bankHolder || "CÔNG TY DU LỊCH TRAVELGO";
  const bankName = settings.bankName || "Vietcombank";

  // Link VietQR động tích hợp đúng mệnh giá booking.total và nội dung booking.code
  const vietQrUrl = `https://img.vietqr.io/image/970436-${cleanAccount}-compact2.png?amount=${booking.total}&addInfo=${encodeURIComponent(booking.code)}&accountName=${encodeURIComponent(bankHolder)}`;

  // Link MoMo fallback
  const momoPhone = String(settings.momoPhone || "0909888777").replace(/\s+/g, "");
  const momoQrData = `2|99|${momoPhone}|${settings.momoHolder || "TRAVELGO"}||0|0|${booking.total}|${booking.code}|transfer_myqr`;
  const momoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(momoQrData)}`;

  // Link QR Check-in lên xe
  const checkinQrData = `TRAVELGO|ETICKET|${booking.code}|${booking.name}|${booking.phone}|${booking.date}|${booking.total}`;
  const checkinQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkinQrData)}`;

  return `
  <section class="ticket-page-wrap">
    <div class="container ticket-container">
      <div class="ticket-top-bar no-print">
        <a href="#/my-bookings" class="btn btn-ghost-soft">
          ← Quay lại đơn hàng
        </a>

        <!-- Thanh chuyển đổi loại vé -->
        <div class="ticket-type-tabs">
          <a href="#/ticket/${escapeHtml(booking.code)}?mode=payment" class="ticket-type-tab ${isPaymentMode ? "active" : ""}">
            ${payToGuide ? "💵 Vé giữ chỗ - Thanh toán cho HDV" : "📄 Vé thanh toán trực tiếp (Mã QR)"}
          </a>
          <a href="#/ticket/${escapeHtml(booking.code)}?mode=boarding" class="ticket-type-tab ${!isPaymentMode ? "active" : ""}">
            🎫 Vé điện tử lên xe (Check-in)
          </a>
        </div>

        <div class="ticket-top-actions">
          <button type="button" class="btn btn-outline" id="btn-email-ticket" data-email="${escapeHtml(booking.email || "")}" data-code="${escapeHtml(booking.code)}">
            ✉️ Gửi vé về Email
          </button>
          <button type="button" class="btn btn-primary" id="btn-print-eticket">
            🖨️ In vé / Lưu file PDF
          </button>
        </div>
      </div>

      <!-- Khung Vé Chuẩn Boarding / Payment Pass -->
      <div class="eticket-card" id="printable-eticket">
        <div class="eticket-header ${isPaymentMode ? "is-payment-mode" : ""}">
          <div class="eticket-brand">
            <svg viewBox="0 0 48 45" class="logo-mark" width="36" height="34" aria-hidden="true">
              <path fill="#1677ff" d="M24 44 2 22l9-9-2-9 9 2 9-8 9 8 9-2-2 9 9 9-22 22z" opacity=".15"/>
              <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
              <path fill="#0d47a1" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
            </svg>
            <div>
              <h2>${
                isPaymentMode
                  ? payToGuide
                    ? "TravelGo HOLD TICKET"
                    : "TravelGo PAYMENT PASS"
                  : boardingLocked
                    ? "TravelGo HOLD TICKET"
                    : "TravelGo E-TICKET"
              }</h2>
              <span>${
                isPaymentMode
                  ? payToGuide
                    ? "VÉ GIỮ CHỖ - THANH TOÁN TRỰC TIẾP CHO HƯỚNG DẪN VIÊN"
                    : "VÉ ĐẶT CHỖ & THANH TOÁN TRỰC TIẾP BẰNG MÃ QR"
                  : boardingLocked
                    ? "VÉ GIỮ CHỖ - CHƯA PHÁT HÀNH VÉ LÊN XE"
                    : "VÉ DU LỊCH & BẢO HIỂM HÀNH TRÌNH ĐIỆN TỬ"
              }</span>
            </div>
          </div>
          <div class="eticket-pnr">
            <span class="pnr-label">MÃ ĐƠN / VÉ (PNR)</span>
            <strong class="pnr-code">${escapeHtml(booking.code)}</strong>
            <span class="eticket-status-badge ${isPaid ? "badge-paid" : "badge-pending"}">
              ${
                cancelled
                  ? "✕ ĐÃ HUỶ ĐƠN"
                  : isPaid
                    ? "✓ ĐÃ THANH TOÁN"
                    : isPaymentMode
                      ? payToGuide
                        ? "⏳ CHƯA THANH TOÁN - TRẢ CHO HDV"
                        : "⏳ CHỜ THANH TOÁN TRỰC TIẾP"
                      : "⏳ CHƯA THANH TOÁN - CHỜ LÊN XE"
              }
            </span>
          </div>
        </div>

        ${
          cancelled
            ? `<div class="ticket-bank-box" style="border-color:#fecaca; background:#fef2f2;">
                 <strong style="color:#b91c1c;">Đơn tour này đã được huỷ.</strong>
                 <p style="margin:6px 0 0; color:#7f1d1d;">Mã vé <strong>${escapeHtml(booking.code)}</strong> không còn hiệu lực. Vui lòng liên hệ hotline ${escapeHtml(settings.hotline || "1900 6868")} nếu bạn cần hỗ trợ.</p>
               </div>`
            : ""
        }

        <div class="eticket-body">
          <div class="eticket-main-info">
            <div class="eticket-tour-title">
              <span class="eticket-sub">Chương trình tour du lịch:</span>
              <h3>${escapeHtml(booking.tourName)}</h3>
              <p class="eticket-meta-tags">
                <span>📍 Điểm đến: <strong>${escapeHtml(tour?.location || "Việt Nam")}</strong></span>
                <span>⏱️ Thời gian: <strong>${escapeHtml(tour?.time || "Theo lịch trình")}</strong></span>
                <span>👥 Số khách: <strong>${escapeHtml(passengerLabel({ adults, children, people }))}</strong></span>
              </p>
            </div>

            <div class="eticket-grid-details">
              <div class="eticket-detail-item">
                <span class="label">NGÀY KHỞI HÀNH</span>
                <strong class="val highlight">${formatDate(booking.date)}</strong>
                <small class="hint">Có mặt trước 30 phút tại điểm hẹn</small>
              </div>

              <div class="eticket-detail-item">
                <span class="label">HÀNH KHÁCH ĐẠI DIỆN</span>
                <strong class="val">${escapeHtml(booking.name)}</strong>
                <small class="hint">SĐT: ${escapeHtml(booking.phone)}</small>
              </div>

              <div class="eticket-detail-item">
                <span class="label">ĐIỂM TẬP TRUNG / ĐÓN KHÁCH</span>
                <strong class="val">${escapeHtml(booking.pickupPoint || "Văn phòng TravelGo / Điểm hẹn theo thông báo")}</strong>
                <small class="hint">Chuyên viên sẽ gọi điện xác nhận giờ đón</small>
              </div>

              <div class="eticket-detail-item">
                <span class="label">HƯỚNG DẪN VIÊN PHỤ TRÁCH</span>
                <strong class="val">${escapeHtml(booking.guideName || "Đang phân công")}</strong>
                <small class="hint">${booking.guidePhone ? `Hotline HDV: ${escapeHtml(booking.guidePhone)}` : "Sẽ cập nhật trước 24h"}</small>
              </div>
            </div>

            ${
              isPaymentMode
                ? cashIntent
                  ? `
            <!-- Khung hướng dẫn thanh toán trực tiếp cho Hướng dẫn viên -->
            <div class="ticket-bank-box">
              <div class="bank-box-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <strong>Thanh toán trực tiếp cho Hướng dẫn viên trước giờ khởi hành:</strong>
              </div>
              <div class="bank-grid-compact">
                <div>
                  <span>Số tiền cần trả:</span>
                  <strong class="ticket-price-val">${isPaid ? "Đã thu đủ" : formatPrice(cashDue)}</strong>
                </div>
                ${
                  cashCollected > 0
                    ? `<div>
                        <span>Đã thu trước đó:</span>
                        <strong>${formatPrice(cashCollected)}</strong>
                      </div>`
                    : ""
                }
                <div class="full-w">
                  <span>Hướng dẫn viên phụ trách:</span>
                  <strong>${escapeHtml(booking.guideName || "Đang phân công")}</strong>
                  ${
                    booking.guidePhone
                      ? `<small style="display:block;">Hotline HDV: ${escapeHtml(booking.guidePhone)}</small>`
                      : `<small style="display:block;">TravelGo sẽ thông báo HDV và SĐT trước ngày khởi hành</small>`
                  }
                </div>
                <div>
                  <span>Mã đơn (nêu khi thanh toán):</span>
                  <strong class="code highlight-code">${escapeHtml(booking.code)}</strong>
                  <button type="button" class="btn-copy-xs" data-copy="${escapeHtml(booking.code)}">Sao chép mã</button>
                </div>
                <div>
                  <span>Ngày khởi hành:</span>
                  <strong>${formatDate(booking.date)}</strong>
                </div>
              </div>
              <p style="margin:10px 0 0; font-size:0.85rem; color:#92400e;">
                Quý khách trả <strong>${formatPrice(cashDue)}</strong> tiền mặt cho hướng dẫn viên ngay tại điểm tập trung
                trước giờ khởi hành. Sau khi HDV xác nhận đã thu đủ tiền, vé điện tử lên xe sẽ được kích hoạt.
              </p>
            </div>`
                  : `
            <!-- Khung thông tin thanh toán trực tiếp -->
            <div class="ticket-bank-box">
              <div class="bank-box-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <strong>Thông tin chuyển khoản thanh toán trực tiếp:</strong>
              </div>
              <div class="bank-grid-compact">
                <div>
                  <span>Ngân hàng thụ hưởng:</span>
                  <strong>${escapeHtml(bankName)}</strong>
                </div>
                <div>
                  <span>Số tài khoản:</span>
                  <strong>${escapeHtml(settings.bankAccount || "0123 4567 8901")}</strong>
                  <button type="button" class="btn-copy-xs" data-copy="${escapeHtml(cleanAccount)}">Sao chép</button>
                </div>
                <div>
                  <span>Chủ tài khoản:</span>
                  <strong>${escapeHtml(bankHolder)}</strong>
                </div>
                <div>
                  <span>Số tiền đúng mệnh giá:</span>
                  <strong class="ticket-price-val">${formatPrice(booking.total)}</strong>
                  <button type="button" class="btn-copy-xs" data-copy="${booking.total}">Sao chép</button>
                </div>
                <div class="full-w">
                  <span>Nội dung chuyển khoản (bắt buộc):</span>
                  <strong class="code highlight-code">${escapeHtml(booking.code)}</strong>
                  <button type="button" class="btn-copy-xs" data-copy="${escapeHtml(booking.code)}">Sao chép mã</button>
                </div>
              </div>
            </div>`
                : `
            <div class="eticket-includes-box">
              <strong>Dịch vụ bao gồm trong vé:</strong>
              <p>Xe du lịch máy lạnh đưa đón, khách sạn theo tiêu chuẩn, các bữa ăn theo lịch trình, vé thắng cảnh, nước uống trên xe và gói Bảo hiểm Du lịch Nội địa hạn mức 50.000.000đ/người.</p>
            </div>`
            }
          </div>

          <!-- Cuống vé: Mã QR (Thanh toán hoặc Check-in) -->
          <div class="eticket-stub">
            ${
              isPaymentMode
                ? payToGuide
                  ? `
              <div class="stub-qr" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:#fffbeb; border:1px dashed #f59e0b; border-radius:12px; padding:16px;">
                <span style="font-size:2.4rem;">💵</span>
                <strong style="color:#92400e; text-align:center;">Trả trực tiếp cho HDV<br>trước giờ khởi hành</strong>
              </div>

              <div class="stub-details">
                <div class="stub-row">
                  <span>Còn phải trả:</span>
                  <strong class="ticket-price-val">${formatPrice(cashDue)}</strong>
                </div>
                ${
                  cashCollected > 0
                    ? `<div class="stub-row">
                        <span>Đã thu:</span>
                        <strong>${formatPrice(cashCollected)}</strong>
                      </div>`
                    : ""
                }
                <div class="stub-row">
                  <span>Mã đơn:</span>
                  <strong class="code">${escapeHtml(booking.code)}</strong>
                </div>
                <div class="stub-row">
                  <span>Người thu:</span>
                  <span>${escapeHtml(booking.guideName || "HDV phụ trách")}</span>
                </div>
                <div class="stub-row">
                  <span>Trạng thái:</span>
                  <span class="text-danger">⏳ Chưa thanh toán</span>
                </div>
              </div>

              <div class="stub-actions no-print" style="width: 100%;">
                ${
                  isPaid
                    ? `<span class="badge-paid" style="padding: 6px 12px; border-radius: 6px; display: block; font-size: 0.82rem; font-weight: 700;">
                        ✓ ĐÃ THANH TOÁN XONG
                       </span>
                       <a href="#/ticket/${escapeHtml(booking.code)}?mode=boarding" class="btn btn-sm btn-outline btn-block" style="margin-top: 6px;">
                         Xem mã QR lên xe
                       </a>`
                    : `<a href="#/ticket/${escapeHtml(booking.code)}?mode=payment" class="btn btn-sm btn-outline btn-block" style="pointer-events:none;">
                         Hướng dẫn viên sẽ thu tiền mặt tại điểm hẹn
                       </a>
                       <small class="ticket-instant-note">Vé lên xe được kích hoạt ngay sau khi HDV xác nhận thu đủ tiền.</small>
                `}
              </div>
            `
                  : `
              <div class="stub-qr ticket-qr-frame">
                <img src="${vietQrUrl}" alt="Mã QR Chuyển tiền ${escapeHtml(booking.code)}" class="qr-payment-img" onerror="this.onerror=null;this.src='${momoQrUrl}';">
                <span class="qr-pill-hint">⚡ Quét bằng App Ngân hàng hoặc MoMo</span>
              </div>

              <div class="stub-details">
                <div class="stub-row">
                  <span>Mệnh giá thanh toán:</span>
                  <strong class="ticket-price-val">${formatPrice(booking.total)}</strong>
                </div>
                <div class="stub-row">
                  <span>Nội dung CK:</span>
                  <strong class="code">${escapeHtml(booking.code)}</strong>
                </div>
                <div class="stub-row">
                  <span>Trạng thái:</span>
                  <span class="${isPaid ? "text-success" : "text-danger"}">
                    ${isPaid ? "✓ Đã nhận thanh toán" : "⏳ Chưa chuyển tiền"}
                  </span>
                </div>
              </div>

              ${
                !isPaid
                  ? `
                <div class="stub-actions no-print" style="width: 100%;">
                  <button type="button" class="btn btn-sm btn-ticket-confirm-pay btn-block" id="btn-ticket-confirm-pay" data-code="${escapeHtml(booking.code)}">
                    ✓ Xác nhận tôi đã chuyển tiền
                  </button>
                  <a href="#/payment?code=${escapeHtml(booking.code)}" class="btn btn-sm btn-momo btn-block" style="margin-top: 6px;">
                    Thanh toán qua Ví MoMo
                  </a>
                  <small class="ticket-instant-note">Hệ thống kích hoạt vé điện tử ngay khi nhận tiền.</small>
                </div>`
                  : `
                <div class="stub-actions no-print" style="width: 100%;">
                  <span class="badge-paid" style="padding: 6px 12px; border-radius: 6px; display: block; font-size: 0.82rem; font-weight: 700;">
                    ✓ ĐÃ THANH TOÁN XONG
                  </span>
                  <a href="#/ticket/${escapeHtml(booking.code)}?mode=boarding" class="btn btn-sm btn-outline btn-block" style="margin-top: 6px;">
                    Xem mã QR lên xe
                  </a>
                </div>`
              }
            `
                : boardingLocked
                  ? `
              <div class="stub-qr" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:#fef2f2; border:1px dashed #ef4444; border-radius:12px; padding:16px;">
                <span style="font-size:2.4rem;">🔒</span>
                <strong style="color:#b91c1c; text-align:center;">Vé lên xe chưa được kích hoạt</strong>
              </div>

              <div class="stub-details">
                <div class="stub-row">
                  <span>Tổng chi phí:</span>
                  <strong>${formatPrice(booking.total)}</strong>
                </div>
                ${
                  cashCollected > 0
                    ? `<div class="stub-row">
                        <span>Đã thu:</span>
                        <strong>${formatPrice(cashCollected)}</strong>
                      </div>`
                    : ""
                }
                <div class="stub-row">
                  <span>Còn phải trả:</span>
                  <strong class="ticket-price-val">${formatPrice(cashDue)}</strong>
                </div>
                <div class="stub-row">
                  <span>Trạng thái:</span>
                  <span class="text-danger">⏳ Chưa thanh toán</span>
                </div>
              </div>

              <div class="stub-actions no-print" style="width: 100%;">
                <a href="#/ticket/${escapeHtml(booking.code)}?mode=payment" class="btn btn-sm btn-primary btn-block">
                  ${
                    isPayToGuide(booking)
                      ? "Xem hướng dẫn trả cho HDV"
                      : "Xem hướng dẫn thanh toán"
                  }
                </a>
                <small class="ticket-instant-note">Mã QR lên xe chỉ phát hành sau khi đã thanh toán đủ tiền.</small>
              </div>
            `
                  : `
              <div class="stub-qr">
                <img src="${checkinQrUrl}" alt="QR Check-in ${escapeHtml(booking.code)}" class="qr-img">
                <span class="qr-note">Quét mã QR khi lên xe / Check-in</span>
              </div>

              <div class="stub-details">
                <div class="stub-row">
                  <span>Tổng chi phí:</span>
                  <strong>${formatPrice(booking.total)}</strong>
                </div>
                <div class="stub-row">
                  <span>Phương thức:</span>
                  <span>${PAYMENT_METHOD[booking.paymentMethod] || (booking.paymentMethod === "bank" ? "VietQR Ngân hàng" : "Ví MoMo")}</span>
                </div>
                <div class="stub-row">
                  <span>Ngày xuất vé:</span>
                  <span>${formattedPaidTime}</span>
                </div>
              </div>

              <div class="stub-barcode">
                <div class="barcode-lines">||| | |||| | || |||| | ||| |||| | ||</div>
                <span class="barcode-text">${escapeHtml(booking.code)}</span>
              </div>
            `
            }
          </div>
        </div>

        <div class="eticket-footer">
          <div class="eticket-rules">
            <small>
              <strong>Lưu ý quan trọng:</strong> ${
                cancelled
                  ? `Đơn đã huỷ, mã vé này không còn hiệu lực giữ chỗ.`
                  : isPaymentMode && payToGuide && !isPaid
                    ? `Vé giữ chỗ này có hiệu lực đến giờ khởi hành. Quý khách vui lòng thanh toán <strong>${formatPrice(cashDue)}</strong> tiền mặt cho hướng dẫn viên phụ trách <strong>${escapeHtml(booking.guideName || "sẽ được phân công")}</strong> trước khi lên xe. Vé lên xe chỉ được kích hoạt sau khi hướng dẫn viên xác nhận đã thu đủ tiền.`
                    : isPaymentMode && !isPaid
                      ? `Vé thanh toán trực tiếp này có hiệu lực giữ chỗ trong 24 giờ. Quý khách vui lòng quét mã QR chuyển khoản đúng số tiền <strong>${formatPrice(booking.total)}</strong> và nội dung <strong>${escapeHtml(booking.code)}</strong> để được gạch nợ tự động.`
                      : `Quý khách vui lòng xuất trình vé điện tử này trên điện thoại hoặc bản in cùng CCCD/Hộ chiếu gốc khi tập trung lên xe. Mọi hỗ trợ khẩn cấp 24/7 vui lòng gọi <strong>${escapeHtml(settings.hotline || "1900 6868")}</strong>.`
              }
            </small>
          </div>
          <div class="eticket-sign">
            <span>Đại diện TravelGo Tourist</span>
            <div class="eticket-stamp ${isPaid ? "" : "stamp-pending"}">
              ${isPaid ? "✓ VERIFIED TICKET" : cancelled ? "✕ CANCELLED" : "⏳ WAITING FOR PAYMENT"}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

document.addEventListener("click", (e) => {
  // 1. In vé
  if (e.target.closest("#btn-print-eticket")) {
    window.print();
    return;
  }

  // 2. Gửi vé qua Email
  const emailBtn = e.target.closest("#btn-email-ticket");
  if (emailBtn) {
    const currentEmail = emailBtn.dataset.email;
    const targetEmail = prompt("Nhập địa chỉ email để nhận vé điện tử:", currentEmail || "khachhang@example.com");
    if (targetEmail) {
      alert(`Đã gửi vé (PDF) của đơn ${emailBtn.dataset.code} thành công tới email: ${targetEmail}! Vui lòng kiểm tra hộp thư đến.`);
    }
    return;
  }

  // 3. Sao chép nội dung nhanh trên vé
  const copyBtn = e.target.closest(".btn-copy-xs");
  if (copyBtn) {
    const text = copyBtn.dataset.copy;
    if (text) {
      navigator.clipboard?.writeText(text).then(() => {
        const oldText = copyBtn.textContent;
        copyBtn.textContent = "✓ Đã chép";
        setTimeout(() => {
          copyBtn.textContent = oldText;
        }, 1500);
      });
    }
    return;
  }

  // 4. Nút Xác nhận đã chuyển tiền trực tiếp trên vé
  const confirmPayBtn = e.target.closest("#btn-ticket-confirm-pay");
  if (confirmPayBtn) {
    const code = confirmPayBtn.dataset.code;
    if (code) {
      recordBookingPayment(code, {
        method: "bank",
        transId: `VQR${Date.now().toString().slice(-8)}`,
      });
      syncNotificationBadge();
      alert(`Xác nhận thanh toán thành công cho đơn ${code}! Vé của bạn đã được chuyển sang trạng thái "ĐÃ THANH TOÁN".`);
      document.dispatchEvent(new CustomEvent("app:refresh"));
    }
  }
});
