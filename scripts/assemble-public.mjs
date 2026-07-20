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

const money = (n, cur = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);

rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
cpSync(join(ROOT, "assets", "volteanu-logo.jpg"), join(PUBLIC, "volteanu-logo.jpg"));

// ---------------------------------------------------------------------------
// Pick a diverse showcase from across all chapters.
// Strategy: round-robin through chapters, prefer InStock + paying commission,
// ensure visual variety by never repeating the same image.
// ---------------------------------------------------------------------------
function pickShowcase(items, chapters, n = 16) {
  const chapterKeys = chapters.map((ch) => ch.key);
  const buckets = {};
  for (const key of chapterKeys) buckets[key] = [];

  for (const item of items) {
    if (item.image && buckets[item.chapter]) {
      buckets[item.chapter].push(item);
    }
  }

  // Sort each bucket: InStock first, then by commission (desc), then by price
  for (const key of chapterKeys) {
    buckets[key].sort((a, b) => {
      const aStock = a.availability === "InStock" ? 0 : 1;
      const bStock = b.availability === "InStock" ? 0 : 1;
      if (aStock !== bStock) return aStock - bStock;
      if ((b.commissionRate || 0) !== (a.commissionRate || 0))
        return (b.commissionRate || 0) - (a.commissionRate || 0);
      return a.price - b.price;
    });
  }

  const picks = [];
  const seenImages = new Set();
  let round = 0;

  while (picks.length < n && round < 20) {
    for (const key of chapterKeys) {
      if (picks.length >= n) break;
      const bucket = buckets[key];
      const candidate = bucket.find((i) => !seenImages.has(i.image));
      if (candidate) {
        seenImages.add(candidate.image);
        picks.push(candidate);
        buckets[key] = bucket.filter((i) => i !== candidate);
      }
    }
    round++;
  }

  return picks;
}

// ---------------------------------------------------------------------------
// Collect site data
// ---------------------------------------------------------------------------
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
    universe.copy?.title?.match(/curated edit of (?:the )?(.+?) universe/i)?.[1] ??
    id.replace(/-/g, " ");
  entries.push({
    id,
    name: universe.name,
    show,
    count: data.items?.length ?? 0,
    chapters: universe.chapters,
    showcase: pickShowcase(data.items ?? [], universe.chapters, 16),
  });
}

const totalPieces = entries.reduce((n, e) => n + e.count, 0);

// ---------------------------------------------------------------------------
// Product card HTML
// ---------------------------------------------------------------------------
function productCard(item) {
  const sale =
    item.compareAt && item.compareAt > item.price
      ? `<s class="was">${esc(money(item.compareAt, item.currency))}</s>`
      : "";
  return `
      <a class="product" data-reveal href="${esc(item.url)}" target="_blank" rel="noopener sponsored">
        <span class="product-img"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async" /></span>
        <span class="product-info">
          <span class="product-brand">${esc(item.brand || item.retailer)}</span>
          <span class="product-title">${esc(item.title)}</span>
          <span class="product-price">${esc(money(item.price, item.currency))} ${sale}</span>
        </span>
      </a>`;
}

// ---------------------------------------------------------------------------
// Universe section HTML
// ---------------------------------------------------------------------------
function universeSection(entry) {
  const cards = entry.showcase.map((item) => productCard(item)).join("");
  return `
    <section class="universe" id="${esc(entry.id)}">
      <div class="universe-header">
        <h2 class="universe-show">${esc(entry.show)}</h2>
        <a class="universe-link" href="/${esc(entry.id)}/">${esc(entry.name)} &rarr; ${entry.count} pieces</a>
      </div>
      <div class="product-grid">${cards}</div>
      <a class="universe-cta" href="/${esc(entry.id)}/">See all ${entry.count} pieces &rarr;</a>
    </section>`;
}

const sections = entries.map((e) => universeSection(e)).join("");

// ---------------------------------------------------------------------------
// Write public/index.html
// ---------------------------------------------------------------------------
writeFileSync(
  join(PUBLIC, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>volteanu | TV Show Merch, Curated</title>
<meta name="description" content="Curated merchandise from Breaking Bad, The Sopranos, Stranger Things, True Detective. ${totalPieces} pieces across 4 universes. All shoppable." />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23201c14'/%3E%3Ctext x='32' y='47' text-anchor='middle' font-family='Georgia,serif' font-weight='bold' font-size='42' fill='%23e8b54a'%3EV%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bungee+Shade&family=Geist:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --ground: oklch(0.13 0.008 80);
    --surface: oklch(0.17 0.01 80);
    --surface-hover: oklch(0.20 0.015 80);
    --ink: oklch(0.93 0.01 85);
    --ink-mid: oklch(0.72 0.015 85);
    --ink-dim: oklch(0.52 0.015 85);
    --amber: oklch(0.80 0.14 85);
    --amber-dim: oklch(0.62 0.09 85);
    --hairline: oklch(0.30 0.01 80);
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  }

  * { box-sizing: border-box; margin: 0; }

  body {
    background: var(--ground);
    color: var(--ink);
    font-family: "Geist", system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ------------------------------------------------------------------ hero */
  .hero {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(48px, 10vh, 100px) 24px clamp(36px, 6vh, 56px);
  }

  .logo {
    font-family: "Bungee Shade", "Arial Black", sans-serif;
    font-weight: 400;
    font-size: clamp(40px, 9vw, 110px);
    line-height: 0.9;
    letter-spacing: 0.02em;
    color: var(--amber);
    text-shadow: 0 0 80px oklch(0.80 0.14 85 / 0.2);
    margin-bottom: clamp(18px, 3vh, 28px);
    text-wrap: balance;
  }

  .pitch {
    font-size: clamp(17px, 2.2vw, 24px);
    line-height: 1.45;
    color: var(--ink);
    max-width: 48ch;
    font-weight: 400;
    margin-bottom: 10px;
  }

  .pitch strong {
    color: var(--amber);
    font-weight: 500;
  }

  .meta {
    font-size: 13px;
    color: var(--ink-dim);
    letter-spacing: 0.03em;
  }

  /* ----------------------------------------------------------- universe */
  .universe {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    margin-bottom: clamp(56px, 8vh, 80px);
  }

  .universe-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--hairline);
    margin-bottom: clamp(16px, 2.5vh, 24px);
  }

  .universe-show {
    font-size: clamp(22px, 3.5vw, 32px);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.15;
    color: var(--ink);
    text-transform: uppercase;
  }

  .universe-link {
    font-size: 13px;
    color: var(--ink-dim);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s var(--ease-out);
  }

  .universe-link:hover {
    color: var(--amber);
  }

  /* --------------------------------------------------------- product grid */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2px;
  }

  @media (min-width: 900px) {
    .product-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .product {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    transition: background 0.25s var(--ease-out);
  }

  .product:hover {
    background: var(--surface-hover);
  }

  .product:focus-visible {
    outline: 2px solid var(--amber);
    outline-offset: -2px;
  }

  .product-img {
    display: block;
    aspect-ratio: 1;
    overflow: hidden;
    background: oklch(0.95 0.005 85);
  }

  .product-img img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px 16px;
    min-height: 0;
  }

  .product-brand {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-dim);
    line-height: 1.3;
  }

  .product-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.35;
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product:hover .product-title {
    color: var(--amber);
  }

  .product-price {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-mid);
    margin-top: auto;
    padding-top: 4px;
  }

  .product-price .was {
    font-weight: 400;
    font-size: 12px;
    color: var(--ink-dim);
    margin-left: 4px;
  }

  /* ----------------------------------------------------------- universe CTA */
  .universe-cta {
    display: inline-block;
    margin-top: clamp(14px, 2vh, 20px);
    font-size: 14px;
    font-weight: 500;
    color: var(--amber-dim);
    text-decoration: none;
    padding: 10px 0;
    transition: color 0.2s var(--ease-out);
  }

  .universe-cta:hover {
    color: var(--amber);
  }

  /* ---------------------------------------------------------------- footer */
  .footer {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(28px, 4vh, 48px) 24px clamp(40px, 6vh, 64px);
    border-top: 1px solid var(--hairline);
    font-size: 12px;
    color: var(--ink-dim);
    line-height: 1.6;
  }

  /* ---------------------------------------------------------- reveal motion */
  @media (prefers-reduced-motion: no-preference) {
    [data-reveal] {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.5s var(--ease), transform 0.5s var(--ease);
    }
    [data-reveal].visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-reveal] {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }

  /* -------------------------------------------------- responsive tweaks */
  @media (max-width: 600px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
    }
    .product-info {
      padding: 10px 10px 12px;
    }
    .product-title {
      font-size: 13px;
    }
    .universe-header {
      flex-direction: column;
      gap: 4px;
    }
  }

  @media (min-width: 601px) and (max-width: 899px) {
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
</head>
<body>
  <header class="hero">
    <h1 class="logo">VOLTEANU</h1>
    <p class="pitch">TV shows have the best stuff. <strong>We found it.</strong></p>
    <p class="meta">${totalPieces} pieces across ${entries.length} universes. Tracked, curated, all shoppable.</p>
  </header>
${sections}
  <footer class="footer">Links are monetized; purchases may earn this site a commission. All trademarks belong to their owners.</footer>
  <script>
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.classList.contains('product-grid')) {
              const cards = el.querySelectorAll('[data-reveal]');
              cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('visible'), i * 35);
              });
            } else {
              el.classList.add('visible');
            }
            io.unobserve(el);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('.universe-header').forEach((h) => {
        h.setAttribute('data-reveal', '');
        io.observe(h);
      });
      document.querySelectorAll('.product-grid').forEach((grid) => io.observe(grid));
    }
  </script>
</body>
</html>
`
);

console.log(`Assembled public/ with ${entries.length} sites: ${entries.map((e) => e.id).join(", ")}`);
console.log(`Total: ${totalPieces} pieces, ${entries.reduce((n, e) => n + e.showcase.length, 0)} showcase items on homepage`);
