# Performance Report Archive

All automated performance outputs for the refactor are stored here so they remain versioned alongside the code:

- `bundle/` – static bundle analyzer exports generated with `npm run analyze:bundle`.
- `lighthouse/` – Lighthouse CI JSON/HTML outputs from `npm run lint:pwa`.
- `mobile/` – Hermes `.cpuprofile` dumps and metadata gathered via `npm run perf:archive-hermes`.

Do not delete these directories; keep them up to date so we can diff regressions across releases.
