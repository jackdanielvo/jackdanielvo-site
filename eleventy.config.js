const pluginRss = require("@11ty/eleventy-plugin-rss");

const fmt = (d, opts) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(d);

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  // Static passthrough — unchanged assets.
  eleventyConfig.addPassthroughCopy("src/tokens.css");
  eleventyConfig.addPassthroughCopy("src/blog.css");
  eleventyConfig.addPassthroughCopy("src/portfolio.json");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  // --- Date filters ---
  eleventyConfig.addFilter("monthDay", (d) => fmt(new Date(d), { month: "short", day: "2-digit" }));
  eleventyConfig.addFilter("readableDate", (d) => fmt(new Date(d), { year: "numeric", month: "long", day: "numeric" }));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("dayMonthCaps", (d) => {
    const dt = new Date(d);
    return fmt(dt, { day: "2-digit" }) + " " + fmt(dt, { month: "short" }).toUpperCase();
  });

  // --- Helpers ---
  const slugify = (s) => String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  // Posts collection, newest first.
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByTag("posts").sort((a, b) => b.date - a.date)
  );

  // Categories collection: [{title, slug, posts[]}], by post count then name.
  eleventyConfig.addCollection("categories", (api) => {
    const posts = api.getFilteredByTag("posts").sort((a, b) => b.date - a.date);
    const map = new Map();
    for (const p of posts) {
      for (const c of (p.data.categories || [])) {
        if (!map.has(c)) map.set(c, { title: c, slug: slugify(c), posts: [] });
        map.get(c).posts.push(p);
      }
    }
    return [...map.values()].sort((a, b) => b.posts.length - a.posts.length || a.title.localeCompare(b.title));
  });

  // Build the homepage "From the Booth" data (newest 3) as JSON for the
  // existing client-side renderer on the homepage.
  eleventyConfig.addFilter("boothCardsJson", (posts) => {
    const items = (posts || []).slice(0, 3).map((p) => ({
      url: p.url,
      img: p.data.cover || null,
      date: fmt(new Date(p.date), { month: "short", day: "2-digit" }),
      cat: (p.data.categories || ["Post"])[0],
      title: p.data.title,
      excerpt: (p.data.excerpt || "").trim()
    }));
    return JSON.stringify(items);
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
    templateFormats: ["html", "njk", "md", "11ty.js"]
  };
};
