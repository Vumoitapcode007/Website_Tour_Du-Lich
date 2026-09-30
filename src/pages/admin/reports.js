import { BOOKING_STATUS, getSettings, listBookings, listReviews } from "../../store.js";
import {
  bookingSummary,
  customerGrowth,
  formatRelative,
  revenueByDay,
  revenueByDestination,
  revenueByMonth,
  topTours,
} from "../../reports.js";
import { adminGuard, refreshAdmin } from "../../components/admin-shell.js";
import {
  barChart,
  donutChart,
  downloadCsv,
  formatMoney,
  lineChart,
  stamp,
} from "../../components/admin-ui.js";
import { listTours } from "../../tour-repository.js";
import { escapeHtml } from "../../validate.js";

const RANGES = {
  "7": { days: 7, months: 2, label: "7 ngày" },
  "30": { days: 30, months: 3, label: "30 ngày" },
  "90": { days: 90, months: 6, label: "90 ngày" },
  "365": { days: 365, months: 12, label: "12 tháng" },
};

let RANGE = "90";

function rangeBookings() {
  const { days } = RANGES[RANGE];
  const from = Date.now() - days * 86400000;
  return listBookings().filter((item) => new Date(item.createdAt).getTime() >= from);
}

export function Reports() {
  const denied = adminGuard("reports.view");
  if (denied) return denied;

  const range = RANGES[RANGE];
  const scoped = rangeBookings();
  const all = listBookings();
  const summary = bookingSummary(scoped);
  const months = revenueByMonth(scoped, range.months);
  const days = revenueByDay(scoped, Math.min(range.days, 14));
  const destinations = revenueByDestination(scoped);
  const growth = customerGrowth(scoped, range.months);
  const tours = topTours(scoped, 8);
  const settings = getSettings();

  const best = months.reduce((acc, item) => (item.revenue > acc.revenue ? item : acc), months[0] || { label: "-", revenue: 0 });
  const peak = days.reduce((acc, item) => (item.revenue > acc.revenue ? item : acc), days[0] || { label: "-", revenue: 0 });
  const totalRevenue = months.reduce((sum, item) => sum + item.revenue, 0);

  return `
  <section class="panel">
    <div class="report-bar">
      <div>
        <h2>Báo cáo kinh doanh</h2>
        <p>Khoảng thời gian: ${escapeHtml(range.label)} · Cập nhật ${formatRelative(new Date().toISOString())}</p>
      </div>
      <div class="report-range">
        ${Object.entries(RANGES)
          .map(
            ([value, item]) =>
              `<button class="btn btn-sm ${value === RANGE ? "btn-primary" : "btn-ghost-soft"}" type="button" data-range="${value}">${escapeHtml(item.label)}</button>`
          )
          .join("")}
        <button class="btn btn-sm btn-outline" type="button" id="rp-print">In báo cáo</button>
        <button class="btn btn-sm btn-primary" type="button" id="rp-export">Xuất CSV</button>
      </div>
    </div>
  </section>

  <section class="kpi-grid kpi-grid-5">
    <article class="kpi kpi-green"><p class="kpi-label">Doanh thu kỳ</p><strong class="kpi-value">${formatMoney(summary.revenue)}</strong><span class="kpi-hint">${summary.total} đơn hợp lệ</span></article>
    <article class="kpi kpi-blue"><p class="kpi-label">Giá trị đơn TB</p><strong class="kpi-value">${formatMoney(summary.avgOrder)}</strong><span class="kpi-hint">${summary.people} lượt khách</span></article>
    <article class="kpi kpi-violet"><p class="kpi-label">Khách hàng</p><strong class="kpi-value">${summary.customers}</strong><span class="kpi-hint">Trong kỳ báo cáo</span></article>
    <article class="kpi kpi-amber"><p class="kpi-label">Tỉ lệ chốt</p><strong class="kpi-value">${summary.conversion}%</strong><span class="kpi-hint">${summary.cancelled} đơn huỷ</span></article>
    <article class="kpi kpi-slate"><p class="kpi-label">Tháng tốt nhất</p><strong class="kpi-value kpi-value-sm">${escapeHtml(best.label || "-")}</strong><span class="kpi-hint">${formatMoney(best.revenue || 0)}</span></article>
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div><h2>Xu hướng doanh thu</h2><p>Theo tháng trong kỳ</p></div>
      </header>
      ${lineChart(months)}
      <ul class="report-legend">
        <li><span>Tổng ${range.label}</span><strong>${formatMoney(totalRevenue)}</strong></li>
        <li><span>Đơn kỷ bản cao nhất</span><strong>${escapeHtml(peak.label)} · ${formatMoney(peak.revenue)}</strong></li>
      </ul>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Số đơn theo tháng</h2><p>Đơn không bị huỷ</p></div>
      </header>
      ${barChart(months, { valueKey: "orders", format: (value) => `${value} đơn` })}
    </article>
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div><h2>14 ngày gần nhất</h2><p>Doanh thu theo ngày</p></div>
      </header>
      ${barChart(days, { valueKey: "revenue", height: 200 })}
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Khách hàng mới</h2><p>Số khách có đơn theo tháng</p></div>
      </header>
      ${barChart(growth, { valueKey: "customers", format: (value) => `${value}` })}
    </article>
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div><h2>Doanh thu theo điểm đến</h2><p>${destinations.length} tuyến đang bán</p></div>
      </header>
      ${donutChart(destinations.map((item) => ({ label: item.name, value: item.revenue })))}
      <ul class="report-legend">
        ${destinations
          .map(
            (item) =>
              `<li><span>${escapeHtml(item.name)} · ${item.orders} đơn</span><strong>${formatMoney(item.revenue)}</strong></li>`
          )
          .join("")}
      </ul>
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Hiệu suất từng tour</h2><p>Xếp theo doanh thu</p></div>
      </header>
      <div class="table-wrap table-wrap-flat">
        <table class="data-table">
          <thead>
            <tr><th>Tour</th><th>Đơn</th><th>Khách</th><th>Doanh thu</th><th>Tỉ trọng</th></tr>
          </thead>
          <tbody>
            ${
              tours.length
                ? tours
                    .map(
                      (tour) => `
              <tr>
                <td>${escapeHtml(tour.name)}<br><small>${escapeHtml(tour.location)}</small></td>
                <td>${tour.orders}</td>
                <td>${tour.people}</td>
                <td><strong>${formatMoney(tour.revenue)}</strong></td>
                <td>${totalRevenue ? Math.round((tour.revenue / totalRevenue) * 100) : 0}%</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="5" class="table-empty">Chưa có dữ liệu trong kỳ.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </article>
  </section>

  <section class="admin-grid admin-grid-2">
    <article class="panel">
      <header class="panel-head">
        <div><h2>Tình hình danh mục</h2><p>Toàn bộ ${listTours().length} tour</p></div>
      </header>
      ${donutChart(
        Object.entries(
          listTours().reduce((acc, tour) => {
            const key = tour.status;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {})
        ).map(([key, value]) => ({ label: TOUR_STATUS_TEXT[key] || key, value }))
      )}
    </article>

    <article class="panel">
      <header class="panel-head">
        <div><h2>Chất lượng dịch vụ</h2><p>Đánh giá khách hàng</p></div>
      </header>
      <ul class="summary-list">
        <li><span>Tổng số đánh giá</span><strong>${listReviews().length}</strong></li>
        <li><span>Đã duyệt</span><strong>${listReviews().filter((item) => item.status === "approved").length}</strong></li>
        <li><span>Chờ duyệt</span><strong>${listReviews().filter((item) => item.status === "pending").length}</strong></li>
        <li><span>Đơn chờ xác nhận</span><strong>${all.filter((item) => item.status === "pending").length}</strong></li>
        <li><span>Hotline công ty</span><strong>${escapeHtml(settings.hotline)}</strong></li>
        <li><span>${escapeHtml(BOOKING_STATUS.confirmed)}</span><strong>${all.filter((item) => item.status === "confirmed").length} đơn</strong></li>
      </ul>
      <p class="form-hint" style="text-align:left">Số liệu báo cáo được tính từ dữ liệu lưu trong trình duyệt của quản trị viên.</p>
    </article>
  </section>`;
}

const TOUR_STATUS_TEXT = { open: "Đang nhận khách", limited: "Sắp hết chỗ", closed: "Tạm ngưng" };

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.params?.section !== "reports") return;
  if (!document.getElementById("rp-export")) return;

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      RANGE = button.dataset.range;
      refreshAdmin();
    });
  });

  document.getElementById("rp-print")?.addEventListener("click", () => {
    if (!window.confirm("Mở hộp thoại in của trình duyệt?")) return;
    window.print();
  });

  document.getElementById("rp-export")?.addEventListener("click", () => {
    const scoped = rangeBookings();
    const summary = bookingSummary(scoped);

    downloadCsv(
      `bao-cao-${RANGES[RANGE].label.replace(/\s/g, "-")}-${stamp()}`,
      ["Báo cáo", "Giá trị"],
      [
        ["Khoảng thời gian", RANGES[RANGE].label],
        ["Tổng đơn", summary.total],
        ["Đơn xác nhận", summary.confirmed],
        ["Đơn chờ xử lý", summary.pending],
        ["Đơn huỷ", summary.cancelled],
        ["Doanh thu", summary.revenue],
        ["Giá trị đơn trung bình", summary.avgOrder],
        ["Lượt khách", summary.people],
        ["Số khách hàng", summary.customers],
        ["Tỉ lệ chốt (%)", summary.conversion],
        [],
        ["Doanh thu theo tháng", ""],
        ...revenueByMonth(scoped, RANGES[RANGE].months).map((item) => [item.label, item.revenue]),
        [],
        ["Top tour", ""],
        ...topTours(scoped, 8).map((item) => [item.name, item.revenue]),
        [],
        ["Doanh thu theo điểm đến", ""],
        ...revenueByDestination(scoped).map((item) => [item.name, item.revenue]),
      ]
    );
  });
});
