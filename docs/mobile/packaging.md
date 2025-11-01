# Mobile Packaging Guide (Capacitor + TWA)

## Overview
We ship the Rayon Sports PWA inside native shells so supporters can install from the Play Store and App Store while preserving one web codebase.

This document captures the baseline setup; finish the remaining steps on a workstation with Android Studio and Xcode once dependencies are available.

## Pre-requisites
- Node.js 20+
- Capacitor CLI (`npx cap`) – already declared in `package.json`
- Android Studio with SDK 34+
- Xcode 15+ (macOS) for iOS build
- Java 17 and Gradle (bundled with Android Studio)

## Initial Sync (after installing deps)
```bash
npm install
npm run build:capacitor
npx cap add android
npx cap add ios
npx cap sync
```

> The repo currently cannot add native platforms while offline. Run the above once network access is restored. The `capacitor.config.ts` file points to the Vite `dist` folder.

## Android Options
### 1. Capacitor Android
- Generated under `android/`
- Update `android/app/src/main/AndroidManifest.xml` to include:
  - `<uses-permission android:name="android.permission.INTERNET" />`
  - Intent filters for `https://fan.rayonsports.rw` custom domain once assigned
- Configure Splash screen assets via `cordova-res android --skip-config --copy`
- Enable USSD `tel:` links by setting `android:usesCleartextTraffic="true"` for dev builds and `<intent-filter>` with `ACTION_DIAL`
- Build: `npx cap open android`

### 2. Trusted Web Activity (TWA)
Use Bubblewrap to create a Play-ready TWA that points to the hosted PWA.
```bash
npx bubblewrap init --manifest=https://<your-domain>/manifest.json
npx bubblewrap build
```
- Host Digital Asset Links at `https://<domain>/.well-known/assetlinks.json`
- Sign with Play Store key or upload certificate to Play Console internal test track

## iOS Capacitor
- After `npx cap add ios`, open the workspace:
```bash
npx cap open ios
```
- In Xcode:
  - Set bundle identifier `com.rayonsports.fanapp`
  - Enable associated domains when the production domain is ready
  - Under `Info.plist`, add `LSApplicationQueriesSchemes` entry for `tel`
  - Configure the Splash screen by replacing assets in `ios/App/App/Assets.xcassets`
- Build for TestFlight using Xcode Archive; upload via Transporter

## Runtime Considerations
- `tel:` links automatically open the dialer for USSD; Capacitor wraps this behaviour. Add user guidance in the native shells if iOS blocks direct dial.
- The web bundle now listens for `CapacitorApp.addListener('appStateChange')` to emit telemetry beacons (`/api/telemetry/app-state`); ensure the backend accepts these once analytics go live.
- Notification permission is requested on first launch. If the user denies it, push-only features remain disabled and are logged to the console for support teams.
- Push notifications can be added later via Capacitor Push plugin once backend support exists.

## Scripts
Recommended additions (run after installing dependencies):
- `npm run cap:sync` → `npm run build:capacitor && npx cap sync`
- `npm run cap:android` → `npm run cap:sync && npx cap open android`
- `npm run cap:ios` → `npm run cap:sync && npx cap open ios`

Add to `package.json` when ready.

## Asset Pipeline
- Place base icons/splash artwork in `resources/` directory (e.g., `icon.png`, `splash.png`).
- Generate assets with `npx cordova-res android && npx cordova-res ios --skip-config --copy`.

## Release Checklist
1. Configure production `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_APP_BASE_URL` pointing to the live domain.
2. `npm run build:capacitor` and `npx cap sync` to copy fresh assets.
3. Android: build signed AAB via Android Studio, upload to Play Console (internal testing track first).
4. iOS: Archive via Xcode, upload to App Store Connect, submit for TestFlight review.
5. Validate USSD flows on physical devices (MTN & Airtel SIMs) before public launch.

## Android Instrumentation Tests
- Ensure the Android shell ships with the latest web bundle before running instrumentation.
- Connect at least one device or emulator and execute `npm run test:android:instrumentation` to run the headless NFC + telemetry suite.
- Tests assert that tap-to-pay transactions dispatch pending payments to Supabase and that USSD launches emit telemetry beacons.
- Include the test artefact summary in the release PR so reviewers can confirm device coverage.

## iOS Manual QA Checklist
- Follow the [NFC verification guide](./nfc-testing.md) to rehearse tap-to-pay and reconciliation flows on a TestFlight build.
- Validate push notification prompts, USSD fallbacks, and background resume telemetry on at least one physical device (iPhone 13 or newer).
- Confirm TestFlight build metadata screenshots reflect the latest UI before submitting for review.
- Record the manual QA session outcome in the release checklist to unblock App Store submission.

For a full launch-readiness checklist (CI smoke tests, telemetry verification, post-launch monitoring), see `docs/launch-readiness.md`.

## Next Steps
- Automate TWA build via GitHub Actions once hosting domain is locked.
- Evaluate Capacitor plugins for camera and push once community/photo submissions are required.
- Add automated smoke tests for gate scanning to run against native shells.
