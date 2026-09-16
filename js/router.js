const routes = [];

export function addRoute(pattern, handler) {
  // pattern like "matchday/:id" -> regex with named groups
  const paramNames = [];
  const regexStr = "^" + pattern.replace(/:[^/]+/g, (m) => {
    paramNames.push(m.slice(1));
    return "([^/]+)";
  }) + "$";
  routes.push({ regex: new RegExp(regexStr), paramNames, handler });
}

export function navigate(hash) {
  window.location.hash = hash;
}

export async function handleRoute() {
  const raw = window.location.hash.replace(/^#\//, "") || "dashboard";
  const [path] = raw.split("?");
  for (const r of routes) {
    const match = r.regex.exec(path);
    if (match) {
      const params = {};
      r.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
      await r.handler(params);
      return;
    }
  }
  navigate("/dashboard");
}

export function startRouter() {
  window.addEventListener("hashchange", handleRoute);
}

export function currentBasePath() {
  const raw = window.location.hash.replace(/^#\//, "") || "dashboard";
  return raw.split("/")[0].split("?")[0];
}
