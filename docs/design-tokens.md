# Design tokens

This repository centralizes its UI primitives around a small set of reusable design tokens. Tokens are defined as CSS custom properties (see `src/styles/tokens.css` and `src/index.css`) and exposed to Tailwind via `tailwind.config.ts` so they stay consistent across components, docs, and stories.

## Tailwind-aligned scales

### Spacing
The spacing scale mirrors the Tailwind shorthand and resolves to CSS variables, so classes like `p-4` and `gap-6` inherit the design system values.

| Token | Tailwind class | Value |
| --- | --- | --- |
| `--space-0` | `p-0` | `0px` |
| `--space-1` | `p-1` | `0.25rem` |
| `--space-2` | `p-2` | `0.5rem` |
| `--space-3` | `p-3` | `0.75rem` |
| `--space-4` | `p-4` | `1rem` |
| `--space-5` | `p-5` | `1.25rem` |
| `--space-6` | `p-6` | `1.5rem` |
| `--space-7` | `p-7` | `1.75rem` |
| `--space-8` | `p-8` | `2rem` |
| `--space-9` | `p-9` | `2.5rem` |
| `--space-10` | `p-10` | `3rem` |
| `--space-12` | `p-12` | `3.5rem` |
| `--space-14` | `p-14` | `4rem` |
| `--space-16` | `p-16` | `4.5rem` |

### Radii
Rounded utilities resolve to the radius tokens below. Use `rounded-pill` for badges and pills instead of hand-written pixel values.

| Token | Tailwind class | Value |
| --- | --- | --- |
| `--radius-xs` | `rounded-xs` | `6px` |
| `--radius-sm` | `rounded-sm` | `8px` |
| `--radius-md` | `rounded-md` | `12px` |
| `--radius-lg` | `rounded-lg` | `16px` |
| `--radius-xl` | `rounded-xl` | `20px` |
| `--radius-2xl` | `rounded-2xl` | `24px` |
| `--radius-pill` | `rounded-pill` | `999px` |

### Color roles
Semantic colors match the HSL tokens defined in `src/index.css` and allow swapping palettes per theme.

| Role | Tailwind token |
| --- | --- |
| Canvas and text | `background`, `foreground` |
| Surfaces | `card`, `card-foreground`, `popover`, `popover-foreground` |
| Primitives | `primary`, `secondary`, `accent`, `muted`, `success`, `destructive` with their `*-foreground` companions |
| UI affordances | `border`, `input`, `ring` |

Use them via `text-foreground`, `bg-card`, `border-border`, and similar utilities to respect dark and light themes automatically.

## Motion constraints
Motion tokens standardize the “feel” of transitions across primitives. Tailwind exposes them as `duration-fast`, `duration-standard`, `duration-deliberate`, and `ease-brand`/`ease-expressive` classes. Prefer these over numeric values unless performance profiling requires a bespoke curve.

| Token | Class | Value |
| --- | --- | --- |
| `--motion-duration-fast` | `duration-fast` | `160ms` |
| `--motion-duration-standard` | `duration-standard` | `200ms` |
| `--motion-duration-deliberate` | `duration-deliberate` | `260ms` |
| `--motion-ease-standard` | `ease-brand` | `cubic-bezier(0.2, 0, 0.38, 0.9)` |
| `--motion-ease-expressive` | `ease-expressive` | `cubic-bezier(0.16, 1, 0.3, 1)` |

When honoring reduced-motion preferences, rely on the existing `[data-motion="reduced"]` hooks and avoid introducing autoplaying animations.

## Component do & don’t examples

### Badge
- **Do** pair pills with motion tokens for hover states.
  ```tsx
  <Badge
    className="rounded-pill px-3 py-1 duration-fast ease-brand"
    variant="accent"
  >
    New arrival
  </Badge>
  ```
- **Don’t** hard-code pixel radii or durations.
  ```tsx
  {/* Avoid: overrides shared tokens */}
  <Badge className="rounded-[4px] px-[14px] transition duration-75">Off-brand</Badge>
  ```

### Glass card
- **Do** compose padding with the spacing scale and keep transitions token-driven.
  ```tsx
  <GlassCard className="p-6 duration-deliberate ease-expressive">
    <h3 className="text-heading-sm">Token-aware surface</h3>
    <p className="text-body-sm text-muted-foreground">
      This card inherits glass styling and respects reduced-motion rules.
    </p>
  </GlassCard>
  ```
- **Don’t** add bespoke box-shadows or timing functions when the tokens already provide them.
  ```tsx
  {/* Avoid: mixes unrelated shadows and easing curves */}
  <GlassCard className="shadow-2xl duration-500 ease-linear">Heavy-handed</GlassCard>
  ```
