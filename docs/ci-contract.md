# CI contract

The CI contract covers the minimum checks required before merging changes and how they are orchestrated locally and in automation.

## Required commands

Run these commands locally before opening or updating a pull request:

- `pnpm lint` — static analysis for app code, shared packages, and unit tests.
- `pnpm type-check` — TypeScript project validation (including `tsconfig.build.json`).
- `pnpm build` — production build to confirm bundling succeeds with the latest code.
- Targeted tests — `pnpm test:unit -- --filter <pattern>` for the files or suites touched by your change. Use broader scopes (or drop the filter) when touching shared utilities or infrastructure-sensitive flows.

## End-to-end coverage

Run Playwright suites when shipping changes that affect user journeys, authentication, onboarding, payments, navigation, or accessibility tooling. When mocks are sufficient, prefer the mocked API setup (`E2E_API_MOCKS=1`) to keep iterations fast; otherwise, point the tests at a deployed backend with the same environment variables used in CI.

## Automation

The root `make verify` target chains the required commands in order so CI and local runs stay aligned. GitHub Actions calls this target directly to keep the workflow consistent with the documented contract.
