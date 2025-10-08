# Rayon Sports Backend

NestJS 11 (Fastify) service delivering the Rayon Sports Fan platform APIs, SMS ingestion, and realtime gateway.

## Getting Started
1. Ensure Postgres, Redis, and Node.js 20+ are installed.
2. Copy `.env.example` to `.env` and populate the required variables.
3. Install dependencies (once network access is available):
   ```bash
   cd backend
   npm install
   npm run prisma:generate
   npm run prisma:dev
   npm run seed
   npm run start:dev
   ```

## Environment Variables
Consult `docs/architecture/data-model-and-config.md` for the canonical contract. Minimal local example:
```
APP_PORT=5000
CORS_ORIGIN=http://localhost:8080
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rayon
DATABASE_SHADOW_URL=postgresql://postgres:postgres@localhost:5433/rayon_shadow
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-***
SMS_WEBHOOK_TOKEN=dev-token
MTN_MOMO_PAY_CODE=0700123456
AIRTEL_MONEY_PAY_CODE=0700123456
ADMIN_SESSION_COOKIE=admin_session
ADMIN_SESSION_SECRET=change-me-admin-session
ADMIN_SESSION_TTL_HOURS=24
# optional
ADMIN_SESSION_COOKIE_DOMAIN=
# seed a bootstrap admin (password hash must be bcrypt)
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD_HASH=
ADMIN_SEED_NAME=System Admin
```

## Project Structure
- `src/modules/sms` – GSM modem webhook and future parser orchestration.
- `src/modules/tickets` – Ticket catalogue & checkout endpoints with USSD generator.
- `src/modules/payments` – Shared payment reconciliation helpers.
- `src/modules/wallet` – Wallet summary + transaction queries for the PWA.
- `src/modules/admin` – Admin auth/session management, RBAC guards, future admin endpoints.
- `prisma/` – Schema and migrations (`202501131200_init`).
- `packages/contracts` – Shared DTOs/enums consumed by frontend/backends.

## Scripts
- `npm run start:dev` – Run backend in watch mode (ts-node + SWC).
- `npm run prisma:dev` – Apply migrations locally.
- `npm run seed` – Seed canonical fixtures.

## Testing SMS Pipeline
Use the emulator at `tools/gsm-emulator` until the physical modem bridge is operational.

## REST Endpoints (current)
- `POST /api/tickets/checkout` – create pending ticket order and USSD code.
- `GET /api/tickets/orders/:orderId` – fetch order snapshot (payments, passes, items).
- `POST /api/tickets/verify-pass` – validate pass tokens; append `?dryRun=true` to keep active.
- `POST /api/sms/webhook` – GSM modem ingress (requires `SMS_WEBHOOK_TOKEN`).
- `GET /api/sms/inbound` – recent SMS (requires `x-admin-token`).
- `GET /api/wallet/summary?userId=...` – totals by payment status.
- `GET /api/wallet/transactions?userId=...` – recent wallet transactions.
- `GET /api/membership/plans` – active membership tiers.
- `GET /api/membership/:userId/status` – membership status for a user.
- `POST /api/membership/upgrade` – start membership checkout (requires `userId`, `planId`, `channel`).
- `GET /api/shop/products` – list active shop products.
- `POST /api/shop/checkout` – create pending shop order and return USSD string.
- `GET /api/community/feed` – public feed of published posts.
- `POST /api/community/posts` – create a new post (auto-flagging heuristics).
- `GET /api/community/moderation` – flagged posts (requires `x-admin-token`).
- `POST /api/community/posts/:id/moderate` – approve/remove flagged posts (requires `x-admin-token`).
- `GET /api/fundraising/projects` – fundraising project list.
- `POST /api/fundraising/donate` – start donation checkout (projectId, amount, channel).
- `POST /api/tickets/passes/initiate-transfer` – generate a transfer code for a pass (requires owner user ID).
- `POST /api/tickets/passes/claim-transfer` – claim a transferred pass using the one-time code.
