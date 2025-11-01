# Additive Delivery Guardrails

## Immutable Change Policy
- Fan platform releases are additive-only: migrations, content, and code must preserve existing records and behaviours while layering improvements on top. Removing tables, columns, or flows requires programme lead approval captured in a new ADR before work begins. This policy keeps parity with current Supabase RLS assumptions and protects long-running analytics jobs.【F:supabase/migrations/20251011000000_core.sql†L10-L188】

## USSD-Only Monetisation
- The CI guard `npm run ci:guard-payments` scans for disallowed payment SDK references (Stripe, PayPal, Flutterwave, etc.) to enforce the USSD-only monetisation rule that underpins Rayon Sports’ compliance posture.【F:scripts/ci/assert-ussd-only.ts†L1-L51】
- Operations documentation reiterates that every admin module expects USSD/SMS flows, and operators rely on the guard to block regressions before they reach production.【F:docs/admin/runbook.md†L6-L39】

## Bilingual & Accessibility Baseline
- Admin delivery plans already call for RW/EN toggles and translation management; ongoing additive work must keep bilingual scaffolding intact or expand it with new content strings and Supabase `translations` rows.【F:docs/gikundiro-admin-delivery-status.md†L40-L63】
- UX phases mandate accessibility-focused refinements (touch targets, reduced motion, Axe/PA11y checks) prior to launch sign-off. New features should inherit these acceptance criteria rather than introducing regressions.【F:plans/REFACTOR_PLAN_PHASED.md†L13-L31】
