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
   - Run `npm run lint:pwa` to validate manifest/service worker checks before matchday deployment.

## Hourly Smoke (Automated)

Add the following command to the hourly GitHub Actions cron job:

```bash
npm run test:unit -- --run tests/unit/home-interactive-layer.test.tsx
```

This ensures the offline banner and onboarding modal interactions continue functioning as expected.

## Incident Response

1. **User reports blank home screen**
   - Ask for the Lighthouse trace or screenshot. If skeletons are stuck, confirm API availability and check for `503` responses on `/api/home`.
   - Review Vercel Edge logs for middleware rejects and ensure CSP policies are not blocking assets.
   - Toggle the `MAINTENANCE_MODE` feature flag in the admin dashboard if the outage persists for more than 10 minutes.
2. **Offline banner remains visible**
   - Confirm the fan is not on a captive portal. Ask them to open <https://captive.apple.com>.
   - Check for JavaScript errors in Sentry mentioning `navigator.onLine`. If present, redeploy after clearing caches via Vercel.
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

## Rollback Procedure (Frontend)

1. Trigger `npm run build` locally to confirm the last stable commit still builds.
2. Revert the offending deployment in Vercel dashboard (select previous deployment from history).
3. Run `npm run smoke:telemetry` and `npm run test:unit` to revalidate.
4. Post-mortem within 24 hours documenting cause, mitigation, and prevention in `docs/runbooks/post-incident/<date>.md`.
