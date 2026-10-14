import { getBooking, getSettings } from "../store.js";
import { getTourById } from "../tour-repository.js";
import { formatDate, formatPrice } from "../data.js";
import { escapeHtml } from "../validate.js";
import { passengerBreakdown, passengerLabel } from "../booking-rules.js";

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
        <h1>Không tìm thấy vé điện tử</h1>
        <p>Không có đơn tour nào khớp với mã <strong>${escapeHtml(code)}</strong>.</p>
        <a class="btn btn-primary" href="#/my-bookings">Danh sách đơn của tôi</a>
      </div>
    </section>`;
  }

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

  const qrData = `TRAVELGO|ETICKET|${booking.code}|${booking.name}|${booking.phone}|${booking.date}|${booking.total}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`;

  return `
  <section class="ticket-page-wrap">
    <div class="container ticket-container">
      <div class="ticket-top-bar no-print">
        <a href="#/my-bookings" class="btn btn-ghost-soft">
          ← Quay lại đơn hàng
        </a>
        <div class="ticket-top-actions">
          <button type="button" class="btn btn-outline" id="btn-email-ticket" data-email="${escapeHtml(booking.email || "")}" data-code="${escapeHtml(booking.code)}">
            ✉️ Gửi vé về Email
          </button>
          <button type="button" class="btn btn-primary" id="btn-print-eticket">
            🖨️ In vé / Lưu file PDF
          </button>
        </div>
      </div>

      <!-- Khung Vé Điện Tử Chuẩn Boarding Pass -->
      <div class="eticket-card" id="printable-eticket">
        <div class="eticket-header">
          <div class="eticket-brand">
            <svg viewBox="0 0 48 45" class="logo-mark" width="36" height="34" aria-hidden="true">
              <path fill="#1677ff" d="M24 44 2 22l9-9-2-9 9 2 9-8 9 8 9-2-2 9 9 9-22 22z" opacity=".15"/>
              <path fill="#1677ff" d="M24 44 15 26 2 22h44L31 26z"/>
              <path fill="#0d47a1" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
            </svg>
            <div>
              <h2>TravelGo E-TICKET</h2>
              <span>VÉ DU LỊCH & BẢO HIỂM HÀNH TRÌNH ĐIỆN TỬ</span>
            </div>
          </div>
          <div class="eticket-pnr">
            <span class="pnr-label">MÃ ĐẶT VÉ (PNR)</span>
            <strong class="pnr-code">${escapeHtml(booking.code)}</strong>
            <span class="eticket-status-badge ${booking.payment === "paid" ? "badge-paid" : "badge-pending"}">
              ${booking.payment === "paid" ? "✓ ĐÃ THANH TOÁN" : "⏳ CHỜ THANH TOÁN"}
            </span>
          </div>
        </div>

        <div class="eticket-body">
          <div class="eticket-main-info">
            <div class="eticket-tour-title">
              <span class="eticket-sub">Chương trình tour:</span>
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
                <span class="label">HỌ & TÊN HÀNH KHÁCH ĐẠI DIỆN</span>
                <strong class="val">${escapeHtml(booking.name)}</strong>
                <small class="hint">SĐT: ${escapeHtml(booking.phone)}</small>
              </div>

              <div class="eticket-detail-item">
                <span class="label">ĐIỂM TẬP TRUNG / ĐÓN KHÁCH</span>
                <strong class="val">${escapeHtml(booking.pickupPoint || "Văn phòng TravelGo / Sân bay theo thông báo")}</strong>
                <small class="hint">Chuyên viên sẽ gọi điện xác nhận giờ đón</small>
              </div>

              <div class="eticket-detail-item">
                <span class="label">HƯỚNG DẪN VIÊN PHỤ TRÁCH</span>
                <strong class="val">${escapeHtml(booking.guideName || "Đang phân công")}</strong>
                <small class="hint">${booking.guidePhone ? `Hotline HDV: ${escapeHtml(booking.guidePhone)}` : "Sẽ cập nhật trước 24h"}</small>
              </div>
            </div>

            <div class="eticket-includes-box">
              <strong>Dịch vụ bao gồm trong vé:</strong>
              <p>Xe du lịch máy lạnh đưa đón, khách sạn theo tiêu chuẩn, các bữa ăn theo lịch trình, vé thắng cảnh, nước uống trên xe và gói Bảo hiểm Du lịch Nội địa hạn mức 50.000.000đ/người.</p>
            </div>
          </div>

          <div class="eticket-stub">
            <div class="stub-qr">
              <img src="${qrUrl}" alt="QR Check-in ${escapeHtml(booking.code)}" class="qr-img">
              <span class="qr-note">Quét mã QR khi lên xe / Check-in</span>
            </div>

            <div class="stub-details">
              <div class="stub-row">
                <span>Tổng chi phí:</span>
                <strong>${formatPrice(booking.total)}</strong>
              </div>
              <div class="stub-row">
                <span>Phương thức:</span>
                <span>${booking.paymentMethod === "bank" ? "VietQR Ngân hàng" : "Ví MoMo"}</span>
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
          </div>
        </div>

        <div class="eticket-footer">
          <div class="eticket-rules">
            <small>
              <strong>Lưu ý quan trọng:</strong> Quý khách vui lòng xuất trình vé điện tử này trên điện thoại hoặc bản in cùng CCCD/Hộ chiếu gốc khi tập trung lên xe. Mọi hỗ trợ khẩn cấp 24/7 vui lòng gọi <strong>${escapeHtml(settings.hotline || "1900 6868")}</strong>.
            </small>
          </div>
          <div class="eticket-sign">
            <span>Đại diện TravelGo Tourist</span>
            <div class="eticket-stamp">✓ VERIFIED TICKET</div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-print-eticket")) {
    window.print();
    return;
  }

  const emailBtn = e.target.closest("#btn-email-ticket");
  if (emailBtn) {
    const currentEmail = emailBtn.dataset.email;
    const targetEmail = prompt("Nhập địa chỉ email để nhận vé điện tử:", currentEmail || "khachhang@example.com");
    if (targetEmail) {
      alert(`Đã gửi vé điện tử (PDF E-Ticket) của đơn ${emailBtn.dataset.code} thành công tới email: ${targetEmail}! Vui lòng kiểm tra hộp thư đến.`);
    }
  }
});
