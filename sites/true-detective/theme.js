// Carcosa Outfitters look: Southern Gothic case file. Tar-green dark ground,
// sulfur-yellow chapter plates with tar ink, typewriter labels, elegant serif
// display, red thread on the evidence board.

export default {
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Special+Elite&family=Lora:ital@0;1&display=swap",

  flags: {
    h1AccentNeon: false,
    evidenceThread: true,
  },

  tokens: {
    "--ground": "oklch(0.15 0.015 150)",
    "--surface": "oklch(0.19 0.02 150)",
    "--well": "oklch(0.12 0.012 150)",
    "--ink": "oklch(0.90 0.015 90)",
    "--ink-dim": "oklch(0.70 0.02 95)",
    "--accent": "oklch(0.78 0.13 95)",
    "--accent-strong": "oklch(0.78 0.13 95)",
    "--plate-bg": "oklch(0.78 0.13 95)",
    "--plate-ink": "oklch(0.15 0.015 150)",
    "--plate-numeral": "oklch(0.40 0.09 50)",
    "--plate-intro-ink": "oklch(0.30 0.04 100)",
    "--tag-bg": "oklch(0.55 0.13 40)",
    "--tag-ink": "oklch(0.90 0.015 90)",
    "--cta-hover": "oklch(0.90 0.015 90)",
    "--scrollbar": "oklch(0.60 0.11 90)",
    "--thread": "oklch(0.52 0.19 25)",
    "--exhibit-paper": "oklch(0.90 0.015 90)",
    "--exhibit-ink": "oklch(0.32 0.03 90)",
    "--exhibit-filter": "saturate(.82) sepia(.12)",

    "--font-base": '"Lora", Georgia, serif',
    "--font-title": '"Cormorant Garamond", Georgia, serif',
    "--font-label": '"Special Elite", "Courier New", monospace',
    "--font-prose": '"Lora", Georgia, serif',
    "--font-quote": '"Cormorant Garamond", Georgia, serif',
    "--font-note": '"Special Elite", "Courier New", monospace',
    "--note-style": "normal",

    "--title-transform": "none",
    "--title-weight": "500",
    "--title-leading": "0.98",
    "--name-font": '"Cormorant Garamond", Georgia, serif',
    "--name-size": "20px",
    "--name-weight": "600",
    "--price-size": "16px",
    "--wordmark-size": "20px",
  },
};
