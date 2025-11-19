# OTP Utilities

Cross-platform helpers for the WhatsApp OTP flow. The TypeScript bundle is consumed by the Expo Router project while the `android/`
(Kotlin) and `ios/` (Swift) sources can be imported into the corresponding native builds via an additional source set / Swift
Package dependency.

## Helpers

- Phone number sanitising and normalisation.
- Six digit enforcement with friendly helpers.
- Countdown timer factory shared across platforms.
- Resend throttling helpers so every surface honours the same backoff rules.

## Native Consumption

- **Android**: Point the module's `sourceSets` to `packages/mobile/otp-utils/android` so Compose screens can import
  `com.rayon.mobile.otputils.*` without duplicating the logic.
- **iOS**: Add the Swift package that lives under `packages/mobile/otp-utils/ios` (`Package.swift`) as a local dependency and
  `import OTPUtils` inside SwiftUI views.
