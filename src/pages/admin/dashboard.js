import {
  BOOKING_STATUS,
  getSettings,
  listBookings,
  listMessages,
  listReviews,
  logActivity,
  updateBooking,
} from "../../store.js";
import {
  bookingSummary,
  formatRelative,
  pendingAttention,
  revenueByMonth,
  topTours,
  tourLoad,
} from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  barChart,
  donutChart,
  formatCompact,
  formatMoney,
  initials,
  statusBadge,
  toast,
} from "../../components/admin-ui.js";
import { escapeHtml, searchKey } from "../../validate.js";
import { hasPermission } from "../../auth.js";

function kpiCard({ label, value, hint, tone = "" }) {
  return `
  <article class="kpi${tone ? ` kpi-${tone}` : ""}">
    <p class="kpi-label">${escapeHtml(label)}</p>
    <strong class="kpi-value">${value}</strong>
    <span class="kpi-hint">${hint}</span>
  </article>`;
}

function quickAction(href, icon, label, note, perm) {
  if (perm && !hasPermission(perm)) return "";
  return `
  <a class="quick-action" href="${href}">
    <span class="quick-icon" aria-hidden="true">${icon}</span>
    <strong>${escapeHtml(label)}</strong>
    <small>${escapeHtml(note)}</small>
  </a>`;
}

export function Dashboard() {
  const denied = adminGuard("dashboard.view");
  if (denied) return denied;

  const bookings = listBookings();
  const messages = listMessages();
  const reviews = listReviews();
  const settings = getSettings();
  const summary = bookingSummary(bookings);
  const months = revenueByMonth(bookings, 6);
  const attention = pendingAttention(bookings, messages);
  const lowStock = tourLoad()
    .filter((tour) => tour.pressure !== "normal")
    .slice(0, 4);
  const recent = bookings.slice(0, 6);
  const top = topTours(bookings, 5);

  const thisMonth = months[months.length - 1]?.revenue || 0;
  const lastMonth = months[months.length - 2]?.revenue || 0;
  const delta = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  const deltaHint =
    delta === 0
      ? "Không đổi so với tháng trước"
      : `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)}% so với tháng trước`;

  return `
  <section class="kpi-grid">
    ${kpiCard({ label: "Tổng đơn đặt tour", value: summary.total, hint: `${summary.people} lượt khách`, tone: "blue" })}
    ${kpiCard({ label: "Chờ xác nhận", value: summary.pending, hint: attention.bookings ? "Cần xử lý ngay" : "Đã xử lý hết", tone: summary.pending ? "amber" : "green" })}
    ${kpiCard({ label: "Doanh thu", value: formatMoney(summary.revenue), hint: deltaHint, tone: "green" })}
    ${kpiCard({ label: "Khách hàng", value: summary.customers, hint: `${summary.avgOrder ? formatCompact(summary.avgOrder) + "đ / đơn" : "Chưa có đơn"}`, tone: "violet" })}
    ${kpiCard({ label: "Tỉ lệ chốt đơn", value: `${summary.conversion}%`, hint: `${summary.cancelled} đơn đã huỷ`, tone: "slate" })}
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div>
          <h2>Doanh thu 6 tháng gần nhất</h2>
          <p>Tổng tiền các đơn không bị huỷ</p>
        </div>
        <a class="btn btn-sm btn-outline" href="#/admin/reports">Xem báo cáo</a>
      </header>
      ${barChart(months)}
    </article>

    <article class="panel">
      <header class="panel-head">
        <div>
          <h2>Cơ cấu đơn đặt tour</h2>
          <p>Phân bổ theo trạng thái</p>
        </div>
      </header>
      ${donutChart([
        { label: BOOKING_STATUS.confirmed, value: summary.confirmed },
        { label: BOOKING_STATUS.pending, value: summary.pending },
        { label: BOOKING_STATUS.cancelled, value: summary.cancelled },
      ])}
    </article>
  </section>

  <section class="admin-grid admin-grid-3">
    <article class="panel">
      <header class="panel-head">
        <div><h2>Tour bán chạy</h2><p>Theo doanh thu</p></div>
        <a class="btn btn-sm btn-ghost-soft" href="#/admin/tours">Quản lý</a>
      </header>
      <ol class="rank-list">
        ${
          top.length
            ? top
                .map(
                  (tour, index) => `
          <li>
            <span class="rank-no">${index + 1}</span>
            <span class="rank-info">
              <strong>${escapeHtml(tour.name)}</strong>
              <small>${escapeHtml(tour.location)} · ${tour.orders} đơn · ${tour.people} khách</small>
            </span>
            <span class="rank-value">${formatMoney(tour.revenue)}</span>
          </li>`
                )
                .join("")
            : `<li class="rank-empty">Chưa có dữ liệu doanh thu.</li>`
        }
      </ol>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Cần xử lý</h2><p>Việc đang chờ nhân viên</p></div>
      </header>
      <ul class="todo-list">
        <li>
          <a href="#/admin/bookings?status=pending">
            <span class="todo-icon todo-amber">▤</span>
            <span><strong>${attention.bookings} đơn chờ xác nhận</strong><small>Ưu tiên gọi khách trong 30 phút</small></span>
          </a>
        </li>
        <li>
          <a href="#/admin/messages">
            <span class="todo-icon todo-blue">✉</span>
            <span><strong>${attention.messages} tin nhắn chưa đọc</strong><small>Từ biểu mẫu liên hệ</small></span>
          </a>
        </li>
        <li>
          <a href="#/admin/reviews">
            <span class="todo-icon todo-violet">★</span>
            <span><strong>${attention.reviews} đánh giá chờ duyệt</strong><small>Chưa hiển thị trên website</small></span>
          </a>
        </li>
        <li>
          <a href="#/admin/tours">
            <span class="todo-icon todo-red">◉</span>
            <span><strong>${attention.tours} tour sắp hết chỗ</strong><small>Cân nhắc mở thêm chuyến</small></span>
          </a>
        </li>
      </ul>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Chỗ còn sắp hết</h2><p>Theo số suất còn lại</p></div>
      </header>
      <ul class="stock-list">
        ${
          lowStock.length
            ? lowStock
                .map(
                  (tour) => `
          <li>
            <div class="stock-head">
              <strong>${escapeHtml(tour.name)}</strong>
              <span>${tour.seatsLeft} chỗ</span>
            </div>
            <span class="status-pill status-${tour.pressure === "critical" ? "cancelled" : "pending"}">${
                      tour.pressure === "critical" ? "Sắp hết chỗ" : "Còn ít chỗ"
                    }</span>
          </li>`
                )
                .join("")
            : `<li class="rank-empty">Tất cả tour đều còn chỗ.</li>`
        }
      </ul>
    </article>
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div><h2>Đơn mới nhất</h2><p>${summary.total} đơn trong hệ thống</p></div>
        <a class="btn btn-sm btn-ghost-soft" href="#/admin/bookings">Xem tất cả</a>
      </header>
      <div class="table-wrap table-wrap-flat">
        <table class="data-table">
          <thead>
            <tr><th>Mã đơn</th><th>Khách hàng</th><th>Tour</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody id="dash-rows">
            ${recent.map(recentRow).join("") || `<tr><td colspan="6" class="table-empty">Chưa có đơn nào.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Tin nhắn mới nhất</h2><p>${attention.messages} chưa đọc</p></div>
        <a class="btn btn-sm btn-ghost-soft" href="#/admin/messages">Xem tất cả</a>
      </header>
      <ul class="msg-brief">
        ${
          messages.slice(0, 4).map(
            (item) => `
          <li>
            <span class="avatar-sm">${initials(item.name)}</span>
            <span class="msg-brief-info">
              <strong>${escapeHtml(item.name)} <em>${escapeHtml(item.topic)}</em></strong>
              <small>${escapeHtml(item.message.slice(0, 90))}${item.message.length > 90 ? "…" : ""}</small>
            </span>
            <span class="msg-brief-time">${formatRelative(item.createdAt)}</span>
          </li>`
          ).join("") || `<li class="rank-empty">Chưa có tin nhắn nào.</li>`
        }
      </ul>

      <header class="panel-head panel-head-sub">
        <div><h2>Thao tác nhanh</h2><p>Tạo mới trong một chạm</p></div>
      </header>
      <div class="quick-grid">
        ${quickAction("#/admin/bookings", "▤", "Xử lý đơn", "Xác nhận hoặc huỷ đơn", "bookings.view")}
        ${quickAction("#/admin/tours", "◉", "Thêm tour", "Đăng tour mới lên web", "tours.manage")}
        ${quickAction("#/admin/promotions", "◐", "Tạo mã giảm giá", "Chương trình ưu đãi", "promotions.manage")}
        ${quickAction("#/admin/customers", "◍", "Khách hàng", "Hồ sơ và lịch sử", "customers.view")}
        ${quickAction("#/admin/settings", "⚙", "Cài đặt", `Hotline: ${escapeHtml(settings.hotline)}`, "settings.view")}
      </div>
    </article>
  </section>`;
}

function recentRow(booking) {
  return `
  <tr data-code="${escapeHtml(booking.code)}" data-search="${escapeHtml(
    searchKey(`${booking.code} ${booking.name} ${booking.tourName}`)
  )}">
    <td><strong>${escapeHtml(booking.code)}</strong><br><small>${formatRelative(booking.createdAt)}</small></td>
    <td>${escapeHtml(booking.name)}<br><small>${escapeHtml(booking.phone)}</small></td>
    <td>${escapeHtml(booking.tourName)}</td>
    <td><strong>${formatMoney(booking.total)}</strong></td>
    <td>${statusBadge(booking.status, BOOKING_STATUS)}</td>
    <td class="row-actions">
      ${
        booking.status === "pending" && hasPermission("bookings.manage")
          ? `<button class="btn btn-sm btn-primary" type="button" data-dash-action="confirmed">Xác nhận</button>`
          : ""
      }
      <a class="btn btn-sm btn-outline" href="#/admin/bookings?q=${encodeURIComponent(booking.code)}">Chi tiết</a>
    </td>
  </tr>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "dashboard") return;
  if (!document.getElementById("dash-rows")) return;

  document.getElementById("dash-rows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-dash-action]");
    if (!button) return;
    const code = button.closest("tr").dataset.code;
    const status = button.dataset.dashAction;
    updateBooking(code, { status });
    logActivity(
      status === "confirmed" ? "Xác nhận đơn" : "Cập nhật đơn",
      `${status === "confirmed" ? "Xác nhận" : "Cập nhật"} đơn ${code}`
    );
    toast(`Đã cập nhật đơn ${code}.`);
    refreshAdmin();
  });
});
