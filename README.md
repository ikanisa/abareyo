# Rayon Sports Digital Platform

This monorepo powers the Rayon Sports fan experience across web, mobile, and match operations. The current MVP is a mobile-first Next.js PWA that reads and writes to Supabase for ticketing, retail, insurance, and SACCO services while remaining payment-first via USSD/SMS confirmations.

## Stack at a Glance
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, TanStack Query, next-themes, Framer Motion.
- **Backend**: Supabase Postgres (SQL migrations + seeds), Supabase Edge Functions, and Next.js API routes backed by `@supabase/supabase-js`.
- **Realtime automation**: `/functions/v1/sms-webhook` reconciles MoMo/Airtel SMS receipts while `/functions/v1/issue-policy` turns paid insurance quotes into policies.
- **Tooling**: Dockerfiles for web, GitHub Actions CI (`npm run lint`, `npm run type-check`, `npm run build`), Supabase CLI helpers.

## Required Environment Variables

Create a root `.env` file with the following values. Keys prefixed with `NEXT_PUBLIC_` are exposed to the browser and should point at the deployed backend/API origin.

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

> Supabase reserves the `SUPABASE_*` prefix for its own managed secrets when using the CLI/Vault. When setting project secrets via `supabase secrets set`, use the `SITE_SUPABASE_URL`, `SITE_SUPABASE_PUBLISHABLE_KEY`, and `SITE_SUPABASE_SECRET_KEY` aliases (they are automatically picked up by the codebase).

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
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
   npm run dev
   ```
   Visit <http://localhost:3000> to explore the mobile-first PWA.

Realtime payment confirmations are delivered through the SMS webhook. Use `node tools/gsm-emulator/send-sms.js "Paid RWF 25000 Ref XYZ"` or call the deployed `/functions/v1/sms-webhook` endpoint with an authorised payload to mark tickets, orders, quotes, and SACCO deposits as paid.

If you plan to surface media (shop products, fundraising covers), configure S3-compatible storage in the Supabase project storage bucket or an external CDN and update product image URLs accordingly.

### Chat-Based Onboarding
- Visit `/onboarding` to launch the anonymous, ChatGPT-style onboarding assistant.
- Set `OPENAI_API_KEY` in `.env` if you want to use the hosted onboarding agent locally.
- The agent stores each fan's WhatsApp and MoMo numbers, linking them to the guest profile for future payments.
- Once onboarding is completed, the app automatically unlocks the regular `/` home experience.

## Useful Scripts
- `npm run lint` / `npm run type-check` / `npm run build` – CI parity checks.
- `npm run cap:sync`, `npm run cap:android`, `npm run cap:ios` – entry points for Capacitor shells (install `@capacitor/cli` and related platform toolchains locally when you run them).
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
  - CI runs lint/unit/build. Preview deploys rely on Vercel + Supabase. Edge Functions ship via `.github/workflows/supabase-functions-deploy.yml`.
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
