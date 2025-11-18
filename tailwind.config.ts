import type { Config } from "tailwindcss";
import preset from "@rayon/ui/tailwind-preset";

const spacingScale = {
  0: "var(--space-0)",
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  7: "var(--space-7)",
  8: "var(--space-8)",
  9: "var(--space-9)",
  10: "var(--space-10)",
  12: "var(--space-12)",
  14: "var(--space-14)",
  16: "var(--space-16)",
};

const radiusScale = {
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  pill: "var(--radius-pill)",
};

const semanticColors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: "hsl(var(--card))",
  "card-foreground": "hsl(var(--card-foreground))",
  popover: "hsl(var(--popover))",
  "popover-foreground": "hsl(var(--popover-foreground))",
  primary: "hsl(var(--primary))",
  "primary-foreground": "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  "secondary-foreground": "hsl(var(--secondary-foreground))",
  muted: "hsl(var(--muted))",
  "muted-foreground": "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  "accent-foreground": "hsl(var(--accent-foreground))",
  success: "hsl(var(--success))",
  "success-foreground": "hsl(var(--success-foreground))",
  destructive: "hsl(var(--destructive))",
  "destructive-foreground": "hsl(var(--destructive-foreground))",
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
};

const motion = {
  fast: "var(--motion-duration-fast)",
  standard: "var(--motion-duration-standard)",
  deliberate: "var(--motion-duration-deliberate)",
};

const config = {
  presets: [preset],
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        ...spacingScale,
        "shell-gutter": "var(--space-shell-gutter)",
        "shell-stack": "var(--space-shell-stack)",
        "shell-utility": "var(--space-shell-utility)",
      },
      maxWidth: {
        "shell-content": "var(--size-shell-content)",
      },
      gridTemplateColumns: {
        "admin-shell": "var(--layout-admin-nav) minmax(0, 1fr)",
        "admin-shell-rail": "var(--layout-admin-nav) minmax(0, 1fr) var(--layout-admin-rail)",
      },
      borderRadius: radiusScale,
      colors: semanticColors,
      transitionDuration: motion,
      transitionTimingFunction: {
        brand: "var(--motion-ease-standard)",
        expressive: "var(--motion-ease-expressive)",
      },
      fontSize: {
        display: [
          "var(--type-scale-display)",
          {
            lineHeight: "var(--type-leading-tight)",
            letterSpacing: "var(--type-tracking-tight)",
            fontWeight: "700",
          },
        ],
        "heading-xl": [
          "var(--type-scale-heading-xl)",
          {
            lineHeight: "var(--type-leading-snug)",
            letterSpacing: "var(--type-tracking-tight)",
            fontWeight: "700",
          },
        ],
        "heading-lg": [
          "var(--type-scale-heading-lg)",
          {
            lineHeight: "var(--type-leading-snug)",
            letterSpacing: "var(--type-tracking-tight)",
            fontWeight: "600",
          },
        ],
        "heading-md": [
          "var(--type-scale-heading-md)",
          {
            lineHeight: "var(--type-leading-normal)",
            letterSpacing: "var(--type-tracking-tight)",
            fontWeight: "600",
          },
        ],
        "heading-sm": [
          "var(--type-scale-heading-sm)",
          {
            lineHeight: "var(--type-leading-normal)",
            letterSpacing: "var(--type-tracking-tight)",
            fontWeight: "600",
          },
        ],
        "heading-xs": [
          "var(--type-scale-heading-xs)",
          {
            lineHeight: "var(--type-leading-relaxed)",
            letterSpacing: "var(--type-tracking-relaxed)",
            fontWeight: "600",
          },
        ],
        subtitle: [
          "var(--type-scale-subtitle)",
          {
            lineHeight: "var(--type-leading-relaxed)",
            letterSpacing: "var(--type-tracking-relaxed)",
            fontWeight: "500",
          },
        ],
        "body-lg": [
          "var(--type-scale-body-lg)",
          {
            lineHeight: "var(--type-leading-loose)",
            letterSpacing: "var(--type-tracking-default)",
          },
        ],
        body: [
          "var(--type-scale-body)",
          {
            lineHeight: "var(--type-leading-loose)",
            letterSpacing: "var(--type-tracking-default)",
          },
        ],
        "body-sm": [
          "var(--type-scale-body-sm)",
          {
            lineHeight: "var(--type-leading-loose)",
            letterSpacing: "var(--type-tracking-relaxed)",
          },
        ],
        caption: [
          "var(--type-scale-caption)",
          {
            lineHeight: "var(--type-leading-loose)",
            letterSpacing: "var(--type-tracking-wide)",
            fontWeight: "500",
          },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
