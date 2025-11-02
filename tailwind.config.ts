import type { Config } from "tailwindcss";
import preset from "@rayon/ui/tailwind-preset";

const config = {
  presets: [preset],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  plugins: [],
} satisfies Config;

export default config;
