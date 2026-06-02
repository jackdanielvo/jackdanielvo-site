// Central settings, mirrored from the WordPress plugin defaults.
export const SETTINGS = {
  senderName:  "Jack Daniel",
  senderEmail: "jack@jackdanielvo.com",
  senderPhone: "805.630.5530",
  siteName:    "Jack Daniel VO",
  siteUrl:     process.env.SITE_URL || "https://jackdanielvo.com",
  adminEmail:  (process.env.ADMIN_EMAIL || "jack@jackdanielvo.com").toLowerCase(),
  tokenLifetimeDays:   14,
  sessionLifetimeDays: 14,
  fileLifetimeDays:    90,
};

export const BRAND = {
  bg: "#FAF9F5", text: "#363636", textMuted: "#8a8a86",
  violet: "#3C0350", gold: "#B88A3E", creamPanel: "#EDE6D3",
  green: "#37AF5D", line: "rgba(54,54,54,0.14)",
};

// File labels (same keys/wording as the plugin).
export const LABELS = {
  final_approved: "Final Approved",
  cutdown: "Cutdown",
  pickup: "Pickup / Alts",
  reference: "Reference",
  raw: "Raw / Unprocessed",
};
export const labelHuman = (k) => LABELS[k] || (k || "").replace(/_/g, " ");

export const ALLOWED_EXTS = ["wav", "mp3", "aiff", "aif", "flac", "m4a", "ogg"];

export function formatSize(bytes = 0) {
  bytes = Number(bytes) || 0;
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}
