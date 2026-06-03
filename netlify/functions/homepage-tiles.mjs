// Serves and saves the homepage Work-grid arrangement.
//   GET  → the tiles to render on the homepage (saved arrangement from Netlify
//          Blobs, else the build-time default /portfolio.json). Public.
//   POST → save a new arrangement (array of { video, title, eyebrow, meta }).
//          Admin session required. Tile color/size/shape are NOT stored — they
//          come from the slot position, so the editor never sets styling.
import { getStore } from "@netlify/blobs";
import { requireAdmin, json } from "./_lib/http.mjs";

export const config = { path: "/api/homepage-tiles" };

const STORE = "settings";
const KEY = "homepage_tiles";

const SLOTS = [
  { color: "ink",    span: 7, shape: "wide" },
  { color: "cream",  span: 5, shape: "wide" },
  { color: "blue",   span: 4, shape: "tall" },
  { color: "purple", span: 4, shape: "tall" },
  { color: "green",  span: 4, shape: "tall" },
  { color: "cream",  span: 6, shape: "wide" },
  { color: "ink",    span: 6, shape: "wide" },
  { color: "green",  span: 4, shape: "" },
  { color: "purple", span: 4, shape: "" },
  { color: "blue",   span: 4, shape: "" },
];

const store = () => getStore({ name: STORE, consistency: "strong" });

async function fetchJSON(origin, path) {
  try { const r = await fetch(origin + path); return r.ok ? await r.json() : null; }
  catch { return null; }
}

function resolveTiles(raw, videos) {
  const bySlug = {};
  (videos || []).forEach((v) => { bySlug[v.slug] = v; });
  return raw.map((t, i) => {
    const v = bySlug[t.video];
    if (!v) return null;
    const slot = SLOTS[i % SLOTS.length];
    const tile = {
      video: v.slug,
      youtube: v.youtube || "",
      vimeo: v.vimeo || "",
      thumbnail: v.thumbnail || "",
      title: String(t.title || v.title || "").split("\n"),
      eyebrow: t.eyebrow || (v.categories && v.categories[0]) || "",
      meta: t.meta || "",
      color: slot.color,
      span: slot.span,
    };
    if (slot.shape) tile.shape = slot.shape;
    return tile;
  }).filter(Boolean);
}

export default async (req) => {
  const origin = new URL(req.url).origin;

  if (req.method === "POST") {
    const s = await requireAdmin(req);
    if (!s) return json({ error: "not_admin" }, 401);
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
    const tiles = Array.isArray(body.tiles) ? body.tiles : [];
    const clean = tiles
      .filter((t) => t && t.video)
      .map((t) => ({ video: String(t.video), title: String(t.title || ""), eyebrow: String(t.eyebrow || ""), meta: String(t.meta || "") }));
    await store().setJSON(KEY, clean);
    return json({ ok: true, count: clean.length });
  }

  // GET
  const raw = await store().get(KEY, { type: "json" }).catch(() => null);
  if (raw && raw.length) {
    const data = await fetchJSON(origin, "/videos.json");
    return json({ tiles: resolveTiles(raw, data && data.videos), saved: true });
  }
  const def = await fetchJSON(origin, "/portfolio.json");
  return json({ tiles: (def && def.tiles) || [], saved: false });
};
