import crypto from "node:crypto";
import { createRequireAuth } from "../auth.js";
import { toPublicCustomer } from "../db.js";
import { HttpError } from "../http.js";
import { createRateLimiter } from "../rateLimit.js";
import { hashPassword, signToken, verifyPassword } from "../security.js";
import { USER_ID_PATTERN, USER_ID_RULE_MESSAGE, validateRegistration } from "../validators.js";

export function registerAuthRoutes(router, { store, config }) {
  const authLimiter = createRateLimiter(config.authRateLimit);
  const lookupLimiter = createRateLimiter(config.lookupRateLimit);
  const requireAuth = createRequireAuth({ store, config });

  // Used when the User ID doesn't exist, so a login takes the same time either way
  // (otherwise response time would reveal which User IDs are registered).
  let decoyHash;
  const getDecoyHash = async () => (decoyHash ??= await hashPassword(crypto.randomUUID()));

  /** GET /api/auth/check-userid/:userId  ->  { userId, available } */
  router.get("/api/auth/check-userid/:userId", lookupLimiter, (ctx) => {
    const userId = ctx.params.userId.trim();
    if (!USER_ID_PATTERN.test(userId)) throw new HttpError(400, USER_ID_RULE_MESSAGE);

    ctx.json(200, { userId, available: !store.findByUserId(userId) });
  });

  /** POST /api/auth/register  ->  201 { customer } */
  router.post("/api/auth/register", authLimiter, async (ctx) => {
    const { error, value } = validateRegistration(ctx.body);
    if (error) throw new HttpError(400, error);

    // Hash first, then check-and-insert with no `await` in between, so two people
    // registering the same User ID at the same moment can't both succeed.
    const passwordHash = await hashPassword(value.password);

    if (store.findByUserId(value.userId)) {
      throw new HttpError(409, "User ID already exists. Please choose another User ID.");
    }
    if (store.findByEmail(value.email)) {
      throw new HttpError(409, "Email already exists. Please use another email.");
    }

    const customer = store.add({
      id: crypto.randomUUID(),
      userId: value.userId,
      name: value.name,
      address: value.address,
      email: value.email,
      phone: value.phone,
      aadhaarLast4: value.aadhaar.slice(-4), // the full Aadhaar number is deliberately not stored
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    ctx.json(201, { customer: toPublicCustomer(customer) });
  });

  /** POST /api/auth/login  ->  { token, expiresIn, customer } */
  router.post("/api/auth/login", authLimiter, async (ctx) => {
    const { userId, password } = ctx.body;
    if (typeof userId !== "string" || typeof password !== "string" || !userId.trim() || !password) {
      throw new HttpError(400, "Please enter User ID and Password.");
    }

    const customer = store.findByUserId(userId.trim());
    const passwordOk = await verifyPassword(password, customer?.passwordHash ?? (await getDecoyHash()));
    if (!customer || !passwordOk) {
      throw new HttpError(401, "Invalid User ID or Password.");
    }

    const token = signToken({ sub: customer.userId }, config.jwtSecret, config.tokenTtlSeconds);
    ctx.json(200, {
      token,
      expiresIn: config.tokenTtlSeconds,
      customer: toPublicCustomer(customer),
    });
  });

  /** GET /api/auth/me  ->  { customer }   (needs a token) */
  router.get("/api/auth/me", requireAuth, (ctx) => {
    ctx.json(200, { customer: toPublicCustomer(ctx.customer) });
  });
}
