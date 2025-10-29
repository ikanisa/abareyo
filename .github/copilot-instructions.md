# Copilot Coding Agent Instructions

## Repository Overview

**Rayon Sports Digital Platform** — A Next.js 14 (App Router) mobile-first PWA monorepo for fan engagement (ticketing, retail, insurance, SACCO), backed by Supabase Postgres/Edge Functions. Designed for match-day operations with USSD/SMS payment reconciliation via MoMo/Airtel.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Supabase (Postgres + Edge Functions), Sentry, Socket.io, Capacitor (mobile shells). Node.js 20.x required.

**Repository Size:** ~1,300 packages; frontend (~50 routes), backend (legacy NestJS in `backend/`, active Supabase functions in `supabase/functions/`), shared contracts (`packages/contracts/`).

---

## Environment Setup

### Required Tools
- **Node.js 20.x** (`.nvmrc` pins `20`) — Always use Node 20; newer versions may break builds.
- **npm 11.4.2** (set via `packageManager` in `package.json`) — CI uses npm 11; pnpm is supported locally but npm is canonical.
- **Supabase CLI** — Required for local Supabase and Edge Functions (install via `brew install supabase/tap/supabase` or official installer).

### Environment Variables
Copy `.env.example` to `.env.local` and populate **all** required variables:
```bash
# Required for build
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
NEXT_PUBLIC_ENVIRONMENT_LABEL=local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>

# Server-only secrets (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SITE_SUPABASE_URL=https://<project-ref>.supabase.co
SITE_SUPABASE_SECRET_KEY=<service-role-key>
ONBOARDING_API_TOKEN=<server-token>
OPENAI_API_KEY=<openai-key>
```

**Critical:** Build fails without `NEXT_PUBLIC_SITE_URL`. CI populates these automatically; local dev requires `.env.local`.

---

## Build & Test Commands

### Install Dependencies
```bash
npm ci  # Always use npm ci in CI and for clean installs
```
- If `npm ci` fails, `npm install` can be used for diagnostics but may cause lockfile drift.
- Package installation takes ~60s on typical hardware.

### Linting & Type Checking
```bash
npm run lint        # ESLint on app/, src/, tests/unit/ (must pass)
npm run type-check  # TypeScript compilation check (must pass)
```
- **Always run before committing.** CI blocks PRs on lint/type failures.
- Lint ignores `.next/`, `dist/`, `node_modules/`.

### Build
```bash
npm run build  # Runs prebuild (builds packages/contracts), then next build
```
- **Takes ~90-120 seconds** on typical hardware.
- **Prebuild step:** Automatically runs `npm run build:packages` (compiles `@rayon/contracts` TypeScript to dist).
- **Expected warnings:** "Using edge runtime disables static generation" for some admin routes, "Dynamic server usage" for routes using cookies.
- **Expected errors (safe to ignore):** Prerender errors for `/api/members/count` and `/api/members` (API routes using `.from()` require runtime context).
- Build artifacts: `.next/` (gitignored).

### Tests
```bash
npm test           # Runs type-check + vitest unit tests (~8s)
npm run test:unit  # Vitest only (94 tests in tests/unit/)
npm run test:e2e   # Playwright e2e tests (requires E2E_API_MOCKS=1)
```
- **Unit tests:** Use Vitest + jsdom, live in `tests/unit/`, mirror source structure.
- **E2E tests:** Use Playwright, live in `tests/e2e/`, require `E2E_API_MOCKS=1` and mock API endpoints.
- **E2E setup time:** ~240s for webServer to start (configured in `playwright.config.ts`).
- Some tests log expected errors to stderr (e.g., PWA parser test, analytics fallback test) — these are intentional and tests still pass.

### Development Server
```bash
npm run dev  # Runs preflight-dev.mjs, then next dev on port 3000
```
- **Predev check:** Validates Node 20+, required env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BACKEND_URL`).
- **Dev server timeout:** Can take 30-60s on first start (Next.js compilation).
- Hot Module Reloading (HMR) enabled.

### Preflight (Full Validation)
```bash
node scripts/preflight.mjs  # Runs env validation, backend check, full build
```
- Used by CI to validate production parity.
- **Expected duration:** ~120-180s.

---

## CI/CD & GitHub Actions

### Key Workflows
1. **`ci.yml`** (main quality gate):
   - Runs on PRs/pushes to `main`.
   - Steps: `npm ci` → lint → type-check → test → preflight → backend env check → Playwright e2e (admin-smokes, a11y).
   - **Blocking:** All steps must pass.
   - Uses npm 11.4.2 (installed via `npm i -g npm@11.4.2` in CI).

2. **`node-ci.yml`** (pnpm alternative):
   - Uses pnpm 10.5.2 for quality checks (typecheck, lint, build).
   - Runs in parallel to `ci.yml`.

3. **`deploy.yml`**:
   - Builds Docker images (frontend + backend), pushes to GHCR, optionally deploys to k8s.
   - Runs Prisma migrations in backend if `DATABASE_URL` set.

4. **`supabase-functions-deploy.yml`**:
   - Deploys Edge Functions (`sms-webhook`, `issue-policy`) to Supabase.

### CI Environment Variables
CI sets minimal test values:
```bash
NEXT_PUBLIC_ENVIRONMENT_LABEL=CI
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
NEXT_PUBLIC_SUPABASE_URL=https://ci.example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-anon-key
SUPABASE_SERVICE_ROLE_KEY=ci-service-role
# ... (full list in .github/workflows/ci.yml)
```

---

## Project Structure & Path Aliases

### Directory Layout
```
app/                   # Next.js App Router (routes, layouts, client wrappers)
├── (routes)/          # Main mobile navigation route group
├── admin/             # Admin console routes
├── api/               # API routes (REST endpoints, mocks for e2e)
├── _components/       # Client-only UI components
├── _lib/              # App-specific utilities
└── globals.css        # Global styles

src/                   # Shared application logic
├── components/        # Reusable UI components (shadcn/ui)
├── lib/               # Utilities (analytics, track, ussd, etc.)
├── providers/         # React context providers (auth, i18n, theme)
├── views/             # Client components for screens
├── config/            # Typed configuration
└── types/             # Shared TypeScript types

backend/               # Legacy NestJS app (Prisma schema, REST helpers)
├── prisma/            # Prisma schema & migrations
└── src/               # NestJS modules (sms, tickets, payments, etc.)

supabase/              # Supabase assets
├── migrations/        # SQL migrations (applied via supabase migration up)
├── functions/         # Edge Functions (sms-webhook, issue-policy)
└── seed.sql           # Seed data

packages/contracts/    # Shared DTOs/enums (@rayon/contracts)
tests/                 # Test suites
├── unit/              # Vitest tests
└── e2e/               # Playwright tests

k8s/                   # Kubernetes manifests
scripts/               # Build/utility scripts
docs/                  # Architecture decisions, runbooks
```

### Path Aliases (tsconfig.json)
```typescript
@/app/*         → app/*
@/components/*  → src/components/*
@/lib/*         → src/lib/*
@/providers/*   → src/providers/*
@/views/*       → src/views/*
@/config/*      → src/config/*
@rayon/contracts → packages/contracts/src/index.ts
```

### Important Files
- **Configuration:** `next.config.mjs`, `tsconfig.json`, `eslint.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- **Environment:** `.env.example`, `.env.template`, `.env.production.example`
- **CI:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- **Package Management:** `package.json`, `package-lock.json` (npm), `bun.lockb` (bun fallback)
- **Build Scripts:** `scripts/preflight.mjs`, `scripts/preflight-dev.mjs`, `scripts/check-frontend-env.mjs`
- **Shared Contracts:** `packages/contracts/src/index.ts` (must be built before frontend build)

---

## Common Issues & Workarounds

### Build Errors

#### 1. Missing `NEXT_PUBLIC_SITE_URL`
**Error:** `Missing required environment variables: - NEXT_PUBLIC_SITE_URL (required in production)`  
**Fix:** Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`.

#### 2. Prerender Errors for `/api/members`
**Expected warnings:** `Error occurred prerendering page "/api/members/count"` with `TypeError: e.from is not a function`.  
**Explanation:** API routes using Supabase `.from()` require runtime context and cannot be statically generated. This is expected and does not block the build.

#### 3. Edge Runtime Warning
**Expected warning:** `Using edge runtime on a page currently disables static generation for that page`  
**Explanation:** Some admin routes use Edge Runtime. This is intentional for performance.

### Dependency Installation

#### 1. `npm ci` Fails
**Error:** `npm ci` exits with error.  
**Diagnosis:** Run `npm install` for diagnostics.  
**Fix:** Usually caused by lockfile mismatch or network issues. Delete `node_modules/` and `package-lock.json`, then `npm install` to regenerate.

### Test Failures

#### 1. E2E Tests Timeout
**Error:** Playwright webServer timeout.  
**Fix:** E2E tests need `E2E_API_MOCKS=1` and require ~240s for Next.js dev server to start. Increase `playwright.config.ts` `webServer.timeout` if needed (currently 240000ms).

#### 2. Expected stderr Logs
**Expected stderr during tests:**
- `Unable to parse stored PWA preference` (pwa-opt-in.test.ts)
- `Analytics handler failed` (track.test.ts)

These are intentional test scenarios and do not indicate failures.

---

## Coding Standards

### TypeScript
- **All code is TypeScript** (`.ts`, `.tsx`).
- **Path aliases:** Use `@/lib/...`, `@/components/...`, `@rayon/contracts`.
- **Module resolution:** `bundler` mode (tsconfig.json).
- **No `allowJs`:** All files must be TypeScript.

### React/Next.js
- **Client components:** Must have `"use client"` directive at top.
- **Server components:** Default (no directive). Keep dependency-free of browser APIs.
- **Naming:** Components are `PascalCase.tsx`, hooks/utilities are `camelCase.ts`.
- **Exports:** Prefer named exports; default exports only for React components.

### Styling
- **Tailwind CSS:** Use utility classes (configured in `tailwind.config.ts`).
- **shadcn/ui:** Component library in `src/components/ui/` (do not modify directly).

### Linting
- **ESLint:** Configured via `eslint.config.js` (Next.js + TypeScript + jsx-a11y).
- **Accessibility warnings:** jsx-a11y rules set to `warn` (except in admin/UI components where stricter).

---

## Backend & Database

### Backend (Legacy NestJS)
Located in `backend/`. Still used for reference and some Prisma schema management.

**Commands (from `backend/` directory):**
```bash
npm ci                     # Install backend deps
npm run prisma:generate    # Generate Prisma client
npm run prisma:dev         # Run migrations (dev)
npm run seed               # Seed database
npm run start:dev          # Start NestJS server (port 5000)
```

**Makefile shortcuts (from repo root):**
```bash
make backend-migrate  # cd backend && npm ci && npx prisma generate && npm run prisma:migrate
make backend-seed     # cd backend && npm run seed
```

### Supabase
**Primary backend.** SQL migrations in `supabase/migrations/`, Edge Functions in `supabase/functions/`.

**Local setup:**
```bash
supabase start             # Start local Supabase (Docker)
supabase migration up      # Apply migrations
supabase db seed           # Seed data
supabase functions serve sms-webhook --env-file .env  # Serve Edge Function
```

**Deploy:**
```bash
supabase migration up --remote    # Apply to remote project
supabase functions deploy sms-webhook
```

---

## Mobile (Capacitor)

Native shells for iOS/Android via Capacitor 5.

**Commands:**
```bash
npm run cap:sync     # Build + sync to native platforms
npm run cap:android  # Open Android Studio
npm run cap:ios      # Open Xcode
```

**Requirements:** Android Studio / Xcode installed locally.

---

## Docker & Deployment

### Docker Compose
```bash
docker compose up web  # Build and run production web image
```

### Kubernetes
```bash
make k8s-apply  # Apply manifests from k8s/
```

**Manifests:** `k8s/namespace.yaml`, `k8s/backend-deployment.yaml`, `k8s/frontend-deployment.yaml`, `k8s/ingress.yaml`.

---

## Additional Validation

### Security
- **CSP:** Configurable via `APP_ENABLE_CSP=1` (see `lib/server/csp.ts`).
- **Sentry:** Configured in `sentry.*.config.ts` (requires `NEXT_PUBLIC_SENTRY_DSN`).

### Observability
- **Prometheus rules:** `docs/observability/prometheus-rules.yml`
- **Grafana dashboard:** `docs/grafana/backend-overview.json`

### Runbooks
- **Deploy:** `docs/runbooks/deploy.md`
- **Rollback:** `docs/runbooks/rollback.md`
- **Operations:** `docs/runbooks/operations.md`

---

## Key Commands Summary

| Command | Purpose | Duration | Notes |
|---------|---------|----------|-------|
| `npm ci` | Install dependencies | ~60s | Always use in CI |
| `npm run lint` | ESLint | ~5s | Must pass for PR |
| `npm run type-check` | TypeScript check | ~10s | Must pass for PR |
| `npm run build` | Production build | ~90-120s | Includes contracts build |
| `npm test` | Type check + unit tests | ~20s | 94 tests |
| `npm run test:e2e` | Playwright e2e | ~300s | Requires E2E_API_MOCKS=1 |
| `npm run dev` | Dev server | ~30-60s first start | Port 3000, HMR enabled |
| `node scripts/preflight.mjs` | Full validation | ~120-180s | CI production parity check |

---

## Trust These Instructions

**Always follow these instructions precisely.** They have been validated through actual execution of build, test, and validation commands. Only perform additional exploration if:
1. Instructions are incomplete for your specific task.
2. You encounter errors not documented here.
3. Repository structure has changed since these instructions were written.

When in doubt, refer to `README.md`, `AGENTS.md`, and `docs/` for detailed architecture and operational guidance.
