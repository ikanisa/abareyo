# NFC Tap & Reconciliation Guide

This guide documents how we validate NFC tap-to-pay flows across the Capacitor shells and web PWA.

## Prerequisites
- Android device (SDK 34+) or emulator with NFC simulation enabled.
- iOS device enrolled in TestFlight (iOS 16+).
- Supabase service role credentials configured in `.env.local` or Supabase CLI session.
- Latest web bundle exported via `npm run build:capacitor` and synced with `npx cap sync`.

## Android Instrumentation Workflow
1. Install the Capacitor Android app on a device/emulator.
2. Run `npm run test:android:instrumentation` from the repo root. The suite:
   - Dispatches synthetic `nfc:transaction` events and asserts `/api/transactions/nfc` records a pending payment.
   - Verifies USSD launches emit telemetry (`ussd-launch`) beacons to the configured endpoint.
   - Captures device logs under `reports/android-instrumentation/*.json` for release notes.
3. Review the generated report to ensure each tap attempt logged telemetry and Supabase state transitions.

## iOS Manual QA
1. Install the TestFlight build created from `npx cap open ios` → Archive → Transporter upload.
2. Follow these steps on-device:
   - Navigate to Wallet → trigger a mock `nfc:transaction` (use the debug menu or Safari console) and confirm the event appears in the telemetry feed.
   - Launch USSD checkout and confirm the fallback prompt appears after ~700 ms on iOS.
   - Resume the app from background and verify app state telemetry is emitted.
3. Record results (screenshots, logs) and attach them to the deployment checklist.

## Troubleshooting
- **Telemetry failures**: Ensure `NEXT_PUBLIC_TELEMETRY_URL` is reachable on device networks.
- **Pending payment missing**: Check Supabase `payments` table for the transaction ID and rerun the instrumentation test if absent.
- **Event listener missing**: Confirm the native shell dispatches `nfc:tap` and `nfc:transaction` events via Capacitor bridge (`window.dispatchEvent`).

Cross-reference the [mobile packaging runbook](./packaging.md) for release sequencing and CI verification steps.
