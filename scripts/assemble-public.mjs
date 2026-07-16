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

const entries = [];
for (const id of readdirSync(SITES)) {
  const dist = join(SITES, id, "dist");
  if (!existsSync(join(dist, "index.html"))) continue;
  cpSync(dist, join(PUBLIC, id), { recursive: true });

  const data = JSON.parse(readFileSync(join(SITES, id, "data", "collection.json"), "utf8"));
  const { default: universe } = await import(
    new URL(`../sites/${id}/universe.js`, import.meta.url).href
  );
  entries.push({
    id,
    name: universe.name,
    lede: universe.copy.metaDescription,
    count: data.items?.length ?? 0,
    updated: (data.generatedAt ?? "").slice(0, 10),
  });
}

const cards = entries
  .map(
    (e) => `
    <a class="site" href="/${e.id}/">
      <span class="site-name">${esc(e.name)}</span>
      <span class="site-lede">${esc(e.lede)}</span>
      <span class="site-meta">${e.count} pieces &middot; updated ${esc(e.updated)}</span>
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
    --ink: oklch(0.92 0.015 85);
    --ink-dim: oklch(0.68 0.02 85);
    --hairline: color-mix(in oklch, var(--ink) 14%, transparent);
  }
  *{ box-sizing: border-box; }
  body{ margin:0; background: var(--ground); color: var(--ink);
    font-family: Georgia, "Times New Roman", serif; line-height: 1.5;
    min-height: 100vh; display: grid; place-items: center; padding: 48px 24px; }
  main{ max-width: 720px; width: 100%; }
  .kicker{ font-family: ui-sans-serif, Arial, sans-serif; font-size: 11px;
    letter-spacing: .3em; text-transform: uppercase; color: var(--ink-dim); margin: 0 0 18px; }
  h1{ font-size: clamp(34px, 6vw, 54px); font-weight: 400; line-height: 1.05;
    margin: 0 0 14px; letter-spacing: -0.01em; }
  .lede{ color: var(--ink-dim); font-style: italic; margin: 0 0 44px; max-width: 52ch; }
  .sites{ display: grid; gap: 1px; background: var(--hairline);
    border-block: 1px solid var(--hairline); }
  .site{ background: var(--ground); padding: 26px 4px; text-decoration: none;
    color: inherit; display: grid; gap: 6px; transition: padding-left .25s ease; }
  .site:hover{ padding-left: 14px; }
  .site-name{ font-size: 24px; }
  .site-lede{ color: var(--ink-dim); font-size: 14.5px; font-style: italic; max-width: 60ch; }
  .site-meta{ font-family: ui-sans-serif, Arial, sans-serif; font-size: 11px;
    letter-spacing: .18em; text-transform: uppercase; color: var(--ink-dim); }
  footer{ margin-top: 46px; color: var(--ink-dim); font-size: 12.5px; }
</style>
</head>
<body>
  <main>
    <p class="kicker">volteanu &middot; curated universe storefronts</p>
    <h1>Worlds you can walk into. Things you can walk out with.</h1>
    <p class="lede">One storefront per beloved TV universe: the licensed relics and the wardrobe of the world around them, each piece chosen on purpose.</p>
    <nav class="sites">${cards}</nav>
    <footer>Links are monetized; purchases may earn this site a commission. All trademarks belong to their owners.</footer>
  </main>
</body>
</html>
`
);

console.log(`Assembled public/ with ${entries.length} sites: ${entries.map((e) => e.id).join(", ")}`);
