# Playwright Navigation Smoke Tests

This runbook captures the guardrails for the `tests/nav.smoke.spec.ts` suite. The
suite exercises the canonical navigation routes and verifies the global 404
experience in a production-build context.

## Bottom navigation skip behaviour

- The bottom navigation is intentionally rendered only on small viewports. The
  smoke test emulates a mobile viewport and attempts to interact with the nav.
- When the test detects that it is running in a desktop-sized viewport (for
  example inside CI without mobile emulation), it skips the nav interaction step
  to avoid false negatives. The skip is logged with the reason so reviewers can
  confirm the execution path.

This behaviour ensures that desktop-only runs remain green while preserving
coverage for the primary mobile experience.

## Execution notes

- Always run the suite against a production build (`npm run build` followed by
  `npx playwright test`) to minimise flakiness.
- Expect the dev server bootstrap to take ~30 seconds in CI; plan the pipeline
  timeout budget accordingly.
- Browser binaries are cached between runs. If Playwright needs to re-download,
  allow for an additional ~400 MB of storage.
