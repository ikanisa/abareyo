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

## Local Development Loop

1. Bootstrap dependencies: `pnpm install`.
2. Start Supabase locally: `supabase start`.
3. Apply migrations/seeds: `supabase migration up && supabase db seed`.
4. Run the dev server: `pnpm dev`.
5. Use the GSM emulator for payment tests: `node tools/gsm-emulator/send-sms.js "Paid RWF 25000 Ref XYZ"`.

If Supabase containers break, run `supabase stop && supabase start` then `supabase migration up` to resync.

## Feature Development Checklist

- Create feature branches using the `feature/<slug>` naming convention.
- Update or add Vitest coverage for new business logic.
- Run `pnpm lint`, `pnpm type-check`, and `pnpm test --coverage` before opening a PR.
- Document new environment variables in [`docs/env.md`](../env.md).

## Deployment Steps

1. Ensure CI is green (`pnpm lint`, `pnpm type-check`, `pnpm test --coverage`, `pnpm build`).
2. Run `node scripts/preflight.mjs` to verify environment parity.
3. Trigger deployment via `make deploy-staging` (staging) or `make deploy-production` (production).
4. Monitor the GitHub Actions workflow for completion.
5. Validate the deployment using `/healthz`, `/admin/realtime`, and the payments dashboard.

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
