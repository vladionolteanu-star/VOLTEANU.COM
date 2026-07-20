# Sopranos site — Anthropic/Claude aesthetic redesign

**Date:** 2026-07-20
**Site:** `sites/sopranos` (Bada Bing & Co.)
**Approved direction:** clean Anthropic clone — warm cream + vermilion, serif editorial, no gold/neon/dark. Sopranos identity lives in copy, imagery, and collages only.

## Goals

1. Reskin the Sopranos site from dark "Bada Bing at night" to the claude.ai look: cream ground, near-black warm ink, white cards, one vermilion accent, soft shadows, rounded corners, generous air.
2. Make the hero highly desirable: huge serif headline + vermilion CTA button on the left, the exhibit collage on white cards on the right.
3. Insert "hot pieces from the universe" among the chapters: exhibit-collage interstitial bands (the hero collage language, repeated) after selected chapters.
4. Zero visual regression on the other three sites — every engine change is opt-in.

## Non-goals

- No engine fork, no second renderer.
- No changes to data pipeline, curation, or Channel3 build.
- No redesign of breaking-bad / true-detective / stranger-things.

## Design decisions

### Palette & type (theme.js rewrite)

| Token | Value | Notes |
|---|---|---|
| ground | `#FAF9F5`-equivalent oklch | warm cream |
| surface / card | white | cards sit on cream |
| well | slightly darker ivory | image frames |
| ink | `#1F1E1D`-equivalent warm near-black | |
| accent + accent-strong | vermilion `#D97757` | THE only accent |
| cta-hover | `#C4633F` | darker vermilion |
| plate-bg | ivory `#F0EEE6` | chapter bands, no more oxblood |
| plate-numeral / tag | vermilion / vermilion | |
| exhibit-paper | white | soft diffuse shadow |

- Titles: Source Serif 4, weight ~550-600, **no uppercase**, tight leading, Tiempos vibe.
- UI/labels: Archivo (Styrene-ish grotesque).
- Curatorial notes stay Source Serif 4 italic.
- `h1AccentNeon: false` → existing italic-accent fallback ("family" in italic vermilion).

### Hero

- Left: small vermilion kicker → huge serif h1 "Dress like the *family*" → lede → **new vermilion pill button** `Browse the record →` linking to `#shrine`.
- Right: existing evidence collage, restyled by tokens (white cards, radius, soft shadow, subtle rotations kept, EXHIBIT A–D labels in small sans).

### Interstitial collages (new engine feature)

- New optional `universe.collages`: array of `{ afterChapter: <key>, title, note, pick: <regex> }`.
- Renders a full-width band after the named chapter: 3–4 items matched by `pick` (falling back to top-ev items from adjacent chapters), shown as rotated white exhibit cards, each linking to its product URL.
- Sopranos config: one collage after `shrine` (wardrobe/gold teasers), one after `gold` (backroom/kitchen teasers).
- Sites without `collages` render nothing new.

### Engine changes (core/render.js — all opt-in)

1. New tokens with defaults preserving today's look: `--radius` (default 0), `--shadow-soft` (default current dark shadow), button tokens.
2. Hero CTA button rendered only when `copy.heroCta` exists (`{ label, href }`).
3. Collage sections rendered only when `universe.collages` exists.
4. No changes to card/ledger/shelf/plate markup.

## Verification

- `node core/render.js sopranos` builds; headless Playwright screenshots desktop + mobile.
- `node core/render.js breaking-bad` → output diff vs. current dist proves the engine changes are invisible without opt-in.
