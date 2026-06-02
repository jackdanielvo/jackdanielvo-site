// Transactional email via Resend (same provider the WP plugin used).
import { SETTINGS, BRAND, labelHuman, formatSize } from "./config.mjs";

export async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  const from = `${SETTINGS.senderName} <${SETTINGS.senderEmail}>`;
  if (!key) { console.error("[portal] RESEND_API_KEY missing"); return false; }
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, reply_to: SETTINGS.senderEmail }),
  });
  if (!resp.ok) { console.error("[portal] Resend error", resp.status, await resp.text()); return false; }
  return true;
}

const shell = (inner) => `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ecedef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Helvetica,Arial,sans-serif;color:${BRAND.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 12px;">
<table role="presentation" width="600" style="max-width:600px;background:white;border-radius:10px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);">
<tr><td style="background:${BRAND.bg};padding:30px 32px 36px;">${inner}</td></tr></table>
</td></tr></table></body></html>`;

const brandBar = `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid ${BRAND.line};"><tr>
  <td style="padding-right:10px;"><div style="width:32px;height:32px;background:${BRAND.violet};border-radius:6px;color:white;font-size:10px;font-weight:800;line-height:1;text-align:center;display:inline-block;"><span style="display:block;padding:6px 0 0;">JD</span><span style="display:block;">VO</span></div></td>
  <td style="font-weight:700;font-size:13px;letter-spacing:0.4px;text-transform:uppercase;">JACK DANIEL <span style="color:${BRAND.textMuted};font-weight:500;">VO</span></td>
</tr></table>`;

const ctaButton = (url, label) => `
<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:26px auto;"><tr>
  <td style="background:${BRAND.violet};border-radius:30px;"><a href="${url}" style="display:inline-block;padding:16px 38px;color:white;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;">${label} &rarr;</a></td>
</tr></table>`;

export function magicLinkEmail(url) {
  const inner = brandBar +
    `<h1 style="font-size:20px;font-weight:600;margin:8px 0 12px;">Your sign-in link</h1>
     <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">Click the button below to open your client area. The link signs you in automatically — no password needed.</p>` +
    ctaButton(url, "Open Client Area") +
    `<p style="font-size:11px;color:${BRAND.textMuted};text-align:center;margin:0;">If you didn't request this, you can ignore this email.</p>`;
  return { subject: "Your link to Jack Daniel VO Client Area", html: shell(inner) };
}

export function deliveryEmail(delivery, recipientEmail, magicLink) {
  const contact = delivery.client?.contact_name || "";
  const first = contact ? contact.trim().split(" ")[0] : "there";
  const files = (delivery.files || []).map((f, i) => `
    <table role="presentation" width="100%" style="${i ? `border-top:1px solid ${BRAND.line};` : ""}"><tr>
      <td style="padding:8px 0;font-size:13px;font-weight:500;">${f.display_name}</td>
      <td style="padding:8px 0;font-size:12px;color:${BRAND.textMuted};text-align:right;">${labelHuman(f.label)} &middot; ${formatSize(f.size_bytes)}</td>
    </tr></table>`).join("");
  const fileBlock = files ? `
    <table role="presentation" width="100%" style="background:white;border:1px solid ${BRAND.line};border-radius:10px;margin:24px 0;"><tr><td style="padding:18px 22px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:${BRAND.textMuted};margin-bottom:12px;">In this delivery</div>${files}
    </td></tr></table>` : "";
  const note = delivery.note_from_jack ? `
    <table role="presentation" width="100%" style="background:${BRAND.creamPanel};border-radius:10px;margin:24px 0;"><tr><td style="padding:18px 22px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:${BRAND.gold};margin-bottom:8px;">Note from Jack</div>
      <div style="font-size:14px;line-height:1.6;font-style:italic;color:#5a4a25;">${delivery.note_from_jack}</div>
    </td></tr></table>` : "";
  const inner = brandBar +
    `<p style="font-size:16px;margin:0 0 18px;">Hi ${first},</p>
     <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Final files for <strong>${delivery.title}</strong> are ready to grab. Click below to open your files page — you're already signed in, no password needed.</p>` +
    ctaButton(magicLink, "Open Your Files") +
    `<p style="text-align:center;font-size:11px;color:${BRAND.textMuted};margin:0 0 8px;">Link valid for ${SETTINGS.tokenLifetimeDays} days &middot; click anytime</p>` +
    fileBlock + note +
    `<table role="presentation" width="100%" style="margin-top:28px;border-top:1px solid ${BRAND.line};padding-top:20px;"><tr><td>
       <div style="font-size:15px;font-weight:600;">${SETTINGS.senderName}</div>
       <div style="font-size:12px;color:${BRAND.textMuted};margin-top:2px;">Voice Over &middot; Narration &middot; Trailer &middot; Promo</div>
       <div style="font-size:13px;margin-top:12px;line-height:1.8;">
         <a href="tel:${SETTINGS.senderPhone.replace(/[^0-9+]/g,"")}" style="color:${BRAND.text};text-decoration:none;">${SETTINGS.senderPhone}</a><br>
         <a href="mailto:${SETTINGS.senderEmail}" style="color:${BRAND.text};text-decoration:none;">${SETTINGS.senderEmail}</a>
       </div>
     </td></tr></table>
     <p style="font-size:11px;color:${BRAND.textMuted};margin:18px 0 0;text-align:center;">Sent to ${recipientEmail} &middot; this link is unique to you, please don't forward.</p>`;
  return { subject: `Your files for ${delivery.title} are ready`, html: shell(inner) };
}

export function downloadNotifyEmail(delivery, email, what) {
  const inner = brandBar +
    `<p style="font-size:15px;"><strong>${email}</strong> just downloaded ${what}.</p>
     <p style="font-size:14px;color:${BRAND.textMuted};">Project: <strong>${delivery.title}</strong></p>`;
  return { subject: `📥 ${email} picked up files: ${delivery.title}`, html: shell(inner) };
}
