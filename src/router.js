function matchRoute(routes, path) {
  for (const route of routes) {
    if (!route.path.includes(":")) {
      if (route.path === path) return { route, params: {} };
      continue;
    }

    const keys = [];
    const pattern = route.path
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      });

    const matched = new RegExp(`^${pattern}$`).exec(path);
    if (matched) {
      return {
        route,
        params: Object.fromEntries(
          keys.map((key, index) => [key, decodeURIComponent(matched[index + 1])])
        ),
      };
    }
  }
  return null;
}

export function createRouter(routes, root = "app") {
  const app = document.getElementById(root);

  function parseHash() {
    const raw = window.location.hash.replace(/^#\/?/, "");
    const [pathPart, ...rest] = raw.split("?");
    return {
      path: decodeURIComponent(pathPart).trim(),
      queryString: rest.join("?"),
    };
  }

  function currentPath() {
    return parseHash().path;
  }

  function currentQuery() {
    return new URLSearchParams(parseHash().queryString);
  }

  function navigate() {
    const { path, queryString } = parseHash();
    const query = new URLSearchParams(queryString);
    const matched = matchRoute(routes, path);
    const route = matched?.route || routes.find((r) => r.path === "404") || routes[0];
    const params = matched?.params || {};

    document.title = route.title
      ? `${route.title} - TravelGo`
      : "TravelGo - Đặt tour du lịch";

    app.innerHTML = `${route.layout(path)}${route.render(path, params, query)}${route.footer(path)}`;
    window.scrollTo({ top: 0, behavior: "auto" });
    app.querySelector(".menu-wrap")?.classList.remove("open");

    document.dispatchEvent(
      new CustomEvent("route:changed", { detail: { path, params, query, queryString } }
      )
    );
  }

  function go(path) {
    window.location.hash = `#/${path}`;
  }

  window.addEventListener("hashchange", navigate);

  if (!window.location.hash) {
    window.location.hash = "#/";
  }

  navigate();
  return { navigate, go, currentPath, currentQuery };
}

export function link(path, label, extra = "") {
  const href = `#/${path}`;
  return `<a href="${href}" rel="router" ${extra}>${label}</a>`;
}
