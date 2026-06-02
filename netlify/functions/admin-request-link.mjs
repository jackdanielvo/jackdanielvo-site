import { Tokens } from "./_lib/data.mjs";
import { sendEmail, magicLinkEmail } from "./_lib/mail.mjs";
import { json } from "./_lib/http.mjs";
import { SETTINGS } from "./_lib/config.mjs";
export const config = { path: "/api/admin/request-link" };
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let email = ""; try { email = (await req.json()).email || ""; } catch {}
  email = String(email).trim().toLowerCase();
  const reply = json({ ok: true, message: "If that's the admin address, a sign-in link is on its way." });
  if (email && email === SETTINGS.adminEmail) {
    const raw = await Tokens.issue(email, null, true);
    const url = `${new URL(req.url).origin}/client-area/open?t=${raw}`;
    const { html } = magicLinkEmail(url);
    await sendEmail(email, "Your admin sign-in link · Jack Daniel VO", html);
  }
  return reply;
};
