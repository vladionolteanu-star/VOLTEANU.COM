# HANDOFF — starting a new universe site

Read this first in a fresh session. The method is fully encoded in the
**`/new-site <universe>`** skill (`~/.claude/skills/new-site/SKILL.md`) —
invoke it and follow it. This file is the state of the world it plugs into.

## What exists (July 16, 2026)

- **This repo** is the canonical monorepo. Remotes (push to BOTH):
  - `origin` → https://gitlab.com/vladionstar-group/volteanu
  - `github` → https://github.com/vladionolteanu-star/VOLTEANU.COM
- **Four live sites** on the shared engine, all fully built and pushed:
  - `sites/sopranos` — Bada Bing & Co. (86 items; smoke/oxblood/neon, Oswald + Source Serif)
  - `sites/true-detective` — Carcosa Outfitters (104 items; tar/sulfur/typewriter, Cormorant + Special Elite + Lora)
  - `sites/breaking-bad` — The Heisenberg Estate (light manila auction catalog, Saira Stencil One + IBM Plex)
  - `sites/stranger-things` — Hawkins General (56 items, lean build, credits were low; indigo night/signal red/cream flyer plates, Fraunces + Literata + Share Tech Mono)
- **Engine** in `core/` (channel3.js, curation.js, build.js, render.js).
  One renderer for all sites; improvements go there behind theme flags,
  NEVER fork it. New site = only `universe.js` + `theme.js`.
- **Aggregator v0**: `scripts/assemble-public.mjs` builds `public/` (root
  index + `/[site]/` paths). `vercel.json` runs it on deploy.
  NOTE: `vercel.json` buildCommand lists render calls per site — add the new
  site there (or generalize the command to loop `sites/`).
- **Deployment**: Vercel import was IN PROGRESS (user was connecting the
  repo; GitHub import is easiest since GitHub is already linked). Domain
  volteanu.com not yet attached. Ask the user for status, don't assume.

## Credentials & money

- `.env` (gitignored, exists locally) has `CHANNEL3_API_KEY` — Vlad's key;
  attribution is by API key, vendor id `uosIs6`. Cost: $7/1000 queries,
  a full site build ≈ 60–70 credits, expect 2–3 build iterations.
  Credits are running LOW (July 2026): plan lean (~24 queries ≈ 48 credits),
  put official queries first in universe.js, and prefer surgical prunes +
  chapter-scoped top-up scripts over full rebuilds. core/build.js now writes
  the partial collection if the API dies mid-run instead of losing the run.
- Channel3 dashboard (trychannel3.com/sign-in): clicks tracking works.
  **Still pending (nag Vlad):** profile identity verification + Stripe
  payout connection — without them brands can deny commissions.

## Commands

```bash
cd "c:\Users\volteanu\Downloads\VOLTEANU COM\volteanu"
node --env-file=.env core/build.js <siteId>   # data (needs key, costs credits)
node core/render.js <siteId>                  # site from committed data (free)
node scripts/assemble-public.mjs              # aggregator public/
git push origin main && git push github main  # ALWAYS both
```

## Hard-won gotchas (don't relearn these)

1. Channel3 semantic search leaks other franchises via *descriptions*
   (Chelsea Detective, Night Country/season 4, Seinfeld...) — the
   officialMatch regex + per-query include/exclude are the wall. Audit
   printed titles after EVERY build; expect kitsch (Harley zippos, "Daddy"
   engravings), wrong geography (California cypress), art-print size
   variants (fingerprint in curation.js handles most).
2. Search results DRIFT between runs (DVDs appeared/vanished). Don't chase;
   officials are stock-exempt by design.
3. Niche official merch is often thin in the index (~7 real TD items).
   Don't pad with junk; source books/music of the show are legitimate
   official-chapter deep cuts (The King in Yellow worked).
4. ~40% of naive results earn 0% commission. in_style must pay >0% unless
   a query sets `allowZero` (theme over economics, 1–2 queries max).
5. Product images come at retailer resolution — the feature layout already
   bounds the hero crop; don't stretch hero frames.
6. No em dashes in any copy. House voice: deadpan, insider, references
   earned not explained. English only.
7. Each universe gets a NEW identity (OKLCH, committed color strategy,
   distinct type pairing). Never reuse the two existing palettes/pairings.

## Next universes Vlad mentioned

Breaking Bad ("și restul" — more beloved shows to follow). End state:
volteanu.com as an aggregator of all of them.
