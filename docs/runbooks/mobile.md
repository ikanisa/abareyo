# Mobile Runbook

This runbook covers the Capacitor-based mobile shells (Android and iOS) for the Rayon Sports Digital Platform.

## Prerequisites

- Node.js 20 (matches `.nvmrc`)
- Capacitor CLI (`pnpm dlx @capacitor/cli@5 cap doctor` to verify)
- Android Studio with SDK 34+, Xcode 15+
- Access to the Apple and Google developer accounts

## Local Development

1. Install dependencies and sync Capacitor:
   ```bash
   pnpm install
   pnpm cap:sync
   ```
2. Generate platform assets:
   ```bash
   pnpm dlx cordova-res
   pnpm dlx @bubblewrap/cli init # for TWA packaging (optional)
   ```
3. Open native projects:
   ```bash
   pnpm cap:android
   pnpm cap:ios
   ```
4. Configure `.env.mobile.local` (copy `.env.example`). Use the same Supabase credentials as web but ensure `NEXT_PUBLIC_ENVIRONMENT_LABEL=mobile-local`.
5. Run the PWA locally (`pnpm dev`) and ensure device simulators connect to <http://localhost:3000> via the network bridge.

## Debugging

- Use Chrome DevTools (`chrome://inspect`) for Android webviews.
- Use Safari's "Develop" menu for iOS webviews.
- Enable verbose logging by setting `MOBILE_DEBUG_LOGGING=1` in `.env.mobile.local`.
- Inspect network requests via the Supabase dashboard when troubleshooting payment confirmation delays.

## Release Pipeline

1. Update version numbers in `app.json` and `android/app/build.gradle` / `ios/App/App.xcodeproj`.
2. Run the release build:
   ```bash
   pnpm build
   pnpm cap copy
   pnpm cap sync
   pnpm cap:android --prod
   pnpm cap:ios --prod
   ```
3. For Android:
   - Generate an `aab` via Android Studio (`Build > Generate Signed Bundle`).
   - Upload to Google Play Console internal testing track.
4. For iOS:
   - Archive the build in Xcode and upload via Transporter.
   - Create TestFlight release and wait for review.
5. Tag the release (`git tag mobile-vX.Y.Z && git push origin mobile-vX.Y.Z`).
6. Update the changelog in `changelogs/mobile.md` and note the rollout plan.

## Post-Release Checklist

- Monitor Crashlytics/Sentry mobile dashboards for regressions.
- Validate push notification enrollment (if enabled).
- Confirm payments still reconcile by running the smoke tests in [`docs/payments-policy.md`](../payments-policy.md#reconciliation--auditing).

## Rollback

- Unpublish or halt staged rollouts in Google Play Console/TestFlight.
- Revert to the previous git tag and rerun the release pipeline above.
- Document the rollback in [`docs/release.md`](../release.md#rollback-procedures) and notify stakeholders in the #mobile channel.

## Contacts

- **Mobile Lead**: @mobile-lead (Slack)
- **Release Manager**: @release-manager
- **On-call Engineer**: See [`docs/runbooks/on-call-enablement-checklist.md`](on-call-enablement-checklist.md)
