// Full detail for one delivery (files, recipients, note) plus its activity log.
// Admin session required.
import { Deliveries, Events, Clients } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";

export const config = { path: "/api/admin/delivery" };

export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const { delivery_id } = await req.json().catch(() => ({}));
  const d = await Deliveries.get(delivery_id);
  if (!d) return json({ error: "Delivery not found" }, 404);
  if (d.client_id) { try { d.client = await Clients.get(d.client_id); } catch {} }
  const events = await Events.forDelivery(delivery_id);
  return json({ ok: true, delivery: d, events });
};
