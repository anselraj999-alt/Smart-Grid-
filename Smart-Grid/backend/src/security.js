import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

/* ---------- Passwords (scrypt, per-password random salt) ---------- */

/** Returns "scrypt$<salt hex>$<hash hex>". The plain password is never stored. */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/* ---------- Login tokens (standard HS256 JWT format) ---------- */

const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest();
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

export function signToken(payload, secret, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ ...payload, iat: now, exp: now + ttlSeconds });
  const signature = hmac(secret, `${header}.${body}`).toString("base64url");
  return `${header}.${body}.${signature}`;
}

/** Returns the token payload, or null if the token is malformed, tampered with or expired. */
export function verifyToken(token, secret) {
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = hmac(secret, `${header}.${body}`);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const head = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (head.alg !== "HS256") return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
