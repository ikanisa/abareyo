# Deployment Readiness Report

_Last updated: 2025-10-21 11:18:39Z_

## Executive Summary
| Surface | Status | Notes |
| --- | --- | --- |
| Web (Next.js) | 🟢 Green | Env validation + CI parity in place. Requires populating Vercel env secrets before first build. |
| Backend (NestJS) | 🟡 Amber | Not deployed on Vercel; ensure existing infrastructure provides HTTPS endpoint for `NEXT_PUBLIC_BACKEND_URL`. |

## Key Outcomes
- Inventory, Vercel plan, and env matrix generated under `audit/`.
- Runtime env schema enforces required variables at build and run time.
- Vercel preview build workflow added to GitHub Actions (`.github/workflows/vercel-preview-build.yml`).
- Local preflight script (`scripts/vercel-preflight.mjs`) mirrors Vercel pull/build.
- Root/node engines aligned on Node 20 via `.nvmrc` + package metadata.

## Environment Variables
- Source of truth: `audit/env-matrix.csv` plus `.env.example` and `backend/.env.example`.
- Validation implemented in `config/validated-env.mjs` (consumed by `next.config.mjs` and application code).
- Missing required variables now fail during `next build`, `vercel build`, and preflight.

### Required Secrets Before Deploying
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_SUPABASE_URL`, `SITE_SUPABASE_SECRET_KEY`.
- Backend: `NEXT_PUBLIC_BACKEND_URL` (must point at deployed NestJS instance).
- Onboarding/AI: `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN`, `ONBOARDING_API_TOKEN`, `OPENAI_API_KEY`.
- Production-only: Provide at least one of `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, and `NEXT_PUBLIC_SITE_URL`.

## Vercel Configuration
- `vercel.json` declares `framework`, `installCommand`, `buildCommand`, and `outputDirectory`.
- `next.config.mjs` sets `output: 'standalone'` and imports `config/validated-env.mjs` to fail fast on missing env.
- Remote images allowed via `images.remotePatterns` to avoid runtime blocking.

## CI / Automation
- GitHub Action `Vercel Preview Build` runs on pull requests targeting `main` and performs:
  1. `npm ci`
  2. `vercel pull --environment=preview`
  3. `node scripts/check-frontend-env.mjs`
  4. `vercel build`
  5. Uploads `.vercel/output/logs`
- Ensure repository secret `VERCEL_TOKEN` is configured before merging.

## Local Developer Workflow
- Run `scripts/vercel-preflight.mjs` to sanity-check env + perform pull/build prior to opening PRs.
- `.nvmrc` enforces Node 20 for both root and backend workspaces.

## Follow-up / Open Risks
- Populate Vercel preview & production env variables via dashboard or `vercel env pull`.
- Backend deployment must expose stable HTTPS URL; coordinate release schedule with backend ops.
- Consider automating backend env validation within its own CI job (outside scope of this audit).

## References
- Audit artifacts: `audit/inventory.json`, `audit/vercel-plan.md`, `audit/env-matrix.csv`
- Example env files: `.env.example`, `backend/.env.example`
- Validation module: `config/validated-env.mjs`
- CI workflow: `.github/workflows/vercel-preview-build.yml`
- Preflight script: `scripts/vercel-preflight.mjs`
