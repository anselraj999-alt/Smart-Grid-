import { HttpError, readJsonBody, sendJson } from "./http.js";
import { PROJECT_ROOT } from "./config.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerDashboardRoutes } from "./routes/dashboard.js";
import { createRouter } from "./router.js";
import { createStaticServer } from "./static.js";

/**
 * Builds the request handler for http.createServer().
 * `store` holds the customers, `config` comes from loadConfig().
 */
export function createApp({ store, config, projectRoot = PROJECT_ROOT }) {
  const router = createRouter();
  registerAuthRoutes(router, { store, config });
  registerDashboardRoutes(router, { store, config });
  router.get("/api/health", (ctx) => ctx.json(200, { status: "ok", time: new Date().toISOString() }));

  const serveStatic = config.serveFrontend ? createStaticServer(projectRoot) : null;

  function applyHeaders(req, res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");

    // CORS: only browsers on the allow-list may call the API from another origin.
    const origin = req.headers.origin;
    if (origin && (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Vary", "Origin");
    }
  }

  async function handleApi(req, res, url) {
    const match = router.match(req.method, url.pathname);
    if (!match.handlers) {
      if (match.pathMatched) throw new HttpError(405, "Method not allowed.");
      throw new HttpError(404, "Not found.");
    }

    const ctx = {
      req,
      res,
      url,
      params: match.params,
      body: req.method === "POST" ? await readJsonBody(req) : {},
      customer: null,
      json: (status, body) => sendJson(res, status, body),
    };

    for (const handler of match.handlers) {
      await handler(ctx);
      if (res.writableEnded) return;
    }
    throw new Error(`Handler for ${req.method} ${url.pathname} did not send a response.`);
  }

  return async function handleRequest(req, res) {
    try {
      applyHeaders(req, res);
      const url = new URL(req.url, "http://localhost");

      if (req.method === "OPTIONS") {
        res.writeHead(204, { "Access-Control-Max-Age": "600" });
        res.end();
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }

      if (serveStatic && (req.method === "GET" || req.method === "HEAD")) {
        if (await serveStatic(req, res, url.pathname)) return;
      }

      throw new HttpError(404, "Not found.");
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message }, error.headers);
        return;
      }
      console.error(error);
      if (res.headersSent) res.end();
      else sendJson(res, 500, { error: "Something went wrong on the server." });
    }
  };
}
