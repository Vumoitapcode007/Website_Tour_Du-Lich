const THEME_KEY = "travelgo.theme";
const THEME_COLOR = { light: "#1677ff", dark: "#0b1220" };

/* trình duyệt riêng tư hoặc bị chặn lưu trữ thì bỏ qua, không làm hỏng trang */
const store = {
  get() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* bỏ qua */
    }
  },
};

/* đọc lựa chọn đã lưu, không có thì theo hệ điều hành */
export function preferredTheme() {
  const saved = store.get();
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/* gắn theme lên <html> để CSS áp dụng ngay, không nháy trắng khi tải trang */
export function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  store.set(next);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[next]);
  window.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: next } }));
  return next;
}

export function toggleTheme() {
  return applyTheme(currentTheme() === "dark" ? "light" : "dark");
}

/* gọi sớm trong main.js: áp theme trước khi vẽ giao diện */
export function initTheme() {
  const theme = preferredTheme();
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
  return theme;
}
