# Self-Hosted Deployment Plan (Archived)

> **Status:** Legacy documentation retained for historical context. The
> project now deploys via container images or Supabase-hosted functions.
> Historical references to third-party managed hosting have been removed.

## Workspace Defaults
- **Repository Root**
  - **Framework**: Next.js 14 App Router
  - **Node**: 20.x (aligns with `package.json` engines)
  - **Package Manager**: pnpm (Corepack-enabled)
  - **Install Command**: `pnpm install`
  - **Build Command**: `pnpm build`
  - **Output Directory**: `.next`
  - **Env Sources**: Supabase (URL + anon/service keys), OpenAI, onboarding tokens, telemetry keys
  - **Notes**: Requires Sentry DSN (server or client) when telemetry enabled; Supabase keys must be set for auth and realtime

- **Backend (`backend/`)**
  - Runs independently on managed VMs or containers (NestJS + Prisma). CI should continue to build/test separately.

## Container-Oriented Settings
- **Image build**: `docker build -f Dockerfile -t abareyo/web .`
- **Runtime command**: `node server.js` via `next start`
- **Ports**: expose 3000 (configurable via `PORT` env)
- **Health checks**: `/api/health`
- **Secrets**:
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
  - Optional: `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN`, `NEXT_PUBLIC_TELEMETRY_URL`, `NEXT_PUBLIC_SOCKET_PATH`, `AUTOMATION_BYPASS_SECRET`

## Routing / Runtime Notes
- `next.config.mjs` sets `output: 'standalone'` for predictable Docker builds.
- API routes live under `/app/api` and remain Node.js compatible.
- Middleware only inspects cookies/headers and runs in the Node runtime.

## Build Artifacts & Caching
- Production bundle emitted to `.next/standalone` during `pnpm build`.
- Static assets available under `.next/static` and `public/`.
- Container image should copy `.next/standalone`, `.next/static`, and `public`.

## Follow-up Actions
- Use `scripts/env-sync-template.sh` as a starting point for propagating secrets to alternative platforms (e.g., Docker Swarm, fly.io, self-managed Kubernetes).
- Map custom domains or reverse proxy rules within your chosen ingress (Caddy, Nginx, or Cloudflare Tunnel) once production build is verified.
- Monitor backend health with `pnpm check:backend` (used by preflight) after infrastructure changes.
