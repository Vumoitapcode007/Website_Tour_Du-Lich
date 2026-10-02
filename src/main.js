import "./style.css";
import { createRouter } from "./router.js";
import { renderHeader, renderFooter } from "./components/layout.js";
import { getSession, isStaffRole, logout } from "./auth.js";
import { Home } from "./pages/home.js";
import { Tours } from "./pages/tours.js";
import { Compare } from "./pages/compare.js";
import { TourDetail } from "./pages/tour-detail.js";
import { Booking } from "./pages/booking.js";
import { About } from "./pages/about.js";
import { Contact } from "./pages/contact.js";
import { Login } from "./pages/login.js";
import { Register } from "./pages/register.js";
import { Account } from "./pages/account.js";
import { closeAdminShell, renderAdminShell } from "./components/admin-shell.js";
import "./components/tour-tools.js";
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
    path: "compare",
    title: "So sánh tour",
    render: Compare,
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
    path: "account",
    title: "Tài khoản của tôi",
    render: Account,
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

function clearAuthAlert() {
  const alertEl = document.getElementById("auth-alert");
  if (alertEl) {
    alertEl.className = "auth-alert hidden";
    alertEl.innerHTML = "";
  }
}

// Xử lý chuyển đổi giữa Đăng nhập và Đăng ký trên trang Auth
function switchAuthTab(targetTab) {
  clearAuthAlert();
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");

  if (!formLogin || !formRegister) return;

  if (targetTab === "register") {
    formLogin.classList.add("hidden");
    formRegister.classList.remove("hidden");
    tabLogin?.classList.remove("active");
    tabRegister?.classList.add("active");
    window.location.hash = "#/register";
  } else {
    formRegister.classList.add("hidden");
    formLogin.classList.remove("hidden");
    tabRegister?.classList.remove("active");
    tabLogin?.classList.add("active");
    window.location.hash = "#/login";
  }
}

// Lắng nghe sự kiện click toàn cục
document.addEventListener("click", (event) => {
  // Mobile Nav Hamburger Toggle
  const toggle = event.target.closest(".nav-toggle");
  if (toggle) {
    document.querySelector(".menu-wrap")?.classList.toggle("open");
    return;
  }

  // User dropdown menu toggle
  const userBtn = event.target.closest("#btn-user-menu");
  if (userBtn) {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown) dropdown.classList.toggle("show");
    return;
  }

  // Đóng dropdown khi click ra ngoài
  if (!event.target.closest(".user-menu-dropdown")) {
    document.getElementById("user-dropdown")?.classList.remove("show");
  }

  // Chuyển tab Auth
  const clickedTabLogin = event.target.closest("#tab-login") || event.target.closest("#link-to-login");
  if (clickedTabLogin) {
    event.preventDefault();
    switchAuthTab("login");
    return;
  }

  const clickedTabReg = event.target.closest("#tab-register") || event.target.closest("#link-to-register");
  if (clickedTabReg) {
    event.preventDefault();
    switchAuthTab("register");
    return;
  }

  // Toggle ẩn/hiện mật khẩu
  const toggleEye = event.target.closest(".toggle-password");
  if (toggleEye) {
    const targetId = toggleEye.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (input) {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleEye.classList.toggle("active", isPassword);
      toggleEye.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
            <line x1="2" x2="22" y1="2" y2="22"></line>
          </svg>`
        : `<svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>`;
    }
    return;
  }

  // Quên mật khẩu
  if (event.target.closest("#btn-forgot-password")) {
    const emailPrompt = prompt("Nhập email tài khoản cần khôi phục mật khẩu:", "demo@travelgo.vn");
    if (emailPrompt) {
      alert(`Liên kết đặt lại mật khẩu đã được gửi đến: ${emailPrompt} (Giả lập). Vui lòng kiểm tra hộp thư!`);
    }
    return;
  }

  // Đăng xuất
  if (event.target.closest("#btn-header-logout") || event.target.closest("#btn-logout-page")) {
    logout();
    router.navigate();
    return;
  }

  // Đăng nhập nhanh bằng Google / Facebook (Demo trải nghiệm)
  if (event.target.closest("#btn-google-login")) {
    register({
      name: "Google Traveler",
      email: "google.user@travelgo.vn",
      password: "password123",
    });
    showAuthAlert("Đăng nhập thành công với tài khoản Google!", "success");
    setTimeout(() => {
      window.location.hash = "#/";
    }, 700);
    return;
  }

  if (event.target.closest("#btn-facebook-login")) {
    register({
      name: "Facebook Member",
      email: "facebook.user@travelgo.vn",
      password: "password123",
    });
    showAuthAlert("Đăng nhập thành công với Facebook!", "success");
    setTimeout(() => {
      window.location.hash = "#/";
    }, 700);
    return;
  }

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

  const accountLink = event.target.closest('a[href="#/account"]');
  if (accountLink && !getSession()) {
    event.preventDefault();
    window.location.hash = "#/login?next=account";
  }
});

// Xử lý Submit Form Đăng nhập & Đăng ký
document.addEventListener("submit", (event) => {
  // Form Đăng nhập
  if (event.target.id === "form-login") {
    event.preventDefault();
    clearAuthAlert();

    const email = document.getElementById("login-email")?.value;
    const password = document.getElementById("login-password")?.value;
    const btnSubmit = document.getElementById("btn-submit-login");

    if (!email || !password) {
      showAuthAlert("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Đang xử lý...";
      }

      const user = login(email, password);
      showAuthAlert(`Đăng nhập thành công! Chào mừng bạn, ${user.name}.`, "success");

      setTimeout(() => {
        window.location.hash = "#/";
      }, 700);
    } catch (err) {
      showAuthAlert(err.message || "Đăng nhập thất bại!", "error");
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Đăng nhập</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m9 18 6-6-6-6"/>
          </svg>`;
      }
    }
    return;
  }

  // Form Đăng ký
  if (event.target.id === "form-register") {
    event.preventDefault();
    clearAuthAlert();

    const name = document.getElementById("reg-name")?.value;
    const email = document.getElementById("reg-email")?.value;
    const phone = document.getElementById("reg-phone")?.value || "";
    const password = document.getElementById("reg-password")?.value;
    const confirmPassword = document.getElementById("reg-confirm-password")?.value;
    const agree = document.getElementById("reg-agree")?.checked;
    const btnSubmit = document.getElementById("btn-submit-register");

    if (!agree) {
      showAuthAlert("Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!");
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!");
      return;
    }

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Đang tạo tài khoản...";
      }

      const user = register({ name, email, password, phone });
      showAuthAlert(`Đăng ký thành công! Chào mừng ${user.name} đến với TravelGo.`, "success");

      setTimeout(() => {
        window.location.hash = "#/";
      }, 900);
    } catch (err) {
      showAuthAlert(err.message || "Đăng ký không thành công!", "error");
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Đăng ký tài khoản</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m9 18 6-6-6-6"/>
          </svg>`;
      }
    }
    return;
  }
});

// Khi auth trạng thái thay đổi -> cập nhật lại view
document.addEventListener("auth:changed", () => {
  router.navigate();
});
