import { Deliveries, Tokens } from "./_lib/data.mjs";
import { sendEmail, magicLinkEmail } from "./_lib/mail.mjs";
import { json } from "./_lib/http.mjs";
export const config = { path: "/api/portal/request-link" };
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let email = "";
  try { email = (await req.json()).email || ""; } catch { email = ""; }
  email = String(email).trim().toLowerCase();
  const reply = json({ ok: true, message: "If that email has files waiting, a sign-in link is on its way. Check your inbox." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply;
  const deliveries = await Deliveries.forRecipient(email);
  if (deliveries.length) {
    const raw = await Tokens.issue(email, null);
    const url = `${new URL(req.url).origin}/client-area/open?t=${raw}`;
    const { subject, html } = magicLinkEmail(url);
    await sendEmail(email, subject, html);
  }
  return reply;
};
