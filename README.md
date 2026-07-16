# volteanu.com — curated universe storefronts

An aggregator of themed affiliate storefronts: one site per beloved TV
universe, all built on one shared engine, all monetized through the
[Channel3](https://trychannel3.com) product API. Live sites so far:

| Site | Universe | Brand |
|------|----------|-------|
| `sites/sopranos` | The Sopranos | Bada Bing & Co. |
| `sites/true-detective` | True Detective S1 | Carcosa Outfitters |

## Architecture: one engine, many skins

```
core/
  channel3.js   Channel3 API client (POST /v1/search, pagination)
  curation.js   shared mechanics: theme filter, normalize, dedup fingerprint,
                sellability rules, expected-value ranking
  build.js      node core/build.js <siteId>  -> sites/<id>/data/collection.json
  render.js     node core/render.js <siteId> -> sites/<id>/dist/index.html
sites/<id>/
  universe.js   the data plan + voice: chapters, queries with noise filters,
                official/in-style split, all copy
  theme.js      the look: OKLCH tokens, fonts, structural flags
  data/         curated collection (committed; refresh with build.js)
  dist/         generated static site (committed)
tools/          channel3 dashboard scraper (cookie.txt is gitignored)
```

**The rule that keeps this scalable:** structure, layouts, motion, and
accessibility live in `core/render.js` and improve for every site at once.
Personality is data (`universe.js` + `theme.js`). If you catch yourself
copying `render.js`, you are doing it wrong.

## Running

```bash
cp .env.example .env          # add your CHANNEL3_API_KEY
node --env-file=.env core/build.js sopranos   # refresh data (~60 API credits)
node core/render.js sopranos                  # regenerate the site
```

Open `sites/<id>/dist/index.html`.

## How the money works

Attribution is **by API key**, not a separate affiliate ID. Buy links returned
to an authenticated `/v1/search` are already monetized to that key's account;
the `aid` in each URL is minted per request by Channel3. Rules encoded in
`core/curation.js`: official items are kept at any commission and any stock
(they are the record); in-style items must pay (>0%) and must ship, unless a
query sets `allowZero` (theme over economics, used sparingly).

## Adding a universe

Use the `/new-site` skill in Claude Code: it encodes the whole method
(universe research, chaptering, query design with noise filters, the audit
loop, and a fresh visual identity per site). Manual path: copy the folder
shape of an existing site, write `universe.js` and `theme.js`, then build and
render.

## Roadmap

- volteanu.com root: an aggregator index page linking every universe.
- Scheduled data refreshes (stock and prices drift).
- Per-site image quality pass (prefer high-res hero shots from the API).
