# Operations Runbook

This runbook outlines the checks the Rayon Sports digital team should perform every matchday and during routine operations to ensure the fan experience stays healthy.

## Daily Checklist (Matchday -4h to +2h)

1. **Status dashboards**
   - Open Grafana dashboard `docs/grafana/backend-overview.json` and confirm API latency P95 < 400ms.
   - Check Sentry `production` project for new errors introduced within the last 12 hours.
2. **Realtime transport**
   - Visit `/admin/realtime` and confirm websocket connection status is `connected` and receiving heartbeats every 30 seconds.
   - Run `npm run smoke:telemetry` (see below) to verify app-state telemetry is ingested without validation errors.
3. **Payments + Wallet**
   - Trigger a ₣1 test top-up in the staging wallet via `/admin/wallet`. Confirm ledger write and Socket.IO broadcast.
   - Review Supabase `wallet_transactions` table for stuck `pending` entries older than 10 minutes.
4. **Content freshness**
   - Ensure the home feed has at least one current story, live ticker item, and fixture. If not, coordinate with media team or rely on new empty/offline states shipped in P3.
5. **PWA readiness**
   - Run `npm run lint:pwa` to build the app and execute Lighthouse PWA assertions, blocking on the `service-worker` and `installable-manifest` checks before matchday deployment.
6. **Offline cache health**
   - Load <http://localhost:3000> once while online, then toggle Chrome DevTools to **Offline** and refresh. Verify the home feed and missions show the offline banner and cached content rather than blank tiles.
   - Inspect `localStorage.getItem("home-surface-cache-v1")` to confirm the cache timestamp updated within the last 24 hours.

## Automated Checks (Managed Schedules)

The `.github/workflows/managed-schedules.yml` workflow now orchestrates all
recurring automation:

- **Synthetic probes** (`observability_probes` job) run every 10 minutes against
  production (and any staging environment configured via manual dispatch).
- **Security scans** execute nightly at 03:00 UTC via the `security_scans` job.
- **Data retention maintenance** calls Supabase cleanup helpers nightly at 23:30
  UTC and records results in `public.job_run_audit`.

To experiment with new automated smoke checks (e.g. running
`npm run test:unit -- --run tests/unit/home-interactive-layer.test.tsx`), clone
the repository, update the managed workflow locally, and dispatch it with
`run_observability_probes=true` while targeting the desired environment. Submit
the change through code review so it lands alongside the other scheduled tasks.

## Incident Response

1. **User reports blank home screen**
   - Ask for the Lighthouse trace or screenshot. If skeletons are stuck, confirm API availability and check for `503` responses on `/api/home`.
   - Review hosting platform edge/runtime logs for middleware rejects and ensure CSP policies are not blocking assets.
   - Toggle the `MAINTENANCE_MODE` feature flag in the admin dashboard if the outage persists for more than 10 minutes.
2. **Offline banner remains visible**
   - Confirm the fan is not on a captive portal. Ask them to open <https://captive.apple.com>.
   - Check for JavaScript errors in Sentry mentioning `navigator.onLine`. If present, redeploy after clearing caches via the hosting platform.
3. **Empty state fallback triggered unexpectedly**
   - Inspect the corresponding config in `app/_config/home.ts` and ensure CMS sync jobs populated the feed.
   - If data is intentionally empty (e.g., between seasons), update copy in `EmptyState` component to provide guidance.

## Manual Smoke Commands

```bash
# Telemetry ingest smoke
npm run smoke:telemetry

# Accessibility sweep on home
npx axe http://localhost:3000 --tags wcag2a,wcag2aa
```

Document results in `reports/operations-log.md` with timestamp, operator, and actions taken.

## Admin SMS Parser Test Endpoint

- The admin parser test route is disabled by default. To enable in staging, set:
  - `ADMIN_SMS_PARSER_TEST_ENABLED=1`
  - Optional rate config: `ADMIN_SMS_PARSER_TEST_RATE_LIMIT` (default 10),
    `ADMIN_SMS_PARSER_TEST_WINDOW_MS` (default 60000).
- The endpoint requires `OPENAI_API_KEY` on the Next.js server to call the
  Responses API. In Kubernetes, this is injected via `backend-secrets` and
  exposed to the frontend deployment (`k8s/frontend-deployment.yaml`).
- When enabled, the route responds with `X-RateLimit-*` headers and `429` on
  excessive calls; consider temporarily raising limits during load testing.

## Offline Cache Validation (Detailed)

1. Visit the fan home experience while connected to the network and wait for the hero, feed, and missions to render.
2. In DevTools, open **Application → Storage** and ensure `home-surface-cache-v1` contains a JSON payload with `meta.generatedAt` no older than 24 hours.
3. Switch DevTools network throttling to **Offline** and refresh the page. Confirm:
   - The top offline banner from `HomeInteractiveLayer` announces the state with `aria-live="assertive"`.
   - The **Latest** feed shows the cached stories with the inline offline card and provides a retry button.
   - The **Play & Earn** missions render with the offline card and cached progress states.
4. Return to **Online** mode and click **Retry now** in the feed to ensure fresh data loads and the offline banners disappear automatically.

## Rollback Procedure (Frontend)

1. Trigger `npm run build` locally to confirm the last stable commit still builds.
2. Revert the offending deployment in the hosting platform dashboard (select previous deployment from history).
3. Run `npm run smoke:telemetry` and `npm run test:unit` to revalidate.
4. Post-mortem within 24 hours documenting cause, mitigation, and prevention in `docs/runbooks/post-incident/<date>.md`.
