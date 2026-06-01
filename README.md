# Jack Daniel VO — site source (Eleventy)

Static site built with [Eleventy](https://www.11ty.dev/). No WordPress.

## Develop

```bash
npm install
npm run dev      # local server with live reload
npm run build    # outputs to _site/
```

## Structure

- `src/index.html` — homepage, served verbatim (byte-identical to the current site).
- `src/tokens.css`, `src/favicon*`, `src/portfolio.json` — static assets, passed through.
- `eleventy.config.js` — build config.
- `netlify.toml` — tells Netlify to run `npm run build` and publish `_site/`.

## Deploy

Connected to Netlify via Git: every push to the main branch triggers a build and deploy.

## Roadmap

- **Phase 2:** blog — `src/posts/*.md`, post + archive + category templates, RSS at `/feed.xml`; homepage cards generated from newest posts.
- **Phase 3:** Decap/Sveltia CMS at `/admin` (GitHub login).
