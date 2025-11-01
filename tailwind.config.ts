import type { Config } from "tailwindcss";

import {
  gradientTokens,
  motionTokens,
  spacingTokens,
  typographyTokens,
} from "./packages/design-tokens/src";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      boxShadow: {
        glass: "var(--shadow-glass)",
        glow: "var(--shadow-glow)",
        "glow-accent": "var(--shadow-glow-accent)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "skeleton-pulse": {
          "0%": { opacity: "0.55" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.55" },
        },
      },
      animation: {
        "accordion-down": `accordion-down ${motionTokens.toMs(motionTokens.duration.standard)} ${motionTokens.easing.standard}`,
        "accordion-up": `accordion-up ${motionTokens.toMs(motionTokens.duration.standard)} ${motionTokens.easing.standard}`,
        skeleton: `skeleton-pulse ${motionTokens.toMs(motionTokens.duration.deliberate)} ${motionTokens.easing.standard} infinite`,
      },
      transitionDuration: {
        fast: motionTokens.toMs(motionTokens.duration.fast),
        standard: motionTokens.toMs(motionTokens.duration.standard),
        deliberate: motionTokens.toMs(motionTokens.duration.deliberate),
      },
      transitionTimingFunction: {
        standard: motionTokens.easing.standard,
        emphasize: motionTokens.easing.emphasize,
        entrance: motionTokens.easing.entrance,
        exit: motionTokens.easing.exit,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
