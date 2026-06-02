import { Sessions } from "./_lib/data.mjs";
import { parseCookies } from "./_lib/crypto.mjs";
import { redirect, clearCookie, COOKIE } from "./_lib/http.mjs";
export const config = { path: "/client-area/logout" };
export default async (req) => {
  const c = parseCookies(req.headers.get("cookie") || "");
  await Sessions.destroy(c[COOKIE]);
  return redirect("/client-area/", { "set-cookie": clearCookie() });
};
