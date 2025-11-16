# Rayon Sports Digital Platform

This monorepo powers the Rayon Sports fan experience across web, mobile, and match operations. The current MVP is a mobile-first Next.js PWA that reads and writes to Supabase for ticketing, retail, insurance, and SACCO services while remaining payment-first via USSD/SMS confirmations.

## Stack at a Glance
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, TanStack Query, next-themes, Framer Motion.
- **Backend**: Supabase Postgres (SQL migrations + seeds), Supabase Edge Functions, and Next.js API routes backed by `@supabase/supabase-js`.
- **Realtime automation**: `/functions/v1/sms-webhook` reconciles MoMo/Airtel SMS receipts while `/functions/v1/issue-policy` turns paid insurance quotes into policies.
- **Tooling**: Dockerfiles for web, GitHub Actions CI (lint/type-check/build + license enforcement and SBOM snapshots), Supabase CLI helpers.

## MacBook Setup

Local contributors primarily develop on Apple Silicon MacBooks. The streamlined setup lives in [`docs/env.md`](docs/env.md) and is summarised under [Developer Environment](#developer-environment). Apple Silicon users should install Homebrew, enable Corepack, and follow the Supabase CLI login steps documented there. Developers who rely on corporate VPNs should export `SUPABASE_DOCKER_IMAGE_REGISTRY=supabase` before running CLI commands to avoid registry resolution issues.

## Supabase Configuration

Supabase now owns the entire auth surface (OTP + session exchange) and the QR access pipeline. Copy `.env.example` to `.env.local` (machine-specific overrides only) and populate the following values. Keys prefixed with `NEXT_PUBLIC_` are exposed to the browser and should point at the deployed backend/API origin. For production builds, use `.env.production.local` based on `.env.production.example` and source values from your secret manager.

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
# legacy fallbacks still supported during migration:
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
REALTIME_SIGNING_SECRET=
SUPABASE_AUTH_REDIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SMS_WEBHOOK_TOKEN=
SMS_INGEST_TOKEN=
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT_LABEL=local
```

`.env.local` is gitignored and takes precedence when you need to experiment with staging Supabase references, alternate webhook tokens, or forthcoming Cloudflare Tunnel hostnames. The QR Edge Functions (`qr-token`, `event-checkin`) require `REALTIME_SIGNING_SECRET` to validate channel auth; set it alongside the Supabase service credentials before deploying functions.

> Supabase reserves the `SUPABASE_*` prefix for its own managed secrets when using the CLI/Vault. When setting project secrets via `supabase secrets set`, use the `SITE_SUPABASE_URL`, `SITE_SUPABASE_PUBLISHABLE_KEY`, and `SITE_SUPABASE_SECRET_KEY` aliases (they are automatically picked up by the codebase). Use `SUPABASE_AUTH_REDIRECT_URL` when enabling magic-link login so Supabase can redirect back to `/admin/login`.

## Workspace Layout

The repository is a polyglot workspace that keeps application code, infrastructure automation, and operational tooling side-by-side. The high-level directory map is below—refer to [`docs/architecture.md`](docs/architecture.md) for a visual overview of how these pieces interact.

| Path | Purpose |
| ---- | ------- |
| `app/` | Next.js App Router surface (mobile-first navigation, admin surfaces, and API routes). |
| `src/` | Shared React components, hooks, providers, and utilities imported via path aliases (`@/lib/*`, `@/components/*`). |
| `backend/` | Historical NestJS services retained for reference and data migrations. |
| `packages/` | Publishable packages such as `packages/contracts` that provide DTOs/enums for the web and tooling layers. |
| `packages/api/` | Shared HTTP + Supabase clients used by the web and automation layers (React Query adapters were removed; use TanStack Query directly in routes/components). |
| `supabase/` | SQL migrations, seed data, and Edge Functions that orchestrate payments and realtime events. |
| `docs/` | Runbooks, release guides, and policy documents. Notable additions: [`docs/env.md`](docs/env.md), [`docs/security.md`](docs/security.md), and [`docs/payments-policy.md`](docs/payments-policy.md). |
| `docs/runbooks/` | Operational runbooks including the new [`mobile.md`](docs/runbooks/mobile.md) and [`web.md`](docs/runbooks/web.md) quickstarts. |
| `scripts/` & `tools/` | Automation helpers (preflight checks, GSM SMS emulator, Supabase deployment scripts). |
| `k8s/` & `infra/` | Kubernetes manifests, Dockerfiles, and deployment scaffolding. |

## Developer Environment

Local contributors primarily develop on Apple Silicon MacBooks. The consolidated environment guide lives in [`docs/env.md`](docs/env.md); the quick checklist is below:

1. Install [Homebrew](https://brew.sh/) and bootstrap the required binaries:
   ```bash
   brew install corepack supabase/tap/supabase
   corepack enable
   corepack prepare pnpm@9.12.2 --activate
   ```
   We ship an `npm@11` lockfile for compatibility with CI, but `pnpm` is the preferred local package manager because it matches the workspace layout and keeps the dependency graph deterministic.
2. Install Node.js 20 via `nvm`, `fnm`, or `asdf` (our `.nvmrc` pins `20.12.x`). Rosetta is not required.
3. Authenticate the Supabase CLI once (`supabase login`) so migrations and function deploys can execute without prompts.
4. Copy `.env.example` to `.env.local`, then follow the staged environment matrix in [`docs/env.md`](docs/env.md#environment-matrix).

Developers who rely on corporate VPNs should export `SUPABASE_DOCKER_IMAGE_REGISTRY=supabase` before running CLI commands to avoid registry resolution issues.

## Local Setup
1. Install dependencies with `pnpm`:
   ```bash
   pnpm install
   ```
   `pnpm` reads the existing npm lockfile via Corepack, so there is no need to regenerate dependency metadata.
2. Ensure the Supabase CLI is installed (<https://supabase.com/docs/guides/cli>). Log in once so migrations can run.
3. Start Supabase locally (or point the env vars to a remote project):
   ```bash
   supabase start
   ```
   The CLI prints credentials that can be copied into `.env` for local development.
4. Apply the MVP schema and seed data:
   ```bash
   supabase migration up
   supabase db seed
   ```
5. Deploy or emulate Edge Functions if you plan to test payment automation locally:
   ```bash
   supabase functions serve sms-ingest --env-file .env
   supabase functions serve parse-sms --env-file .env
   supabase functions serve issue-perk --env-file .env
   supabase functions serve ops-digest --env-file .env
   supabase functions serve issue-policy --env-file .env
   ```
   These functions can also be deployed via `supabase functions deploy <name>`. Production rollouts should include `sms-ingest`,
   `parse-sms`, `issue-perk`, `ops-digest`, and `issue-policy` so that inbound payments, perks, and nightly summaries execute
   without manual intervention.
6. Run the Next.js dev server:
   ```bash
   pnpm dev
   ```
Visit <http://localhost:3000> to explore the mobile-first PWA. The full troubleshooting guide—including how to reset local Supabase data and rerun migrations—lives in [`docs/runbooks/web.md`](docs/runbooks/web.md#local-development-loop).

👉 Check out [`docs/local-hosting.md`](docs/local-hosting.md) for a consolidated Mac-first runbook covering `.env.local` usage, build/start commands, and reverse proxy considerations.

Realtime payment confirmations are delivered through the SMS webhook. Use `node tools/gsm-emulator/send-sms.js "Paid RWF 25000 Ref XYZ"` or call the deployed `/functions/v1/sms-webhook` endpoint with an authorised payload to mark tickets, orders, quotes, and SACCO deposits as paid.

If you plan to surface media (shop products, fundraising covers), configure S3-compatible storage in the Supabase project storage bucket or an external CDN and update product image URLs accordingly.

### WhatsApp OTP Smoke Tests

With the Next.js server running (`pnpm dev`) and the WhatsApp Cloud credentials set in `.env.local`, use the following `curl` commands to validate the OTP flow end-to-end:

```bash
# 1) Issue an OTP to your WhatsApp number
curl -X POST http://localhost:3000/api/auth/whatsapp/start \
  -H 'content-type: application/json' \
  -d '{"phone":"+250788888888"}'

# Response
# {"ok":true,"expiresAt":"2025-01-01T12:00:00.000Z"}

# 2) Verify the code you received on WhatsApp (replace 123456 with the actual OTP)
curl -X POST http://localhost:3000/api/auth/whatsapp/verify \
  -H 'content-type: application/json' \
  -d '{"phone":"+250788888888","otp":"123456"}'

# Response
# {"ok":true,"token":"<hs256-jwt>"}
```

If you attempt to reuse the same OTP or submit the wrong code more than five times, the API returns descriptive errors such as `otp_expired`, `otp_invalid`, or `otp_attempts_exceeded`. The start endpoint enforces `RATE_LIMIT_PER_PHONE_PER_HOUR`, returning HTTP `429` with a `retryAt` timestamp when the hourly cap is reached.

## Run Commands

`package.json` exposes the same script names across npm and pnpm. A deeper explanation of each command—including when to run it during feature development or release prep—is available in [`docs/runbooks/web.md`](docs/runbooks/web.md#core-commands). The canonical pnpm entry points are:

- `pnpm dev` – Next.js dev server with HMR.
- `pnpm build` – Production build (runs `next build`).
- `pnpm start` – Serve the production bundle (`next start`).
- `pnpm lint` / `pnpm type-check` / `pnpm test` – Static analysis and unit coverage gates.
- `pnpm coverage` – Generates the Vitest coverage report; CI enforces the thresholds defined in [`docs/release.md`](docs/release.md#quality-gates).
- Legacy Capacitor build tooling has been removed; the PWA is now the only supported client.
- `pnpm supabase:functions` (see `package.json`) – Convenience wrappers for function deploys.
- `node scripts/preflight.mjs` – Combined env + backend availability check followed by `npm run build`.

## Hosting Strategy

We intentionally removed the default managed-host deployment path. The platform now targets containerised or Supabase-hosted environments for the following reasons:

- **Deterministic runtime** – Self-hosting via Docker or Supabase Edge Functions keeps the Node.js version and native dependencies aligned with our CI images, eliminating provider-specific quirks around OpenSSL and experimental flags.
- **Network affinity** – Running the web app closer to Supabase Postgres (or within the same VPC) lowers latency for realtime updates and reduces cross-region egress charges.
- **Compliance** – Match-day integrations (MoMo SMS, SACCO accounting) require IP allowlists that are impractical to enforce on ephemeral preview hosts.

Upcoming production hardening includes a reverse proxy in front of the Next.js runtime. Cloudflare Tunnel was selected for production to pair Cloudflare-managed TLS with zero-trust Access policies while keeping the cluster private. Refer to [`docs/runbooks/ingress-cloudflare-tunnel.md`](docs/runbooks/ingress-cloudflare-tunnel.md) for deployment steps and zero-trust guidance.

### Chat-Based Onboarding
- Visit `/onboarding` to launch the anonymous, ChatGPT-style onboarding assistant.
- Set `OPENAI_API_KEY` in `.env` if you want to use the hosted onboarding agent locally.
- The agent stores each fan's WhatsApp and MoMo numbers, linking them to the guest profile for future payments.
- Once onboarding is completed, the app automatically unlocks the regular `/` home experience.

## Useful Scripts
- `pnpm lint` / `pnpm type-check` / `pnpm build` – CI parity checks.
- Supply chain snapshots: `npm run check:licenses && npm run sbom` – regenerate license and SBOM reports prior to a release (CI uploads the generated bundle automatically).
- Mobile packaging scripts were removed with the native bridges; reference the historical notes in `docs/mobile` if you need the archived steps.
- `docker compose up web` – build and run the production web image locally.
- `node tools/gsm-emulator/send-sms.js "…"` – simulate inbound MoMo/Airtel confirmation messages during flows.
- `npm run lint:ussd` – shared keyword audit for the web and React Native clients (guards against non-USSD payment SDKs).
- Admin console → `/admin/sms` lists inbound traffic and a manual review queue for low-confidence parses; link SMS to payments directly from the UI.
- Realtime dashboard → `/admin/realtime` visualises websocket events (ticket confirmations, gate scans, manual review, donations) for match-day ops.
- Community feed now supports reactions, quick comments, media attachments, and highlights flagged keywords for moderators.

## Deployment Entry Points

Deployment processes are orchestrated via Make targets and GitHub Actions. Consult [`docs/release.md`](docs/release.md) and [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md) for the end-to-end flow; the quick reference is below:

- `make deploy-staging` / `make deploy-production` – Triggers the web deployment workflow with the current commit.
- `make deploy:rollback ENV=<staging|production>` – Restores the last known good artifact (see [`docs/runbooks/rollback.md`](docs/runbooks/rollback.md)).
- `pnpm supabase:functions deploy` – Deploys updated Edge Functions (including `qr-token` and `event-checkin`) against the current `SUPABASE_PROJECT_REF`.
- Native release targets are no longer built from this repo; coordinate with Product if a dedicated mobile shell is reintroduced.

CI expectations, coverage thresholds, and rollback playbooks are formalised in [`docs/release.md`](docs/release.md#quality-gates) and [`docs/runbooks/rollback.md`](docs/runbooks/rollback.md).

## Repository Layout
- `app/` – Next.js route tree (`/(routes)` encloses mobile navigation, `/admin/*` hosts internal consoles).
- `src/views/` – Client components powering screens referenced by routes.
- `src/providers/` – Global context providers (auth façade, i18n scaffold, theme provider, React Query).
- `backend/` – Legacy NestJS application retained for reference. The Supabase-backed flows now live in `app/api` and `supabase/`.
- `packages/contracts/` – Shared DTOs and enums consumed by frontend utilities and any remaining backend tooling.
- `packages/api/` – HTTP + Supabase wrappers shared between the web app and automation scripts (React Query adapters have been retired in favour of direct TanStack Query usage).
- `docs/` – Architecture decisions, local runbooks, and historical mobile packaging guides.

## Next Steps (Production Readiness)

### Deployment Checklist & Validation

Use the streamlined deployment runbook and automation instead of the retired standalone checklists:

- [docs/runbooks/deploy.md](./docs/runbooks/deploy.md) – Source of truth for build promotion, Supabase migrations, and function deploys.
- [docs/runbooks/web.md](./docs/runbooks/web.md#deployment-steps) – Per-app commands (build, lint/type-check/test, and preflight) and smoke checks.
- Automated validation: `npm run validate:deployment` or `make validate-deployment` verifies environment completeness, Node.js compatibility, lint/type-check/test parity, and env documentation. Add `--check-k8s` + `--check-services` for cluster/service reachability.

Retired documents (`DEPLOYMENT_CHECKLIST.md`, `DEPLOYMENT_QUICKSTART.md`, Netlify/K8s quick references, and audit summaries) have been removed in favor of the consolidated runbooks above.

### Infrastructure Setup

- Migrations & Seed
  - Review `docs/migrations.md` for Supabase workflow tips.
  - Promote SQL via `supabase db push` in CI/CD or run `supabase migration up` + `supabase db seed` in production environments.

- Envs & Secrets
  - Confirm required envs in `docs/production-env.md` and [`docs/env.md`](docs/env.md). Validate with `make env-check`.
  - Ensure Supabase service role keys are stored as repo/infra secrets, never shipped to the browser.
  - Admin SMS parser test endpoint (staging only): set `OPENAI_API_KEY` and `ADMIN_SMS_PARSER_TEST_ENABLED=1`. Optional rate config: `ADMIN_SMS_PARSER_TEST_RATE_LIMIT` (default 10), `ADMIN_SMS_PARSER_TEST_WINDOW_MS` (default 60000).

- E2E Smokes
  - `make e2e` runs Playwright smokes with mocked API (guarded by `E2E_API_MOCKS=1`).

- CI/CD
  - CI runs lint/unit/build, enforces Vitest coverage thresholds, and publishes artifacts described in [`docs/release.md`](docs/release.md#ci-pipeline).
  - Preview deploys now rely on the internal GitHub Actions workflow paired with Supabase (the legacy managed-host flow has been retired). Edge Functions ship via `.github/workflows/supabase-functions-deploy.yml`.
  - Optional `HEALTH_URL` secret enables post-deploy health check loop.

- Observability & Security
  - Prometheus rules: `docs/observability/prometheus-rules.yml`; Grafana dashboard: `docs/grafana/backend-overview.json`.
  - Security hardening notes: [`docs/security.md`](docs/security.md); enable CSP via `APP_ENABLE_CSP=1` in production.

- Runbooks & Manifests
  - Deploy: `docs/runbooks/deploy.md`; Rollback: `docs/runbooks/rollback.md`; Cutover: `docs/cutover-readiness.md`; Web & mobile operations: [`docs/runbooks/web.md`](docs/runbooks/web.md) and [`docs/runbooks/mobile.md`](docs/runbooks/mobile.md).
  - **Operations**: `docs/runbooks/operations.md` covers daily checks, telemetry smokes, and the new offline/empty-state playbook.
  - K8s examples under `k8s/` and `docs/k8s/README.md`.

## Resilience Enhancements (P3)

- Home now renders skeleton placeholders while data loads and surfaces copy-led empty states when CMS content is unavailable.
- Fans see an accessible offline banner whenever connectivity drops; the UI recovers automatically when the network returns.
