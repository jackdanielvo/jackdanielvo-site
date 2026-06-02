import { Deliveries, Events } from "./_lib/data.mjs";
import { presignDownload } from "./_lib/r2.mjs";
import { sendEmail, downloadNotifyEmail } from "./_lib/mail.mjs";
import { getSession, redirect, json, reqMeta } from "./_lib/http.mjs";
import { SETTINGS } from "./_lib/config.mjs";
export const config = { path: "/client-area/dl" };
export default async (req) => {
  const s = await getSession(req);
  if (!s) return redirect("/client-area/");
  const u = new URL(req.url);
  const deliveryId = u.searchParams.get("delivery") || "";
  const fileId = u.searchParams.get("file") || "";
  const d = await Deliveries.get(deliveryId);
  if (!d || !Deliveries.accessibleBy(d, s.email)) return json({ error: "forbidden" }, 403);
  const f = Deliveries.fileById(d, fileId);
  if (!f || !f.r2_key) return json({ error: "not_found" }, 404);
  const { ip, ua } = reqMeta(req);
  await Events.log("file_downloaded", { deliveryId: d.id, fileId: f.id, email: s.email, ip, ua });
  if (d.notify_on_download) {
    const { subject, html } = downloadNotifyEmail(d, s.email, f.display_name);
    try { await sendEmail(SETTINGS.adminEmail, subject, html); } catch {}
  }
  const url = await presignDownload(f.r2_key, f.display_name);
  return redirect(url);
};
