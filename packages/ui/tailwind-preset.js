import tokens from "./src/tokens.json" assert { type: "json" };
import tailwindcssAnimate from "tailwindcss-animate";

const motion = {
  duration: {
    instant: 0,
    fast: 160,
    standard: 200,
    deliberate: 250,
    slow: 320,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0.38, 0.9)",
    emphasize: "cubic-bezier(0.05, 0.7, 0.1, 1)",
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.16, 0, 0.13, 1)",
  },
};

const toMs = (value) => `${value}ms`;

const preset = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      letterSpacing: tokens.typography.letterSpacing,
      spacing: {
        ...tokens.spacing,
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
        "gradient-hero": tokens.gradients.hero,
        "gradient-accent": tokens.gradients.accent,
        "gradient-success": tokens.gradients.success,
        "gradient-gold": tokens.gradients.gold,
        "gradient-surface": tokens.gradients.surface,
      },
      backdropBlur: {
        glass: tokens.glass.blur,
      },
      boxShadow: {
        glass: tokens.glass.shadows.surfaceLight,
        "glass-dark": tokens.glass.shadows.surfaceDark,
        glow: tokens.glass.shadows.glow,
        "glow-accent": tokens.glass.shadows.glowAccent,
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
        "accordion-down": `accordion-down ${toMs(motion.duration.standard)} ${motion.easing.standard}`,
        "accordion-up": `accordion-up ${toMs(motion.duration.standard)} ${motion.easing.standard}`,
        skeleton: `skeleton-pulse ${toMs(motion.duration.deliberate)} ${motion.easing.standard} infinite`,
      },
      transitionDuration: {
        fast: toMs(motion.duration.fast),
        standard: toMs(motion.duration.standard),
        deliberate: toMs(motion.duration.deliberate),
      },
      transitionTimingFunction: {
        standard: motion.easing.standard,
        emphasize: motion.easing.emphasize,
        entrance: motion.easing.entrance,
        exit: motion.easing.exit,
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default preset;
