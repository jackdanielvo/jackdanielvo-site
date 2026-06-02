import { Deliveries, Tokens } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
import { SETTINGS } from "./_lib/config.mjs";
export const config = { path: "/api/admin/links" };
export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const { delivery_id } = await req.json().catch(() => ({}));
  const d = await Deliveries.get(delivery_id);
  if (!d) return json({ error: "Delivery not found" }, 404);
  const origin = new URL(req.url).origin;
  const links = [];
  for (const email of (d.recipients || [])) {
    const raw = await Tokens.issue(email, d.id); // multi-use, 14-day
    links.push({ email, url: `${origin}/client-area/open?t=${raw}` });
  }
  return json({ ok: true, title: d.title, days: SETTINGS.tokenLifetimeDays, links });
};
