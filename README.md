# Rayon Sports Digital Platform

This monorepo powers the Rayon Sports fan experience across web, mobile, and match operations. The current iteration delivers the Phase 1 foundation: a Next.js App Router frontend, a NestJS 11 backend scaffold, shared TypeScript contracts, and automation for CI/CD and containerised development.

## Stack at a Glance
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, TanStack Query, next-themes, Socket.IO client for realtime toasts.
- **Backend**: NestJS 11 + Fastify, Prisma ORM, PostgreSQL, Redis, BullMQ (queued jobs), OpenAI integrations, Socket.IO gateway.
- **Shared packages**: `packages/contracts` distributes request/response DTOs used by the app and API.
- **Tooling**: Dockerfiles for web + services, GitHub Actions CI (`npm run lint`, `npm run type-check`, `npm run build`).

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   (cd backend && npm install)
   ```
2. Copy backend environment defaults and tweak as needed:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Create a root `.env` for the Next.js app (keys prefixed with `NEXT_PUBLIC_` are exposed to the browser):
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
   NEXT_PUBLIC_ADMIN_API_TOKEN=admin-dev-token
   ```
4. Start supporting services (Postgres, Redis) via Docker Compose or local installs. A minimal compose file is provided:
   ```bash
   docker compose up db redis -d
   ```
5. Apply Prisma schema and seed the database:
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:dev
   npm run seed
   ```
6. Run the backend and frontend in separate terminals:
   ```bash
   # backend
   cd backend
   npm run start:dev

   # frontend
   npm run dev
   ```
   Visit <http://localhost:3000> to explore the mobile-first PWA.

Realtime events (ticket confirmations, gate scans, etc.) stream over Socket.IO at `<backend>/ws`. The UI already listens and surfaces toasts for the most common signals.

If you plan to surface media (shop products, fundraising covers), configure S3-compatible storage in `backend/.env`:

```
S3_ENDPOINT=http://127.0.0.1:9000
S3_BUCKET=rayon-dev
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=miniostorage
S3_PUBLIC_BASE_URL=http://127.0.0.1:9000/rayon-dev
```

In development, you can run a local MinIO instance and point the `S3_PUBLIC_BASE_URL` at its HTTP endpoint so the frontend receives fully-qualified image URLs.

### Chat-Based Onboarding
- Visit `/onboarding` to launch the anonymous, ChatGPT-style onboarding assistant.
- The backend requires `OPENAI_API_KEY` and optionally `OPENAI_ONBOARDING_MODEL` (defaults to `gpt-4.1-mini`) in `backend/.env` to call the OpenAI Responses API.
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
- `backend/` – NestJS application (modules for tickets, payments, wallet, community, fundraising, SMS processing).
- `packages/contracts/` – Shared DTOs and enums consumed by frontend and backend.
- `docs/` – Architecture decisions, local runbooks, and mobile packaging guides.

## Next Steps (Production Readiness)

- Migrations & Seed
  - See `docs/migrations.md` and run `make backend-migrate` then `make backend-seed`.

- Envs & Secrets
  - Confirm required envs in `docs/production-env.md`. Validate with `make env-check`.

- E2E Smokes
  - `make e2e` runs Playwright smokes with mocked API (guarded by `E2E_API_MOCKS=1`).

- CI/CD
  - CI runs lint/unit/e2e. Deploy workflow builds/pushes images (GHCR) and runs Prisma migrate deploy.
  - Optional `HEALTH_URL` secret enables post-deploy health check loop.

- Observability & Security
  - Prometheus rules: `docs/observability/prometheus-rules.yml`; Grafana dashboard: `docs/grafana/backend-overview.json`.
  - Security hardening notes: `docs/security.md`; enable CSP via `APP_ENABLE_CSP=1` in production.

- Runbooks & Manifests
  - Deploy: `docs/runbooks/deploy.md`; Rollback: `docs/runbooks/rollback.md`; Cutover: `docs/cutover-readiness.md`.
  - K8s examples under `k8s/` and `docs/k8s/README.md`.
