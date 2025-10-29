# Copilot Coding Agent Instructions

## Repository Overview
**Rayon Sports Digital Platform** — Next.js 14 PWA monorepo for fan engagement (ticketing, retail, insurance, SACCO) backed by Supabase. Node.js 20.x, TypeScript, Tailwind, shadcn/ui, TanStack Query. ~1,300 packages; frontend (~50 routes in `app/`), legacy NestJS backend (`backend/`), active Supabase functions (`supabase/functions/`), shared contracts (`packages/contracts/`).

## Environment Setup
**Node 20.x required** (`.nvmrc`). npm 11.4.2 canonical (pnpm supported locally). Supabase CLI for local dev. **Critical env vars** in `.env.local`: `NEXT_PUBLIC_SITE_URL` (build fails without this), `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_SUPABASE_URL`, `SITE_SUPABASE_SECRET_KEY`, `ONBOARDING_API_TOKEN`, `OPENAI_API_KEY`. Copy from `.env.example`.

## Build & Test Commands (All Must Pass for PR)
| Command | Duration | Notes |
|---------|----------|-------|
| `npm ci` | ~60s | Always use; `npm install` only for diagnostics |
| `npm run lint` | ~5s | ESLint on app/src/tests/unit |
| `npm run type-check` | ~10s | TypeScript compilation |
| `npm run build` | ~90-120s | Builds `@rayon/contracts` then `next build` |
| `npm test` | ~20s | Type check + 94 unit tests (Vitest) |
| `npm run test:e2e` | ~300s | Playwright; needs `E2E_API_MOCKS=1`, 240s webServer startup |
| `npm run dev` | ~30-60s first | Preflight checks env, starts Next.js:3000, HMR |

**Expected build warnings (safe):** Edge runtime disables static generation, dynamic server usage for cookie routes. **Expected errors (safe):** Prerender failures for `/api/members*` (API routes need runtime context).

## CI Workflows
- **ci.yml** (blocking): npm ci → lint → type-check → test → preflight → backend env check → Playwright (admin-smokes, a11y)
- **node-ci.yml**: pnpm 10.5.2 quality checks (parallel to ci.yml)
- **deploy.yml**: Docker images to GHCR, optional k8s deploy, Prisma migrations if `DATABASE_URL` set
- **supabase-functions-deploy.yml**: Deploys Edge Functions to Supabase

## Project Structure & Path Aliases
```
app/              # Next.js routes (App Router)
├── (routes)/     # Main mobile nav group
├── admin/        # Admin console
├── api/          # REST endpoints + e2e mocks
└── _components/  # Client-only UI

src/              # Shared logic
├── components/   # Reusable UI (shadcn/ui)
├── lib/          # Utilities (analytics, track, ussd)
├── providers/    # React context (auth, i18n, theme)
├── views/        # Client components for screens
└── config/       # Typed configuration

backend/          # Legacy NestJS + Prisma
supabase/         # Migrations + Edge Functions
packages/contracts/ # Shared DTOs (@rayon/contracts)
tests/            # unit/ (Vitest), e2e/ (Playwright)
k8s/              # Kubernetes manifests
scripts/          # Build/utility scripts
```

**Path aliases (tsconfig.json):** `@/app/*` → app/*, `@/components/*` → src/components/*, `@/lib/*` → src/lib/*, `@/providers/*` → src/providers/*, `@/views/*` → src/views/*, `@/config/*` → src/config/*, `@rayon/contracts` → packages/contracts/src/index.ts

**Key files:** `next.config.mjs`, `tsconfig.json`, `eslint.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `package.json`, `.env.example`, `.github/workflows/ci.yml`

## Common Issues & Fixes

### Build Errors
**"Missing required environment variables: NEXT_PUBLIC_SITE_URL"** → Add to `.env.local`: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

**Prerender errors for /api/members*** → Expected; API routes using Supabase `.from()` need runtime context. Build succeeds.

**"Using edge runtime disables static generation"** → Expected for admin routes. Intentional.

### Dependency Errors
**npm ci fails** → Delete `node_modules/` & `package-lock.json`, run `npm install` to diagnose. Usually lockfile mismatch or network issues.

### Test Failures
**E2E timeout** → E2E tests need `E2E_API_MOCKS=1` and 240s for Next.js dev server (configured in `playwright.config.ts`).

**Expected stderr logs** (intentional, tests pass): "Unable to parse stored PWA preference" (pwa-opt-in.test.ts), "Analytics handler failed" (track.test.ts).

## Coding Standards
**TypeScript only** (.ts/.tsx). Use path aliases (`@/lib/...`, `@rayon/contracts`). Client components need `"use client"` directive. Server components are default; no browser APIs. Components: PascalCase.tsx, utilities: camelCase.ts. Named exports preferred; default exports for React components only. **Tailwind CSS** for styling. **ESLint** (eslint.config.js): Next.js + TypeScript + jsx-a11y; accessibility rules `warn` (strict in admin/UI).

## Backend & Database
**Backend (legacy NestJS in `backend/`):** `npm ci` → `npm run prisma:generate` → `npm run prisma:dev` (migrations) → `npm run seed`. Or use Makefile: `make backend-migrate`, `make backend-seed`.

**Supabase (primary):** SQL in `supabase/migrations/`, Edge Functions in `supabase/functions/`. Local: `supabase start` → `supabase migration up` → `supabase db seed`. Edge Functions: `supabase functions serve sms-webhook --env-file .env`. Deploy: `supabase migration up --remote`, `supabase functions deploy sms-webhook`.

## Mobile (Capacitor 5)
Native iOS/Android shells. `npm run cap:sync` (build + sync), `npm run cap:android` (Android Studio), `npm run cap:ios` (Xcode). Requires platform toolchains.

## Docker & Deployment
**Docker Compose:** `docker compose up web` (build + run production).  
**Kubernetes:** `make k8s-apply` (applies `k8s/*.yaml`).  
**CI builds Docker images** and pushes to GHCR; optional k8s deploy.

## Additional Validation
**Security:** CSP via `APP_ENABLE_CSP=1` (`lib/server/csp.ts`). Sentry in `sentry.*.config.ts` (needs `NEXT_PUBLIC_SENTRY_DSN`).  
**Observability:** Prometheus rules (`docs/observability/prometheus-rules.yml`), Grafana dashboard (`docs/grafana/backend-overview.json`).  
**Runbooks:** `docs/runbooks/deploy.md`, `rollback.md`, `operations.md`.

## Trust These Instructions
**Follow precisely.** Instructions validated through actual command execution (build, test, CI parity). Only explore further if:
1. Instructions incomplete for your task
2. Encounter undocumented errors
3. Repository structure changed since writing

See `README.md`, `AGENTS.md`, `docs/` for architecture and operational details.
