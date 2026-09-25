export function createRouter(routes, root = "app") {
  const app = document.getElementById(root);
  console.log(app)

  function currentPath() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return decodeURIComponent(hash).trim();
  }

  function navigate() {
    const path = currentPath();
    const route =
      routes.find((r) => r.path === path) ||
      routes.find((r) => r.path === "404") ||
      routes[0];

    document.title = route.title
      ? `${route.title} - TravelGo`
      : "TravelGo - Đặt tour du lịch";

    app.innerHTML = `${route.layout(path)}${route.render(path)}${route.footer(path)}`;
    window.scrollTo({ top: 0, behavior: "auto" });

    document.dispatchEvent(new CustomEvent("route:changed", { detail: { path } }));
  }

  function go(path) {
    window.location.hash = `#/${path}`;
  }

  window.addEventListener("hashchange", navigate);

  if (!window.location.hash) {
    window.location.hash = "#/";
  }

  navigate();
  return { navigate, go, currentPath };
}

export function link(path, label, extra = "") {
  const href = `#/${path}`;
  return `<a href="${href}" rel="router" ${extra}>${label}</a>`;
}