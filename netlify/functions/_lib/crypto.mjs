import { randomBytes, createHash } from "node:crypto";

// Random 64-char hex token (matches the plugin's bin2hex(random_bytes(32))).
export const randomToken = () => randomBytes(32).toString("hex");
export const sha256hex = (s) => createHash("sha256").update(String(s)).digest("hex");
export const isHexToken = (s) => typeof s === "string" && /^[0-9a-f]{64}$/i.test(s);

export function daysFromNow(days) {
  return new Date(Date.now() + days * 86400_000).toISOString();
}
export const isExpired = (iso) => !iso || new Date(iso).getTime() < Date.now();

// --- Cookie helpers ---
export function parseCookies(header = "") {
  const out = {};
  (header || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
export function serializeCookie(name, value, { maxAgeSec, expires = false } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  if (expires) c += "; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  else if (maxAgeSec) c += `; Max-Age=${maxAgeSec}`;
  return c;
}
