import js from "@eslint/js";
import globals from "globals";
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
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": "off",
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
    rules: {
      "react-refresh/only-export-components": ["error", { allowConstantExport: true }],
      "react-hooks/exhaustive-deps": "error",
    },
  },
);
