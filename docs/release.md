# Release Management Guide

This guide defines how we plan, validate, and ship releases across web, mobile, and backend surfaces.

## Cadence

- **Web**: Continuous delivery—deploy on merge when quality gates pass.
- **Mobile (Capacitor shells)**: Biweekly sprint releases aligned with app store review windows.
- **Edge Functions**: Deploy alongside web releases when schema or payment automation changes land.

## Quality Gates

All release candidates must satisfy the following before requesting approval:

| Check | Command | Threshold |
| --- | --- | --- |
| Static analysis | `pnpm lint` | No warnings promoted to errors |
| Type safety | `pnpm type-check` | Pass |
| Unit tests | `pnpm test --coverage` | ≥ 90% statements, 90% branches, 90% lines |
| End-to-end smoke | `make e2e` | Pass key flows (auth, payments, admin moderation) |
| Build parity | `pnpm build` | Pass |

Coverage thresholds are enforced in Vitest (`vitest.config.ts`) and verified automatically in CI.

## CI Pipeline

GitHub Actions orchestrates the following jobs:

1. **`lint-type-test`** – Runs linting, type checking, unit tests with coverage, and uploads the coverage summary artifact.
2. **`build`** – Generates the production bundle and archives `.next/`. Fails if environment variables are missing.
3. **`preview`** – Optional; publishes the artifact to the staging deployment target.
4. **`edge-functions`** – Deploys modified Supabase functions when the `/supabase/functions/**` tree changes.

CI must be green before a PR can merge. Preview deploys auto-run for branches prefixed with `feature/` or `release/`.

## Release Checklist

1. Confirm target scope in the sprint board; ensure related tickets are in the "Ready to Release" column.
2. Run local validation commands:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test --coverage
   pnpm build
   ```
3. Update changelog entries under `changelogs/` (one per package/app).
4. Coordinate with design/QA for sign-off.
5. Submit PR with:
   - Summary of user-facing changes
   - Links to validation output and Lighthouse report (if UI changes)
   - Screenshots or videos for major UI adjustments
6. After merge, trigger the deployment workflow (`make deploy-staging` or `make deploy-production`).

## Environment Sign-Off

- Verify environment variables using `pnpm env:lint` and cross-check against [`docs/env.md`](env.md).
- Ensure Supabase migrations have been applied (`supabase db push` or `supabase migration up`).
- Confirm payment secrets per [`docs/payments-policy.md`](payments-policy.md#required-secrets).

## Rollback Procedures

1. **Web (Vercel/K8s)**
   - Use `make deploy:rollback ENV=<staging|production>` to redeploy the last known good artifact.
   - Confirm the rollback by hitting the `/healthz` endpoint and verifying Sentry release markers.
2. **Supabase Edge Functions**
   - Run `supabase functions deploy <name> --project-ref <ref> --import-map supabase/functions/import_map.json --rollback`.
   - Disable problematic triggers in the Supabase dashboard until a fix ships.
3. **Mobile**
   - Unpublish staged builds in Google Play Console/TestFlight.
   - Revert to the previous tag in the Capacitor repo and rebuild using the steps in [`docs/runbooks/mobile.md`](runbooks/mobile.md#release-pipeline).

Document every rollback in `DEPLOYMENT_AUDIT_SUMMARY.md` with root cause and remediation plan.

## Post-Release Monitoring

- Monitor the `/admin/realtime` dashboard and Supabase logs for errors.
- Review Sentry for new issues tagged with the current release.
- Confirm payment confirmations continue to process (check `sms-ingest` function logs).

## Related Documents

- [`docs/runbooks/web.md`](runbooks/web.md)
- [`docs/runbooks/mobile.md`](runbooks/mobile.md)
- [`docs/runbooks/rollback.md`](runbooks/rollback.md)
- [`docs/security.md`](security.md)
- [`docs/payments-policy.md`](payments-policy.md)
