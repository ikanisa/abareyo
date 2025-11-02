const js = require('@eslint/js');
const globals = require('globals');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const tseslint = require('typescript-eslint');

const base = tseslint.config(
  { ignores: ['dist', '.next', 'coverage', 'build'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',
    },
  },
  {
    files: [
      'src/components/admin/**/*.{ts,tsx}',
      'src/views/Admin*',
      'app/admin/**/*.{ts,tsx}',
      'src/components/ui/button.tsx',
      'src/components/ui/badge.tsx',
      'src/components/ui/toggle.tsx',
      'src/components/ui/navigation-menu.tsx',
      'src/components/ui/sidebar.tsx',
      'src/components/ui/sonner.tsx',
      'src/components/ui/form.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 'error',
    },
  }
);

const mobile = [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals['react-native'],
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

module.exports = { base, mobile };
