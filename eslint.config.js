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
                "../packages/mobile/**",
                "../**/packages/mobile/**",
              ],
              message:
                "Use the configured path aliases (@/*, @admin/*, @mobile/*) instead of relative imports that cross app boundaries.",
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
      "react-refresh/only-export-components": ["error", { allowConstantExport: true }],
      "react-hooks/exhaustive-deps": "error",
    },
  },
);
