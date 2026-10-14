import { contactInfo } from "../data.js";
import { escapeHtml } from "../validate.js";

const POLICIES = {
  terms: {
    id: "terms",
    title: "Điều khoản dịch vụ & Quy chế hoạt động",
    icon: "📜",
    content: `
      <h3>1. Nguyên tắc chung</h3>
      <p>Chào mừng bạn đến với nền tảng đặt tour trực tuyến <strong>TravelGo</strong>. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu rõ dưới đây.</p>
      
      <h3>2. Đăng ký & Đặt tour</h3>
      <ul>
        <li>Khách hàng có trách nhiệm cung cấp thông tin chính xác về họ tên, số điện thoại, email và số lượng hành khách khi đặt tour.</li>
        <li>Đơn đặt tour chỉ được coi là xác nhận thành công sau khi TravelGo nhận được khoản đặt cọc hoặc thanh toán đầy đủ và gửi mã xác nhận đơn (mã bắt đầu bằng <code>TG...</code>).</li>
        <li>TravelGo có quyền từ chối hoặc hủy đơn nếu phát hiện hành vi gian lận thông tin hoặc không tuân thủ quy định thanh toán trong thời gian quy định.</li>
      </ul>

      <h3>3. Giá cả & Phương thức thanh toán</h3>
      <ul>
        <li>Mọi mức giá niêm yết trên website đều là Việt Nam Đồng (VNĐ) và đã bao gồm các dịch vụ cơ bản nêu trong mục "Bao gồm" của từng tour.</li>
        <li>Khách hàng có thể thanh toán qua Ví điện tử MoMo, chuyển khoản ngân hàng VietQR hoặc thanh toán trực tiếp tại văn phòng.</li>
      </ul>

      <h3>4. Quyền và nghĩa vụ của khách hàng</h3>
      <ul>
        <li>Có mặt đúng giờ tại điểm đón đã hẹn trong lịch trình. TravelGo không chịu trách nhiệm nếu khách hàng đến trễ dẫn đến lỡ chuyến đi.</li>
        <li>Tự bảo quản hành lý, tư trang cá nhân và tài sản có giá trị trong suốt quá trình tham gia tour.</li>
        <li>Tuân thủ hướng dẫn an toàn của trưởng đoàn và hướng dẫn viên địa phương.</li>
      </ul>
    `
  },
  privacy: {
    id: "privacy",
    title: "Chính sách bảo mật thông tin khách hàng",
    icon: "🔒",
    content: `
      <h3>1. Phạm vi thu thập thông tin</h3>
      <p>TravelGo thu thập các thông tin cá nhân cơ bản gồm: Họ tên, số điện thoại, địa chỉ email, thông tin thanh toán và số CCCD/Hộ chiếu (đối với các tour yêu cầu làm thủ tục bay hoặc khai báo bảo hiểm).</p>

      <h3>2. Mục đích sử dụng thông tin</h3>
      <ul>
        <li>Xác nhận đơn đặt tour và cung cấp dịch vụ vận chuyển, khách sạn, vé tham quan.</li>
        <li>Mua bảo hiểm du lịch bắt buộc cho hành khách trong đoàn.</li>
        <li>Gửi thông báo cập nhật lịch trình, vé điện tử và hỗ trợ xử lý sự cố.</li>
        <li>Gửi các chương trình ưu đãi, khuyến mãi dành riêng cho khách hàng thân thiết (khi khách đồng ý nhận bản tin).</li>
      </ul>

      <h3>3. Cam kết bảo mật thông tin (Nghị định 13/2023/NĐ-CP)</h3>
      <p>TravelGo cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Chúng tôi <strong>không bao giờ</strong> chia sẻ, buôn bán hay cho thuê dữ liệu của khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại, ngoại trừ trường hợp có yêu cầu từ cơ quan pháp luật có thẩm quyền.</p>
    `
  },
  refund: {
    id: "refund",
    title: "Chính sách hủy tour & Quy chế hoàn tiền",
    icon: "💳",
    content: `
      <h3>1. Quy định hủy tour từ phía khách hàng (Ngày thường)</h3>
      <p>Trường hợp khách hàng không thể tham gia chuyến đi và thông báo hủy tour, mức phí phạt sẽ được áp dụng dựa trên thời gian thông báo trước ngày khởi hành:</p>

      <div class="policy-table-wrap">
        <table class="policy-table">
          <thead>
            <tr>
              <th>Thời gian thông báo hủy</th>
              <th>Mức phí phạt</th>
              <th>Số tiền hoàn lại</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Trước ngày khởi hành <strong>≥ 10 ngày</strong></td>
              <td>0% (Miễn phí)</td>
              <td>Hoàn 100% tiền cọc</td>
            </tr>
            <tr>
              <td>Trước ngày khởi hành <strong>từ 5 đến 9 ngày</strong></td>
              <td>30% tổng giá tour</td>
              <td>Hoàn 70% số tiền</td>
            </tr>
            <tr>
              <td>Trước ngày khởi hành <strong>từ 2 đến 4 ngày</strong></td>
              <td>50% tổng giá tour</td>
              <td>Hoàn 50% số tiền</td>
            </tr>
            <tr>
              <td>Trước ngày khởi hành <strong>dưới 24h hoặc không đến</strong></td>
              <td>100% tổng giá tour</td>
              <td>Không hoàn tiền</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2. Trường hợp bất khả kháng (Thiên tai, Dịch bệnh, Bão lũ)</h3>
      <p>Nếu chuyến đi bị hủy do các lý do bất khả kháng (thời tiết xấu cấm tàu/xe, bão lũ hoặc chỉ thị từ cơ quan nhà nước), TravelGo sẽ hỗ trợ khách hàng bảo lưu toàn bộ số tiền cọc sang tour khác hoặc hoàn lại 100% tiền sau khi trừ đi các chi phí thực tế mà bên cung cấp thứ 3 (hãng bay, tàu cao tốc) không hoàn lại.</p>

      <h3>3. Thời gian xử lý hoàn tiền</h3>
      <p>Khoản hoàn tiền sẽ được chuyển về tài khoản ngân hàng hoặc ví MoMo của quý khách trong vòng <strong>3 - 5 ngày làm việc</strong> kể từ khi xác nhận yêu cầu hủy tour.</p>
    `
  },
  insurance: {
    id: "insurance",
    title: "Chính sách bảo hiểm du lịch & Hỗ trợ",
    icon: "🛡️",
    content: `
      <h3>1. Quyền lợi bảo hiểm du lịch trọn gói</h3>
      <p>Tất cả các tour do TravelGo tổ chức đều đã được mua gói <strong>Bảo hiểm Du lịch Nội địa Bảo Việt / PJICO</strong> tiêu chuẩn cao:</p>
      <ul>
        <li>Hạn mức trách nhiệm bảo hiểm tối đa: <strong>50.000.000 VNĐ / vụ / người</strong>.</li>
        <li>Bảo hiểm chi trả toàn bộ chi phí y tế phát sinh do tai nạn rủi ro trong suốt thời gian diễn ra tour.</li>
        <li>Hỗ trợ chi phí vận chuyển y tế khẩn cấp khi có sự cố.</li>
      </ul>

      <h3>2. Kênh tiếp nhận hỗ trợ 24/7</h3>
      <p>Trong trường hợp cần hỗ trợ y tế hoặc khẩn cấp trong chuyến đi, quý khách vui lòng liên hệ ngay trưởng đoàn/hướng dẫn viên hoặc gọi trực tiếp đường dây nóng của TravelGo:</p>
      <div class="emergency-contact-box">
        <p>📞 Hotline khẩn cấp 24/7: <a href="tel:${contactInfo.hotlineDigits}"><strong>${escapeHtml(contactInfo.hotline)}</strong></a></p>
        <p>✉️ Email hỗ trợ khách hàng: <a href="mailto:${escapeHtml(contactInfo.email)}"><strong>${escapeHtml(contactInfo.email)}</strong></a></p>
      </div>
    `
  }
};

export function Policies(path, params = {}, query = new URLSearchParams()) {
  const currentTab = query.get("tab") || "terms";
  const activePolicy = POLICIES[currentTab] || POLICIES.terms;

  return `
  <section class="page-hero">
    <div class="container center">
      <span class="hero-eyebrow">Minh bạch & Tin cậy</span>
      <h1>Chính Sách & Quy Định Hoạt Động</h1>
      <p>Cam kết bảo vệ quyền lợi, bảo mật dữ liệu và mang đến sự an tâm tuyệt đối cho khách hàng trên mỗi hành trình cùng TravelGo.</p>
    </div>
  </section>

  <section class="section container policies-layout">
    <aside class="policies-sidebar">
      <nav class="policies-nav">
        ${Object.values(POLICIES).map(p => `
          <a href="#/policies?tab=${p.id}" class="policy-nav-item ${currentTab === p.id ? "active" : ""}">
            <span class="policy-nav-icon">${p.icon}</span>
            <span>${escapeHtml(p.title)}</span>
          </a>
        `).join("")}
      </nav>
      <div class="policy-help-box">
        <h4>Cần tư vấn thêm?</h4>
        <p>Đội ngũ CSKH của chúng tôi sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
        <a href="#/contact" class="btn btn-outline btn-sm btn-block">Gửi câu hỏi ngay</a>
      </div>
    </aside>

    <main class="policies-content">
      <div class="policy-card">
        <div class="policy-header">
          <span class="policy-badge">${activePolicy.icon} Quy chuẩn áp dụng 2026</span>
          <h2>${escapeHtml(activePolicy.title)}</h2>
        </div>
        <div class="policy-body">
          ${activePolicy.content}
        </div>
      </div>
    </main>
  </section>`;
}
