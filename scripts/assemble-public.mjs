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
cpSync(join(ROOT, "assets", "google166c56f5cbded422.html"), join(PUBLIC, "google166c56f5cbded422.html"));

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
// Pick 4 in-world images for a universe's hero card: iconic licensed pieces
// first, then officials, then anything — never repeating the showcase grid.
// ---------------------------------------------------------------------------
function pickHeroImages(items, universe, showcase, n = 4) {
  const used = new Set(showcase.map((i) => i.image));
  const withImg = items.filter((i) => i.image);
  const officials = withImg.filter((i) => i.collection === "official");
  const iconic = universe.evidenceIconic
    ? officials.filter((i) => universe.evidenceIconic.test(i.title))
    : [];
  const pool = [...iconic, ...officials, ...withImg];
  const seen = new Set();
  const picks = [];
  for (const skipUsed of [true, false]) {
    for (const i of pool) {
      if (seen.has(i.image) || (skipUsed && used.has(i.image))) continue;
      seen.add(i.image);
      picks.push(i);
      if (picks.length === n) return picks;
    }
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
  const { default: theme } = await import(
    new URL(`../sites/${id}/theme.js`, import.meta.url).href
  );
  const show =
    universe.copy?.title?.match(/curated edit of (?:the )?(.+?) universe/i)?.[1] ??
    id.replace(/-/g, " ");
  const showcase = pickShowcase(data.items ?? [], universe.chapters, 16);
  entries.push({
    id,
    name: universe.name,
    show,
    count: data.items?.length ?? 0,
    chapters: universe.chapters,
    showcase,
    heroPicks: pickHeroImages(data.items ?? [], universe, showcase),
    fontsHref: theme.fontsHref,
    t: theme.tokens,
  });
}

entries.sort((a, b) => {
  if (a.id === "sopranos") return -1;
  if (b.id === "sopranos") return 1;
  return a.id.localeCompare(b.id);
});

const totalPieces = entries.reduce((n, e) => n + e.count, 0);

// ---------------------------------------------------------------------------
// Product card HTML
// ---------------------------------------------------------------------------
function productCard(item) {
  const sale =
    item.compareAt && item.compareAt > item.price
      ? `<s class="was">${esc(money(item.compareAt, item.currency))}</s>`
      : "";
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": item.title,
    "image": [item.image],
    "description": item.description || item.note || item.title,
    "sku": item.id,
    "brand": {
      "@type": "Brand",
      "name": item.brand || item.retailer
    },
    "offers": {
      "@type": "Offer",
      "url": item.url,
      "priceCurrency": item.currency || "USD",
      "price": item.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    }
  };
  const schemaHtml = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;

  return `
      ${schemaHtml}
      <a class="product" data-reveal href="${esc(item.url)}" target="_blank" rel="noopener sponsored">
        <span class="product-img"><img src="${esc(item.image)}" alt="${esc(item.alt_text || item.title)}" loading="lazy" decoding="async" /></span>
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
const chNo = (i) => `CH ${String(i + 1).padStart(2, "0")}`;

// Each universe section carries its own site's identity: display face, accent,
// and chapter-plate treatment, scoped through inline CSS custom properties.
const uVars = (e) =>
  [
    `--u-font: ${e.t["--font-title"]}`,
    `--u-accent: ${e.t["--accent-strong"]}`,
    `--u-plate: ${e.t["--plate-bg"]}`,
    `--u-plate-ink: ${e.t["--plate-ink"]}`,
    `--u-plate-dim: ${e.t["--plate-intro-ink"]}`,
    `--u-title-transform: ${e.t["--title-transform"] || "none"}`,
    `--u-title-weight: ${e.t["--title-weight"] || "600"}`,
  ]
    .join("; ")
    .replace(/"/g, "&quot;");

function universeSection(entry, i) {
  const cards = entry.showcase.map((item) => productCard(item)).join("");

  const heroImgs = entry.heroPicks
    .map(
      (item) =>
        `<img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async" />`
    )
    .join("");

  const heroCard = `
    <a class="product hero-card" data-reveal href="/${esc(entry.id)}/">
      <span class="hero-card-ch">${chNo(i)} &middot; ${esc(entry.name)}</span>
      <span class="hero-card-imgs">${heroImgs}</span>
      <span class="hero-card-link">Change the channel &rarr;</span>
    </a>
  `;

  return `
    <section class="universe" id="${esc(entry.id)}" style="${uVars(entry)}">
      <div class="universe-header">
        <span class="universe-ch">${chNo(i)} &middot; ${esc(entry.name)} &middot; ${entry.count} pieces</span>
        <h2 class="universe-show"><a href="/${esc(entry.id)}/">${esc(entry.show)}</a></h2>
      </div>
      <div class="product-grid">
        ${heroCard}
        ${cards}
      </div>
      <a class="universe-cta" href="/${esc(entry.id)}/">See all ${entry.count} pieces &rarr;</a>
    </section>`;
}

const sections = entries.map((e, i) => universeSection(e, i)).join("");

const fontLinks = [...new Set(entries.map((e) => e.fontsHref))]
  .map((href) => `<link href="${href}" rel="stylesheet" />`)
  .join("\n");

// ---------------------------------------------------------------------------
// Write public/index.html
// ---------------------------------------------------------------------------
writeFileSync(
  join(PUBLIC, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-7L7RXM5Q92"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-7L7RXM5Q92');
</script>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>volteanu | TV Show Merch, Curated</title>
<meta name="description" content="Curated merchandise from Breaking Bad, The Sopranos, Stranger Things, True Detective. ${totalPieces} pieces across 4 universes. All shoppable." />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23191715'/%3E%3Ctext x='32' y='47' text-anchor='middle' font-family='Arial,sans-serif' font-weight='bold' font-size='42' fill='%23FBFAF6'%3EV%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
${fontLinks}
<style>
  :root {
    --paper: oklch(0.975 0.004 90);
    --ink: oklch(0.21 0.008 60);
    --ink-mid: oklch(0.40 0.01 60);
    --ink-dim: oklch(0.55 0.01 60);
    --hairline: oklch(0.90 0.008 85);
    --mono: "Space Mono", "Courier New", monospace;
    --display: "Bricolage Grotesque", "Arial Black", sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  }

  * { box-sizing: border-box; margin: 0; }

  body {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ------------------------------------------------------------------ hero */
  .hero {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(36px, 7vh, 70px) 24px clamp(24px, 4vh, 40px);
  }

  .logo {
    font-family: var(--display);
    font-weight: 800;
    font-size: clamp(34px, 5.6vw, 72px);
    line-height: 0.98;
    letter-spacing: -0.025em;
    color: var(--ink);
    margin-bottom: clamp(14px, 2vh, 20px);
    text-wrap: balance;
  }

  .logo-found {
    color: var(--ink-dim);
  }

  .meta {
    font-size: 11.5px;
    color: var(--ink-dim);
    letter-spacing: 0.14em;
    text-transform: uppercase;
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
    flex-direction: column;
    gap: 6px;
    padding-bottom: 16px;
    margin-bottom: clamp(16px, 2.5vh, 24px);
  }

  .universe-ch {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--u-accent);
  }

  .universe-show {
    line-height: 1.05;
  }

  .universe-show a {
    font-family: var(--u-font);
    font-weight: var(--u-title-weight);
    text-transform: var(--u-title-transform);
    font-size: clamp(32px, 4.6vw, 54px);
    color: var(--ink);
    text-decoration: none;
    transition: color 0.2s var(--ease-out);
  }

  .universe-show a:hover {
    color: var(--u-accent);
  }

  /* --------------------------------------------------------- product grid */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  @media (min-width: 900px) {
    .product-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .product {
    display: flex;
    flex-direction: column;
    background: oklch(1 0 0);
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    border: 1px solid var(--hairline);
    transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
    border-radius: 8px;
  }

  .product:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -8px oklch(0 0 0 / 0.07);
    border-color: var(--u-accent);
  }

  .product:focus-visible {
    outline: 2px solid var(--u-accent);
    outline-offset: 2px;
  }

  .product-img {
    display: block;
    aspect-ratio: 1;
    overflow: hidden;
    background: oklch(0.96 0.004 90);
    border-bottom: 1px solid var(--hairline);
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
    gap: 4px;
    padding: 16px;
    min-height: 0;
  }

  .product-brand {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-dim);
    line-height: 1.3;
  }

  .product-title {
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product-price {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--ink);
    margin-top: auto;
    padding-top: 8px;
  }

  .product-price .was {
    font-weight: 400;
    font-size: 11px;
    color: var(--ink-dim);
    margin-left: 4px;
    text-decoration: line-through;
  }
  
  /* ----------------------------------------------------------- hero card */
  .hero-card {
    grid-column: span 1;
    justify-content: flex-start;
    padding: clamp(16px, 1.8vw, 22px);
    background: var(--u-plate);
    color: var(--u-plate-ink);
    border: none;
  }

  @media (min-width: 600px) {
    .hero-card {
      grid-column: span 2;
    }
  }

  .hero-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -14px oklch(0 0 0 / 0.3);
    border-color: transparent;
  }

  .hero-card-ch {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.72;
    margin-bottom: 12px;
  }

  .hero-card-imgs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .hero-card-imgs img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
    background: oklch(1 0 0);
  }

  .hero-card-link {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 12.5px;
    letter-spacing: 0.04em;
    color: inherit;
    margin-top: auto;
    display: inline-block;
  }

  /* ----------------------------------------------------------- universe CTA */
  .universe-cta {
    display: inline-block;
    margin-top: clamp(16px, 2.5vh, 24px);
    font-family: var(--mono);
    font-weight: 700;
    font-size: 13px;
    color: var(--u-accent);
    text-decoration: none;
    padding: 10px 0;
    transition: color 0.2s var(--ease-out);
  }

  .universe-cta:hover {
    color: var(--ink);
  }

  /* ---------------------------------------------------------------- footer */
  .footer {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(28px, 4vh, 48px) 24px clamp(40px, 6vh, 64px);
    border-top: 1px solid var(--hairline);
    font-size: 13px;
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

  /* -------------------------------------------------- responsive tweaks */  /* -------------------------------------------------- responsive tweaks */
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
    <h1 class="logo">TV shows have the best stuff.<br /><span class="logo-found">We found it.</span></h1>
    <p class="meta">volteanu.com &middot; ${totalPieces} pieces &middot; ${entries.length} channels &middot; tracked, curated, all shoppable</p>
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

const sitemapUrls = [
  "https://www.volteanu.com/",
  ...entries.map((e) => `https://www.volteanu.com/${e.id}/`)
];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}
</urlset>`;
writeFileSync(join(PUBLIC, "sitemap.xml"), sitemapXml);

const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://www.volteanu.com/sitemap.xml`;
writeFileSync(join(PUBLIC, "robots.txt"), robotsTxt);

console.log(`Assembled public/ with ${entries.length} sites: ${entries.map((e) => e.id).join(", ")}`);
console.log(`Total: ${totalPieces} pieces, ${entries.reduce((n, e) => n + e.showcase.length, 0)} showcase items on homepage`);
