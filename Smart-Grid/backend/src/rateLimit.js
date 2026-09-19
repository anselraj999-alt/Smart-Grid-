import { HttpError } from "./http.js";

/**
 * Fixed-window, in-memory rate limiter (per client IP). Returns a handler you can
 * put in front of a route. Good enough for one server process; use a shared store
 * (e.g. Redis) if you ever run several copies. Behind a reverse proxy every request
 * looks like it comes from the proxy, so limit there or read X-Forwarded-For.
 */
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  return function rateLimit(ctx) {
    const key = ctx.req.socket.remoteAddress ?? "unknown";
    const now = Date.now();

    if (hits.size > 5000) {
      for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
    }

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      throw new HttpError(429, "Too many attempts. Please wait a minute and try again.", {
        "Retry-After": String(retryAfter),
      });
    }
  };
}
