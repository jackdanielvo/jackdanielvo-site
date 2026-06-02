import { Deliveries } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
export const config = { path: "/api/admin/deliveries" };
export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const d = await req.json().catch(() => ({}));
  let recipients = d.recipients;
  if (typeof recipients === "string") recipients = recipients.split(/[\s,;]+/);
  recipients = (recipients || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  if (!d.title) return json({ error: "Title required" }, 400);
  if (!recipients.length) return json({ error: "At least one recipient email required" }, 400);
  const delivery = await Deliveries.create({ ...d, recipients });
  return json({ ok: true, delivery });
};
