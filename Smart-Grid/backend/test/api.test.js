import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createApp } from "../src/app.js";
import { createStore } from "../src/db.js";
import { ensureDemoCustomer } from "../src/seed.js";
import { signToken } from "../src/security.js";

const SECRET = "test-secret";

const validRegistration = (overrides = {}) => ({
  name: "Asha Rao",
  address: "12 Lake Road, Pune",
  email: "asha@example.com",
  aadhaar: "1111 2222 3333",
  phone: "9123456780",
  userId: "asha_01",
  password: "Str0ng!Pass",
  ...overrides,
});

async function startServer(configOverrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smartgrid-test-"));
  const config = {
    jwtSecret: SECRET,
    tokenTtlSeconds: 3600,
    corsOrigins: ["http://localhost:5173"],
    serveFrontend: true,
    authRateLimit: { windowMs: 60_000, max: 1000 },
    lookupRateLimit: { windowMs: 60_000, max: 1000 },
    ...configOverrides,
  };
  const dataFile = path.join(dir, "customers.json");
  const store = createStore(dataFile);
  await ensureDemoCustomer(store);

  const server = http.createServer(createApp({ store, config }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, urlPath, { body, token, headers = {} } = {}) {
    const response = await fetch(base + urlPath, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: response.status, json, text, headers: response.headers };
  }

  return {
    call,
    dataFile,
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections?.();
      }),
  };
}

async function loginAs(api, userId, password) {
  const res = await api.call("POST", "/api/auth/login", { body: { userId, password } });
  assert.equal(res.status, 200, res.text);
  return res.json.token;
}

test("API", async (t) => {
  const api = await startServer();
  t.after(() => api.close());

  await t.test("health check", async () => {
    const res = await api.call("GET", "/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.json.status, "ok");
  });

  await t.test("demo account can log in (case-insensitive User ID) and never leaks the hash", async () => {
    const res = await api.call("POST", "/api/auth/login", {
      body: { userId: "customer001", password: "Demo@123" },
    });
    assert.equal(res.status, 200);
    assert.ok(res.json.token);
    assert.equal(res.json.customer.userId, "CUSTOMER001");
    assert.equal(res.json.customer.aadhaarMasked, "XXXX-XXXX-1234");
    assert.ok(!res.text.includes("passwordHash"));
    assert.ok(!res.text.includes("scrypt$"));
  });

  await t.test("wrong password and unknown user get the same 401 message", async () => {
    const wrong = await api.call("POST", "/api/auth/login", { body: { userId: "CUSTOMER001", password: "nope" } });
    const unknown = await api.call("POST", "/api/auth/login", { body: { userId: "ghost", password: "nope" } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.json.error, unknown.json.error);
  });

  await t.test("login with missing fields is a 400", async () => {
    const res = await api.call("POST", "/api/auth/login", { body: { userId: "CUSTOMER001" } });
    assert.equal(res.status, 400);
  });

  await t.test("invalid JSON body is a 400", async () => {
    const res = await api.call("POST", "/api/auth/login", { body: "{not json" });
    assert.equal(res.status, 400);
    assert.match(res.json.error, /JSON/);
  });

  await t.test("registration validation rules", async () => {
    const cases = [
      [{ name: "" }, /fill in all fields/],
      [{ email: "not-an-email" }, /valid email/],
      [{ phone: "12345" }, /10-digit/],
      [{ aadhaar: "1234" }, /12 digits/],
      [{ userId: "a b" }, /User ID must be/],
      [{ password: "weakpass" }, /Password must be/],
    ];
    for (const [override, pattern] of cases) {
      const res = await api.call("POST", "/api/auth/register", { body: validRegistration(override) });
      assert.equal(res.status, 400, JSON.stringify(override));
      assert.match(res.json.error, pattern);
    }
  });

  await t.test("register -> check availability -> login -> me -> dashboard", async () => {
    const before = await api.call("GET", "/api/auth/check-userid/asha_01");
    assert.deepEqual(before.json, { userId: "asha_01", available: true });

    const created = await api.call("POST", "/api/auth/register", { body: validRegistration() });
    assert.equal(created.status, 201, created.text);
    assert.equal(created.json.customer.aadhaarMasked, "XXXX-XXXX-3333");
    assert.equal(created.json.customer.phone, "9123456780");

    const after = await api.call("GET", "/api/auth/check-userid/ASHA_01");
    assert.equal(after.json.available, false);

    // Only the last four Aadhaar digits and a hash are stored on disk.
    const stored = fs.readFileSync(api.dataFile, "utf8");
    assert.ok(!stored.includes("111122223333"));
    assert.ok(!stored.includes("Str0ng!Pass"));

    const token = await loginAs(api, "asha_01", "Str0ng!Pass");

    const me = await api.call("GET", "/api/auth/me", { token });
    assert.equal(me.status, 200);
    assert.equal(me.json.customer.name, "Asha Rao");

    const dash = await api.call("GET", "/api/dashboard", { token });
    assert.equal(dash.status, 200);
    assert.equal(dash.json.stats.currentLoadKw, 742);
    assert.equal(dash.json.forecast.actualKw.length, 10);
    assert.equal(dash.json.forecast.predictedKw.length, 10);
    assert.equal(dash.json.alerts.length, 3);
  });

  await t.test("duplicate User ID and duplicate email are 409", async () => {
    const sameId = await api.call("POST", "/api/auth/register", {
      body: validRegistration({ userId: "ASHA_01", email: "other@example.com" }),
    });
    assert.equal(sameId.status, 409);
    assert.match(sameId.json.error, /User ID already exists/);

    const sameEmail = await api.call("POST", "/api/auth/register", {
      body: validRegistration({ userId: "someone_else", email: "ASHA@example.com" }),
    });
    assert.equal(sameEmail.status, 409);
    assert.match(sameEmail.json.error, /Email already exists/);
  });

  await t.test("two simultaneous registrations of one User ID: exactly one wins", async () => {
    const results = await Promise.all(
      [1, 2, 3].map((n) =>
        api.call("POST", "/api/auth/register", {
          body: validRegistration({ userId: "racer", email: `racer${n}@example.com` }),
        })
      )
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
  });

  await t.test("protected routes reject missing, garbage, tampered and expired tokens", async () => {
    assert.equal((await api.call("GET", "/api/dashboard")).status, 401);
    assert.equal((await api.call("GET", "/api/dashboard", { token: "garbage" })).status, 401);

    const good = await loginAs(api, "CUSTOMER001", "Demo@123");
    const [h, b, s] = good.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ sub: "asha_01", exp: 9999999999 })).toString("base64url");
    assert.equal((await api.call("GET", "/api/auth/me", { token: `${h}.${forgedBody}.${s}` })).status, 401);

    const expired = signToken({ sub: "CUSTOMER001" }, SECRET, -10);
    assert.equal((await api.call("GET", "/api/auth/me", { token: expired })).status, 401);

    const wrongSecret = signToken({ sub: "CUSTOMER001" }, "another-secret", 3600);
    assert.equal((await api.call("GET", "/api/auth/me", { token: wrongSecret })).status, 401);

    // A valid token for a user that no longer exists is rejected too.
    const orphan = signToken({ sub: "deleted-user" }, SECRET, 3600);
    assert.equal((await api.call("GET", "/api/auth/me", { token: orphan })).status, 401);
  });

  await t.test("CORS: allowed origin gets headers, others don't; preflight works", async () => {
    const allowed = await api.call("GET", "/api/health", { headers: { Origin: "http://localhost:5173" } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");

    const blocked = await api.call("GET", "/api/health", { headers: { Origin: "http://evil.example" } });
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);

    const preflight = await api.call("OPTIONS", "/api/auth/login", {
      headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" },
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get("access-control-allow-headers"), /Authorization/);
  });

  await t.test("unknown API route is 404, wrong method is 405", async () => {
    assert.equal((await api.call("GET", "/api/nope")).status, 404);
    assert.equal((await api.call("GET", "/api/auth/login")).status, 405);
  });

  await t.test("static server: serves the app, blocks path traversal", async () => {
    const page = await api.call("GET", "/");
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    assert.match(page.text, /SmartGrid AI/);

    assert.equal((await api.call("GET", "/css/styles.css")).status, 200);
    assert.equal((await api.call("GET", "/javascript/app.js")).status, 200);
    assert.equal((await api.call("GET", "/css/..%2f..%2fbackend%2fpackage.json")).status, 404);
    assert.equal((await api.call("GET", "/javascript/%2e%2e/backend/package.json")).status, 404);
  });
});

test("rate limiting: too many logins get a 429 with Retry-After", async (t) => {
  const api = await startServer({ authRateLimit: { windowMs: 60_000, max: 3 } });
  t.after(() => api.close());

  const statuses = [];
  let last;
  for (let i = 0; i < 5; i++) {
    last = await api.call("POST", "/api/auth/login", { body: { userId: "CUSTOMER001", password: "wrong" } });
    statuses.push(last.status);
  }
  assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
  assert.ok(Number(last.headers.get("retry-after")) > 0);
});
