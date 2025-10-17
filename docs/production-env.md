Production Environment & Secrets

> ℹ️ For the full Supabase admin authentication checklist (including seeding and troubleshooting), see [runbooks/admin-supabase-email-login.md](runbooks/admin-supabase-email-login.md).

Required runtime env vars

- Backend (NestJS)
  - SUPABASE_URL (Supabase project URL)
  - SUPABASE_SERVICE_ROLE_KEY (Supabase service role key)
  - APP_HOST, APP_PORT (optional; defaults 0.0.0.0:5000)
  - CORS_ORIGIN (comma-separated allowlist; no wildcard in prod)
  - BACKEND_BASE_URL (public URL of API)
  - DATABASE_URL (Postgres)
  - DATABASE_SHADOW_URL (optional for Prisma)
  - REDIS_URL
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
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase anonymous public key)
  - NEXT_PUBLIC_BACKEND_URL (points at /api gateway that fronts Nest API; must be an absolute HTTPS URL in hosted environments)
  - NEXT_PUBLIC_TELEMETRY_URL (optional override for telemetry beacons; defaults to `/api/telemetry/app-state`)
  - NEXT_PUBLIC_ENVIRONMENT_LABEL (optional ribbon)
  - NEXT_PUBLIC_ADMIN_SESSION_COOKIE (optional; default admin_session)

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
