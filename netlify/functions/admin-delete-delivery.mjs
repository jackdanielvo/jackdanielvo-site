// Permanently delete a delivery: its R2 files, its activity events, and the
// delivery record itself. Admin session required. Triggered by the admin from
// the dashboard (with a confirmation prompt in the UI).
import { Deliveries, Events } from "./_lib/data.mjs";
import { deleteObject } from "./_lib/r2.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";

export const config = { path: "/api/admin/delete-delivery" };

export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const { delivery_id } = await req.json().catch(() => ({}));
  const d = await Deliveries.get(delivery_id);
  if (!d) return json({ error: "Delivery not found" }, 404);

  for (const f of (d.files || [])) {
    if (f.r2_key) { try { await deleteObject(f.r2_key); } catch {} }
  }
  await Events.deleteForDelivery(delivery_id);
  await Deliveries.remove(delivery_id);

  return json({ ok: true });
};
