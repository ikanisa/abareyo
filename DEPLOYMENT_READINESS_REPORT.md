# Deployment Readiness Report

_Last updated: 2025-10-22 10:50:38Z_

## Executive Summary
| Surface | Status | Notes |
| --- | --- | --- |
| Web (Next.js) | 🟢 Green | Env validation + CI parity in place. Requires populating hosting environment secrets before first build. |
| Backend (NestJS) | 🟢 Green | External service verified via `scripts/check-backend-endpoint.mjs`; Supabase/hosting secrets managed via the vault map. |

## Key Outcomes
- Inventory, legacy Vercel plan, and env matrix captured under `audit/`; notes updated to reflect hosting shift.
- Runtime env schema enforces required variables at build and run time.
- Legacy Vercel preview workflow, preflight script, and secret sync command were removed in favour of direct `npm run build` parity and manual secret management via Supabase Vault.
- Root/node engines aligned on Node 20 via `.nvmrc` + package metadata.

## Environment Variables
- Source of truth: `audit/env-matrix.csv` plus `.env.example` and `backend/.env.example`.
- Validation implemented in `config/validated-env.mjs` (consumed by `next.config.mjs` and application code).
- Missing required variables now fail during `next build` and the server bootstrap.

### Required Secrets Before Deploying
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_SUPABASE_URL`, `SITE_SUPABASE_SECRET_KEY`.
- Backend: `NEXT_PUBLIC_BACKEND_URL` (absolute HTTPS endpoint) and `CORS_ORIGIN` allowlist.
- Onboarding/AI: `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN`, `ONBOARDING_API_TOKEN`, `OPENAI_API_KEY`, and `NEXT_PUBLIC_OPENAI_BASE_URL`/`OPENAI_BASE_URL` when overriding the API host.
- Production-only: Provide at least one of `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`, and telemetry/socket overrides when applicable.
- Follow `docs/supabase/vault-secret-map.md` when copying values into Supabase Vault and the hosting environment.

## Hosting Configuration Notes
- Legacy `vercel.json` has been removed; Next.js relies on the default build pipeline (`next build`, `next start`).
- `next.config.mjs` sets `output: 'standalone'` and imports `config/validated-env.mjs` to fail fast on missing env.
- `scripts/check-backend-endpoint.mjs` validates the configured backend URL before builds.
- Remote images allowed via `images.remotePatterns` to avoid runtime blocking.

## CI / Automation
- `.github/workflows/preview.yml` runs lint, type-check, and `npm run build` on pull requests targeting `main`.
- Backend deploy workflow continues to build Docker images and apply Kubernetes manifests.
- Supabase deploy workflow (`.github/workflows/supabase-deploy.yml`) pushes migrations and edge functions on merge.

## Local Developer Workflow
- Run `npm run build` locally to sanity-check env configuration and verify backend availability with `scripts/check-backend-endpoint.mjs` before opening PRs.
- `.nvmrc` enforces Node 20 for both root and backend workspaces.

## Follow-up / Open Risks
- Consider automating backend env validation within its own CI job (outside scope of this audit).

## References
- Audit artifacts: `audit/inventory.json`, `audit/vercel-plan.md` (archived), `audit/env-matrix.csv`
- Example env files: `.env.example`, `backend/.env.example`
- Validation module: `config/validated-env.mjs`
- CI workflow: `.github/workflows/preview.yml`
- Backend availability check: `scripts/check-backend-endpoint.mjs`
