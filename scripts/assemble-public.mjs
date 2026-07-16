// Assemble the deployable aggregator: public/<siteId>/ for every site in
// sites/, plus a root public/index.html linking them. Vercel (or any static
// host) serves public/ as the whole of volteanu.com.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITES = join(ROOT, "sites");
const PUBLIC = join(ROOT, "public");

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
cpSync(join(ROOT, "assets", "volteanu-logo.jpg"), join(PUBLIC, "volteanu-logo.jpg"));

// Same ranking the sites' evidence boards use: iconic officials first.
function pickPreviews(items, universe, n = 4) {
  const officials = items.filter((i) => i.collection === "official");
  const ranked = [
    ...officials.filter((i) => universe.evidenceIconic.test(i.title)),
    ...officials,
  ];
  const seen = new Set();
  const picks = [];
  for (const i of ranked) {
    if (seen.has(i.image)) continue;
    seen.add(i.image);
    picks.push(i);
    if (picks.length === n) break;
  }
  return picks;
}

const entries = [];
for (const id of readdirSync(SITES)) {
  const dist = join(SITES, id, "dist");
  if (!existsSync(join(dist, "index.html"))) continue;
  cpSync(dist, join(PUBLIC, id), { recursive: true });

  const data = JSON.parse(readFileSync(join(SITES, id, "data", "collection.json"), "utf8"));
  const { default: universe } = await import(
    new URL(`../sites/${id}/universe.js`, import.meta.url).href
  );
  const show =
    universe.copy.title.match(/curated edit of (?:the )?(.+?) universe/i)?.[1] ??
    id.replace(/-/g, " ");
  entries.push({
    id,
    name: universe.name,
    show,
    count: data.items?.length ?? 0,
    previews: pickPreviews(data.items ?? [], universe),
  });
}

const cards = entries
  .map(
    (e) => `
    <a class="site" href="/${e.id}/">
      <span class="proof">${e.previews
        .map((p) => `<span class="tile"><img src="${esc(p.image)}" alt="" decoding="async" /></span>`)
        .join("")}</span>
      <span class="site-show">${esc(e.show)}</span>
      <span class="site-name">${esc(e.name)}</span>
      <span class="site-meta">${e.count} pieces</span>
    </a>`
  )
  .join("");

writeFileSync(
  join(PUBLIC, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>volteanu | Curated universe storefronts</title>
<meta name="description" content="Curated, shoppable edits of beloved TV universes. One storefront per world." />
<style>
  :root{
    --ground: oklch(0.15 0.01 80);
    --surface: oklch(0.18 0.012 80);
    --ink: oklch(0.92 0.015 85);
    --ink-dim: oklch(0.68 0.02 85);
    --hairline: color-mix(in oklch, var(--ink) 14%, transparent);
    --paper: oklch(0.96 0.01 90);
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }
  *{ box-sizing: border-box; }
  body{ margin:0; background: var(--ground); color: var(--ink);
    font-family: Georgia, "Times New Roman", serif; line-height: 1.5;
    min-height: 100vh; display: grid; place-items: center; padding: 48px 24px; }
  main{ max-width: 1060px; width: 100%; }
  .masthead{ display: flex; align-items: center; gap: 16px; margin: 0 0 40px; }
  .mark{ width: 56px; height: 56px; border-radius: 50%; display: block;
    box-shadow: 0 0 0 1px var(--hairline), 0 10px 26px -14px oklch(0 0 0 / 0.8); }
  .wordmark{ font-family: ui-sans-serif, Arial, sans-serif; font-size: 15px;
    font-weight: 700; letter-spacing: .34em; text-transform: uppercase; }
  .tagline{ font-size: 13.5px; font-style: italic; color: var(--ink-dim); margin-top: 3px; }
  .sites{ display: grid; gap: 22px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .site{ background: var(--surface); border: 1px solid var(--hairline);
    padding: 14px 14px 20px; text-decoration: none; color: inherit;
    display: flex; flex-direction: column; gap: 4px;
    transition: transform .3s var(--ease), border-color .3s var(--ease); }
  .site:hover{ transform: translateY(-4px); border-color: color-mix(in oklch, var(--ink) 34%, transparent); }
  .site:focus-visible{ outline: 2px solid var(--ink); outline-offset: 3px; }
  .proof{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .tile{ display: block; background: var(--paper); padding: 7px; }
  .tile img{ display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
  .site-show{ font-family: ui-sans-serif, Arial, sans-serif; font-size: 11px;
    font-weight: 600; letter-spacing: .26em; text-transform: uppercase; color: var(--ink-dim); }
  .site-name{ font-size: 23px; line-height: 1.15; }
  .site:hover .site-name{ text-decoration: underline; text-underline-offset: 4px;
    text-decoration-thickness: 1px; }
  .site-meta{ font-family: ui-sans-serif, Arial, sans-serif; font-size: 11px;
    letter-spacing: .18em; text-transform: uppercase; color: var(--ink-dim); margin-top: 6px; }
  footer{ margin-top: 44px; color: var(--ink-dim); font-size: 12.5px; }
</style>
</head>
<body>
  <main>
    <header class="masthead">
      <img class="mark" src="volteanu-logo.jpg" alt="volteanu" width="56" height="56" />
      <div>
        <div class="wordmark">volteanu</div>
        <div class="tagline">One storefront per beloved TV universe.</div>
      </div>
    </header>
    <nav class="sites" aria-label="Storefronts">${cards}</nav>
    <footer>Links are monetized; purchases may earn this site a commission. All trademarks belong to their owners.</footer>
  </main>
</body>
</html>
`
);

console.log(`Assembled public/ with ${entries.length} sites: ${entries.map((e) => e.id).join(", ")}`);
