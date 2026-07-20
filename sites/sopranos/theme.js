// Bada Bing & Co. look, third edition: Satriale's in daylight. Butcher-paper
// cream kept light and clean, but the chrome is North Jersey vernacular now:
// gravy-red accent, the pork-store awning stripe across every chapter plate,
// fat sign-painter slab display (Ultra), deli-tag condensed labels, trattoria
// serif notes. One accent, one stripe, no neon, no terracotta.

export default {
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Ultra&family=Barlow+Condensed:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap",

  flags: {
    h1AccentNeon: false,
    evidenceThread: false,
  },

  tokens: {
    "--ground": "oklch(0.965 0.009 85)",
    "--surface": "oklch(1 0 0)",
    "--well": "oklch(0.955 0.008 85)",
    "--ink": "oklch(0.23 0.012 50)",
    "--ink-dim": "oklch(0.47 0.015 50)",
    "--accent": "oklch(0.46 0.14 32)",
    "--accent-strong": "oklch(0.46 0.14 32)",
    "--plate-bg":
      "linear-gradient(oklch(0.94 0.012 85), oklch(0.94 0.012 85)) 0 18px / 100% calc(100% - 18px) no-repeat, repeating-linear-gradient(90deg, oklch(0.46 0.14 32) 0 26px, oklch(0.965 0.009 85) 26px 52px)",
    "--plate-ink": "oklch(0.23 0.012 50)",
    "--plate-numeral": "oklch(0.46 0.14 32)",
    "--plate-intro-ink": "oklch(0.42 0.02 50)",
    "--tag-bg": "oklch(0.46 0.14 32)",
    "--tag-ink": "oklch(0.97 0.005 85)",
    "--cta-hover": "oklch(0.36 0.13 32)",
    "--scrollbar": "oklch(0.46 0.14 32)",
    "--exhibit-paper": "oklch(1 0 0)",
    "--exhibit-ink": "oklch(0.40 0.02 50)",
    "--exhibit-filter": "saturate(.96)",
    "--shadow-soft": "0 14px 34px -14px oklch(0.3 0.06 40 / 0.32)",
    "--radius": "6px",

    "--font-base": '"Lora", Georgia, serif',
    "--font-title": '"Ultra", "Rockwell Extra Bold", serif',
    "--font-label": '"Barlow Condensed", "Arial Narrow", sans-serif',
    "--font-prose": '"Lora", Georgia, serif',
    "--font-quote": '"Lora", Georgia, serif',
    "--font-note": '"Lora", Georgia, serif',
    "--note-style": "italic",

    "--title-transform": "none",
    "--title-weight": "400",
    "--title-leading": "1.04",
    "--h1-accent-style": "normal",
    "--h1-size": "clamp(40px, 7vw, 92px)",
    "--plate-title-size": "clamp(32px, 5.4vw, 68px)",
    "--name-font": '"Barlow Condensed", "Arial Narrow", sans-serif',
    "--name-size": "18px",
    "--name-weight": "600",
    "--price-size": "18px",
    "--wordmark-size": "19px",
  },
};
