// Emits /videos.json — the full video library (slug, title, youtube id, vimeo,
// thumbnail, categories). Feeds the visual Homepage editor's palette and the
// homepage-tiles function's slug → video resolver.
const ytid = (s) => {
  const m = String(s || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : String(s || "").trim();
};

module.exports = class {
  data() {
    return { permalink: "/videos.json", eleventyExcludeFromCollections: true };
  }
  render(data) {
    const videos = (data.collections.video || []).map((v) => {
      const id = ytid(v.data.youtube || "");
      return {
        slug: v.fileSlug,
        title: v.data.title || "",
        youtube: id,
        vimeo: v.data.vimeo || "",
        thumbnail: v.data.thumbnail || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ""),
        categories: v.data.categories || [],
        order: v.data.order || 999,
      };
    });
    return JSON.stringify({ videos }, null, 0);
  }
};
