# Rayon Liquid Glass Design System

## Accessibility and Contrast

The liquid glass surfaces now ship with updated opacity tokens to guarantee WCAG 2.1 AA
contrast on layered tiles and admin cards. We increased the light theme `--glass-bg`
opacities from `0.75` → `0.82` and the dark theme equivalent from `0.50` → `0.68`, and
aligned the border alpha values with the same delta. The new values keep the glass effect
while ensuring foreground text maintains a 4.5:1 ratio when audited with Axe DevTools and
the Chrome accessibility panel.

### Validation checklist

- ✅ Validate tiles and glass cards with `axe --tags wcag21aa` (admin dashboard + consumer home).
- ✅ Confirm minimum 4.5:1 contrast for text on glass surfaces via Chrome DevTools → Rendering →
  **Emulate vision deficiencies**.
- ✅ Run `npm run lint:a11y` before merging to catch regressions in focusable glass controls.

Document any future token adjustments (opacity, hue, or blur) here alongside the measured
contrast ratios and the tooling used to verify compliance.

## Storybook and Admin UI Catalogue

- Run `npm run storybook` to explore the admin primitives (buttons, inputs, cards, toasts) and
  reference states for hover, focus, disabled, and loading scenarios.
- The full admin component audit lives in [`admin-component-audit.md`](./admin-component-audit.md)
  and should be kept in sync with Storybook when adding or modifying surfaces.
