# iOS Workspace

This directory contains configuration that lets CI import signing artifacts and build
with the same secrets described in [`docs/mobile/signing-keys.md`](../docs/mobile/signing-keys.md).

- `Config/Base.xcconfig` — bundle + signing identifiers referenced by Xcode.
- `Config/Secrets.xcconfig` — API + Supabase keys injected from CI (`API_BASE_URL`, `SUPABASE_*`).
- `scripts/import-provisioning.sh` — decodes the `APPLE_*` GitHub secrets into `Provisioning/`.
- `App/Info.plist` — enforces App Transport Security (ATS) and references build settings for secrets.

Run the provisioning import script before `xcodebuild`:

```bash
pushd ios
APPLE_PROVISIONING_PROFILE_BASE64=... \
APPLE_DISTRIBUTION_CERT_BASE64=... \
APPLE_TEAM_ID=YOURTEAMID \
xcrun xcodebuild -workspace Abareyo.xcworkspace -scheme Abareyo \
  -xcconfig Config/Secrets.xcconfig \
  API_BASE_URL="$API_BASE_URL" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
popd
```
