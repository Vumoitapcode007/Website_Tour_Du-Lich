import "./style.css";
import { createRouter } from "./router.js";
import { renderHeader, renderFooter } from "./components/layout.js";
import { Home } from "./pages/home.js";
import { Tours } from "./pages/tours.js";
import { TourDetail } from "./pages/tour-detail.js";
import { Booking } from "./pages/booking.js";
import { About } from "./pages/about.js";
import { Contact } from "./pages/contact.js";

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
    title: "Giới thiệu",
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
    path: "404",
    title: "Không tìm thấy",
    render: NotFound,
    layout: renderHeader,
    footer: renderFooter,
  },
];

createRouter(routes);

document.addEventListener("click", (event) => {
  const toggle = event.target.closest(".nav-toggle");
  if (!toggle) return;

  const wrap = document.querySelector(".menu-wrap");
  const isOpen = wrap.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});
