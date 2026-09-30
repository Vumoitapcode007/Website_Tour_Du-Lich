import { ADMIN_NAV, ADMIN_SECTIONS, adminSection } from "../../components/admin-shell.js";
import { escapeHtml } from "../../validate.js";
import { hasPermission } from "../../auth.js";

export function AdminNotFound() {
  const links = ADMIN_NAV.flatMap((group) => group.items).filter((item) => hasPermission(item.perm));

  return `
  <section class="admin-notfound">
    <span class="admin-notfound-code">404</span>
    <h2>Không tìm thấy mục quản trị này</h2>
    <p>Đường dẫn bạn truy cập không thuộc khu vực quản trị của TravelGo.</p>
    <div class="admin-notfound-links">
      ${links
        .map(
          (item) =>
            `<a class="btn btn-sm btn-outline" href="#/admin/${item.path}">${escapeHtml(item.label)}</a>`
        )
        .join("")}
    </div>
    <p class="admin-stamp">Các mục hợp lệ: ${Object.keys(ADMIN_SECTIONS).join(", ")}</p>
    <a class="btn btn-primary" href="#/admin/${adminSection()}">Về bảng điều khiển</a>
  </section>`;
}
