import { parseCookies, serializeCookie } from "./crypto.mjs";
import { Sessions } from "./data.mjs";

export const COOKIE = "jdvo_session";
export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
export const redirect = (location, extraHeaders = {}) => {
  const h = new Headers({ location });
  for (const [k, v] of Object.entries(extraHeaders)) h.append(k, v);
  return new Response(null, { status: 302, headers: h });
};
export async function getSession(req) {
  const c = parseCookies(req.headers.get("cookie") || "");
  return Sessions.fromRaw(c[COOKIE]);
}
export const sessionCookie = (raw, maxAgeSec) => serializeCookie(COOKIE, raw, { maxAgeSec });
export const clearCookie = () => serializeCookie(COOKIE, "", { expires: true });
export const reqMeta = (req) => ({
  ip: (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim(),
  ua: req.headers.get("user-agent") || "",
});

export async function requireAdmin(req){ const s = await getSession(req); return (s && s.is_admin) ? s : null; }
