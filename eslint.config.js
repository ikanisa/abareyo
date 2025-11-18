import js from "@eslint/js";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".next"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../app/**",
                "../**/app/**",
                "../admin/**",
                "../**/admin/**",
              ],
              message:
                "Use the configured path aliases (@/*, @admin/*, @mobile/*) instead of relative imports that cross app boundaries.",
            },
            {
              group: ["./backend/**", "../backend/**", "../../backend/**", "backend/**"],
              message:
                "Legacy backend code must stay behind adapters. Use @rayon/api/legacy-backend exports instead of importing from backend/ directly.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/components/admin/**/*.{ts,tsx}",
      "src/views/Admin*",
      "app/admin/**/*.{ts,tsx}",
      "src/components/ui/button.tsx",
      "src/components/ui/badge.tsx",
      "src/components/ui/toggle.tsx",
      "src/components/ui/navigation-menu.tsx",
      "src/components/ui/sidebar.tsx",
      "src/components/ui/sonner.tsx",
      "src/components/ui/form.tsx",
    ],
    ignores: [
      "app/admin/**/layout.tsx",
      "app/admin/**/page.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true, allowExportNames: ["metadata", "viewport", "generateMetadata", "generateViewport"] }],
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["src/domains/auth/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domains/payments/**", "@/domains/ticketing/**", "@/domains/commerce/**"],
              message: "Auth domain code should depend on shared utilities, not other domains. Move shared pieces to src/lib or src/providers if needed.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domains/payments/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domains/auth/**", "@/domains/ticketing/**", "@/domains/commerce/**"],
              message: "Payment flows should not reach into other domains directly. Expose shared helpers from src/lib instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domains/ticketing/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domains/auth/**", "@/domains/payments/**", "@/domains/commerce/**"],
              message: "Ticketing domain code must use shared adapters instead of other domain internals to prevent bleed-over.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domains/commerce/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domains/auth/**", "@/domains/payments/**", "@/domains/ticketing/**"],
              message: "Commerce domain code should consume shared services rather than importing from other domains.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/api/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./backend/**", "../backend/**", "../../backend/**", "backend/**"],
              message: "Route backend calls through packages/api adapters (e.g., @rayon/api/legacy-backend) instead of importing backend directly.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/api/src/legacy/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
