# Supabase Email Login for GIKUNDIRO Admin

This runbook documents how to finish configuring the existing Supabase-powered login flow for the admin panel. The frontend login page already signs into Supabase and exchanges the access token with the backend session endpoint; the remaining tasks are environment configuration, seeding an admin record, and (optionally) enabling a magic-link experience.

## 1. Required environment variables

The login page instantiates a Supabase browser client and forwards the resulting access token to the backend session exchange. Both surfaces must point at the same Supabase project and share a backend base URL.

| Variable | Surface | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend (hosting platform) | Supabase project URL used by the login form client.【F:app/admin/(auth)/login/page.tsx†L14-L37】 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend (hosting platform) | Publishable key used to call `supabase.auth.signInWithPassword` (legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` still supported).【F:app/admin/(auth)/login/page.tsx†L14-L46】 |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend (hosting platform) | Override for the API base URL; defaults to `/api` when unset.【F:app/admin/(auth)/login/page.tsx†L16-L71】 |
| `SUPABASE_URL` | Backend (NestJS) | Supabase project URL used by the service-role client that verifies the token and reads admin users.【F:backend/src/modules/admin/auth/supabase-admin-auth.service.ts†L10-L47】 |
| `SUPABASE_SECRET_KEY` | Backend (NestJS) | Secret key required for `supabase.auth.getUser` and querying `admin_users` (legacy `SUPABASE_SERVICE_ROLE_KEY` still supported).【F:backend/src/modules/admin/auth/supabase-admin-auth.service.ts†L10-L47】 |
| `ADMIN_SESSION_SECRET`, `FAN_SESSION_SECRET`, etc. | Backend (NestJS) | Secrets for signing session cookies. See [production-env.md](../production-env.md) for the complete list.【F:docs/production-env.md†L6-L33】 |
| `ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD`, `ADMIN_DEFAULT_NAME` | Backend (NestJS) & Frontend | Fallback credentials used to auto-bootstrap an admin account and service the Supabase login form (`bosco@ikanisa.com` / `MoMo!!0099`).【F:backend/src/modules/admin/auth/admin-auth.service.ts†L62-L119】 |

### Hosting platform configuration

1. Open *Project Settings → Environment Variables*.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with values from **Project Settings → API** in the Supabase dashboard.
3. Add `NEXT_PUBLIC_BACKEND_URL` pointing to the deployed backend (for example `https://api.gikundiro.com`).
4. Redeploy the Next.js app so the new variables are available to the login page.

### Backend configuration

1. In your backend host (Fly.io, Render, etc.), set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) using the same values as above.
2. Ensure session secrets (`ADMIN_SESSION_SECRET`, `FAN_SESSION_SECRET`, and related cookie names) match the production checklist in [production-env.md](../production-env.md).
3. Restart the backend deployment to load the new secrets.

## 2. Seed an admin user

The Supabase login flow requires a matching row in the `admin_users` table. Seed an administrator before attempting to sign in:

1. In the Supabase SQL editor, ensure the table exists:
   ```sql
   create table if not exists public.admin_users (
     id uuid primary key default gen_random_uuid(),
     email text not null unique,
     display_name text,
     password_hash text,
     status text not null default 'active',
     last_login timestamptz
   );
   ```
2. If `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD` are set (see `.env`), the first successful login automatically seeds `admin_users` and the corresponding roles. Otherwise, manually create a Supabase auth user for the admin email via **Auth → Users** (or a one-off script using `auth.signUp`).
3. Insert an `admin_users` row with the same email and `status = 'active'` if you are not using the default bootstrap flow.
4. Optional: set `password_hash` if you also plan to use the legacy NestJS-only login endpoint (`/admin/auth/login`).

You can automate the above locally or in CI by providing `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD_HASH`, and `ADMIN_SEED_NAME` when running `npm --prefix backend run seed`.【F:backend/prisma/seed.ts†L8-L120】

## 3. Email + password sign-in flow

With configuration and seed data in place, the existing login page works without code changes:

1. The form collects the admin email and password.【F:app/admin/(auth)/login/page.tsx†L49-L109】
2. Submission calls `supabase.auth.signInWithPassword({ email, password })`.【F:app/admin/(auth)/login/page.tsx†L40-L61】
3. On success the page POSTs the access token to `/admin/auth/supabase`, which the backend verifies and converts into a signed session cookie.【F:app/admin/(auth)/login/page.tsx†L63-L88】【F:backend/src/modules/admin/auth/admin-auth.controller.ts†L21-L57】
4. The frontend signs out of Supabase (leaving the backend session active) and redirects to `/admin`.【F:app/admin/(auth)/login/page.tsx†L90-L105】

## 4. Optional magic-link (passwordless) variant

To adopt a passwordless flow, replace the password submission with `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '<site>/admin/login' } })`. After the user confirms the email, Supabase redirects with an `access_token` in the URL. Reuse the same `/admin/auth/supabase` exchange by reading the token from the query string and POSTing it to the backend. No backend changes are required because the controller already accepts any valid Supabase access token.【F:backend/src/modules/admin/auth/admin-auth.controller.ts†L21-L57】

## 5. Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| "Supabase configuration is missing." | Frontend is missing one or both Supabase env vars. | Verify the hosting platform variables for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are populated and redeploy.【F:app/admin/(auth)/login/page.tsx†L34-L39】 |
| "Supabase did not return an access token." | Supabase rejected the credentials or the email is unconfirmed. | Confirm the email/password and check the user status in Supabase Auth.【F:app/admin/(auth)/login/page.tsx†L48-L61】 |
| `Admin user not found` / `Admin user is disabled` | Backend could not find an active `admin_users` row. | Insert or activate the admin in Supabase using the steps above.【F:backend/src/modules/admin/auth/supabase-admin-auth.service.ts†L49-L123】 |
| `Invalid Supabase access token` | Backend cannot validate the token (secret key missing or revoked). | Rotate `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) and redeploy the backend.【F:backend/src/modules/admin/auth/supabase-admin-auth.service.ts†L24-L75】 |

Once these steps are complete, Supabase email/password authentication is fully wired end-to-end for the GIKUNDIRO admin panel.
