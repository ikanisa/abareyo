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

## Useful Scripts
- `npm run lint` / `npm run type-check` / `npm run build` – CI parity checks.
- `npm run cap:sync`, `npm run cap:android`, `npm run cap:ios` – entry points for Capacitor shells.
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

## Next Steps
Phase 2 onwards will layer in full Prisma migrations, payment reconciliation workers, GSM ingestion, offline-first caching, and the mobile packaging pipeline. Refer to `docs/architecture/phase0/architecture-lockdown.md` for the roadmap.
