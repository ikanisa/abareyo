# iOS Release Checklist

- [ ] Ensure bundle identifier/version increment aligns with TestFlight build numbers in Expo/Capacitor configuration (`app.json`).【bb9650†L2-L89】
- [ ] Generate updated provisioning profiles and certificates; upload to secure secret store (`APPLE_TEAM_ID`, `APPLE_APP_ID`, `APPLE_APP_SPECIFIC_PASSWORD`).
- [ ] Run `npm run test:native:ios` and `swift test` for `ios/Auth` package to confirm native modules pass CI.【f72421†L1-L141】【3e0275†L4-L22】
- [ ] Execute `npm run build:capacitor` followed by `npx cap sync ios` to refresh Xcode project assets before archiving.【55bf56†L1-L30】
- [ ] Produce signed IPA via `eas build --platform ios --profile production` (or Xcode archive) and notarize if distributing outside App Store.
- [ ] Populate `API_BASE_URL`/Supabase secrets in `xcconfig` or secure runtime storage; avoid embedding secrets in Info.plist.【a7a201†L24-L78】
- [ ] Update App Store Privacy Nutrition Labels to reflect telemetry and Supabase usage.
- [ ] Verify ATS policy enforces HTTPS and add exceptions explicitly if needed.
- [ ] Submit to TestFlight, run smoke tests on iPhone 12/15, and capture crash-free metrics ≥99.5% before public rollout.
