import "./style.css";
import { createRouter } from "./router.js";
import { renderHeader, renderFooter } from "./components/layout.js";
import { getSession, isStaffRole, logout } from "./auth.js";
import { Home } from "./pages/home.js";
import { Tours } from "./pages/tours.js";
import { TourDetail } from "./pages/tour-detail.js";
import { Booking } from "./pages/booking.js";
import { About } from "./pages/about.js";
import { Contact } from "./pages/contact.js";
import { Login } from "./pages/login.js";
import { Register } from "./pages/register.js";
import { closeAdminShell, renderAdminShell } from "./components/admin-shell.js";
import { Dashboard } from "./pages/admin/dashboard.js";
import { Bookings } from "./pages/admin/bookings.js";
import { Tours as AdminTours } from "./pages/admin/tours.js";
import { Customers } from "./pages/admin/customers.js";
import { Messages } from "./pages/admin/messages.js";
import { Reviews } from "./pages/admin/reviews.js";
import { Promotions } from "./pages/admin/promotions.js";
import { Reports } from "./pages/admin/reports.js";
import { Users } from "./pages/admin/users.js";
import { Settings } from "./pages/admin/settings.js";
import { Logs } from "./pages/admin/logs.js";
import { Profile } from "./pages/admin/profile.js";
import { AdminNotFound } from "./pages/admin/not-found.js";

function NotFound() {
  return `
  <section class="page-hero">
    <div class="container center">
      <h1>404 - Không tìm thấy trang</h1>
      <p>Trang bạn đang tìm đã không tồn tại.</p>
      <a class="btn btn-light" href="#/tours">Xem danh sách tour</a>
    </div>
  </section>`;
}

const ADMIN_PAGES = {
  dashboard: { render: Dashboard, title: "Bảng điều khiển" },
  bookings: { render: Bookings, title: "Quản lý đơn đặt tour" },
  tours: { render: AdminTours, title: "Quản lý tour" },
  customers: { render: Customers, title: "Khách hàng" },
  messages: { render: Messages, title: "Tin nhắn liên hệ" },
  reviews: { render: Reviews, title: "Đánh giá tour" },
  promotions: { render: Promotions, title: "Khuyến mãi" },
  reports: { render: Reports, title: "Báo cáo kinh doanh" },
  users: { render: Users, title: "Quản lý tài khoản" },
  settings: { render: Settings, title: "Cài đặt hệ thống" },
  logs: { render: Logs, title: "Nhật ký hoạt động" },
  profile: { render: Profile, title: "Hồ sơ cá nhân" },
};

const routes = [
  {
    path: "",
    title: "Trang chủ",
    render: Home,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "tours",
    title: "Danh sách tour",
    render: Tours,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "tour/:id",
    title: "Chi tiết tour",
    render: TourDetail,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "booking",
    title: "Đặt tour",
    render: Booking,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "about",
    title: "Giới thiện",
    render: About,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "contact",
    title: "Liên hệ",
    render: Contact,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "login",
    title: "Đăng nhập",
    render: Login,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "register",
    title: "Đăng ký tài khoản",
    render: Register,
    layout: renderHeader,
    footer: renderFooter,
  },
  {
    path: "admin",
    title: "Bảng điều khiển",
    render: (path, params, query) => Dashboard(path, params, query),
    layout: renderAdminShell,
    footer: closeAdminShell,
  },
  {
    path: "admin/:section",
    title: (path, params) =>
      ADMIN_PAGES[params.section]?.title || "Không tìm thấy mục quản trị",
    render: (path, params, query) => {
      const page = ADMIN_PAGES[params.section];
      return page ? page.render(path, params, query) : AdminNotFound(path, params, query);
    },
    layout: renderAdminShell,
    footer: closeAdminShell,
  },
  {
    path: "404",
    title: "Không tìm thấy",
    render: NotFound,
    layout: renderHeader,
    footer: renderFooter,
  },
];

const router = createRouter(routes);

document.addEventListener("app:refresh", () => router.navigate());

document.addEventListener("click", (event) => {
  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) {
    event.preventDefault();
    logout();
    window.location.hash = "#/";
    return;
  }

  const adminLink = event.target.closest('a[href^="#/admin"]');
  if (adminLink && !isStaffRole(getSession()?.roleKey)) {
    event.preventDefault();
    window.location.hash = `#/login?next=${encodeURIComponent(adminLink.getAttribute("href").slice(1))}`;
    return;
  }

  const toggle = event.target.closest(".nav-toggle");
  if (!toggle) return;

  const wrap = document.querySelector(".menu-wrap");
  const isOpen = wrap.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});
