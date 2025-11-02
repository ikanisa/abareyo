import type { Config } from "tailwindcss";

import {
  gradientTokens,
  motionTokens,
  spacingTokens,
  typographyTokens,
} from "@rayon/design-tokens";

const preset = {
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: typographyTokens.fontFamily.sans,
        display: typographyTokens.fontFamily.display,
        mono: typographyTokens.fontFamily.mono,
      },
      fontSize: typographyTokens.fontSize,
      letterSpacing: typographyTokens.letterSpacing,
      spacing: {
        ...spacingTokens,
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "rayon-blue": "hsl(var(--rayon-blue))",
        "deep-blue": "hsl(var(--deep-blue))",
        "rwanda-azure": "hsl(var(--rwanda-azure))",
        "rwanda-yellow": "hsl(var(--rwanda-yellow))",
        "rwanda-green": "hsl(var(--rwanda-green))",
        gold: "hsl(var(--gold))",
      },
      backgroundImage: {
        "gradient-hero": gradientTokens.hero,
        "gradient-accent": gradientTokens.accent,
        "gradient-success": gradientTokens.success,
        "gradient-gold": gradientTokens.gold,
        "gradient-surface": gradientTokens.surface,
      },
      animation: {
        skeleton: `skeleton-pulse ${motionTokens.toMs(motionTokens.duration.deliberate)} ${motionTokens.easing.standard} infinite`,
      },
      keyframes: {
        "skeleton-pulse": {
          "0%": { opacity: "0.55" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.55" },
        },
      },
      boxShadow: {
        glass: "var(--shadow-glass)",
        glow: "var(--shadow-glow)",
        "glow-accent": "var(--shadow-glow-accent)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 0.5rem)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default preset;
