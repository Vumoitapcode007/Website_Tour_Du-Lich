import "./style.css";
import { createRouter } from "./router.js";
import { renderHeader, renderFooter } from "./components/layout.js";
import { Home } from "./pages/home.js";
import { About } from "./pages/about.js";

function NotFound() {
  return `
  <section class="page-hero">
    <div class="container center">
      <h1>404 - Không tìm thấy trang</h1>
      <p>Trang bạn đang tìm đã không tồn tại.</p>
      <a class="btn btn-primary" href="#/">Trang chủ</a>
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
    path: "about",
    title: "Giới thiệu",
    render: About,
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
  const anchor = event.target.closest("a[href^='#/']");
  if (anchor) return;
  const toggle = event.target.closest(".nav-toggle");
  if (toggle) {
    document.querySelector(".menu-wrap").classList.toggle("open");
  }
});