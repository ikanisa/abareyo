# Supabase & Platform Secret Map (Phase 1)

Use this checklist when copying secrets from local `.env*` files into managed stores (hosting platform env — formerly Vercel, Supabase Vault, GitHub Actions). Keep values out of git — these entries describe where the live secret must live and who consumes it.

> **Note:** Legacy mentions of "Vercel" in examples/commands highlight the previous hosting provider. Substitute your current hosting platform when provisioning secrets.

| Secret | Primary store | Consumers | Notes |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Vault (`supabase secrets set`) & hosting platform (server-side) | Backend NestJS, admin API routes, edge functions | Rotate via Supabase dashboard → API → Service key. Do **not** expose to browser bundles. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Hosting platform (Production/Preview/Dev) | Next.js frontend, client SDKs | Safe for client exposure, but keep consistent across environments. |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Hosting platform & Supabase Vault | Backend + frontend | Must match `https://paysnhuxngsvzdpwlosv.supabase.co`. |
| `ADMIN_SESSION_SECRET` | Hosting platform → Backend | NestJS admin session cookies | Required in prod; rotate quietly with cookie invalidation. |
| `FAN_SESSION_SECRET` | Hosting platform → Backend | NestJS fan session cookies | Required in prod. |
| `ADMIN_API_TOKEN` | Hosting platform → Backend | Protected admin API jobs (if used) | Remove if unused; otherwise document issuance. |
| `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD` | 1Password (not in env after bootstrap) | One-time bootstrap for admin login | After first login rotate + delete from env. |
| `METRICS_TOKEN` | Hosting platform → Backend | `/metrics` endpoint | Needed to protect Prometheus scrape.
| `SMS_WEBHOOK_TOKEN` | Supabase Vault & hosting platform | SMS ingest webhook | Keep in sync with telecom provider. |
| `OPENAI_API_KEY` | Supabase Vault & hosting platform | Onboarding agent | Replace with org-wide key; optional `OPENAI_BASE_URL`. |
| `MTN_MOMO_PAY_CODE`, `AIRTEL_MONEY_PAY_CODE` | Supabase Vault | Payments flows | Mapped in backend config. |
| `TICKET_PERK_THRESHOLD` | Supabase Vault | `issue_ticket_perk` function | Controls perk award trigger (default 50,000). |
| `REDIS_URL` | Hosting platform | Admin login rate limiter | Required to avoid in-memory fallback. |
| `DATABASE_URL` / `DATABASE_SHADOW_URL` | Supabase (managed by platform) | Prisma + backend | Prod values managed by Supabase; shadow only for CI/local. |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Hosting platform | Media uploads | Skip if Supabase Storage used exclusively. |
| `JWT_SECRET` | Hosting platform | Supabase Edge Functions / Next Auth (if applicable) | Rotate alongside auth token TTL change. |
| `REALTIME_SIGNING_SECRET` | Supabase Vault | Supabase Realtime | Required when enabling channel auth. |
| `ANALYTICS_WRITE_KEY` | Hosting platform | Client telemetry | Replace placeholders before enabling analytics. |
| `APP_ENABLE_CSP` | Hosting platform | Backend Fastify Helmet | Set to `1` in prod to activate CSP. |
| `NEXT_PUBLIC_BACKEND_URL` | Hosting platform | Frontend API proxy | Must be absolute HTTPS in prod (e.g. `https://api.example.com`). |
| `NEXT_PUBLIC_ADMIN_SESSION_COOKIE`, `ADMIN_SESSION_COOKIE` | Hosting platform | Cookie naming | Optional overrides; defaults fine. |

## Rotation Playbook (no key swap executed yet)
1. Export current secrets from the hosting platform & Supabase (use platform CLI/API; legacy command `vercel env pull` shown for history) alongside `supabase secrets list`.
2. Generate new values (Supabase dashboard for publishable/service keys; `openssl rand -hex 32` for session secrets).
3. Update hosting platform Production → Preview → Development, then Supabase Vault, using the map above.
4. Redeploy backend (platform deploy pipeline or CI; legacy `vercel deploy` noted for reference) so new env vars take effect.
5. Validate:
   - Admin login (service client) succeeds.
   - Fan session flows use new cookie secret.
   - `/metrics` requires the updated token.
   - Edge functions read secrets via `supabase secrets list`.
6. Revoke old keys in Supabase dashboard / providers.

Keep this file aligned with `docs/production-env.md` whenever env vars change.
