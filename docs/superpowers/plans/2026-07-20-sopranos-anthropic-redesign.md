# Sopranos Anthropic-Aesthetic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin `sites/sopranos` to the claude.ai look (cream + vermilion, serif editorial) with a CTA hero and exhibit-collage interstitials, via opt-in engine extensions.

**Architecture:** All structural additions land in `core/render.js` gated behind tokens with old-behavior defaults (`--radius: 0`, current shadow) or behind optional data (`copy.heroCta`, `universe.collages`). Sopranos personality changes live entirely in `sites/sopranos/theme.js` + `universe.js`. Other sites re-render visually identical.

**Tech Stack:** Node ESM renderer, static HTML/CSS output, Playwright-core (cached Chromium) for visual verification.

## Global Constraints

- Never fork `core/render.js`; extensions must be invisible to sites that don't opt in.
- Sopranos palette: cream ground `oklch(0.977 0.005 90)`, warm near-black ink, white cards, **vermilion `oklch(0.66 0.13 42)` as the only accent**. No gold, no neon, no dark surfaces.
- Titles: Source Serif 4, no uppercase. UI/labels: Archivo.
- There is no JS test framework in this repo; the test cycle is `node core/render.js <site>` + inspecting emitted HTML + Playwright screenshots.

---

### Task 1: Engine opt-in tokens + hero CTA

**Files:**
- Modify: `core/render.js` (css() rules; render() hero markup)

**Interfaces:**
- Produces: CSS vars consumed by themes: `--radius` (default 0), `--shadow-soft` (default `0 18px 44px -18px oklch(0 0 0 / 0.68)`), `--h1-size`, `--plate-title-size`, `--btn-bg`, `--btn-ink`. Optional copy field `copy.heroCta = { label, href }` rendering `<a class="hero-cta">`.

- [ ] **Step 1: Add radius/shadow/size vars to existing rules in `css()`**

In `core/render.js` `css()`:
- `.exhibit`: `box-shadow: var(--shadow-soft, 0 18px 44px -18px oklch(0 0 0 / 0.68));` and add `border-radius: var(--radius, 0); overflow: hidden;` — wait, overflow hidden would clip rotated labels? No: label is inside the card; overflow only matters for img corners. Add `border-radius: var(--radius, 0)` on `.exhibit` and `.exhibit img{ border-radius: calc(var(--radius, 0px) - 4px); }` instead of overflow.
- `.card`, `.frame` (top corners), `.thumb`, `.idx`: `border-radius: var(--radius, 0)`; `.frame` needs `overflow:hidden` (already has) — add radius on `.frame` top corners via `border-radius: var(--radius, 0) var(--radius, 0) 0 0`.
- `h1`: `font-size: var(--h1-size, clamp(52px, 10.5vw, 148px));`
- `.plate-title`: `font-size: var(--plate-title-size, clamp(45px, 9vw, 118px));`

- [ ] **Step 2: Add `.hero-cta` CSS + markup**

CSS:
```css
.hero-cta{ display:inline-flex; align-items:center; gap:10px; margin-top:36px;
  background: var(--btn-bg, var(--accent-strong)); color: var(--btn-ink, var(--ground));
  font-family: var(--font-label); font-size:14px; font-weight:500; letter-spacing:.03em;
  text-decoration:none; padding:15px 28px; border-radius:999px;
  transition: background .25s var(--ease), transform .25s var(--ease); }
.hero-cta:hover{ background: var(--cta-hover, var(--ink)); transform: translateY(-1px); }
.hero-cta:focus-visible{ outline:2px solid var(--accent); outline-offset:3px; }
```
Markup in `render()` after the lede `<p>`:
```js
const heroCta = copy.heroCta
  ? `\n        <a class="hero-cta" href="${esc(copy.heroCta.href)}" data-reveal>${esc(copy.heroCta.label)} &rarr;</a>`
  : "";
```
inserted inside `.hero-copy`.

- [ ] **Step 3: Verify no-op for other sites**

Run: `node core/render.js breaking-bad` → renders OK; grep dist for `hero-cta` anchor → absent (only CSS rule present).

- [ ] **Step 4: Commit** `feat(core): opt-in radius/shadow tokens, size overrides, hero CTA`

### Task 2: Engine collage interstitials

**Files:**
- Modify: `core/render.js`

**Interfaces:**
- Consumes: `universe.collages?: [{ afterChapter: string, label: string, note: string, pick: RegExp }]`
- Produces: `<aside class="collage">` band after the named chapter with up to 4 in-stock matched items as clickable exhibit cards.

- [ ] **Step 1: Add `collageBand()`**

```js
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
```

- [ ] **Step 2: Wire into sections loop**

In `render()` sections map, after quote logic, append `collageBand(col, items, copy)` for `universe.collages?.find(c => c.afterChapter === chapter.key)`.

- [ ] **Step 3: Collage CSS**

```css
.collage{ margin-top: clamp(90px, 14vh, 160px); }
.collage-head{ display:flex; align-items:baseline; gap:18px; flex-wrap:wrap; margin-bottom:26px; }
.collage-label{ font-family: var(--font-label); font-size:11.5px; font-weight:500;
  letter-spacing:.22em; text-transform:uppercase; color: var(--accent); }
.collage-note{ font-family: var(--font-note, var(--font-prose)); font-style: var(--note-style, normal);
  font-size:14.5px; color: var(--ink-dim); margin:0; }
.collage-row{ display:grid; gap:26px; grid-template-columns: repeat(4, 1fr); }
.collage-item{ position: static; width:auto; }
.collage-item:nth-child(1){ transform: rotate(-2deg); }
.collage-item:nth-child(2){ transform: rotate(1.6deg); }
.collage-item:nth-child(3){ transform: rotate(-1.2deg); }
.collage-item:nth-child(4){ transform: rotate(2.2deg); }
.collage-item:hover{ transform: rotate(0) translateY(-6px); }
@media (max-width: 880px){ .collage-row{ grid-template-columns: repeat(2, 1fr); } }
```

- [ ] **Step 4: Verify** `node core/render.js breaking-bad` → no `<aside class="collage">` in dist. `node core/render.js sopranos` → still none (config not added yet).

- [ ] **Step 5: Commit** `feat(core): opt-in exhibit-collage interstitials`

### Task 3: Sopranos theme.js rewrite

**Files:**
- Modify: `sites/sopranos/theme.js` (full rewrite)

- [ ] **Step 1: Rewrite theme** — claude.ai palette: ground `oklch(0.977 0.005 90)`, surface white, well `oklch(0.955 0.006 90)`, ink `oklch(0.24 0.005 60)`, ink-dim `oklch(0.49 0.01 60)`, accent + accent-strong vermilion `oklch(0.66 0.13 42)`, cta-hover `oklch(0.58 0.13 40)`, plate-bg `oklch(0.945 0.008 92)`, plate-ink = ink, plate-numeral = vermilion, tag vermilion/white, exhibit-paper white, exhibit-ink `oklch(0.45 0.01 60)`, exhibit-filter none. Fonts: Source Serif 4 (title/prose/quote/note, italic notes) + Archivo (base/label/name). `--title-transform: none`, `--title-weight: 600`, `--title-leading: 1.02`, `--h1-size: clamp(46px, 8.2vw, 108px)`, `--plate-title-size: clamp(36px, 6.2vw, 82px)`, `--radius: 14px`, `--shadow-soft: 0 16px 40px -16px oklch(0.3 0.03 50 / 0.28)`. Flags both false.

- [ ] **Step 2: Verify + commit** `node core/render.js sopranos` renders; commit `feat(sopranos): Anthropic-clean light theme`.

### Task 4: Sopranos universe.js copy + collages

**Files:**
- Modify: `sites/sopranos/universe.js`

- [ ] **Step 1: Add hero CTA + collages**

```js
copy.heroCta = { label: "Browse the record", href: "#shrine" };
collages: [
  { afterChapter: "shrine", label: "From the wardrobe",
    note: "The uniform, previewed. Velour, terry, and the gold that goes over it.",
    pick: /velour|track|terry|robe|silk|cuban|chain|bracelet/i },
  { afterChapter: "gold", label: "After hours",
    note: "The back room and the kitchen. Business gets discussed over these.",
    pick: /humidor|whisk|decanter|poker|ashtray|moka|espresso|pasta/i },
]
```

- [ ] **Step 2: Verify + commit** — dist contains two `<aside class="collage">`; commit `feat(sopranos): hero CTA + interstitial collages`.

### Task 5: Render all sites + visual verification

- [ ] **Step 1:** `node core/render.js` for all four sites; commit dists.
- [ ] **Step 2:** Playwright-core screenshots (cached Chromium, per memory note): sopranos desktop 1440px full-page, mobile 390px, breaking-bad desktop (regression eyeball). Inspect: cream/vermilion only, serif hero + pill CTA, white rounded exhibits, two collage bands, chapters ivory.
- [ ] **Step 3:** Fix visual issues found (spacing/contrast), re-render, final commit.
