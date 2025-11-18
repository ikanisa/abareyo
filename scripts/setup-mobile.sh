#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPO_SAMPLE="$ROOT_DIR/packages/mobile/.env.example"
ANDROID_SAMPLE="$ROOT_DIR/android/gradle.properties.example"
IOS_SAMPLE="$ROOT_DIR/ios/Config.sample.xcconfig"

REQUIRED_VARS=(
  API_BASE_URL
  EXPO_PUBLIC_WEB_URL
  WHATSAPP_ACCESS_TOKEN
  WHATSAPP_PHONE_NUMBER_ID
  WHATSAPP_OTP_TEMPLATE
  META_WABA_BASE_URL
)

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var-}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
  cat <<MSG >&2
Missing required mobile environment variables: ${missing_vars[*]}.
Populate them via the platform templates before running Expo, Gradle, or Xcode:
  - $EXPO_SAMPLE (Expo Metro / EAS builds)
  - $ANDROID_SAMPLE (Gradle BuildConfig + Compose runtime)
  - $IOS_SAMPLE (xcconfig → Info.plist / AuthAPI)

Each value maps directly to the WhatsApp OTP runtime config in src/lib/server/otp/whatsapp.ts
and docs/mobile/whatsapp-auth.md, so CI + local builds stay consistent.
MSG
  exit 1
fi

echo "✅ Mobile environment looks good (API + WhatsApp OTP vars detected)."

if [[ $# -gt 0 ]]; then
  echo "Running command: $*"
  exec "$@"
fi
