import { Tokens, Sessions, Events } from "./_lib/data.mjs";
import { redirect, sessionCookie, reqMeta } from "./_lib/http.mjs";
export const config = { path: "/client-area/open" };
export default async (req) => {
  const raw = new URL(req.url).searchParams.get("t") || "";
  const res = await Tokens.consume(raw);
  if (res.error) return redirect(`/client-area/?error=${encodeURIComponent(res.error)}`);
  const { raw: sid, maxAgeSec } = await Sessions.create(res.email, res.is_admin);
  const { ip, ua } = reqMeta(req);
  await Events.log("link_opened", { deliveryId: res.delivery_id, email: res.email, ip, ua });
  const dest = res.is_admin ? "/client-area/admin/"
    : res.delivery_id ? `/client-area/?d=${encodeURIComponent(res.delivery_id)}` : "/client-area/";
  return redirect(dest, { "set-cookie": sessionCookie(sid, maxAgeSec) });
};
