Deploy Runbook (Supabase-first)

Images

- CI builds and pushes the web image to GHCR: `ghcr.io/<org>/<repo>-frontend:latest` and `:<SHA>`.
- Supabase Edge Functions are deployed from source using `pnpm supabase:functions deploy` (no separate backend image needed for auth/QR).

Database migrations

1. Ensure `SUPABASE_URL`, `SUPABASE_SECRET_KEY`/`SITE_SUPABASE_SECRET_KEY`, and `SUPABASE_PROJECT_REF` are set in the runtime environment.
2. Promote schema changes with the Supabase CLI:

   ```bash
   supabase db push
   supabase migration up
   supabase db seed
   ```

3. Deploy the QR/auth functions immediately after migrations so RLS changes apply before token validation:

   ```bash
   pnpm supabase:functions deploy qr-token event-checkin
   ```

4. Coordinate with Ops on the migration/function deployment order. Announce the planned window in the Ops channel, confirm who is on point to monitor the Supabase dashboard, and verify Postgres logs for new RLS denials during rollout.

Secrets & environments

- Staging and production environments must both include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `REALTIME_SIGNING_SECRET`, and `SUPABASE_AUTH_REDIRECT_URL` before promoting builds.
- Run `pnpm supabase:functions check-secrets` during deployment windows to confirm Vault/secret manager values are available to the function runtime.

Health

- Web: `/api/health` should return 200.
- Realtime/QR: Supabase logs should show successful channel auth for `ticket_passes` subscriptions; failures usually mean `REALTIME_SIGNING_SECRET` is missing or mismatched.

Rollback

1. Revert to previous image tags in the deployment workflow (`make deploy:rollback ENV=<env>`).
2. If a DB migration is incompatible, follow [`docs/runbooks/rollback.md`](rollback.md) to restore the database.
3. After every rollback or deploy, re-run OTP + QR smokes (`README.md#whatsapp-otp-smoke-tests` and a gate scan) before calling the release done.

