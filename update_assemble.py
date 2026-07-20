import re
import sys

with open("scripts/assemble-public.mjs", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update entries.push to include rawTitle and pitch
push_target = """  entries.push({
    id,
    name: universe.name,
    show,
    count: data.items?.length ?? 0,"""

push_replacement = """  entries.push({
    id,
    name: universe.name,
    show,
    rawTitle: universe.copy?.title || show,
    pitch: universe.copy?.pitch || "",
    count: data.items?.length ?? 0,"""

content = content.replace(push_target, push_replacement)

# 2. Update universeSection(entry) HTML
section_target = """function universeSection(entry) {
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
}"""

section_replacement = """function universeSection(entry) {
  const cards = entry.showcase.map((item) => productCard(item)).join("");
  const formattedTitle = esc(entry.rawTitle).replace(/\\n/g, "<br/>");
  
  const heroCard = `
    <div class="product hero-card" data-reveal>
      <h3 class="hero-card-title">${formattedTitle}</h3>
      <p class="hero-card-pitch">${esc(entry.pitch)}</p>
      <a class="hero-card-link" href="/${esc(entry.id)}/">Explore the Universe &rarr;</a>
    </div>
  `;

  return `
    <section class="universe" id="${esc(entry.id)}">
      <div class="universe-header">
        <h2 class="universe-show"><a href="/${esc(entry.id)}/" style="color:inherit;text-decoration:none;">${esc(entry.show)}</a></h2>
        <a class="universe-link" href="/${esc(entry.id)}/">${esc(entry.name)} &rarr; ${entry.count} pieces</a>
      </div>
      <div class="product-grid">
        ${heroCard}
        ${cards}
      </div>
      <a class="universe-cta" href="/${esc(entry.id)}/">See all ${entry.count} pieces &rarr;</a>
    </section>`;
}"""

content = content.replace(section_target, section_replacement)

# 3. Replace the entire HTML template string in writeFileSync
html_target_start = 'writeFileSync(\n  join(PUBLIC, "index.html"),\n  `<!doctype html>'
html_target_end = '  /* -------------------------------------------------- responsive tweaks */'
# Find start and end indices
start_idx = content.find(html_target_start)
if start_idx == -1:
    print("Could not find start of HTML")
    sys.exit(1)

new_html = """writeFileSync(
  join(PUBLIC, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>volteanu | TV Show Merch, Curated</title>
<meta name="description" content="Curated merchandise from Breaking Bad, The Sopranos, Stranger Things, True Detective. ${totalPieces} pieces across 4 universes. All shoppable." />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23ffffff'/%3E%3Ctext x='32' y='47' text-anchor='middle' font-family='Arial,sans-serif' font-weight='bold' font-size='42' fill='%23111111'%3EV%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  :root {
    --ground: oklch(0.98 0.005 250);
    --surface: oklch(1 0 0);
    --surface-hover: oklch(0.98 0.005 250);
    --surface-alt: oklch(0.95 0.01 250);
    --ink: oklch(0.15 0.01 250);
    --ink-mid: oklch(0.40 0.01 250);
    --ink-dim: oklch(0.60 0.01 250);
    --accent: oklch(0.45 0.12 250);
    --accent-dim: oklch(0.60 0.10 250);
    --hairline: oklch(0.92 0.01 250);
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
    font-family: "Geist", sans-serif;
    font-weight: 800;
    font-size: clamp(40px, 9vw, 96px);
    line-height: 0.9;
    letter-spacing: -0.04em;
    color: var(--ink);
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
    color: var(--accent);
    font-weight: 600;
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
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: var(--ink);
    text-transform: uppercase;
  }
  
  .universe-show a:hover {
    color: var(--accent) !important;
  }

  .universe-link {
    font-size: 13px;
    color: var(--ink-dim);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s var(--ease-out);
    font-weight: 500;
  }

  .universe-link:hover {
    color: var(--accent);
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
    background: var(--surface);
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    border: 1px solid var(--hairline);
    transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
    border-radius: 4px;
  }

  .product:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -8px oklch(0 0 0 / 0.05);
    border-color: var(--ink-dim);
  }

  .product:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .product-img {
    display: block;
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--surface-alt);
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
    font-size: 11px;
    font-weight: 600;
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

  .product-price {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    margin-top: auto;
    padding-top: 8px;
  }

  .product-price .was {
    font-weight: 400;
    font-size: 12px;
    color: var(--ink-dim);
    margin-left: 4px;
  }
  
  /* ----------------------------------------------------------- hero card */
  .hero-card {
    grid-column: span 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(24px, 3vw, 32px);
    background: var(--surface-alt);
    border: 1px solid var(--hairline);
  }
  
  @media (min-width: 600px) {
    .hero-card {
      grid-column: span 2;
    }
  }
  
  .hero-card:hover {
    transform: none;
    box-shadow: none;
    border-color: var(--hairline);
  }
  
  .hero-card-title {
    font-size: clamp(26px, 3vw, 42px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin-bottom: 12px;
    text-wrap: balance;
    text-transform: uppercase;
  }
  
  .hero-card-pitch {
    font-size: clamp(14px, 1.2vw, 16px);
    line-height: 1.5;
    color: var(--ink-mid);
    margin-bottom: 24px;
    max-width: 40ch;
  }
  
  .hero-card-link {
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
    margin-top: auto;
    display: inline-block;
    transition: color 0.2s var(--ease-out);
  }
  
  .hero-card-link:hover {
    color: var(--ink);
  }

  /* ----------------------------------------------------------- universe CTA */
  .universe-cta {
    display: inline-block;
    margin-top: clamp(16px, 2.5vh, 24px);
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
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

  /* -------------------------------------------------- responsive tweaks */"""

# Use regex or string slicing to replace the CSS part
# The original code ends responsive tweaks around line 413, then script tags.
end_idx = content.find('  /* -------------------------------------------------- responsive tweaks */')
if end_idx == -1:
    print("Could not find end of CSS")
    sys.exit(1)

final_content = content[:start_idx] + new_html + content[end_idx:]

with open("scripts/assemble-public.mjs", "w", encoding="utf-8") as f:
    f.write(final_content)

print("Successfully updated assemble-public.mjs")
