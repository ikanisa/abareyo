# Vercel Deployment Plan (Archived)

> **Status:** Legacy documentation retained for historical context. The
> project no longer deploys via Vercel as of January 2026, and the
> associated configuration files (`vercel.json`, `.vercel/*`, env
> templates) have been removed from the repository. Use the consolidated
> GitHub Actions workflows and platform-specific runbooks for current
> deployment guidance.

## Workspace Defaults
- **Repository Root**
  - **Framework**: Next.js 14 App Router
  - **Node**: 20.x (aligns with `package.json` engines)
  - **Package Manager**: npm (lockfile present)
  - **Install Command**: `npm ci`
  - **Build Command**: `npm run build`
  - **Output Directory**: `.next`
  - **Env Sources**: Supabase (URL + anon/service keys), OpenAI, onboarding tokens, telemetry keys
  - **Notes**: Requires Sentry DSN (server or client) when telemetry enabled; Supabase keys must be set for auth and realtime

- **Backend (`backend/`)**
  - Not deployed to Vercel. Remains on separate infrastructure (NestJS + Prisma). CI should continue to build/test separately.

## Legacy Vercel Project Configuration
- **Project Name**: `<VERCEL_PROJECT_NAME>` (update in dashboard)
- **Root Directory**: repository root (`.`)
- **Framework Preset**: Next.js
- **Node.js Version**: 20.x
- **Install Command**: `npm ci`
- **Build Command**: `npm run build`
- **Pre-build**: `npm run build:packages` (emits shared contract declarations consumed by app + backend)
- **Secret Sync**: `npm run vercel:env:sync` (interactive script that pushed Supabase, onboarding, OpenAI, and Sentry env vars to preview/prod/dev). _This script is now considered legacy._
- **Output Directory**: `.next`
- **Ignored Build Step**: rely on default; CI/Preflight ensures env completeness
- **Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_SUPABASE_URL`
- `SITE_SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ENVIRONMENT_LABEL`
- `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN`
- `ONBOARDING_API_TOKEN`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_OPENAI_BASE_URL` / `OPENAI_BASE_URL` (when overriding default host)
- Optional: `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, `NEXT_PUBLIC_TELEMETRY_URL`, `NEXT_PUBLIC_SOCKET_PATH`, `VERCEL_AUTOMATION_BYPASS_SECRET`

## Routing / Edge Notes
- `vercel.json` previously retained rewrites/redirects and build metadata but was removed when migrating away from Vercel.
- No custom server required; Next.js handles API routes under `/api` and `/app/api`.
- Edge middleware only inspects cookies/headers; remains compatible with Node 20 runtime.

## Build Artifacts & Caching
- `next.config.mjs` updated with `output: 'standalone'` to generate minimal server bundle for Vercel lambdas.
- `.next/cache` automatically managed by Vercel.

## Follow-up Actions
- _(Legacy)_ Run `npm run vercel:env:sync` from a workstation with Vercel CLI access to seed preview/prod/dev secrets (record values in 1Password/Secret Manager).
- _(Legacy)_ Map custom domains via Vercel once production build verified.
- Monitor backend health with `npm run check:backend` (used by preflight) after infrastructure changes.
