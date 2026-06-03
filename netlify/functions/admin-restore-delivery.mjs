// Restore a soft-deleted delivery from Trash. Admin session required.
import { Deliveries } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";

export const config = { path: "/api/admin/restore-delivery" };

export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const { delivery_id } = await req.json().catch(() => ({}));
  const d = await Deliveries.get(delivery_id);
  if (!d) return json({ error: "Delivery not found" }, 404);
  delete d.deleted_at;
  await Deliveries.save(d);
  return json({ ok: true });
};
