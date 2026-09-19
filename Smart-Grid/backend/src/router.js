import { HttpError } from "./http.js";

/**
 * A very small router: exact paths plus ":param" segments.
 * Each route has one or more handlers (middleware first, final handler last).
 */
export function createRouter() {
  const routes = [];

  function add(method, pattern, handlers) {
    const keys = [];
    const source = pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });
    routes.push({ method, keys, regex: new RegExp(`^${source}/?$`), handlers });
  }

  return {
    get: (pattern, ...handlers) => add("GET", pattern, handlers),
    post: (pattern, ...handlers) => add("POST", pattern, handlers),

    /** Returns { handlers, params } on a match, or { pathMatched } when nothing fits. */
    match(method, pathname) {
      let pathMatched = false;

      for (const route of routes) {
        const found = route.regex.exec(pathname);
        if (!found) continue;

        pathMatched = true;
        if (route.method !== method) continue;

        const params = {};
        route.keys.forEach((key, index) => {
          try {
            params[key] = decodeURIComponent(found[index + 1]);
          } catch {
            throw new HttpError(400, "Malformed URL.");
          }
        });
        return { handlers: route.handlers, params };
      }

      return { pathMatched };
    },
  };
}
