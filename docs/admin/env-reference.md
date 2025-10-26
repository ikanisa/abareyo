# Admin Environment Reference

This document complements the root `.env.example`. Use it as a deployment
checklist when wiring up the hosting platform, Supabase Vault, or local `.env.*.local`
overrides. Variables marked **_secret_** must never be committed to git.

## 1. Core Application

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Frontend | Canonical site URL used in metadata and redirects. |
| `NEXT_PUBLIC_ENVIRONMENT_LABEL` | Frontend | Badge in the admin shell (`dev`, `staging`, `prod`). |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | Base URL for admin API fetches. Must be absolute in production. |
| `INTERNAL_BACKEND_BASE_URL` | Server | Internal base URL for edge/runtime calls (use private load balancer if available). |
| `APP_LOG_LEVEL` | Backend | `debug`, `info`, `warn`, or `error`. Defaults to `info`. |
| `APP_ENABLE_CSP` | Frontend | `1` to enable the Content Security Policy header. |

## 2. Supabase

Configure *both* client and service credentials:

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Publishable key for end-user auth flows. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Optional alias for the publishable key (newer code paths). |
| `SITE_SUPABASE_URL` | Server | Mirrors the project URL for server helpers. |
| `SITE_SUPABASE_SECRET_KEY` | Server _secret_ | Service-role key used in API routes. |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Server _secret_ | Additional fallbacks for legacy scripts—keep them in sync. |
| `SUPABASE_ACCESS_TOKEN` | CLI _secret_ | Required for `supabase db push` / migrations. |
| `SUPABASE_DB_PASSWORD` | CLI _secret_ | Database password for local `psql` access. |

> **Tip:** set `NEXT_PUBLIC_*` keys in the hosting platform and duplicate the service-role key
in Supabase Vault for edge functions.

## 3. Sessions & Authentication

| Variable | Scope | Notes |
| --- | --- | --- |
| `ADMIN_SESSION_COOKIE` | Backend | Cookie name for admin sessions (default `admin_session`). |
| `ADMIN_SESSION_COOKIE_DOMAIN` | Backend | Recommended for production (`.example.com`). |
| `ADMIN_SESSION_SECRET` | Backend _secret_ | 32+ char random string for session encryption. |
| `ADMIN_SESSION_TTL_HOURS` | Backend | Defaults to 24 hours. |
| `FAN_SESSION_COOKIE`, `FAN_SESSION_COOKIE_DOMAIN`, `FAN_SESSION_SECRET`, `FAN_SESSION_TTL_HOURS` | Backend | Mirrors the admin session config for fan logins. |
| `ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD`, `ADMIN_DEFAULT_NAME` | Backend _secret_ | Bootstrap account for first-run environments. Remove/rotate after provisioning. |

## 4. Onboarding & AI Agent

| Variable | Scope | Notes |
| --- | --- | --- |
| `ONBOARDING_API_TOKEN` | API routes _secret_ | Bearer token checked by `/api/onboarding/*`. |
| `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN` | Frontend | Safe for client usage; used in browser fetches. |
| `ONBOARDING_ALLOW_MOCK` / `NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK` | Both | Set to `1` to allow mock responses during manual testing. |
| `AGENT_ID` | API routes | Defaults to `gikundiro-onboarding`; customise per environment. |
| `OPENAI_API_KEY` | Backend _secret_ | Needed for the onboarding assistant. |
| `OPENAI_BASE_URL`, `NEXT_PUBLIC_OPENAI_BASE_URL` | Both | Override if proxying OpenAI. |
| `OPENAI_ONBOARDING_MODEL` | Backend | Defaults to `gpt-4.1-mini`. |

## 5. Observability & Telemetry

| Variable | Scope | Notes |
| --- | --- | --- |
| `SENTRY_DSN` | Backend | Required for server-side error capture. |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend | Mirrors DSN for client reporting. |
| `SENTRY_TRACES_SAMPLE_RATE` | Both | Fraction between 0 and 1. |
| `SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | Frontend | Controls Replay sampling. |
| `SENTRY_REPLAYS_ERROR_SAMPLE_RATE` | Frontend | Replay sampling for error sessions. |
| `METRICS_TOKEN` | Backend | Auth token for internal metrics ingestion. |

## 6. Infrastructure (DB, Redis, Object Storage)

| Variable | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` / `DATABASE_SHADOW_URL` | Backend _secret_ | Primary / shadow Postgres URLs for Prisma, migrations, and Supabase CLI. |
| `REDIS_URL` | Backend _secret_ | Required for rate limiting and job queues. |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Backend _secret_ | Configure for MinIO/S3 uploads; leave empty if object storage is disabled. |

## 7. Payments & SMS

| Variable | Scope | Notes |
| --- | --- | --- |
| `MTN_MOMO_PAY_CODE`, `AIRTEL_MONEY_PAY_CODE` | Backend | MoMo pay codes displayed on receipts and reconciliation flows. |
| `SMS_WEBHOOK_TOKEN` | Backend _secret_ | Shared secret for inbound SMS webhooks. |
| `SMS_PARSE_CONFIDENCE_THRESHOLD` | Backend | Float value (default `0.65`) for classifier confidence. |
| `OPENAI_API_KEY` | Frontend (server) _secret_ | Required by the Admin SMS parser test endpoint at `/api/admin/sms/parser/test`. |

## 8. Feature Flags & Misc

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_FEATURE_FLAGS` | Frontend | JSON string consumed by the client bootstrap. |
| `FEATURE_FLAGS` | Backend | Legacy fallback for seed scripts. |
| `E2E_API_MOCKS` | Tests | Set to `1` when running Playwright with mocked APIs. |
| `CI` | CI | Auto-set in GitHub Actions/hosting platform; included here for transparency. |

## 9. Local Development Quickstart

Create `.env.local` (Next.js) and `backend/.env.local` (NestJS) with the values
you need. Example minimal front-end setup (store this file locally only):

```
APP_ENV=local
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT_LABEL=dev
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SITE_SUPABASE_URL=https://<project>.supabase.co
SITE_SUPABASE_SECRET_KEY=<service-role-key>
ONBOARDING_API_TOKEN=local-onboarding-token # Server-only secret
NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN=local-onboarding-token
OPENAI_API_KEY=sk-local-key # Server-only secret
```

Example backend overrides in `backend/.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rayon
REDIS_URL=redis://localhost:6379
ADMIN_SESSION_SECRET=change-me
FAN_SESSION_SECRET=change-me
MTN_MOMO_PAY_CODE=0700123456
AIRTEL_MONEY_PAY_CODE=0700123456
```

Run `npm run env:check` to verify the minimum set of variables is present
before booting the app.

> **Reminder:** never commit `.env.local` or `.env.production.local`. Use the
> secure storage documented in `docs/supabase/secret-rotation-plan.md` for
> staging/production secrets.
