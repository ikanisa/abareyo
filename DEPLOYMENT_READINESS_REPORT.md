# Deployment Readiness Report

_Last updated: 2025-10-22 10:50:38Z_

## Executive Summary
| Surface | Status | Notes |
| --- | --- | --- |
| Web (Next.js) | 🟢 Green | Env validation + CI parity in place. Populate deployment platform secrets via the internal runbooks. |
| Backend (NestJS) | 🟢 Green | External service verified via `scripts/check-backend-endpoint.mjs`; follow the platform secret rotation guide rather than the retired syncing scripts. |

## Key Outcomes
- Inventory and env matrix generated under `audit/`.
- Runtime env schema enforces required variables at build and run time.
- Preview build workflow handled in GitHub Actions (`.github/workflows/preview.yml`).
- Local preflight script consolidated under `scripts/preflight.mjs` to run env checks, backend verification, and the production build in one entry point.
- Documented platform-agnostic secret rotation for deployment configuration.
- Root/node engines aligned on Node 20 via `.nvmrc` + package metadata.
- Lighthouse + axe accessibility suites part of pre-flight (`npm run lint:pwa`, `npm run test:e2e:a11y`) with artefacts tracked under `docs/launch/checklists`.
- Store icons, screenshots, and promo copy standardised in `docs/launch/` for App Store / Play Store submissions.
- WhatsApp OTP flow protected with Redis-backed rate limits and runtime dashboards (`/admin/sms/otp`).
- OTP status endpoint now surfaces Redis health + rate limit thresholds for smoke validation, and consent copy is localized to match Meta-approved WhatsApp templates.

## Environment Variables
- Source of truth: `audit/env-matrix.csv` plus `.env.example` and `backend/.env.example`.
- Validation implemented in `config/validated-env.mjs` (consumed by `next.config.mjs` and application code).
- Missing required variables now fail during `next build` and CI preflight.

### Required Secrets Before Deploying
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_SUPABASE_URL`, `SITE_SUPABASE_SECRET_KEY`.
- Backend: `NEXT_PUBLIC_BACKEND_URL` (absolute HTTPS endpoint) and `CORS_ORIGIN` allowlist.
- Onboarding/AI: `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN`, `ONBOARDING_API_TOKEN`, `OPENAI_API_KEY`, and `NEXT_PUBLIC_OPENAI_BASE_URL`/`OPENAI_BASE_URL` when overriding the API host.
- Production-only: Provide at least one of `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`, and telemetry/socket overrides when applicable.
- OTP delivery: configure `OTP_WHATSAPP_TEMPLATE_*`, `OTP_RATE_MAX_*`, `OTP_COOLDOWN_SECONDS`, and baseline blocklists (`OTP_BLOCKED_NUMBERS`, `OTP_BLOCKED_IPS`).
- Follow the deployment runbook to push these values to staging/production environments (no automated env sync remains in this repo).

## Deployment Platform Configuration
- `next.config.mjs` sets `output: 'standalone'` and imports `config/validated-env.mjs` to fail fast on missing env.
- `scripts/check-backend-endpoint.mjs` validates the configured backend URL before builds/pulls.
- Remote images allowed via `images.remotePatterns` to avoid runtime blocking.

## CI / Automation
  - GitHub Action `Preview Build` runs on pull requests targeting `main` and performs:
    1. `npm ci`
    2. `npm run -s type-check`
    3. `npm run -s lint`
    4. `node scripts/preflight.mjs`
    5. Archives `.next` build artifacts for review
- Ensure repository secrets for the hosting platform (for example, container registry tokens or SSH deploy keys) are configured before merging.

## Local Developer Workflow
- Run `node scripts/preflight.mjs` to verify env, backend availability, and build parity prior to opening PRs.
- `.nvmrc` enforces Node 20 for both root and backend workspaces.

## Follow-up / Open Risks
- Consider automating backend env validation within its own CI job (outside scope of this audit).
- Capture real device screenshots before final store submission (SVG storyboards included here as placeholders).

## References
- Audit artifacts: `audit/inventory.json`, `audit/env-matrix.csv`
- Example env files: `.env.example`, `backend/.env.example`
- Validation module: `config/validated-env.mjs`
- CI workflow: `.github/workflows/preview.yml`
- Preflight script: `scripts/preflight.mjs`
- Backend availability check: `scripts/check-backend-endpoint.mjs`
- Operational playbooks: `docs/runbooks/incident-response.md`, `docs/runbooks/disaster-recovery.md`, `docs/runbooks/on-call-enablement-checklist.md`, `docs/runbooks/otp-fallbacks.md`
