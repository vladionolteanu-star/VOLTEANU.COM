// Hawkins General look: a November night in Hawkins. Indigo dark over the
// cul-de-sac, one red sign buzzing (the h1 flickers once, like the lights do),
// xeroxed cream flyer plates stapled over the dark, CRT mono labels, warm
// bookish serif prose. No case-file props here; the hero photos are Polaroids.

export default {
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Literata:ital,opsz,wght@0,7..72,400;1,7..72,400&family=Share+Tech+Mono&display=swap",

  flags: {
    h1AccentNeon: true,
    evidenceThread: false,
  },

  tokens: {
    "--ground": "oklch(0.16 0.03 285)",
    "--surface": "oklch(0.20 0.035 285)",
    "--well": "oklch(0.13 0.025 285)",
    "--ink": "oklch(0.93 0.015 90)",
    "--ink-dim": "oklch(0.72 0.025 290)",
    "--accent": "oklch(0.70 0.17 25)",
    "--accent-strong": "oklch(0.62 0.25 27)",
    "--plate-bg": "oklch(0.92 0.02 90)",
    "--plate-ink": "oklch(0.20 0.03 285)",
    "--plate-numeral": "oklch(0.52 0.21 27)",
    "--plate-intro-ink": "oklch(0.34 0.03 285)",
    "--tag-bg": "oklch(0.50 0.20 27)",
    "--tag-ink": "oklch(0.93 0.015 90)",
    "--cta-hover": "oklch(0.93 0.015 90)",
    "--scrollbar": "oklch(0.55 0.18 27)",
    "--exhibit-paper": "oklch(0.93 0.01 90)",
    "--exhibit-ink": "oklch(0.30 0.03 285)",
    "--exhibit-filter": "saturate(.88) contrast(1.03)",

    "--font-base": '"Literata", Georgia, serif',
    "--font-title": '"Fraunces", Georgia, serif',
    "--font-label": '"Share Tech Mono", "Courier New", monospace',
    "--font-prose": '"Literata", Georgia, serif',
    "--font-quote": '"Fraunces", Georgia, serif',
    "--font-note": '"Literata", Georgia, serif',
    "--note-style": "italic",

    "--title-transform": "none",
    "--title-weight": "700",
    "--title-leading": "0.96",
    "--name-font": '"Fraunces", Georgia, serif',
    "--name-size": "19px",
    "--name-weight": "600",
    "--price-size": "17px",
    "--wordmark-size": "19px",
  },
};
