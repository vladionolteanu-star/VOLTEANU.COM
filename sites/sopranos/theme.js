// Bada Bing & Co. look, second edition: the claude.ai register. Warm cream
// ground, white cards with soft diffuse shadows, one vermilion accent doing
// every job, rounded corners, generous air. Source Serif editorial display,
// Archivo grotesque for UI. The Sopranos lives in the copy and the imagery,
// not in the chrome.

export default {
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap",

  flags: {
    h1AccentNeon: false,
    evidenceThread: false,
  },

  tokens: {
    "--ground": "oklch(0.977 0.005 90)",
    "--surface": "oklch(1 0 0)",
    "--well": "oklch(0.955 0.006 90)",
    "--ink": "oklch(0.24 0.005 60)",
    "--ink-dim": "oklch(0.49 0.01 60)",
    "--accent": "oklch(0.66 0.13 42)",
    "--accent-strong": "oklch(0.66 0.13 42)",
    "--plate-bg": "oklch(0.945 0.008 92)",
    "--plate-ink": "oklch(0.24 0.005 60)",
    "--plate-numeral": "oklch(0.66 0.13 42)",
    "--plate-intro-ink": "oklch(0.45 0.01 60)",
    "--tag-bg": "oklch(0.66 0.13 42)",
    "--tag-ink": "oklch(1 0 0)",
    "--cta-hover": "oklch(0.58 0.13 40)",
    "--scrollbar": "oklch(0.66 0.13 42)",
    "--exhibit-paper": "oklch(1 0 0)",
    "--exhibit-ink": "oklch(0.45 0.01 60)",
    "--exhibit-filter": "none",
    "--shadow-soft": "0 16px 40px -16px oklch(0.3 0.03 50 / 0.28)",
    "--radius": "14px",

    "--font-base": '"Archivo", "Helvetica Neue", sans-serif',
    "--font-title": '"Source Serif 4", Georgia, serif',
    "--font-label": '"Archivo", "Helvetica Neue", sans-serif',
    "--font-prose": '"Source Serif 4", Georgia, serif',
    "--font-quote": '"Source Serif 4", Georgia, serif',
    "--font-note": '"Source Serif 4", Georgia, serif',
    "--note-style": "italic",

    "--title-transform": "none",
    "--title-weight": "600",
    "--title-leading": "1.02",
    "--h1-size": "clamp(46px, 8.2vw, 108px)",
    "--plate-title-size": "clamp(36px, 6.2vw, 82px)",
    "--name-font": '"Archivo", "Helvetica Neue", sans-serif',
    "--name-size": "16px",
    "--name-weight": "600",
    "--price-size": "17px",
    "--wordmark-size": "18px",
  },
};
