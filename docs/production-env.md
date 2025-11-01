Production Environment & Secrets

> ℹ️ For host-agnostic deployment guardrails, review the
> [Hosting Migration Playbook](hosting-migration.md) alongside the Supabase
> admin checklist in
> [runbooks/admin-supabase-email-login.md](runbooks/admin-supabase-email-login.md).

Required runtime env vars

- Backend (NestJS)
  - SUPABASE_URL (Supabase project URL)
  - SUPABASE_SECRET_KEY (Supabase secret key; legacy `SUPABASE_SERVICE_ROLE_KEY` still supported during migration)
  - APP_HOST, APP_PORT (optional; defaults 0.0.0.0:5000)
  - CORS_ORIGIN (comma-separated allowlist; no wildcard in prod)
  - BACKEND_BASE_URL (public URL of API)
  - DATABASE_URL (Postgres)
  - DATABASE_SHADOW_URL (optional for Prisma)
  - REDIS_URL
  - WHATSAPP_ACCESS_TOKEN (Meta Cloud token for OTP notifications)
  - WHATSAPP_PHONE_NUMBER_ID (WhatsApp sender number for OTP)
  - WHATSAPP_OTP_TEMPLATE (optional template override)
  - WHATSAPP_VERIFY_TOKEN (used by webhook verification handshake)
  - WHATSAPP_APP_SECRET (optional HMAC validation for webhook payloads)
  - METRICS_TOKEN (required in prod for /metrics)
  - ADMIN_SESSION_SECRET (required in prod)
  - FAN_SESSION_SECRET (required in prod)
  - ADMIN_SESSION_COOKIE (optional; default admin_session)
  - FAN_SESSION_COOKIE (optional; default fan_session)
  - S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL (if using object storage)
  - OPENAI_API_KEY, OPENAI_BASE_URL (if using onboarding agent features)
  - APP_ENABLE_CSP=1 (enable Helmet CSP in prod)

- Frontend (Next.js)
  - NEXT_PUBLIC_SUPABASE_URL (Supabase project URL)
  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase publishable key; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` supported for backwards compatibility)
  - NEXT_PUBLIC_BACKEND_URL (points at /api gateway that fronts Nest API; must be an absolute HTTPS URL in hosted environments)
  - NEXT_PUBLIC_TELEMETRY_URL (optional override for telemetry beacons; defaults to `/api/telemetry/app-state`)
  - NEXT_PUBLIC_ENVIRONMENT_LABEL (optional ribbon)
  - NEXT_PUBLIC_ADMIN_SESSION_COOKIE (optional; default admin_session)

- Supabase Edge Functions / Vault secrets
  - SITE_SUPABASE_URL (custom prefix required because Supabase reserves `SUPABASE_*`)
  - SITE_SUPABASE_PUBLISHABLE_KEY (publishable key shared with the frontend)
  - SITE_SUPABASE_SECRET_KEY (service/secret key used by edge functions)
  - Any additional provider secrets (`SMS_WEBHOOK_TOKEN`, `OPENAI_API_KEY`, etc.)

Live scores provider

- `/api/live/match/[id]` queries the Supabase RPC `live_match_snapshot` via the service-role client.
  - Ensure `SITE_SUPABASE_URL` and `SITE_SUPABASE_SECRET_KEY` are set in the runtime (or their `SUPABASE_*` aliases for local dev).
  - Add `{"live.scores": true}` (or enable the key in the feature flag dashboard) within `NEXT_PUBLIC_FEATURE_FLAGS` so the route hits the provider instead of the static fallback.
  - Deploy the `live_match_snapshot` RPC/view and keep it aligned with the expected payload shape (`timeline[]`, `stats`, `score`, `status`, `updated_at`). Missing data gracefully returns the fallback response.

Seed and migrations

- Run `npm --prefix backend ci`
- Generate client: `npx --prefix backend prisma generate`
- Apply migrations: `npm --prefix backend run prisma:migrate`
- Seed base data (optional admin user):
  - ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD_HASH (bcrypt), ADMIN_SEED_NAME
  - `npm --prefix backend run seed`

Health and protections

- Backend must reject unknown origins; verify CORS.
- `/metrics` returns 401 without Authorization: Bearer $METRICS_TOKEN.
- Check boot log for warnings/errors about session secrets.
