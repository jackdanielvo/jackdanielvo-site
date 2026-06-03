module.exports = class {
  data() {
    return { permalink: "/portfolio.json", eleventyExcludeFromCollections: true };
  }
  render({ collections }) {
    const ytid = (s) => {
      const m = String(s || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
      return m ? m[1] : String(s || "").trim();
    };
    const feat = (collections.video || [])
      .filter((v) => v.data.featured)
      .sort((a, b) => (a.data.hp_order || 999) - (b.data.hp_order || 999));
    const tiles = feat.map((v) => {
      const t = {
        youtube: ytid(v.data.youtube || ""),
        title: String(v.data.hp_title || v.data.title || "").split("\n"),
        eyebrow: v.data.hp_eyebrow || "",
        meta: v.data.hp_meta || "",
        color: v.data.hp_color || "ink",
        span: v.data.hp_span || 4
      };
      if (v.data.hp_shape) t.shape = v.data.hp_shape;
      return t;
    });
    return JSON.stringify({ _comment: "Generated from featured videos (src/videos/*). Toggle 'Show on homepage' on a video to change these.", tiles }, null, 2);
  }
};
