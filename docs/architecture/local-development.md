# Local Development Setup

This guide links the NestJS backend, Next.js App Router frontend, and GSM emulator for end-to-end ticket checkout tests without production infrastructure.

## Prerequisites
- Node.js 20+
- pnpm or npm (project currently assumes npm)
- Docker (for Postgres + Redis) or local services
- Optional: `jq` and `httpie` for API debugging

## Clone & Install
Network access is currently restricted in the CI sandbox, but on a developer machine run:
```bash
npm install
(cd backend && npm install)
```
> Re-run these commands whenever `package.json` files change (e.g., after adding `@rayon/contracts`).

## Environment Variables
Create `.env` in repo root for the frontend. Next.js exposes any keys prefixed with `NEXT_PUBLIC_` to the browser:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
SMS_PARSE_CONFIDENCE_THRESHOLD=0.65
```

Copy backend example:
```bash
cp backend/.env.example backend/.env
```
Adjust credentials if your local Postgres/Redis differs.

If you want local media rendering (shop products, fundraising covers), configure the S3 block in `backend/.env` — for example when using MinIO:
```
S3_ENDPOINT=http://127.0.0.1:9000
S3_BUCKET=rayon-dev
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=miniostorage
S3_PUBLIC_BASE_URL=http://127.0.0.1:9000/rayon-dev
```
The frontend automatically resolves product and project images when `S3_PUBLIC_BASE_URL` is provided.

## Start Datastores
With Docker:
```bash
docker run --name rayon-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -d postgres:15
docker run --name rayon-redis -p 6379:6379 -d redis:7
# Optional: MinIO for local asset storage
docker run --name rayon-minio -p 9000:9000 -p 9090:9090 \
  -e MINIO_ROOT_USER=minio -e MINIO_ROOT_PASSWORD=miniostorage \
  -d minio/minio server /data --console-address :9090
```

## Database & Seeds
```bash
cd backend
npm run prisma:generate
npm run prisma:dev
npm run seed
```

## Run Services
```bash
# Backend
npm run start:dev

# Frontend (new terminal)
npm run dev
```
Open `http://localhost:3000` and execute a ticket checkout. Use the GSM emulator to simulate the confirmation:
```bash
node tools/gsm-emulator/send-sms.js "You have received RWF 8,000 from 0788***123. Ref RS-ORDER-123" --from=0788123123 --token=dev-token
```

Observe the backend logs for queue processing. The admin console at `/admin/sms` now proxies requests through the Next.js API
using your authenticated session cookie. If you need to inspect raw records, sign in via `/admin/login` and use the in-app tools
or Prisma Studio (`npx prisma studio`).

### Realtime gateway
- Socket.IO namespace lives at `<backend>/ws` and streams ticket confirmations, gate scans, donation status, and manual-review alerts.
- The frontend already subscribes and surfaces toast notifications, but you can attach any admin surface with `socket.io-client` to build richer dashboards.

### Gate & Wallet flows
- Steward gate UI lives at `/gate` and posts to `POST /tickets/verify-pass`. Supply `dryRun=true` while testing so passes remain active.
- Use the optional steward ID field to tag scans; the backend records entries in `GateScan`. Refresh the history panel to confirm `GET /tickets/gate/history` is capturing activity—the UI now proxies through `/admin/api/tickets/gate-history`, so make sure you are signed into `/admin/login` to satisfy the session + CSRF guard.
- Wallet dashboard (`/wallet`) calls `GET /wallet/summary` and `GET /wallet/transactions`. Provide a UUID tied to seeded data once users exist; for now you can create a dummy user in Prisma Studio and re-run the flow.
- Membership upgrade runs through `/membership`. After setting a user ID and selecting a plan, the screen triggers `POST /membership/upgrade` to generate a USSD code. When the GSM emulator posts the payment SMS, the membership activates automatically (status visible on refresh).
- Shop checkout is available at `/shop`. Add items to the cart, optionally provide contact info, and trigger `POST /shop/checkout`. Once the SMS emulator submits a confirmation with the matching amount, the order status updates to `confirmed`; verify via `GET /wallet/transactions?userId=...` or a direct DB query.
- Community feed lives at `/community`. Posts with suspicious keywords are flagged; refresh `/admin/community` (requires an authenticated admin session) to approve or remove flagged entries.
  - `GET /community/leaderboard?period=weekly` returns the top fans, powering the leaderboard card in the Community view (toggle between weekly/monthly).
- Fundraising page (`/fundraising`) starts `POST /fundraising/donate` flows. After dialing the USSD code, send a matching SMS via the emulator and confirm the donation appears in `/wallet` transactions (kind `donation`).
- Ticket transfers are available at `/tickets/transfer`. Owners generate a code via `POST /tickets/passes/initiate-transfer`; recipients redeem the code using `POST /tickets/passes/claim-transfer` to link the pass to their user ID.
- `GET /tickets/analytics` returns consolidated ticket KPIs (revenue, status breakdowns, match performance). The admin dashboard at `/admin/tickets` now calls `/admin/api/tickets/analytics`, which forwards the request with the active admin session and rejects it when CSRF headers/cookies are missing.
- Fans can review order history via `GET /tickets/orders?userId=...`, cancel pending orders with `POST /tickets/orders/:orderId/cancel`, and fetch shareable receipts using `GET /tickets/orders/:orderId/receipt?userId=...`. The Tickets screen surfaces these actions alongside the checkout flow.
- Manual reconciliation lives at `/admin/sms`: low-confidence parses appear under **Manual Review Queue** alongside pending payments. Select an SMS + payment pair and press *Attach* to confirm manually.
- Live telemetry dashboard lives at `/admin/realtime` (websocket namespace `/ws`). Use it to observe ticket confirmations, gate scans, manual-review events, and donation receipts in real time.
- A Workbox-powered service worker caches `/api/tickets/passes` responses; active passes remain visible (with the latest rotated QR tokens) even when the device briefly goes offline.
- Community endpoints:
  - `POST /community/posts/:postId/react` toggles reactions (like/cheer/love) per user.
  - `POST /community/posts/:postId/comments` stores quick replies; counts surface in the feed.
  - `GET /community/analytics` summarises posts/reactions/comments for the admin dashboard.
  - Posts return `riskTerms` (flagged keywords) so the UI can highlight moderation hints.
  - `GET /community/polls` fetches the latest fan polls with live vote totals.
  - `POST /community/polls` creates standalone polls (posts can attach them automatically).
  - `POST /community/polls/:pollId/vote` records or updates a fan's choice while keeping counts in sync.
  - The `/community` composer lets fans attach poll options; the feed surfaces poll cards with vote controls and results, and a **Fan Polls** section highlights recent questions.
  - `GET /community/missions` exposes the active quiz and prediction fixture shown on the Fan Missions card.
  - `POST /community/check-in`, `POST /community/quiz`, and `POST /community/prediction` award leaderboard points for mission completion.
  - Admin endpoints (`GET /community/admin/missions`, `POST /community/admin/quizzes`, `POST /community/admin/predictions`, and their `/close` variants) let operators publish new missions; manage them via `/admin/community/missions`.
  - `POST /community/check-in`, `POST /community/quiz`, and `POST /community/prediction` award points that feed the leaderboard; the Community view exposes quick actions for these missions.

### Mobile packaging
- See `docs/mobile/packaging.md` for Capacitor + TWA setup.
- Use `npm run cap:sync`, `npm run cap:android`, and `npm run cap:ios` after installing dependencies to open native projects.
