import { currentTheme, toggleTheme } from "./theme.js";

/* nút trên header: bấm là đổi sáng/tối, trạng thái lưu lại cho lần sau */
export function initThemeToggle() {
  const sync = () => {
    const theme = currentTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối");
      button.setAttribute("title", dark ? "Chế độ sáng" : "Chế độ tối");
    });
  };

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-theme-toggle]")) return;
    toggleTheme();
    sync();
  });

  /* header được dựng lại mỗi lần đổi trang nên đồng bộ lại sau mỗi lần render */
  document.addEventListener("route:changed", sync);
  document.addEventListener("theme:changed", sync);
  sync();
}
