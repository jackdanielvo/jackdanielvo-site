import { Clients } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
export const config = { path: "/api/admin/clients" };
export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const d = await req.json().catch(() => ({}));
  if (!d.agency_name && !d.contact_name) return json({ error: "Need an agency or contact name" }, 400);
  const client = await Clients.create(d);
  return json({ ok: true, client });
};
