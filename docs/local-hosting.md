# Local Hosting Guide (Mac-first)

This guide walks through running the admin PWA locally on a MacBook. It is
safe to adapt the same steps for Linux workstations and CI runners.

## Prerequisites
- Node.js 20.x (`nvm install 20 && nvm use 20`)
- Corepack (ships with Node 20)
- pnpm 9 (`corepack prepare pnpm@9.12.2 --activate`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Docker Desktop (optional, for local Supabase containers)

## Environment Files
1. Copy `.env.example` to `.env.local`.
2. Fill in:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<public-anon-key>"
   SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
   SITE_SUPABASE_URL="https://<project-ref>.supabase.co"
   SITE_SUPABASE_SECRET_KEY="<service-role-key>"
   NEXT_PUBLIC_BACKEND_URL="http://localhost:3000/api"
   NEXT_PUBLIC_ENVIRONMENT_LABEL="local"
   PORT=3000
   APP_ENV=local
   ```
3. Store server-only secrets (service role key, onboarding tokens, OpenAI
   key) outside the browser bundle. Never commit `.env.local` to git.
4. Use `scripts/env-sync-template.sh` when you need to emit a `.env.sync`
   bundle for Docker/Kubernetes secrets.

## Install & Build
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

## Start the App
```bash
PORT=3000 pnpm start
```
Visit <http://localhost:3000> in your browser. The admin PWA loads without
needing any proprietary hosting platform features. Leave the terminal open
while testing.

## Redis (OTP, Rate Limits, Queues)
- Bring up Redis alongside the frontend when exercising OTP flows or
  server-side rate limiting:
  ```bash
  docker compose up redis -d
  ```
- Point your environment at the local instance with
  `REDIS_URL="redis://localhost:6379"`.
- Use `redis-cli -u redis://localhost:6379 PING` to confirm the
  container is reachable before running the OTP unit tests.

## Supabase Notes
- `supabase start` launches a local stack. Use this when you need Postgres or
  Storage offline.
- `supabase db reset` reapplies migrations and seeds when schemas change.
- Supabase Storage can replace third-party blob/KV systems. The helper in
  `src/lib/storage.ts` (if present) should wrap uploads/downloads.
- Keep service role keys on the server. Client code must only use the anon key
  exposed via `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Reverse Proxy Prep
- The app expects to sit behind a TLS proxy later (Caddy, Nginx, or
  Cloudflare Tunnel).
- Configure the proxy to forward `X-Forwarded-*` headers and preserve `Secure`
  cookies.
- Document any additional origins in `CORS_ORIGIN` and
  `NEXT_PUBLIC_SITE_URL`.

## Troubleshooting
- Missing env vars: run `node config/validated-env.mjs` or
  `node scripts/check-frontend-env.mjs`.
- Backend offline: `node scripts/check-backend-endpoint.mjs` ensures the
  configured API URL responds.
- Build errors: rerun `pnpm build` and inspect `.next/trace` output for
  failing modules.

## Next Steps
- Automate preflight checks with `scripts/local-preflight.mjs`.
- Add your preferred reverse proxy to the docs once configured.
- Track local-only overrides in `.env.local` and keep `.env.example` aligned
  for teammates.
