/** "742" + " kW" -> "742 kW"; shows a dash while data is still loading. */
export const show = (value, suffix = "") =>
  value === undefined || value === null ? "—" : `${value}${suffix}`;

const STATUS_CLASS = {
  low: "green-text",
  stable: "green-text",
  medium: "orange-text",
  high: "red-text",
  critical: "red-text",
  unstable: "red-text",
};

/** CSS class that colours a status word (Low / Stable = green, Medium = orange, High = red). */
export const statusClass = (status) => STATUS_CLASS[String(status).toLowerCase()] ?? "";
