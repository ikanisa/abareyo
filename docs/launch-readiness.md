# Launch Readiness Checklist

Use this checklist before pushing the Rayon Sports fan experience to production app stores or promoting a new web release. The steps complement `docs/mobile/packaging.md` and the architecture docs.

## 1. Source & Dependency Hygiene
- Ensure dependency tree resolves with `npm install --legacy-peer-deps` (temporary workaround until Capacitor peer conflicts are fixed). Commit the resulting `package-lock.json` if changes are expected.
- Confirm environment variables for production (`NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_TELEMETRY_URL`, plus any analytics tokens) are present in your deployment platform. `NEXT_PUBLIC_BACKEND_URL` must be an absolute HTTPS URL when configured in the hosting platform.
- Run `npm run lint` (no warnings tolerated) and `npm run test` locally. The latter performs the type-check plus unit suites.
- Enforce local quality gates by running `npm run setup:hooks` once; the repo-level pre-commit hook now executes `npm run lint` and `npm run test`.

## 2. CI Smoke Tests
Ensure your CI pipeline runs the following (in this order) on every release candidate:
1. `npm run lint`
2. `npm run test`
3. `npm test -- community`
4. `npm test -- tickets`
5. `npm run build`

> If CI cannot resolve Capacitor peer dependencies, pin `npm install --legacy-peer-deps` in the workflow until the dependency tree is updated.

## 3. Web Build & Offline Validation
- `npm run build`
- `npm run build:capacitor` (exports the static bundle to `dist/`).
- Manually open the Community view, then simulate offline mode to verify cached leaderboard/polls/missions render correctly.
- Confirm `/service-worker.js` registers and caches the expected routes (check DevTools → Application → Service Workers).

## 4. Native Shell Preparation
1. `npm run cap:sync`
2. `npm run cap:android` (Android Studio opens)
3. `npm run cap:ios` (Xcode opens)
4. Run platform smoke tests:
   - Android emulator/physical device: USSD dial from Tickets view, offline mode fallback, mission submissions.
   - iOS simulator/device: verify `tel:` opens dialer, check notification permission prompt, confirm app resumes gracefully from background.

If native projects cannot be synced locally (e.g., due to dependency conflicts), document the skip and run these steps on a workstation once resolved.

## 5. Telemetry & Observability
- Confirm `METRICS_TOKEN` is configured in the runtime and that `/metrics` responds with `401` when the token is absent.
- Verify `CORS_ORIGIN` is a comma-separated allow-list that matches the deployed web origins (no wildcard in production).
- Backend must accept `POST /api/telemetry/app-state` beacons (emitted from `app/providers.tsx`). Confirm logs/metrics record app state transitions when the Capacitor app foregrounds/backgrounds.
- Validate notification permission flow: deny once, ensure the console log is produced and UI handles disabled push gracefully.
- Confirm existing analytics dashboards receive community mission data (`adminMissionsOverview`).

## 6. Release Playbooks
### Android (Capacitor shell)
- Update app versionCode/versionName in `android/app/build.gradle`.
- Build signed bundle: Android Studio → Build → Generate Signed Bundle/APK.
- Upload `.aab` to Play Console → Internal testing. Attach release notes referencing mission/analytics changes.

### Android (TWA)
- `npx bubblewrap update` if manifest changed, then `npx bubblewrap build`.
- Upload to Play Console → Create Release → TWA track.
- Ensure `.well-known/assetlinks.json` matches the Play signing key.

### iOS
- Increment build number in Xcode.
- Archive → Distribute via App Store Connect (TestFlight first).
- Update App Store metadata highlighting offline support and mission cards.

## 7. Post-Launch Checklist
- Monitor telemetry dashboard for app-state events and API response times (missions, leaderboard, tickets).
- Verify service worker cache hit rate (Chrome DevTools or Cloudflare analytics).
- Confirm push/notification backlog (if disabled, note for stakeholders).
- Validate community mission completion metrics align with expected campaign.
- Schedule regression smoke test within 24 hours post-launch.

---
Keep this checklist updated as tooling changes. For packaging specifics, refer back to `docs/mobile/packaging.md`.
