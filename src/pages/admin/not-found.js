import {
  ADMIN_NAV,
  ADMIN_SECTIONS,
  GUIDE_NAV,
  GUIDE_SECTIONS,
  adminSection,
  shellArea,
} from "../../components/admin-shell.js";
import { escapeHtml } from "../../validate.js";
import { hasPermission } from "../../auth.js";

export function AdminNotFound(path = "", params = {}) {
  const area = shellArea(path);
  const nav = area === "guide" ? GUIDE_NAV : ADMIN_NAV;
  const sections = area === "guide" ? GUIDE_SECTIONS : ADMIN_SECTIONS;
  const links = nav.flatMap((group) => group.items).filter((item) => hasPermission(item.perm));

  return `
  <section class="admin-notfound">
    <span class="admin-notfound-code">404</span>
    <h2>Không tìm thấy mục này</h2>
    <p>Đường dẫn bạn truy cập không thuộc khu vực ${
      area === "guide" ? "hướng dẫn viên" : "quản trị"
    } của TravelGo.</p>
    <div class="admin-notfound-links">
      ${links
        .map(
          (item) =>
            `<a class="btn btn-sm btn-outline" href="#/${area}/${item.path}">${escapeHtml(item.label)}</a>`
        )
        .join("")}
    </div>
    <p class="admin-stamp">Các mục hợp lệ: ${Object.keys(sections).join(", ")}</p>
    <a class="btn btn-primary" href="#/${area}/${adminSection("dashboard", area)}">Về bảng điều khiển</a>
  </section>`;
}