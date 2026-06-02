import { Deliveries } from "./_lib/data.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
export const config = { path: "/api/admin/attach-file" };
export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const f = await req.json().catch(() => ({}));
  if (!f.delivery_id || !f.r2_key) return json({ error: "Missing fields" }, 400);
  const updated = await Deliveries.addFile(f.delivery_id, {
    display_name: f.display_name || "file",
    r2_key: f.r2_key,
    label: f.label || "final_approved",
    size_bytes: Number(f.size_bytes) || 0,
    mime_type: f.mime_type || "",
    duration_sec: f.duration_sec ? Number(f.duration_sec) : null,
    sample_rate: f.sample_rate ? Number(f.sample_rate) : null,
    bit_depth: f.bit_depth ? Number(f.bit_depth) : null,
  });
  if (!updated) return json({ error: "Delivery not found" }, 404);
  return json({ ok: true });
};
