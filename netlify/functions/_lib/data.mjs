// Data layer on Netlify Blobs. Each "collection" is a Blobs store of JSON
// records keyed by id. At this scale (a solo VO) scanning a store is fine.
import { getStore } from "@netlify/blobs";
import { randomToken, sha256hex, daysFromNow, isExpired } from "./crypto.mjs";
import { SETTINGS } from "./config.mjs";

const store = (name) => getStore({ name, consistency: "strong" });
const newId = () => Date.now().toString(36) + "-" + randomToken().slice(0, 8);

async function listAll(name) {
  const s = store(name);
  const { blobs } = await s.list();
  return Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
}

/* ---------------- CLIENTS ---------------- */
export const Clients = {
  async create(d) {
    const id = newId();
    const row = {
      id, agency_name: d.agency_name || "", contact_name: d.contact_name || "",
      email: (d.email || "").toLowerCase(), phone: d.phone || "", notes: d.notes || "",
      created_at: new Date().toISOString(),
    };
    await store("clients").setJSON(id, row);
    return row;
  },
  get: (id) => store("clients").get(id, { type: "json" }),
  list: () => listAll("clients"),
};

/* ---------------- DELIVERIES ----------------
   A delivery embeds its files[] and recipients[] (collapsing the plugin's
   projects/files/recipients tables — same behavior, simpler at this scale). */
export const Deliveries = {
  async create(d) {
    const id = newId();
    const lifetime = SETTINGS.fileLifetimeDays;
    const row = {
      id,
      client_id: d.client_id || null,
      project_name: d.project_name || "",
      title: d.title || "",
      note_from_jack: d.note_from_jack || "",
      show_recent_work: !!d.show_recent_work,
      notify_on_download: !!d.notify_on_download,
      status: "draft",
      recipients: (d.recipients || []).map((e) => e.toLowerCase()),
      files: [], // {id, display_name, r2_key, label, size_bytes, mime_type, duration_sec, sample_rate, bit_depth, sort_order}
      expires_at: lifetime > 0 ? daysFromNow(lifetime) : null,
      created_at: new Date().toISOString(),
      delivered_at: null,
    };
    await store("deliveries").setJSON(id, row);
    return row;
  },
  get: (id) => store("deliveries").get(id, { type: "json" }),
  list: () => listAll("deliveries"),
  async save(row) { await store("deliveries").setJSON(row.id, row); return row; },
  async remove(id) { await store("deliveries").delete(String(id)); },
  async markSent(id) {
    const row = await Deliveries.get(id);
    if (!row) return null;
    row.status = "sent";
    row.delivered_at = new Date().toISOString();
    return Deliveries.save(row);
  },
  async addFile(id, file) {
    const row = await Deliveries.get(id);
    if (!row) return null;
    row.files.push({ id: newId(), sort_order: row.files.length, ...file });
    return Deliveries.save(row);
  },
  async forRecipient(email) {
    email = (email || "").toLowerCase();
    const all = await Deliveries.list();
    return all
      .filter((d) => d && d.status === "sent" && !d.deleted_at && (d.recipients || []).includes(email))
      .sort((a, b) => (b.delivered_at || "").localeCompare(a.delivered_at || ""));
  },
  accessibleBy(delivery, email) {
    return !!delivery && (delivery.recipients || []).includes((email || "").toLowerCase());
  },
  fileById(delivery, fileId) {
    return (delivery.files || []).find((f) => f.id === fileId) || null;
  },
};

/* ---------------- TOKENS (magic links) ---------------- */
export const Tokens = {
  async issue(email, deliveryId = null, isAdmin = false) {
    const raw = randomToken();
    const rec = {
      hash: sha256hex(raw), email: (email || "").toLowerCase(),
      delivery_id: deliveryId, is_admin: !!isAdmin, used_at: null,
      created_at: new Date().toISOString(),
      expires_at: daysFromNow(SETTINGS.tokenLifetimeDays),
    };
    await store("tokens").setJSON(rec.hash, rec);
    return raw;
  },
  // Returns {email, delivery_id} or {error}
  async consume(raw) {
    if (!/^[0-9a-f]{64}$/i.test(raw || "")) return { error: "This link is invalid." };
    const s = store("tokens");
    const rec = await s.get(sha256hex(raw), { type: "json" });
    if (!rec) return { error: "This link is invalid or already used." };
    if (isExpired(rec.expires_at))
      return { error: "This link has expired. Reply to your delivery email and Jack will send you a fresh one." };
    if (!rec.used_at) { rec.used_at = new Date().toISOString(); await s.setJSON(rec.hash, rec); }
    return { email: rec.email, delivery_id: rec.delivery_id || null, is_admin: !!rec.is_admin };
  },
};

/* ---------------- SESSIONS ---------------- */
export const Sessions = {
  async create(email, isAdmin = false) {
    const raw = randomToken();
    const rec = {
      hash: sha256hex(raw), email: (email || "").toLowerCase(), is_admin: !!isAdmin,
      created_at: new Date().toISOString(), expires_at: daysFromNow(SETTINGS.sessionLifetimeDays),
    };
    await store("sessions").setJSON(rec.hash, rec);
    return { raw, maxAgeSec: SETTINGS.sessionLifetimeDays * 86400 };
  },
  async fromRaw(raw) {
    if (!/^[0-9a-f]{64}$/i.test(raw || "")) return null;
    const s = store("sessions");
    const rec = await s.get(sha256hex(raw), { type: "json" });
    if (!rec) return null;
    if (isExpired(rec.expires_at)) { await s.delete(rec.hash); return null; }
    return rec;
  },
  async destroy(raw) {
    if (/^[0-9a-f]{64}$/i.test(raw || "")) await store("sessions").delete(sha256hex(raw));
  },
};

/* ---------------- EVENTS (open/download log) ---------------- */
export const Events = {
  async log(type, { deliveryId = null, fileId = null, email = "", ip = "", ua = "" } = {}) {
    const id = newId();
    await store("events").setJSON(id, {
      id, event_type: type, delivery_id: deliveryId, file_id: fileId,
      email, ip, user_agent: (ua || "").slice(0, 250), created_at: new Date().toISOString(),
    });
  },
  async forDelivery(deliveryId) {
    const all = await listAll("events");
    return all.filter((e) => e && e.delivery_id === deliveryId)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  },
  async deleteForDelivery(deliveryId) {
    const s = store("events");
    const { blobs } = await s.list();
    for (const b of blobs) {
      const e = await s.get(b.key, { type: "json" });
      if (e && e.delivery_id === deliveryId) await s.delete(b.key);
    }
  },
};
