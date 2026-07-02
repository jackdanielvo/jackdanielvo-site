// Cal.com → Resend booking notifier. Cal.com POSTs here on each booking; we
// verify the signature and email Jack a branded "new/paid coaching booking"
// notice through Resend — so notifications don't depend on Cal.com's or
// Stripe's default emails. Set CAL_WEBHOOK_SECRET in Netlify to the same
// secret configured on the Cal.com webhook.
import crypto from "node:crypto";
import { sendEmail, coachingNotifyEmail } from "./_lib/mail.mjs";
import { SETTINGS } from "./_lib/config.mjs";

export const config = { path: "/api/cal-webhook" };

const fmtWhen = (iso, tz) => {
  try { return new Date(iso).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: tz || "America/Los_Angeles" }); }
  catch { return iso || ""; }
};
const money = (amt, cur) => {
  if (amt == null) return "";
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: (cur || "usd").toUpperCase() }).format(amt / 100); }
  catch { return (amt / 100) + " " + (cur || "").toUpperCase(); }
};
const val = (x) => (x && typeof x === "object" && "value" in x) ? x.value : x;

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();

  // Verify Cal.com's HMAC signature when a secret is configured.
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-cal-signature-256") || "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return new Response("bad signature", { status: 401 });
    }
  }

  let evt;
  try { evt = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  const trigger = evt.triggerEvent || "";
  const p = evt.payload || {};

  // Notify on a completed booking. Paid events fire BOOKING_PAID; free ones
  // fire BOOKING_CREATED. Skip BOOKING_CREATED when a payment is attached so a
  // paid booking produces exactly one email (on BOOKING_PAID).
  const price = (p.price != null) ? p.price : (p.paymentInfo && p.paymentInfo.amount);
  const hasPayment = price != null && price > 0;
  if (trigger === "BOOKING_CREATED" && hasPayment) return new Response("ok", { status: 200 });
  if (trigger !== "BOOKING_CREATED" && trigger !== "BOOKING_PAID") return new Response("ignored", { status: 200 });

  const att = (p.attendees && p.attendees[0]) || {};
  const r = p.responses || {};
  const notes = val(r.notes) || p.additionalNotes || "";

  const info = {
    paid: trigger === "BOOKING_PAID" || hasPayment,
    title: p.eventTitle || p.type || p.title || "Coaching session",
    when: fmtWhen(p.startTime, att.timeZone || (p.organizer && p.organizer.timeZone)),
    name: att.name || val(r.name) || "",
    email: att.email || val(r.email) || "",
    amount: money(price, p.currency),
    notes: typeof notes === "string" ? notes : "",
    bookingUrl: p.uid ? ("https://app.cal.com/booking/" + p.uid) : (p.bookerUrl || ""),
  };

  const { subject, html } = coachingNotifyEmail(info);
  await sendEmail(SETTINGS.adminEmail, subject, html);
  return new Response("ok", { status: 200 });
};
