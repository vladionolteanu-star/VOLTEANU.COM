// Bada Bing & Co. look: night-time North Jersey. Warm smoke-black ground,
// oxblood chapter plates, rationed neon pink, gold accents. Oswald condensed
// uppercase display, Source Serif italic curatorial voice.

export default {
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&display=swap",

  flags: {
    h1AccentNeon: true,
    evidenceThread: false,
  },

  tokens: {
    "--ground": "oklch(0.16 0.012 40)",
    "--surface": "oklch(0.20 0.015 40)",
    "--well": "oklch(0.13 0.01 40)",
    "--ink": "oklch(0.92 0.02 85)",
    "--ink-dim": "oklch(0.72 0.02 85)",
    "--accent": "oklch(0.78 0.11 85)",
    "--accent-strong": "oklch(0.68 0.21 356)",
    "--plate-bg": "oklch(0.38 0.13 25)",
    "--plate-ink": "oklch(0.92 0.02 85)",
    "--plate-numeral": "oklch(0.78 0.11 85)",
    "--plate-intro-ink": "color-mix(in oklch, oklch(0.92 0.02 85) 82%, oklch(0.38 0.13 25))",
    "--tag-bg": "oklch(0.38 0.13 25)",
    "--tag-ink": "oklch(0.92 0.02 85)",
    "--cta-hover": "oklch(0.47 0.15 25)",
    "--scrollbar": "oklch(0.38 0.13 25)",
    "--exhibit-paper": "oklch(0.92 0.02 85)",
    "--exhibit-ink": "oklch(0.35 0.05 25)",
    "--exhibit-filter": "saturate(.92)",

    "--font-base": '"Oswald", "Arial Narrow", sans-serif',
    "--font-title": '"Oswald", "Arial Narrow", sans-serif',
    "--font-label": '"Oswald", "Arial Narrow", sans-serif',
    "--font-prose": '"Source Serif 4", Georgia, serif',
    "--font-quote": '"Source Serif 4", Georgia, serif',
    "--font-note": '"Source Serif 4", Georgia, serif',
    "--note-style": "italic",

    "--title-transform": "uppercase",
    "--title-weight": "600",
    "--title-leading": "0.92",
    "--name-font": '"Oswald", "Arial Narrow", sans-serif',
    "--name-size": "17px",
    "--name-weight": "500",
    "--price-size": "18px",
    "--wordmark-size": "18px",
  },
};
