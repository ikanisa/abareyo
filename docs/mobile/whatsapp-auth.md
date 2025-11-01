# WhatsApp OTP Authentication Flow

This guide outlines how the cross-platform mobile clients integrate with the WhatsApp OTP endpoints and how to configure build-time secrets across Expo (React Native), Android Compose, and SwiftUI.

## API Base URLs

| Platform | Source | Notes |
| --- | --- | --- |
| Expo / React Native | `EXPO_PUBLIC_WEB_URL` → `NEXT_PUBLIC_SITE_URL` fallback | The Expo client reuses the existing onboarding helpers and automatically injects the bearer token into follow-up fetches. |
| Android (Compose) | `API_BASE_URL` BuildConfig field | Populate via Gradle env (`API_BASE_URL`) before building or running instrumentation. |
| iOS (SwiftUI) | `API_BASE_URL` Info.plist or environment | `AuthAPI` checks `API_BASE_URL` in process environment first, then the app Info.plist. |

> ℹ️ Ensure the base URL points at the web API host (e.g., `https://fan-api.rayonsports.rw`). All helpers normalise trailing slashes.

## Secure Token Persistence

- **Expo**: Uses `@react-native-async-storage/async-storage` (`authStorage.ts`) with an in-memory cache to hydrate existing sessions before onboarding begins.
- **Android**: Persists JWTs in `DataStore` (`PreferencesTokenStore`) and surfaces them via `AuthRepository.token`. Compose screens automatically observe the flow.
- **iOS**: Stores tokens inside the system Keychain (`KeychainTokenStorage`). The SwiftUI view model reads any stored token on launch.

## Developer Workflow

1. Configure the base URLs:
   ```bash
   # Expo / Vite
   export EXPO_PUBLIC_WEB_URL="https://fan-api.rayonsports.rw"

   # Android Compose (Gradle)
   export API_BASE_URL="https://fan-api.rayonsports.rw"

   # iOS SwiftUI (Xcode / swift test)
   export API_BASE_URL="https://fan-api.rayonsports.rw"
   ```
2. Run the platform tests:
   ```bash
   # React Native lint + type safety
   npm --prefix packages/mobile run lint

   # Android unit tests
   cd android && ./gradlew test

   # Swift package tests
   cd ios && swift test
   ```
3. Verify OTP delivery through the Compose `AuthActivity` or the SwiftUI previews before distributing.

## Error Handling Expectations

- OTP request failures surface inline messages and keep the user on the phone entry screen.
- Verification requires a 6-digit code on every platform; attempting fewer digits returns actionable errors.
- Successful verification immediately stores the JWT and unblocks the remainder of onboarding.

For release sign-off, copy the relevant checklist items from [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md) into your playbook and confirm the secure storage locations are documented for security reviews.
