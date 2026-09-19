export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USER_ID_PATTERN = /^[A-Za-z0-9_.-]{3,32}$/;
export const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const USER_ID_RULE_MESSAGE =
  "User ID must be 3-32 characters: letters, numbers, dots, hyphens or underscores.";

/**
 * Checks the registration form. Returns { error } with the first problem found
 * (one message at a time, like the UI shows), or { value } with cleaned-up data.
 */
export function validateRegistration(body) {
  const text = (v) => (typeof v === "string" ? v.trim() : "");

  const name = text(body.name);
  const address = text(body.address);
  const email = text(body.email);
  const userId = text(body.userId);
  const phoneRaw = text(body.phone);
  const aadhaarRaw = text(body.aadhaar);
  const password = typeof body.password === "string" ? body.password : "";

  if (![name, address, email, userId, phoneRaw, aadhaarRaw, password].every(Boolean)) {
    return { error: "Please fill in all fields." };
  }
  if (name.length > 100 || address.length > 200 || email.length > 254) {
    return { error: "Name, address or email is too long." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const phone = phoneRaw.replace(/\D/g, "");
  if (!/^\d{10}$/.test(phone)) {
    return { error: "Please enter a valid 10-digit contact number." };
  }

  const aadhaar = aadhaarRaw.replace(/\D/g, "");
  if (!/^\d{12}$/.test(aadhaar)) {
    return { error: "Aadhaar must contain exactly 12 digits. Use dummy data only." };
  }

  if (!USER_ID_PATTERN.test(userId)) {
    return { error: USER_ID_RULE_MESSAGE };
  }
  if (!STRONG_PASSWORD_PATTERN.test(password)) {
    return {
      error:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
    };
  }
  if (password.length > 128) {
    return { error: "Password must be at most 128 characters." };
  }

  return { value: { name, address, email, userId, phone, aadhaar, password } };
}
