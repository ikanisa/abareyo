# Deployment Readiness Report

_Last updated: 2025-10-22 10:50:38Z_

## Executive Summary
| Surface | Status | Notes |
| --- | --- | --- |
| Web (Next.js) | 🟢 Green | Env validation + CI parity in place. Populate deployment platform secrets via the internal runbooks (Vercel flow retired). |
| Backend (NestJS) | 🟢 Green | External service verified via `scripts/check-backend-endpoint.mjs`; follow the platform secret rotation guide instead of the legacy Vercel sync script. |

## Key Outcomes
- Inventory, archived Vercel plan, and env matrix generated under `audit/`.
- Runtime env schema enforces required variables at build and run time.
- Preview build workflow handled in GitHub Actions (`.github/workflows/preview.yml`).
- Local preflight script consolidated under `scripts/preflight.mjs` to run env checks, backend verification, and the production build in one entry point.
- Documented platform-agnostic secret rotation replaces the former `npm run vercel:env:sync` flow.
- Root/node engines aligned on Node 20 via `.nvmrc` + package metadata.

## Environment Variables
- Source of truth: `audit/env-matrix.csv` plus `.env.example` and `backend/.env.example`.
- Validation implemented in `config/validated-env.mjs` (consumed by `next.config.mjs` and application code).
- Missing required variables now fail during `next build` and CI preflight.

### Required Secrets Before Deploying
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_SUPABASE_URL`, `SITE_SUPABASE_SECRET_KEY`.
- Backend: `NEXT_PUBLIC_BACKEND_URL` (absolute HTTPS endpoint) and `CORS_ORIGIN` allowlist.
- Onboarding/AI: `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN`, `ONBOARDING_API_TOKEN`, `OPENAI_API_KEY`, and `NEXT_PUBLIC_OPENAI_BASE_URL`/`OPENAI_BASE_URL` when overriding the API host.
- Production-only: Provide at least one of `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`, and telemetry/socket overrides when applicable.
- Follow the deployment runbook to push these values to staging/production environments (legacy `npm run vercel:env:sync` is archived).

## Deployment Platform Configuration
- `vercel.json` previously declared `framework`, `installCommand`, `buildCommand`, and `outputDirectory`; it has been removed from source control.
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

## References
- Audit artifacts: `audit/inventory.json`, `audit/vercel-plan.md` (archived), `audit/env-matrix.csv`
- Example env files: `.env.example`, `backend/.env.example`
- Validation module: `config/validated-env.mjs`
- CI workflow: `.github/workflows/preview.yml`
- Preflight script: `scripts/preflight.mjs`
- Backend availability check: `scripts/check-backend-endpoint.mjs`
