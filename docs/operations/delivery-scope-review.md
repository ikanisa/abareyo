# Delivery Scope & QA Alignment

## Scope Confirmation
- The phased roadmap remains split across P0–P3 sprints covering build stabilisation, mobile home experience, platform hardening, and polish/documentation, with explicit acceptance criteria for each phase to keep stakeholders aligned on deliverables.【F:plans/REFACTOR_PLAN_PHASED.md†L3-L31】
- Supabase edge refactors, admin service consolidation, and reporting follow-up items are still in scope for the full-stack initiative, anchoring the shared source of truth and helper patterns described in the refactor goals document.【F:plans/FULLSTACK_REFACTOR_PLAN.md†L4-L36】

## Milestones & Test Expectations
- QA milestones prioritise mobile smoke coverage (home load, onboarding, PWA opt-in, tickets navigation) and extend to localisation, offline, and admin login cases once upstream blockers clear, ensuring Playwright plus Vitest automation guard critical flows.【F:plans/TEST_MATRIX_E2E.md†L3-L12】
- Later phases enforce accessibility, telemetry, and documentation sign-off, requiring Axe/PA11y parity and published runbooks before the programme can close.【F:plans/REFACTOR_PLAN_PHASED.md†L21-L31】

## Deployment Readiness Touchpoints
- Deployment quality gates remain unchanged: lint, type-check, unit tests, and build must pass alongside the preflight script, and the command pair `npm run validate:deployment` / `make validate-deployment` stays the recommended validation entrypoint.【F:DEPLOYMENT_CHECKLIST.md†L23-L43】
- Environment and infrastructure expectations still require Supabase, backend integrations, Redis, Kubernetes, and secret provisioning prior to go-live, matching the existing checklist owners rely on today.【F:DEPLOYMENT_CHECKLIST.md†L45-L152】
