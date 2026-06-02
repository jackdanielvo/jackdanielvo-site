import { Deliveries, Clients, Tokens } from "./_lib/data.mjs";
import { sendEmail, deliveryEmail } from "./_lib/mail.mjs";
import { requireAdmin, json } from "./_lib/http.mjs";
export const config = { path: "/api/admin/send" };
export default async (req) => {
  if (!(await requireAdmin(req))) return json({ error: "not_admin" }, 401);
  const { delivery_id } = await req.json().catch(() => ({}));
  const d = await Deliveries.get(delivery_id);
  if (!d) return json({ error: "Delivery not found" }, 404);
  if (!(d.files || []).length) return json({ error: "Add at least one file before sending" }, 400);
  if (!(d.recipients || []).length) return json({ error: "No recipients" }, 400);
  if (d.client_id) { try { d.client = await Clients.get(d.client_id); } catch {} }
  const origin = new URL(req.url).origin;
  let sent = 0, failed = 0;
  for (const email of d.recipients) {
    try {
      const raw = await Tokens.issue(email, d.id);
      const url = `${origin}/client-area/open?t=${raw}`;
      const { subject, html } = deliveryEmail(d, email, url);
      (await sendEmail(email, subject, html)) ? sent++ : failed++;
    } catch { failed++; }
  }
  await Deliveries.markSent(d.id);
  return json({ ok: true, sent, failed });
};
