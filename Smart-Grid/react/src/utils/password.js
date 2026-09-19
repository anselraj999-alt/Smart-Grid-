/** Same scoring as the original app: 5 checks -> Weak / Medium / Strong. */
export function getPasswordStrength(password) {
  if (!password) return { label: "Weak", width: "0%", color: undefined };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", width: "30%", color: "#dc2626" };
  if (score <= 4) return { label: "Medium", width: "65%", color: "#f59e0b" };
  return { label: "Strong", width: "100%", color: "#16a34a" };
}
