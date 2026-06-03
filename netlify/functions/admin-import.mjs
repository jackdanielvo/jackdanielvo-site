// One-time migration import from the old WordPress client portal.
// Writes clients, deliveries (metadata + recipients, NO files), and events
// straight into Netlify Blobs using their ORIGINAL ids and timestamps, so the
// data is keyed stably (re-running overwrites rather than duplicating) and no
// delivery email is ever sent. Files are attached separately afterward via the
// existing /api/admin/upload-url + /api/admin/attach-file path (R2 creds stay
// server-side). Admin session required.
import { getStore } from "@netlify/blobs";
import { requireAdmin, json } from "./_lib/http.mjs";

export const config = { path: "/api/admin/import" };
const store = (n) => getStore({ name: n, consistency: "strong" });
const nowISO = () => new Date().toISOString();

export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const clients     = Array.isArray(body.clients)     ? body.clients     : [];
  const deliveries  = Array.isArray(body.deliveries)  ? body.deliveries  : [];
  const events      = Array.isArray(body.events)      ? body.events      : [];

  const cs = store("clients"), ds = store("deliveries"), es = store("events");
  let c = 0, d = 0, e = 0;

  for (const x of clients) {
    if (!x || !x.id) continue;
    await cs.setJSON(String(x.id), {
      id: String(x.id),
      agency_name: x.agency_name || "",
      contact_name: x.contact_name || "",
      email: (x.email || "").toLowerCase(),
      phone: x.phone || "",
      notes: x.notes || "",
      created_at: x.created_at || nowISO(),
    });
    c++;
  }

  for (const x of deliveries) {
    if (!x || !x.id) continue;
    // files intentionally reset to [] — they are (re)attached by attach-file
    await ds.setJSON(String(x.id), {
      id: String(x.id),
      client_id: x.client_id ? String(x.client_id) : null,
      project_name: x.project_name || "",
      title: x.title || "",
      note_from_jack: x.note_from_jack || "",
      show_recent_work: !!x.show_recent_work,
      notify_on_download: !!x.notify_on_download,
      status: x.status || "sent",
      recipients: (x.recipients || []).map((s) => String(s).toLowerCase()),
      files: [],
      expires_at: x.expires_at || null,
      created_at: x.created_at || nowISO(),
      delivered_at: x.delivered_at || x.created_at || nowISO(),
    });
    d++;
  }

  for (const x of events) {
    if (!x || !x.id) continue;
    await es.setJSON(String(x.id), {
      id: String(x.id),
      event_type: x.event_type || "event",
      delivery_id: x.delivery_id ? String(x.delivery_id) : null,
      file_id: x.file_id ? String(x.file_id) : null,
      email: (x.email || "").toLowerCase(),
      ip: x.ip || "",
      user_agent: (x.user_agent || "").slice(0, 250),
      created_at: x.created_at || nowISO(),
    });
    e++;
  }

  return json({ ok: true, clients: c, deliveries: d, events: e });
};
