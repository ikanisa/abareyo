# Rayon Sports Digital Platform

This monorepo powers the Rayon Sports fan experience across web, mobile, and match operations. The current MVP is a mobile-first Next.js PWA that reads and writes to Supabase for ticketing, retail, insurance, and SACCO services while remaining payment-first via USSD/SMS confirmations.

## Stack at a Glance
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, TanStack Query, next-themes, Framer Motion.
- **Backend**: Supabase Postgres (SQL migrations + seeds), Supabase Edge Functions, and Next.js API routes backed by `@supabase/supabase-js`.
- **Realtime automation**: `/functions/v1/sms-webhook` reconciles MoMo/Airtel SMS receipts while `/functions/v1/issue-policy` turns paid insurance quotes into policies.
- **Tooling**: Dockerfiles for web, GitHub Actions CI (`npm run lint`, `npm run type-check`, `npm run build`), Supabase CLI helpers.

## MacBook Setup

Local contributors primarily develop on Apple Silicon MacBooks. The following steps align with our supported toolchain:

1. Install [Homebrew](https://brew.sh/) and bootstrap the required binaries:
   ```bash
   brew install corepack supabase/tap/supabase
   corepack enable
   corepack prepare pnpm@9.12.2 --activate
   ```
   We ship an `npm@11` lockfile for compatibility with CI, but `pnpm` is the preferred local package manager because it matches the workspace layout and keeps the dependency graph deterministic.
2. Install Node.js 20 via `nvm`, `fnm`, or `asdf` (our `.nvmrc` pins `20.12.x`). Rosetta is not required.
3. Authenticate the Supabase CLI once (`supabase login`) so migrations and function deploys can execute without prompts.

Developers who rely on corporate VPNs should export `SUPABASE_DOCKER_IMAGE_REGISTRY=supabase` before running CLI commands to avoid registry resolution issues.

## Supabase Configuration

Supabase drives authentication, storage, and realtime updates. Copy `.env.example` to `.env.local` (machine-specific overrides only) and populate the following values. Keys prefixed with `NEXT_PUBLIC_` are exposed to the browser and should point at the deployed backend/API origin. For production builds, use `.env.production.local` based on `.env.production.example` and source values from your secret manager.

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
# legacy fallbacks still supported during migration:
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SMS_WEBHOOK_TOKEN=
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT_LABEL=local
```

`.env.local` is gitignored and takes precedence when you need to experiment with staging Supabase references, alternate webhook tokens, or forthcoming Cloudflare Tunnel hostnames.

> Supabase reserves the `SUPABASE_*` prefix for its own managed secrets when using the CLI/Vault. When setting project secrets via `supabase secrets set`, use the `SITE_SUPABASE_URL`, `SITE_SUPABASE_PUBLISHABLE_KEY`, and `SITE_SUPABASE_SECRET_KEY` aliases (they are automatically picked up by the codebase).

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
   supabase functions serve sms-webhook --env-file .env
   supabase functions serve issue-policy --env-file .env
   ```
   These functions can also be deployed via `supabase functions deploy <name>`.
6. Run the Next.js dev server:
   ```bash
   pnpm dev
   ```
Visit <http://localhost:3000> to explore the mobile-first PWA.

👉 Check out [`docs/local-hosting.md`](docs/local-hosting.md) for a consolidated Mac-first runbook covering `.env.local` usage, build/start commands, and reverse proxy considerations.

Realtime payment confirmations are delivered through the SMS webhook. Use `node tools/gsm-emulator/send-sms.js "Paid RWF 25000 Ref XYZ"` or call the deployed `/functions/v1/sms-webhook` endpoint with an authorised payload to mark tickets, orders, quotes, and SACCO deposits as paid.

If you plan to surface media (shop products, fundraising covers), configure S3-compatible storage in the Supabase project storage bucket or an external CDN and update product image URLs accordingly.

## Run Commands

`package.json` exposes the same script names across npm and pnpm. We standardise on the following pnpm invocations during local development and CI smoke tests:

- `pnpm dev` – Next.js dev server with HMR.
- `pnpm build` – Production build (runs `next build`).
- `pnpm start` – Serve the production bundle (`next start`).
- `pnpm lint` / `pnpm type-check` / `pnpm test` – Static analysis and unit coverage gates.
- `pnpm cap:sync`, `pnpm cap:android`, `pnpm cap:ios` – Capacitor workflows (requires native toolchains).
- `pnpm supabase:functions` (see `package.json`) – Convenience wrappers for function deploys.

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
- `pnpm cap:sync`, `pnpm cap:android`, `pnpm cap:ios` – entry points for Capacitor shells (install `@capacitor/cli` and related platform toolchains locally when you run them).
- Use `npx cordova-res` and `npx @bubblewrap/cli` on demand for mobile asset generation and TWA packaging; they are no longer pinned in `devDependencies` to avoid shipping known vulnerabilities.
- `docker compose up web` – build and run the production web image locally.
- `node tools/gsm-emulator/send-sms.js "…"` – simulate inbound MoMo/Airtel confirmation messages during flows.
- Admin console → `/admin/sms` lists inbound traffic and a manual review queue for low-confidence parses; link SMS to payments directly from the UI.
- Realtime dashboard → `/admin/realtime` visualises websocket events (ticket confirmations, gate scans, manual review, donations) for match-day ops.
- Community feed now supports reactions, quick comments, media attachments, and highlights flagged keywords for moderators.

## Repository Layout
- `app/` – Next.js route tree (`/(routes)` encloses mobile navigation, `/admin/*` hosts internal consoles).
- `src/views/` – Client components powering screens referenced by routes.
- `src/providers/` – Global context providers (auth façade, i18n scaffold, theme provider, React Query).
- `backend/` – Legacy NestJS application retained for reference. The Supabase-backed flows now live in `app/api` and `supabase/`.
- `packages/contracts/` – Shared DTOs and enums consumed by frontend utilities and any remaining backend tooling.
- `docs/` – Architecture decisions, local runbooks, and mobile packaging guides.

## Next Steps (Production Readiness)

- Migrations & Seed
  - Review `docs/migrations.md` for Supabase workflow tips.
  - Promote SQL via `supabase db push` in CI/CD or run `supabase migration up` + `supabase db seed` in production environments.

- Envs & Secrets
  - Confirm required envs in `docs/production-env.md`. Validate with `make env-check`.
  - Ensure Supabase service role keys are stored as repo/infra secrets, never shipped to the browser.

- E2E Smokes
  - `make e2e` runs Playwright smokes with mocked API (guarded by `E2E_API_MOCKS=1`).

- CI/CD
  - CI runs lint/unit/build. Preview deploys now rely on the internal GitHub Actions workflow paired with Supabase (the legacy managed-host flow has been retired). Edge Functions ship via `.github/workflows/supabase-functions-deploy.yml`.
  - Optional `HEALTH_URL` secret enables post-deploy health check loop.

- Observability & Security
  - Prometheus rules: `docs/observability/prometheus-rules.yml`; Grafana dashboard: `docs/grafana/backend-overview.json`.
  - Security hardening notes: `docs/security.md`; enable CSP via `APP_ENABLE_CSP=1` in production.

- Runbooks & Manifests
  - Deploy: `docs/runbooks/deploy.md`; Rollback: `docs/runbooks/rollback.md`; Cutover: `docs/cutover-readiness.md`.
  - **Operations**: `docs/runbooks/operations.md` covers daily checks, telemetry smokes, and the new offline/empty-state playbook.
  - K8s examples under `k8s/` and `docs/k8s/README.md`.

## Resilience Enhancements (P3)

- Home now renders skeleton placeholders while data loads and surfaces copy-led empty states when CMS content is unavailable.
- Fans see an accessible offline banner whenever connectivity drops; the UI recovers automatically when the network returns.
