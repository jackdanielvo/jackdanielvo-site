module.exports = function (eleventyConfig) {
  // Copy static assets straight through, unchanged.
  eleventyConfig.addPassthroughCopy("src/tokens.css");
  eleventyConfig.addPassthroughCopy("src/portfolio.json");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  // Phase 1: the homepage is served verbatim (no template processing),
  // so output is byte-identical to the current static site. Blog
  // templates added in Phase 2 will use Nunjucks (.njk) / Markdown (.md).
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
    templateFormats: ["html", "njk", "md", "11ty.js"]
  };
};
