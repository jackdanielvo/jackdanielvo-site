import { Clients, Deliveries, Events } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
export const config = { path: "/api/admin/me" };
export default async (req) => {
  const s = await requireAdmin(req);
  if (!s) return json({ error: "not_admin" }, 401);
  const clients = (await Clients.list()).sort((a, b) => (a.agency_name || "").localeCompare(b.agency_name || ""));
  const all = (await Deliveries.list()).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  const sum = (d) => ({
    id: d.id, title: d.title, status: d.status, recipients: d.recipients || [],
    file_count: (d.files || []).length, created_at: d.created_at, delivered_at: d.delivered_at,
    expires_at: d.expires_at, deleted_at: d.deleted_at || null,
  });
  const deliveries = all.filter((d) => !d.deleted_at).slice(0, 50).map(sum);
  const trashed = all.filter((d) => d.deleted_at).slice(0, 50).map(sum);
  return json({ admin: true, email: s.email, clients, deliveries, trashed });
};
