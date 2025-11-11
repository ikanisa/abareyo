import type { Config } from "tailwindcss";
import preset from "@rayon/ui/tailwind-preset";

const config = {
  presets: [preset],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
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
