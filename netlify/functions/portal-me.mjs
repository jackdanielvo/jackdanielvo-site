import { Deliveries, Clients } from "./_lib/data.mjs";
import { getSession, json } from "./_lib/http.mjs";
export const config = { path: "/api/portal/me" };
export default async (req) => {
  const s = await getSession(req);
  if (!s) return json({ error: "not_authenticated" }, 401);
  const deliveries = await Deliveries.forRecipient(s.email);
  const out = [];
  for (const d of deliveries) {
    let client = null;
    if (d.client_id) { try { client = await Clients.get(d.client_id); } catch {} }
    out.push({
      id: d.id, title: d.title, project_name: d.project_name,
      note_from_jack: d.note_from_jack, delivered_at: d.delivered_at, expires_at: d.expires_at,
      agency_name: client?.agency_name || "",
      files: (d.files || []).map((f) => ({
        id: f.id, display_name: f.display_name, label: f.label, size_bytes: f.size_bytes,
        duration_sec: f.duration_sec, sample_rate: f.sample_rate, bit_depth: f.bit_depth,
      })),
    });
  }
  return json({ email: s.email, deliveries: out });
};
