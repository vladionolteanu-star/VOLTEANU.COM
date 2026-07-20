// Shared site renderer: node core/render.js <siteId>
//
// One HTML/CSS skeleton for every universe. Structure, layouts, motion, and
// accessibility live HERE and improve for all sites at once. Personality is
// data: sites/<id>/theme.js (tokens, fonts, flags) + universe.js (chapters,
// copy, voice). If you find yourself copying this file, you are doing it wrong.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { ev } from "./curation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const isOOS = (item) => item.availability !== "InStock";

// --- cards -------------------------------------------------------------------

function cardInner(item, copy) {
  const sale =
    item.compareAt && item.compareAt > item.price
      ? `<s class="was">${esc(money(item.compareAt, item.currency))}</s>`
      : "";
  const oosTag = isOOS(item) ? `<span class="oos-tag">${esc(copy.soldOut)}</span>` : "";
  return `
    <a class="frame" href="${esc(item.url)}" target="_blank" rel="noopener sponsored" tabindex="-1" aria-hidden="true">
      <img src="${esc(item.image)}" alt="" loading="lazy" decoding="async" />${oosTag}
    </a>
    <div class="body">
      <span class="eyebrow">${esc(item.brand || item.retailer)}</span>
      <h3 class="name">${esc(item.title)}</h3>
      <p class="note">${esc(item.note ?? "")}</p>
      <div class="row">
        <span class="price">${esc(money(item.price, item.currency))} ${sale}</span>
        <a class="cta" href="${esc(item.url)}" target="_blank" rel="noopener sponsored">${esc(copy.ctaVerb)} ${esc(item.retailer)}</a>
      </div>
    </div>`;
}

const card = (item, copy, cls = "") =>
  `<article class="card ${cls}${isOOS(item) ? " oos" : ""}" data-reveal>${cardInner(item, copy)}</article>`;

function ledgerRow(item, copy) {
  const oosTag = isOOS(item)
    ? `<span class="oos-tag oos-tag-inline">${esc(copy.soldOut)}</span>`
    : "";
  return `
  <article class="ledger-row${isOOS(item) ? " oos" : ""}" data-reveal>
    <a class="thumb" href="${esc(item.url)}" target="_blank" rel="noopener sponsored" tabindex="-1" aria-hidden="true">
      <img src="${esc(item.image)}" alt="" loading="lazy" decoding="async" />
    </a>
    <div class="ledger-main">
      <h3 class="name">${esc(item.title)} ${oosTag}</h3>
      <p class="note">${esc(item.note ?? "")}</p>
    </div>
    <div class="ledger-end">
      <span class="price">${esc(money(item.price, item.currency))}</span>
      <a class="cta" href="${esc(item.url)}" target="_blank" rel="noopener sponsored">${esc(copy.ctaVerb)} ${esc(item.retailer)}</a>
    </div>
  </article>`;
}

// --- chapter layouts -----------------------------------------------------------

function featureLayout(items, copy) {
  const [hero, ...rest] = items;
  const side = rest.slice(0, 4);
  const overflow = rest.slice(4);
  return `
    <div class="feature">
      ${card(hero, copy, "card-hero")}
      <div class="feature-rest">${side.map((i) => card(i, copy)).join("")}</div>
    </div>
    ${overflow.length ? `<div class="feature-overflow">${overflow.map((i) => card(i, copy)).join("")}</div>` : ""}`;
}

const shelfLayout = (items, copy, label) => `
    <div class="shelf" role="list" aria-label="${esc(label)}">
      ${items.map((i) => card(i, copy, "card-shelf")).join("")}
    </div>
    <p class="shelf-hint" aria-hidden="true">${esc(copy.shelfHint)}</p>`;

const ledgerLayout = (items, copy) => `
    <div class="ledger">${items.map((i) => ledgerRow(i, copy)).join("")}</div>`;

function chapterSection(ch, items, copy) {
  if (items.length === 0) return "";
  const sorted =
    ch.sort === "curated" ? items : [...items].sort((a, b) => ev(b) - ev(a));
  const body =
    ch.layout === "shelf"
      ? shelfLayout(sorted, copy, ch.title)
      : ch.layout === "ledger"
        ? ledgerLayout(sorted, copy)
        : featureLayout(sorted, copy);
  return `
  <section class="chapter" id="${ch.key}">
    <header class="plate" data-reveal>
      <span class="numeral">${esc(copy.chapterLabel)} ${ch.numeral}</span>
      <h2 class="plate-title">${esc(ch.title)}</h2>
      <p class="plate-intro">${esc(ch.intro)}</p>
    </header>
    <div class="chapter-body">${body}</div>
  </section>`;
}

// --- collage interstitials ------------------------------------------------------

// Optional per-site bands (universe.collages): the hero's exhibit language
// repeated between chapters, each card clickable straight to the retailer.
function collageBand(col, items, copy) {
  const seen = new Set();
  const picks = [];
  for (const i of items) {
    if (isOOS(i) || !col.pick.test(i.title) || seen.has(i.image)) continue;
    seen.add(i.image);
    picks.push(i);
    if (picks.length === 4) break;
  }
  if (picks.length < 3) return "";
  const cards = picks
    .map(
      (i) => `
      <a class="exhibit collage-item" href="${esc(i.url)}" target="_blank" rel="noopener sponsored" data-reveal>
        <img src="${esc(i.image)}" alt="${esc(i.title)}" loading="lazy" decoding="async" />
        <span class="exhibit-label">${esc(i.brand || i.retailer)} &middot; ${esc(money(i.price, i.currency))}</span>
      </a>`
    )
    .join("");
  return `
  <aside class="collage">
    <div class="wrap">
      <header class="collage-head" data-reveal>
        <span class="collage-label">${esc(col.label)}</span>
        <p class="collage-note">${esc(col.note)}</p>
      </header>
      <div class="collage-row">${cards}</div>
    </div>
  </aside>`;
}

// --- hero evidence board --------------------------------------------------------

function pickEvidence(items, universe) {
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
    if (picks.length === 4) break;
  }
  return picks;
}

// --- css ------------------------------------------------------------------------

function css(theme) {
  const tokens = Object.entries(theme.tokens)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n");

  const h1Accent = theme.flags.h1AccentNeon
    ? `
  .h1-accent{
    color: var(--accent-strong);
    text-shadow: 0 0 28px color-mix(in oklch, var(--accent-strong) 55%, transparent),
                 0 0 6px color-mix(in oklch, var(--accent-strong) 80%, transparent);
    animation: flick 1.9s steps(1) 1;
  }
  @keyframes flick{
    0%, 34%, 46%, 58%, 100% { opacity: 1; }
    30% { opacity: .2; } 42% { opacity: .55; } 54% { opacity: .3; }
  }`
    : `
  .h1-accent{ font-style: var(--h1-accent-style, italic); color: var(--accent-strong); }`;

  const thread = theme.flags.evidenceThread
    ? `
  .thread{ position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 5; }
  .thread path{ stroke: var(--thread, oklch(0.52 0.19 25)); stroke-width: 1.6;
    fill: none; opacity: .85; vector-effect: non-scaling-stroke; }
  .thread circle{ fill: var(--thread, oklch(0.52 0.19 25)); }`
    : `
  .thread{ display: none; }`;

  return `
  :root{
${tokens}
    --hairline: color-mix(in oklch, var(--ink) 12%, transparent);
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body{
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--font-base);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  img { max-width: 100%; }
  a { color: inherit; }
  .wrap { max-width: 1200px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }

  [data-reveal]{ opacity: 0; transform: translateY(14px);
    transition: opacity .34s var(--ease), transform .34s var(--ease);
    transition-delay: var(--stagger, 0ms); }
  [data-reveal].in{ opacity: 1; transform: none; }

  /* ---- masthead + hero ---- */
  .masthead{
    position: sticky; top: 0; z-index: 20;
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px clamp(20px, 4vw, 48px);
    background: color-mix(in oklch, var(--ground) 87%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--hairline);
  }
  .wordmark{ font-family: var(--font-title); font-weight: 600;
    font-size: var(--wordmark-size, 19px); letter-spacing: .05em;
    text-transform: uppercase; text-decoration: none; }
  .wm-accent{ color: var(--accent-strong); }
  .masthead-note{ font-family: var(--font-note, var(--font-label));
    font-style: var(--note-style, normal); font-size: 13px; color: var(--ink-dim); }

  .hero{ padding: clamp(70px, 11vh, 140px) 0 clamp(56px, 8vh, 90px);
    display: grid; gap: clamp(36px, 5vw, 72px); align-items: center; }
  @media (min-width: 980px){ .hero{ grid-template-columns: 1.15fr 1fr; } }
  .kicker{ font-family: var(--font-label); font-size: 11.5px; font-weight: 500;
    letter-spacing: .22em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 26px; }
  h1{
    font-family: var(--font-title); font-weight: var(--title-weight, 600);
    text-transform: var(--title-transform, none);
    font-size: var(--h1-size, clamp(52px, 10.5vw, 148px));
    line-height: var(--title-leading, 0.95); letter-spacing: -0.01em;
    margin: 0 0 30px; max-width: 13ch; text-wrap: balance;
  }
${h1Accent}
  .hero .lede{
    font-family: var(--font-prose);
    font-size: clamp(16px, 1.9vw, 19.5px);
    color: var(--ink-dim); max-width: 57ch; margin: 0;
  }
  .hero-cta{ display: inline-flex; align-items: center; gap: 10px; margin-top: 36px;
    background: var(--btn-bg, var(--accent-strong)); color: var(--btn-ink, var(--ground));
    font-family: var(--font-label); font-size: 14px; font-weight: 500;
    letter-spacing: .03em; text-decoration: none; padding: 15px 28px;
    border-radius: 999px;
    transition: background .25s var(--ease), transform .25s var(--ease); }
  .hero-cta:hover{ background: var(--cta-hover, var(--ink)); transform: translateY(-1px); }
  .hero-cta:focus-visible{ outline: 2px solid var(--accent); outline-offset: 3px; }

  /* evidence board */
  .evidence{ position: relative; min-height: 465px; }
${thread}
  .exhibit{
    position: absolute; display: block; width: min(46%, 228px);
    background: var(--exhibit-paper, var(--ink)); padding: 9px 9px 7px;
    border-radius: var(--radius, 0);
    box-shadow: var(--shadow-soft, 0 18px 44px -18px oklch(0 0 0 / 0.68));
    text-decoration: none;
    transition: transform .35s var(--ease), box-shadow .35s var(--ease);
  }
  .exhibit img{ display: block; width: 100%; aspect-ratio: 1;
    object-fit: cover; border-radius: calc(var(--radius, 0px) / 2);
    filter: var(--exhibit-filter, saturate(.9)); }
  .exhibit-label{ display: block; padding: 7px 2px 2px;
    font-family: var(--font-label); font-size: 10px; font-weight: 600;
    letter-spacing: .2em; text-transform: uppercase;
    color: var(--exhibit-ink, oklch(0.33 0.04 60)); }
  .exhibit-1{ top: 0; left: 3%; transform: rotate(-3.5deg); z-index: 4; }
  .exhibit-2{ top: 9%; right: 2%; transform: rotate(2.5deg); z-index: 3; }
  .exhibit-3{ bottom: 5%; left: 11%; transform: rotate(2deg); z-index: 2; }
  .exhibit-4{ bottom: 0; right: 9%; transform: rotate(-2deg); z-index: 1; }
  .exhibit:hover{ transform: rotate(0deg) translateY(-6px); z-index: 9; }
  .exhibit:focus-visible{ outline: 2px solid var(--accent); outline-offset: 3px; }
  @media (max-width: 979px){
    .evidence{ min-height: 0; display: grid; gap: 18px 14px;
      grid-template-columns: repeat(2, 1fr); padding: 8px 4px; }
    .exhibit{ position: static; width: auto; }
    .thread{ display: none; }
    .exhibit-1{ transform: rotate(-2deg); }
    .exhibit-2{ transform: rotate(1.5deg); }
    .exhibit-3{ transform: rotate(1.5deg); }
    .exhibit-4{ transform: rotate(-1.5deg); }
  }

  /* chapter index */
  .index-head{ font-family: var(--font-label); font-size: 12px;
    letter-spacing: .22em; text-transform: uppercase; color: var(--ink-dim);
    margin: clamp(48px, 7vh, 80px) 0 14px; }
  .index{ display: grid; gap: 1px; background: var(--hairline);
    border-block: 1px solid var(--hairline);
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .index.no-head{ margin-top: clamp(48px, 7vh, 80px); }
  .idx{ background: var(--ground); padding: 20px 20px 24px;
    display: flex; flex-direction: column; gap: 5px;
    text-decoration: none; transition: background .3s var(--ease); }
  .idx:hover{ background: var(--surface); }
  .idx:focus-visible{ outline: 2px solid var(--accent); outline-offset: -2px; }
  .idx-numeral{ font-family: var(--font-label); color: var(--accent);
    font-size: 11px; letter-spacing: .2em; text-transform: uppercase; }
  .idx-title{ font-family: var(--font-title); font-size: 23px; font-weight: 600;
    text-transform: var(--title-transform, none); }
  .idx-count{ font-family: var(--font-note, var(--font-label));
    font-style: var(--note-style, normal); font-size: 12.5px; color: var(--ink-dim); }

  /* ---- chapter plates ---- */
  .chapter{ margin-top: clamp(90px, 14vh, 160px); }
  .plate{
    background: var(--plate-bg); color: var(--plate-ink);
    padding: clamp(52px, 9vh, 110px) clamp(20px, 4vw, 48px);
  }
  .numeral{ display: block; font-family: var(--font-label);
    color: var(--plate-numeral); font-size: 12px; font-weight: 500;
    letter-spacing: .28em; text-transform: uppercase; margin-bottom: 13px; }
  .plate-title{
    font-family: var(--font-title); font-weight: var(--title-weight, 600);
    text-transform: var(--title-transform, none);
    font-size: var(--plate-title-size, clamp(45px, 9vw, 118px)); line-height: .95;
    margin: 0 0 17px; max-width: 1200px;
  }
  .plate-intro{ font-family: var(--font-prose); font-style: italic;
    font-size: clamp(16px, 1.8vw, 19px);
    color: var(--plate-intro-ink); margin: 0; max-width: 54ch; }
  .chapter-body{ max-width: 1296px;
    margin: clamp(36px, 6vh, 64px) auto 0;
    padding: 0 clamp(20px, 4vw, 48px); }

  /* ---- cards ---- */
  .card{ display: flex; flex-direction: column;
    border: 1px solid var(--hairline); background: var(--surface);
    border-radius: var(--radius, 0); }
  .frame{ display: block; aspect-ratio: 1; overflow: hidden; position: relative;
    border-radius: var(--radius, 0) var(--radius, 0) 0 0;
    background: var(--well, oklch(0.12 0.01 60)); }
  .frame img{ width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .4s var(--ease); }
  .card:hover .frame img{ transform: scale(1.03); }

  .oos .frame img, .oos .thumb img{ filter: grayscale(.58) brightness(.87); }
  .oos-tag{ position: absolute; top: 12px; left: 12px;
    background: var(--tag-bg); color: var(--tag-ink);
    font-family: var(--font-label); font-size: 10px; font-weight: 600;
    letter-spacing: .2em; text-transform: uppercase; padding: 5px 9px; }
  .oos-tag-inline{ position: static; margin-left: 10px; padding: 3px 7px;
    vertical-align: middle; }

  .body{ display: flex; flex-direction: column; gap: 7px;
    padding: 18px 18px 22px; flex: 1; }
  .eyebrow{ font-family: var(--font-label); color: var(--accent);
    font-size: 10.5px; font-weight: 500;
    letter-spacing: .17em; text-transform: uppercase; }
  .name{ font-family: var(--name-font, var(--font-title));
    font-size: var(--name-size, 19px); font-weight: var(--name-weight, 600);
    line-height: 1.2; margin: 0; }
  .note{ font-family: var(--font-prose); font-style: italic;
    font-size: 14.5px; color: var(--ink-dim); margin: 0; }
  .row{ margin-top: auto; padding-top: 16px; display: flex;
    justify-content: space-between; align-items: baseline; gap: 12px;
    border-top: 1px solid var(--hairline); }
  .price{ font-family: var(--price-font, var(--font-label));
    font-size: var(--price-size, 17px); font-weight: 600;
    font-variant-numeric: tabular-nums; }
  .was{ color: var(--ink-dim); font-weight: 400; font-size: 12.5px; margin-left: 6px; }
  .cta{ font-family: var(--font-label); font-size: 11.5px; font-weight: 500;
    letter-spacing: .09em; text-transform: uppercase; color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in oklch, var(--accent) 45%, transparent);
    padding-bottom: 2px; white-space: nowrap;
    transition: color .25s var(--ease), border-color .25s var(--ease); }
  .cta:hover{ color: var(--cta-hover, var(--ink)); border-color: var(--cta-hover, var(--ink)); }
  .cta:focus-visible, .frame:focus-visible{
    outline: 2px solid var(--accent); outline-offset: 3px; }

  /* feature layout: hero + 2x2 support; overflow flows below */
  .feature{ display: grid; gap: 22px; grid-template-columns: 1.35fr 1fr; }
  .card-hero .frame{ aspect-ratio: auto; flex: 1; min-height: 380px; }
  .card-hero .body{ flex: 0 0 auto; }
  .card-hero .name{ font-size: calc(var(--name-size, 19px) + 7px); }
  .card-hero .note{ font-size: 15.5px; }
  .feature-rest{ display: grid; gap: 22px; grid-template-columns: repeat(2, 1fr); }
  .feature-overflow{ display: grid; gap: 22px; margin-top: 22px;
    grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 880px){
    .feature{ grid-template-columns: 1fr; }
    .card-hero .frame{ aspect-ratio: 1; min-height: 0; flex: initial; }
    .feature-rest{ grid-template-columns: repeat(2, 1fr); }
    .feature-overflow{ grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px){
    .feature-rest, .feature-overflow{ grid-template-columns: 1fr; }
  }

  /* shelf layout */
  .shelf{ display: flex; gap: 18px; overflow-x: auto;
    scroll-snap-type: x mandatory; padding-bottom: 10px;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar, var(--accent)) transparent; }
  .card-shelf{ min-width: min(300px, 78vw); scroll-snap-align: start; }
  .shelf-hint{ font-family: var(--font-note, var(--font-label));
    font-style: var(--note-style, normal); color: var(--ink-dim);
    font-size: 12px; letter-spacing: .06em; margin: 10px 0 0; }
  @media (hover: none){ .shelf-hint{ display: none; } }

  /* ledger layout */
  .ledger{ border-top: 1px solid var(--hairline); }
  .ledger-row{ display: grid; align-items: center; gap: 20px;
    grid-template-columns: 92px 1fr auto;
    padding: 18px 0; border-bottom: 1px solid var(--hairline); }
  .thumb{ width: 92px; height: 92px; overflow: hidden; display: block;
    border-radius: var(--radius, 0);
    background: var(--well, oklch(0.12 0.01 60)); }
  .thumb img{ width: 100%; height: 100%; object-fit: cover; display: block; }
  .ledger-main .name{ font-size: calc(var(--name-size, 19px) + 2px); }
  .ledger-main .note{ margin-top: 4px; }
  .ledger-end{ display: flex; flex-direction: column; gap: 8px;
    align-items: flex-end; text-align: right; }
  @media (max-width: 640px){
    .ledger-row{ grid-template-columns: 72px 1fr; }
    .thumb{ width: 72px; height: 72px; }
    .ledger-end{ grid-column: 2; flex-direction: row; align-items: baseline;
      justify-content: space-between; width: 100%; }
  }

  /* collage interstitial */
  .collage{ margin-top: clamp(90px, 14vh, 160px); }
  .collage-head{ display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap;
    margin-bottom: 26px; }
  .collage-label{ font-family: var(--font-label); font-size: 11.5px; font-weight: 500;
    letter-spacing: .22em; text-transform: uppercase; color: var(--accent); }
  .collage-note{ font-family: var(--font-note, var(--font-prose));
    font-style: var(--note-style, normal);
    font-size: 14.5px; color: var(--ink-dim); margin: 0; }
  .collage-row{ display: grid; gap: 26px; grid-template-columns: repeat(4, 1fr); }
  .collage-item{ position: static; width: auto; }
  .collage-item:nth-child(1){ transform: rotate(-2deg); }
  .collage-item:nth-child(2){ transform: rotate(1.6deg); }
  .collage-item:nth-child(3){ transform: rotate(-1.2deg); }
  .collage-item:nth-child(4){ transform: rotate(2.2deg); }
  .collage-item:hover{ transform: rotate(0deg) translateY(-6px); }
  @media (max-width: 880px){
    .collage-row{ grid-template-columns: repeat(2, 1fr); gap: 18px 14px; }
  }

  /* quote interstitial */
  .quote{ margin-top: clamp(90px, 14vh, 160px); text-align: center;
    padding: 0 clamp(20px, 4vw, 48px); }
  .quote blockquote{
    font-family: var(--font-quote, var(--font-title));
    font-style: italic; font-weight: 500;
    font-size: clamp(27px, 4.6vw, 46px); line-height: 1.22;
    max-width: 24ch; margin: 0 auto; text-wrap: balance; }
  .quote cite{ display: block; margin-top: 18px; font-style: normal;
    font-family: var(--font-label); font-size: 11px; font-weight: 500;
    letter-spacing: .28em; text-transform: uppercase; color: var(--accent); }

  /* footer */
  footer{ margin-top: clamp(100px, 16vh, 180px);
    border-top: 1px solid var(--hairline);
    padding: 44px 0 72px; }
  footer .wrap{ display: grid; gap: 28px; grid-template-columns: 1.2fr 1fr; }
  @media (max-width: 720px){ footer .wrap{ grid-template-columns: 1fr; } }
  footer h2{ font-family: var(--font-label); font-size: 13px; font-weight: 600;
    letter-spacing: .16em; text-transform: uppercase; margin: 0 0 10px; }
  footer p{ font-family: var(--font-prose); font-size: 14px;
    color: var(--ink-dim); margin: 0 0 8px; max-width: 58ch; }

  @media (prefers-reduced-motion: reduce){
    [data-reveal]{ opacity: 1; transform: none; transition: none; }
    .h1-accent{ animation: none; }
    html{ scroll-behavior: auto; }
    .frame img{ transition: none; }
  }`;
}

// --- page ----------------------------------------------------------------------

function render(universe, theme, data) {
  const copy = universe.copy;
  const items = data.items ?? [];
  const byChapter = (key) => items.filter((i) => i.chapter === key);
  const date = new Date(data.generatedAt ?? Date.now());
  const updated = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const kicker = copy.kicker
    .replaceAll("{count}", String(items.length))
    .replaceAll("{updated}", updated);

  const evidence = pickEvidence(items, universe)
    .map(
      (i, n) => `
      <a class="exhibit exhibit-${n + 1}" href="#${universe.chapters[0].key}" data-reveal>
        <img src="${esc(i.image)}" alt="${esc(i.title)}" loading="eager" decoding="async" />
        <span class="exhibit-label">${copy.exhibitLabel.replaceAll("{letter}", "ABCD"[n])}</span>
      </a>`
    )
    .join("");

  const threadSvg = theme.flags.evidenceThread
    ? `
        <svg class="thread" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 22 12 L 78 22 L 30 68 L 72 84" />
          <circle cx="22" cy="12" r="1.4"/><circle cx="78" cy="22" r="1.4"/>
          <circle cx="30" cy="68" r="1.4"/><circle cx="72" cy="84" r="1.4"/>
        </svg>`
    : "";

  const index = universe.chapters
    .filter((c) => byChapter(c.key).length > 0)
    .map(
      (c) => `
      <a class="idx" href="#${c.key}" data-reveal>
        <span class="idx-numeral">${esc(copy.chapterLabel)} ${c.numeral}</span>
        <span class="idx-title">${esc(c.title)}</span>
        <span class="idx-count">${byChapter(c.key).length} pieces</span>
      </a>`
    )
    .join("");

  const sections = universe.chapters
    .map((c, n) => {
      let s = chapterSection(c, byChapter(c.key), copy);
      if (n === universe.quoteAfterChapter && s) {
        s += `
  <aside class="quote" data-reveal>
    <blockquote>&ldquo;${copy.quote.text}&rdquo;</blockquote>
    <cite>${esc(copy.quote.cite)}</cite>
  </aside>`;
      }
      const col = universe.collages?.find((x) => x.afterChapter === c.key);
      if (col && s) s += collageBand(col, items, copy);
      return s;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(copy.title)}</title>
<meta name="description" content="${esc(copy.metaDescription)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${theme.fontsHref}" rel="stylesheet" />
<style>${css(theme)}</style>
</head>
<body>
  <header class="masthead">
    <a class="wordmark" href="#top">${copy.wordmark}</a>
    <span class="masthead-note">${esc(copy.mastheadNote)}</span>
  </header>

  <main id="top">
    <section class="hero wrap">
      <div class="hero-copy">
        <p class="kicker" data-reveal>${kicker}</p>
        <h1 data-reveal>${copy.h1}</h1>
        <p class="lede" data-reveal>${esc(copy.lede)}</p>${
          copy.heroCta
            ? `\n        <a class="hero-cta" href="${esc(copy.heroCta.href)}" data-reveal>${esc(copy.heroCta.label)} &rarr;</a>`
            : ""
        }
      </div>
      <div class="evidence" aria-label="${esc(copy.evidenceAria)}">${threadSvg}
        ${evidence}
      </div>
    </section>

    <div class="wrap">
      ${copy.indexHead ? `<p class="index-head">${esc(copy.indexHead)}</p>` : ""}
      <nav class="index${copy.indexHead ? "" : " no-head"}" aria-label="Chapters">${index}</nav>
    </div>
    ${sections}
  </main>

  <footer>
    <div class="wrap">
      <div>
        <h2>${esc(copy.footer.recordTitle)}</h2>
        ${copy.footer.recordParagraphs.map((p) => `<p>${p}</p>`).join("\n        ")}
      </div>
      <div>
        <h2>${esc(copy.footer.arrangementTitle)}</h2>
        <p>${copy.footer.arrangementParagraph}</p>
      </div>
    </div>
  </footer>

  <script>
    (function () {
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var els = document.querySelectorAll("[data-reveal]");
      if (reduced || !("IntersectionObserver" in window)) {
        els.forEach(function (el) { el.classList.add("in"); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        var batch = entries.filter(function (e) { return e.isIntersecting; });
        batch.forEach(function (e, n) {
          e.target.style.setProperty("--stagger", Math.min(n * 45, 320) + "ms");
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      els.forEach(function (el) { io.observe(el); });
    })();
  </script>
</body>
</html>
`;
}

async function main() {
  const siteId = process.argv[2];
  if (!siteId) {
    console.error("Usage: node core/render.js <siteId>   (a folder in sites/)");
    process.exit(1);
  }
  const siteDir = join(__dirname, "..", "sites", siteId);
  const { default: universe } = await import(pathToFileURL(join(siteDir, "universe.js")).href);
  const { default: theme } = await import(pathToFileURL(join(siteDir, "theme.js")).href);
  const data = JSON.parse(readFileSync(join(siteDir, "data", "collection.json"), "utf8"));

  const outDir = join(siteDir, "dist");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), render(universe, theme, data));
  console.log(`Rendered ${data.items?.length ?? 0} items to sites/${siteId}/dist/index.html`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
