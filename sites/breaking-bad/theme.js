// The Heisenberg Estate look: a federal auction catalog on manila stock.
// Light paper ground (the first light site), evidence-green plates, crystal
// blue rationed to the accent role, rubber-stamp red on seized tags. Stencil
// display like a crate marking, Plex Mono federal forms, Plex Serif prose.

export default {
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Saira+Stencil+One&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap",

  flags: {
    h1AccentNeon: false,
    evidenceThread: false,
  },

  tokens: {
    "--ground": "oklch(0.92 0.035 90)",
    "--surface": "oklch(0.955 0.022 92)",
    "--well": "oklch(0.97 0.012 95)",
    "--ink": "oklch(0.24 0.018 255)",
    "--ink-dim": "oklch(0.45 0.02 255)",
    "--accent": "oklch(0.48 0.11 235)",
    "--accent-strong": "oklch(0.55 0.13 232)",
    "--plate-bg": "oklch(0.33 0.05 155)",
    "--plate-ink": "oklch(0.92 0.035 90)",
    "--plate-numeral": "oklch(0.75 0.1 220)",
    "--plate-intro-ink": "color-mix(in oklch, oklch(0.92 0.035 90) 78%, oklch(0.33 0.05 155))",
    "--tag-bg": "oklch(0.5 0.16 28)",
    "--tag-ink": "oklch(0.95 0.02 90)",
    "--cta-hover": "oklch(0.24 0.018 255)",
    "--scrollbar": "oklch(0.55 0.1 232)",
    "--exhibit-paper": "oklch(0.97 0.01 95)",
    "--exhibit-ink": "oklch(0.35 0.03 250)",
    "--exhibit-filter": "saturate(.9) contrast(1.03)",

    "--font-base": '"IBM Plex Serif", Georgia, serif',
    "--font-title": '"Saira Stencil One", "Arial Black", sans-serif',
    "--font-label": '"IBM Plex Mono", "Courier New", monospace',
    "--font-prose": '"IBM Plex Serif", Georgia, serif',
    "--font-quote": '"IBM Plex Serif", Georgia, serif',
    "--font-note": '"IBM Plex Mono", "Courier New", monospace',
    "--note-style": "normal",

    "--title-transform": "uppercase",
    "--title-weight": "400",
    "--title-leading": "0.96",
    "--name-font": '"IBM Plex Mono", "Courier New", monospace',
    "--name-size": "15px",
    "--name-weight": "500",
    "--price-size": "16px",
    "--wordmark-size": "17px",
  },
};
