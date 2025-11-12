import type { Config } from "tailwindcss";
import preset from "@rayon/ui/tailwind-preset";

const config = {
  presets: [preset],
  theme: {
    extend: {
      spacing: {
        'shell-gutter': 'var(--space-shell-gutter)',
        'shell-stack': 'var(--space-shell-stack)',
        'shell-utility': 'var(--space-shell-utility)',
      },
      maxWidth: {
        'shell-content': 'var(--size-shell-content)',
      },
      gridTemplateColumns: {
        'admin-shell': 'var(--layout-admin-nav) minmax(0, 1fr)',
        'admin-shell-rail': 'var(--layout-admin-nav) minmax(0, 1fr) var(--layout-admin-rail)',
      },
    },
  },
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  plugins: [],
} satisfies Config;

export default config;
