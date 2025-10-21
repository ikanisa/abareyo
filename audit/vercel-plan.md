# Vercel Deployment Plan

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

## Vercel Project Configuration
- **Project Name**: `<VERCEL_PROJECT_NAME>` (update in dashboard)
- **Root Directory**: repository root (`.`)
- **Framework Preset**: Next.js
- **Node.js Version**: 20.x
- **Install Command**: `npm ci`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Ignored Build Step**: rely on default; CI/Preflight ensures env completeness
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_BACKEND_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_ENVIRONMENT_LABEL`
  - `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN`
  - `ONBOARDING_API_TOKEN`
  - `OPENAI_API_KEY`
  - Optional: `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, `NEXT_PUBLIC_TELEMETRY_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`

## Routing / Edge Notes
- `vercel.json` retains existing rewrites/redirects and now declares build metadata.
- No custom server required; Next.js handles API routes under `/api` and `/app/api`.
- Edge middleware only inspects cookies/headers; remains compatible with Node 20 runtime.

## Build Artifacts & Caching
- `next.config.mjs` updated with `output: 'standalone'` to generate minimal server bundle for Vercel lambdas.
- `.next/cache` automatically managed by Vercel.

## Follow-up Actions
- Set preview/prod env vars in Vercel dashboard (and store secrets in 1Password/Secret Manager).
- Map custom domains via Vercel once production build verified.
- Ensure backend deployment exposes HTTPS endpoint matching `NEXT_PUBLIC_BACKEND_URL`.
