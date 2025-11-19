# Mobile WhatsApp OTP & In-App Experience Plan

## Context
- The repo currently ships a Next.js PWA and documentation-only Android/iOS bridges; there are no native source trees checked in, so OTP onboarding, widgets, and other mobile-only affordances exist only on paper.
- `docs/mobile/whatsapp-auth.md` defines the API expectations, storage layers, and developer workflows for Expo, Android Compose, and SwiftUI clients but does not include implementations.
- The WhatsApp OTP infrastructure requires environment variables such as `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_OTP_TEMPLATE` to be wired through each platform and through CI to ensure parity with production.

## Objectives
1. Ship end-to-end WhatsApp OTP authentication in regenerated native shells (Expo, Android Compose, SwiftUI) with parity to the documented flow.
2. Deliver in-app experience widgets (install prompts, USSD fallbacks, payment reminders, WhatsApp session helpers) that mirror the current PWA UX but leverage native capabilities when available.
3. Provide actionable telemetry and QA coverage so OTP and widget regressions are caught before release.

## Suggested Tasks

### 1. Recreate Native Workspaces & Wiring
- Run `npm run build:capacitor && npx cap add android && npx cap add ios` to regenerate Capacitor scaffolding for the existing PWA bundle.
- Scaffold the Expo Router project under `packages/mobile/app` and ensure it consumes shared contracts/utilities from `packages/contracts` and `src/lib/*`.
- Update `packages/mobile/observability` to expose initialization helpers (Sentry DSNs, release tags) for Expo, Android, and iOS.

### 2. Implement WhatsApp OTP Flows
- Build the OTP request + verification screens in Expo Router using React Native Paper components and AsyncStorage-backed token persistence described in `docs/mobile/whatsapp-auth.md`.
- Create Android Compose screens (`AuthActivity`, `OtpEntryScreen`) that bind to a `PreferencesTokenStore` DataStore implementation and call the Supabase/WhatsApp endpoints via Retrofit/Ktor.
- Implement SwiftUI views (`PhoneEntryView`, `OtpVerifyView`) and `KeychainTokenStorage`; ensure tokens hydrate app state on launch and log out correctly clears secure storage.
- Provide shared validation helpers (6-digit enforcement, countdown timers, resend gating) via a small cross-platform package where possible.

### 3. Wire Secrets & Environments
- Extend the GitHub Actions workflows (see `report/ci/android.yml` and `report/ci/ios.yml`) to inject WhatsApp credentials plus `API_BASE_URL`/`EXPO_PUBLIC_WEB_URL` into each build job.
- Add platform-specific `.env.example` or `.xcconfig` templates documenting WhatsApp-related secrets and how they map to each runtime (Expo, Gradle, Xcode).
- Ensure local developer onboarding scripts validate presence of `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `META_WABA_BASE_URL` before running native tests.

### 4. In-App Experience Widgets
- Implement install prompts and Add-to-Home-Screen helpers for iOS/Android within the Expo app, mirroring the logic already present in the PWA components under `app/_components`.
- Create USSD fallback and payment reminder widgets that reuse copy from `docs/runbooks/otp-fallbacks.md` and `docs/payments-policy.md`, including CTA buttons that deep link into the WhatsApp thread or dialer.
- Add a WhatsApp session helper widget that surfaces OTP delivery status (e.g., pending, delivered, template rejected) and exposes quick actions to resend or escalate per the runbook.

### 5. Telemetry & QA Automation
- Expand `packages/mobile/observability` to emit breadcrumbs for OTP submission, verification success/failure, widget interactions, and USSD fallback launches.
- Add instrumentation tests for Compose (`./gradlew connectedAndroidTest`) and XCTest/SwiftUI previews verifying OTP validation logic, secure storage, and widget render states.
- Integrate Playwright (PWA) and Detox (Expo) smoke tests into CI so OTP flows are exercised on every PR with mocked WhatsApp responses.

## Phased Delivery
1. **Foundation** – Regenerate native workspaces, scaffold the Expo app, and ensure secrets are plumbed through build tooling.
2. **Authentication Core** – Implement OTP request/verification flows, secure storage, and logout flows across all platforms with accompanying unit tests.
3. **Experience Layer** – Build widgets (install prompts, USSD fallback, payment reminders, WhatsApp helper) and ensure UI parity with the PWA.
4. **Observability & QA** – Ship telemetry hooks, instrumentation tests, and CI automation to keep OTP/auth widgets stable long-term.
