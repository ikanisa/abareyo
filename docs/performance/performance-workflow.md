# Performance Verification & Remediation Workflow

This guide documents how to run the automated performance checks introduced during the refactor and how to respond when they surface regressions.

## Lighthouse CI

- `lighthouserc.json` now enforces minimum category scores (Performance ≥ 0.85, PWA ≥ 0.90, Accessibility ≥ 0.95, SEO ≥ 0.90) and loads the shared budgets from `lighthouse-budgets.json`.
- Reports are written to `reports/refactor/perf/lighthouse/` so every CI run leaves an artifact we can review locally or attach to readiness reviews.
- Run `npm run lint:pwa` (or `lhci autorun --config=./lighthouserc.json`) after `npm run build` to reproduce the check locally.

If a build fails on `performance-budget` or category thresholds:

1. Inspect the HTML report in `reports/refactor/perf/lighthouse/` to see the largest offenders (3rd-party bundles, image payload, etc.).
2. Trim the offending asset (e.g., resize hero imagery, lower font count) or ship the feature behind a flag.
3. Re-run `npm run lint:pwa` until all budgets pass.

## Bundle Analysis

- The Next.js bundle analyzer is wrapped with `@next/bundle-analyzer` and gated behind the `NEXT_ANALYZE` flag. Run `npm run analyze:bundle` to generate a static report at `reports/refactor/perf/bundle/client.html`.
- Use the analyzer to investigate any large chunks called out by Lighthouse budgets or Core Web Vitals.

When a module exceeds expected weight:

1. **Confirm module ownership** – is it part of `@/app/(routes)` or a shared component? Decide where the optimization belongs.
2. **Split delivery** – prefer `next/dynamic` with `ssr: false` for client-only packages (maps, charts) and wrap seldom used panels behind route-level code splitting.
3. **Audit dependencies** – if a component only needs a fraction of a vendor library, replace the import with a lighter alternative or tree-shake friendly entry point.
4. **Capture regression evidence** – drop a note in `reports/refactor/perf/bundle/` (e.g., add a markdown snippet next to the HTML export) describing the change so future runs have context.

## React Native (Hermes) Startup Profiling

- A new hook (`useHermesStartupTrace`) starts a Hermes sampling profile when `EXPO_PUBLIC_ENABLE_HERMES_PROFILING` is set to `1` or `true` and the app launches on a native target.
- The hook attempts to persist the trace inside the device sandbox; if Hermes’ JS APIs are unavailable it logs a fallback instruction to use `npx react-native profile-hermes`.
- After pulling the `.cpuprofile` off the device/emulator, run:

  ```bash
  npm run perf:archive-hermes -- <local-path-to-profile> [label]
  ```

  The script stores the profile (and metadata) under `reports/refactor/perf/mobile/` so it travels with the refactor artifacts.

### Startup Remediation Tips

1. Promote heavy React Native UI widgets (animations, charts) to lazy imports so they don’t block the JS engine during cold start. The updated `GlassCard` component shows how to dynamically load Skia and Lottie only when required.
2. Measure subsequent launches with Hermes tracing to ensure code splitting meaningfully reduces boot time before landing.
3. If a module cannot be split, consider deferring its initialization with `InteractionManager.runAfterInteractions` or moving the functionality behind a feature flag for gradual rollout.

## Report Archive Layout

All performance artifacts are collocated under `reports/refactor/perf/`:

- `bundle/` – static bundle analyzer exports plus remediation notes.
- `lighthouse/` – Lighthouse CI JSON/HTML outputs from `npm run lint:pwa`.
- `mobile/` – Hermes `.cpuprofile` dumps and metadata captured via `npm run perf:archive-hermes`.

Keep this tree committed so every refactor iteration retains the evidence required for deployment readiness reviews.
