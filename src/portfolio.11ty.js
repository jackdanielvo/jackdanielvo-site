// Generates /portfolio.json (the homepage Work tiles) from the editable
// "Homepage" config (src/_data/homepage.json). Each tile just names a video;
// its color/size/shape come automatically from its position in the grid via
// the SLOTS template below, so the editor never has to set any styling.
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

const ytid = (s) => {
  const m = String(s || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : String(s || "").trim();
};

module.exports = class {
  data() {
    return { permalink: "/portfolio.json", eleventyExcludeFromCollections: true };
  }
  render(data) {
    const bySlug = {};
    (data.collections.video || []).forEach((v) => { bySlug[v.fileSlug] = v; });

    const tiles = ((data.homepage && data.homepage.tiles) || [])
      .map((t, i) => {
        const v = bySlug[t.video];
        if (!v) return null; // chosen video no longer exists — skip
        const slot = SLOTS[i % SLOTS.length];
        const tile = {
          video: v.fileSlug,
          youtube: ytid(v.data.youtube || ""),
          clip: v.data.clip || "",
          title: String(t.title || v.data.title || "").split("\n"),
          eyebrow: t.eyebrow || (v.data.categories && v.data.categories[0]) || "",
          meta: t.meta || "",
          color: slot.color,
          span: slot.span,
        };
        if (slot.shape) tile.shape = slot.shape;
        return tile;
      })
      .filter(Boolean);

    return JSON.stringify({
      _comment: "Generated from src/_data/homepage.json (edit under 'Homepage' in the editor).",
      tiles,
    }, null, 2);
  }
};
