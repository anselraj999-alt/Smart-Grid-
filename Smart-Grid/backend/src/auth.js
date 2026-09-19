import { HttpError } from "./http.js";
import { verifyToken } from "./security.js";

/**
 * Handler that only lets requests through when they carry a valid
 * "Authorization: Bearer <token>" header. On success it sets ctx.customer.
 */
export function createRequireAuth({ store, config }) {
  return function requireAuth(ctx) {
    const header = ctx.req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    const payload = scheme === "Bearer" && token ? verifyToken(token, config.jwtSecret) : null;
    const customer = payload ? store.findByUserId(payload.sub) : null;

    if (!customer) {
      throw new HttpError(401, "Please log in again.");
    }
    ctx.customer = customer;
  };
}
