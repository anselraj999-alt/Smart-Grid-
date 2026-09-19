import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** .../Smart-Grid/backend */
export const BACKEND_ROOT = path.resolve(here, "..");
/** .../Smart-Grid  (the folder that contains html/, css/, javascript/, react/, backend/) */
export const PROJECT_ROOT = path.resolve(BACKEND_ROOT, "..");

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173", // React (Vite) dev server
  "http://127.0.0.1:5173",
  "http://localhost:5500", // VS Code Live Server
  "http://127.0.0.1:5500",
  "http://localhost:4000", // this backend serving the plain HTML version
  "null", // pages opened straight from disk (file://) send "Origin: null" - dev only
].join(",");

/**
 * Tiny .env reader so the backend needs no dependencies.
 * Real environment variables win over values in the file.
 */
function loadDotEnv(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return; // no .env file - that's fine
  }

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue; // blank line or comment

    let value = match[2];
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

export function loadConfig(overrides = {}) {
  loadDotEnv(path.join(BACKEND_ROOT, ".env"));

  const env = process.env;
  const isProduction = env.NODE_ENV === "production";

  let jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      throw new Error("JWT_SECRET must be set when NODE_ENV=production.");
    }
    jwtSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[config] JWT_SECRET is not set - using a random one. Everyone is logged out whenever the server restarts."
    );
  }

  return {
    port: Number(env.PORT ?? 4000),
    isProduction,
    jwtSecret,
    tokenTtlSeconds: Number(env.TOKEN_TTL_SECONDS ?? 7200),
    corsOrigins: (env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    dataFile: path.resolve(BACKEND_ROOT, env.DATA_FILE ?? "data/customers.json"),
    serveFrontend: env.SERVE_FRONTEND !== "false",
    seedDemoUser: env.SEED_DEMO_USER ? env.SEED_DEMO_USER === "true" : !isProduction,
    authRateLimit: { windowMs: 60_000, max: Number(env.AUTH_RATE_LIMIT_MAX ?? 20) },
    lookupRateLimit: { windowMs: 60_000, max: 60 },
    ...overrides,
  };
}
