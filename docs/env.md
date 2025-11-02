# Environment Reference

This guide centralises the environment configuration for the Rayon Sports Digital Platform across local, staging, and production deployments. It complements [`docs/production-env.md`](production-env.md) with practical setup steps, validation commands, and secret management policies.

## Environment Matrix

| Environment | Target | Env File | Key Commands | Notes |
| --- | --- | --- | --- | --- |
| Local | Individual developer workstations | `.env.local` | `pnpm dev`, `supabase start` | Supabase CLI project spins up Postgres, storage, and realtime emulators.
| CI | GitHub Actions `build` workflow | GitHub secrets | `pnpm lint`, `pnpm type-check`, `pnpm test --coverage`, `pnpm build` | Secrets injected via repository/environment configuration; no database migrations run automatically.
| Staging | Long-lived QA environment | `.env.staging` | `make deploy-staging`, `supabase functions deploy --project-ref <ref>` | Mirrors production but points to staging Supabase project and SMS sandbox credentials.
| Production | Vercel/Supabase-backed runtime | `.env.production`, K8s/Secrets Manager | `make deploy-production`, `supabase secrets set` | Immutable build artifacts. Secrets stored in platform-specific vaults.

## Required Variables

Start from `.env.example` for local work and `.env.production.example` for staged deployments. The critical variables are:

- **Supabase**: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_PROJECT_REF`
- **Application**: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_ENVIRONMENT_LABEL`, `APP_ENABLE_CSP`
- **Payments & SMS**: `SMS_WEBHOOK_TOKEN`, `SMS_INGEST_TOKEN`, `MOMO_WEBHOOK_SECRET`, `USSD_CALLBACK_SECRET`
- **Observability**: `SENTRY_DSN`, `LOGFLARE_API_KEY`, `PROM_PUSH_GATEWAY_URL`

Refer to [`docs/payments-policy.md`](payments-policy.md#required-secrets) for payment-rail specific credentials.

## Local Setup Checklist

1. Copy `.env.example` to `.env.local` and populate the Supabase keys printed by `supabase start`.
2. Run `pnpm env:lint` (alias for `node scripts/preflight.mjs --env-only`) to ensure required variables are present.
3. When switching between staging and production projects, create separate files (`.env.staging.local`, `.env.prod.local`) and use `direnv` or `asdf env` to swap contexts safely.
4. Never commit secrets—`.env.*` files are gitignored by default.

## Secret Management Policy

- **Local**: Managed manually in `.env.local`. Rotate tokens whenever you run `supabase start` or receive new SMS sandbox credentials.
- **Staging**: Store in the staging namespace of your secret manager (e.g., Doppler, 1Password Connect). Access is limited to QA engineers and release managers.
- **Production**: Inject via Vercel environment variables or Kubernetes secrets. Keys must be base64 encoded when stored in K8s manifests. All updates require a two-person review and should be accompanied by a [deployment checklist](../DEPLOYMENT_CHECKLIST.md) run.
- **Rotation**: Document every rotation in the `infra/secret-rotations.log` file and notify the on-call channel.

## Validation Commands

```bash
# Sanity check environment completeness
pnpm env:lint

# Run Supabase connectivity probe (requires SUPABASE_* variables)
pnpm supabase:health

# Confirm Edge Function secrets before deploying
pnpm supabase:functions check-secrets
```

## Troubleshooting

- **Missing or invalid Supabase keys**: Run `supabase status` to ensure the local containers are running. If not, restart with `supabase stop && supabase start`.
- **CI failing due to env mismatch**: Inspect the failed job logs; the preflight step prints missing variables. Update repository secrets and rerun the workflow.
- **Vercel preview lacking secrets**: Use the Vercel CLI to sync (`vercel env pull .env.preview.local`) and redeploy.

For more detail on infrastructure-specific configuration, see [`docs/runbooks/deploy.md`](runbooks/deploy.md) and [`docs/release.md`](release.md#environment-sign-off).
