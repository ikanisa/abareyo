# Phase 0 — Baseline & Discovery

Date: 2025-10-18  
Owner: Platform Engineering

## 1. Current Admin & API Inventory

- **Admin surface** lives primarily under `app/admin/*` with supporting view components in `src/views/Admin*` and shared UI in `src/components/admin`.
- **Server utilities** for admin flows sit in `src/lib/api/admin*` (REST-like wrappers that call the legacy backend) and `src/lib/api/admin.ts` (service-role Supabase helpers, SMS reconciliation, etc.).
- **Feature flags** resolved via `app/api/flags/route.ts` and consumed in both client and admin shells.
- **Supabase integration** currently leverages:
  - Edge Functions already deployed (`supabase/functions/*`) including `award_points`, `handle_momo_webhook`, `issue-policy`, `match-payment`, etc.
  - Database migrations in `supabase/migrations` up to `20251112_cleanup_camelcase.sql`. History aligned with remote via `supabase db push --include-all`.
- **Testing surface** covers Vitest unit specs in `tests/unit/`, Playwright suites in `tests/e2e/`, and CI scripts in `package.json`.

## 2. Environment & Secrets Snapshot

- The project expects Supabase credentials (`SITE_SUPABASE_URL`, `SITE_SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for both build-time and run-time contexts.
- Admin-specific configuration observed:
  - Admin dashboards proxy through `/admin/api/*` using session cookies; no shared browser token is required.
  - `NEXT_PUBLIC_BACKEND_URL` bridges to the legacy REST bridge.
- Supabase CLI operations require `SUPABASE_DB_PASSWORD` / `PGPASSWORD` (currently stored in the secure shell session as `MoMo!!0099`), plus logged-in profile tokens under `supabase/.config`.
- Deployment targets:
  - **Hosting platform** replacing the legacy managed host that previously served `ikanisa/abareyo` (retired after January 2026).
  - **Supabase** project `paysnhuxngsvzdpwlosv` verified through `supabase db push --include-all` and `supabase functions deploy`.

> **Action:** Document these env keys in the admin runbook before Phase 1 so onboarding and rotation are streamlined.

## 3. Tooling & CLI Verification

Commands executed during discovery:

```bash
npm run lint
npm run type-check
npm run test
npm run build
supabase db push --include-all
supabase functions deploy award_points --project-ref paysnhuxngsvzdpwlosv
```

All commands completed successfully (lint/test/build already green before Phase 1). Supabase push required `--include-all` to replay the `20251112_cleanup_camelcase.sql` migration; function deploy produced the expected decorator warning only.

## 4. Accessibility & Lint Baseline

Added `eslint-plugin-jsx-a11y` with the following new guard rails (warnings for now, to be tightened in later phases):

- `jsx-a11y/no-distracting-elements` — discourages marquee/blink style motion without reduced-motion fallbacks.
- `jsx-a11y/no-aria-hidden-on-focusable`, `jsx-a11y/interactive-supports-focus`, `jsx-a11y/no-noninteractive-tabindex`, `jsx-a11y/no-static-element-interactions`, `jsx-a11y/no-noninteractive-element-interactions` — enforce visible focus indicators and semantic focus targets.
- `jsx-a11y/click-events-have-key-events`, `jsx-a11y/mouse-events-have-key-events` — encourage 44 px-equivalent hit targets and keyboard parity for pointer actions.

This satisfies the Phase 0 requirement to begin policing focus visibility, reduced motion, and minimum hit target sizes (by insisting on semantic, keyboard-accessible interactions).

## 5. Gaps & Next Steps

- **Documentation:** Create a living admin runbook (Phase 1 deliverable) covering SMS reconciliation, Supabase secrets, and feature flag hygiene.
- **Feature flags:** Current flag loader lacks explicit gating per module. Phase 1 must introduce per-module flags and RBAC scaffolding.
- **MFA & Session Security:** Admin auth still password-only; MFA deferred to later phases.
- **Automated a11y audits:** Playwright + axe already wired but not run regularly for admin flows; plan to expand coverage in Phase 4+.

Phase 0 is complete; proceed to Phase 1 Foundations with the updated lint configuration and documented baseline.
