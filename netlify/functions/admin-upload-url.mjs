import { Deliveries } from "./_lib/data.mjs";
import { presignUpload } from "./_lib/r2.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
import { ALLOWED_EXTS } from "./_lib/config.mjs";
import { randomToken } from "./_lib/crypto.mjs";
export const config = { path: "/api/admin/upload-url" };
export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const { delivery_id, filename, content_type } = await req.json().catch(() => ({}));
  const d = await Deliveries.get(delivery_id);
  if (!d) return json({ error: "Delivery not found" }, 404);
  const safe = String(filename || "file").replace(/[^A-Za-z0-9._-]+/g, "_");
  const ext = safe.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) return json({ error: "Filetype not allowed: ." + ext }, 400);
  const key = `deliveries/${delivery_id}/${randomToken().slice(0, 12)}-${safe}`;
  const url = await presignUpload(key, content_type || "application/octet-stream");
  return json({ ok: true, url, key });
};
