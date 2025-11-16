# Web Runbook

This runbook documents how to develop, deploy, and operate the Next.js web application.

## Core Commands

| Purpose | Command |
| --- | --- |
| Start dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Serve production build | `pnpm start` |
| Lint | `pnpm lint` |
| Type-check | `pnpm type-check` |
| Unit tests with coverage | `pnpm test --coverage` |
| Coverage report only | `pnpm coverage` |
| Playwright smoke tests | `make e2e` |
| Deployment preflight | `node scripts/preflight.mjs` |
| Supabase function deploys | `pnpm supabase:functions deploy` |

## Local Development Loop

1. Bootstrap dependencies: `pnpm install`.
2. Copy `.env.example` to `.env.local` and populate Supabase auth + QR settings (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `REALTIME_SIGNING_SECRET`).
3. Start Supabase locally: `supabase start`.
4. Apply migrations/seeds: `supabase migration up && supabase db seed`.
5. Serve or deploy Edge Functions when testing auth/QR flows locally: `supabase functions serve qr-token --env-file .env.local` (repeat for `event-checkin` if you need gate scans).
6. Run the dev server: `pnpm dev`.
7. Use the GSM emulator for payment tests: `node tools/gsm-emulator/send-sms.js "Paid RWF 25000 Ref XYZ"`.

If Supabase containers break, run `supabase stop && supabase start` then `supabase migration up` to resync.

## Auth & QR smokes

- OTP: follow the WhatsApp curl smoke in [`README.md`](../../README.md#whatsapp-otp-smoke-tests) after setting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`.
- QR channel auth: with `REALTIME_SIGNING_SECRET` set, deploy the `qr-token` function (`pnpm supabase:functions deploy qr-token`) and validate gate scans against `/api/tickets/passes` while watching the Supabase Realtime logs for signature failures.

## Feature Development Checklist

- Create feature branches using the `feature/<slug>` naming convention.
- Update or add Vitest coverage for new business logic.
- Run `pnpm lint`, `pnpm type-check`, and `pnpm test --coverage` before opening a PR.
- Document new environment variables in [`docs/env.md`](../env.md).

## Deployment Steps

1. Ensure CI is green (`pnpm lint`, `pnpm type-check`, `pnpm test --coverage`, `pnpm build`).
2. Run `node scripts/preflight.mjs` to verify environment parity.
3. Run `pnpm supabase:functions check-secrets` to ensure `REALTIME_SIGNING_SECRET` + `SITE_SUPABASE_*` are available before deploying auth/QR changes.
4. Trigger deployment via `make deploy-staging` (staging) or `make deploy-production` (production).
5. Monitor the GitHub Actions workflow for completion.
6. Validate the deployment using `/healthz`, `/admin/realtime`, and the payments dashboard.

## Observability

- Sentry DSN is configured via environment variables. Confirm release tags match git SHA after each deploy.
- Grafana dashboards live in `docs/grafana/`; import `backend-overview.json` for server metrics.
- Prometheus alerts feed into Slack #ops-alerts.

## Rollback

See [`docs/release.md`](../release.md#rollback-procedures) for platform-wide steps. For web-only rollbacks:

```bash
make deploy:rollback ENV=staging
# or
make deploy:rollback ENV=production
```

After rolling back, confirm the previous release is healthy via `/healthz` and Sentry.

## Incident Response

- Follow [`docs/runbooks/incident-response.md`](incident-response.md) for triage.
- Coordinate with the on-call engineer and document findings in the incident report template.

## Contacts

- **Web Lead**: @web-lead
- **Release Manager**: @release-manager
- **On-call Engineer**: Refer to [`docs/runbooks/on-call-enablement-checklist.md`](on-call-enablement-checklist.md)
