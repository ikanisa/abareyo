# Mobile Signing Keys & Rotation

This guide describes how Android and iOS signing material is stored, injected into CI, and rotated. It complements the
checklists in `DEPLOYMENT_CHECKLIST.md` and the CI playbooks under `reports/ci/`.

## Storage Overview

| Platform | Artifact | Primary store | Backup store |
| --- | --- | --- | --- |
| Android | Play signing keystore (`release.jks`) | 1Password → "Abareyo Ops / Mobile" vault | GitHub Encrypted Secrets (`ANDROID_KEYSTORE_*`) |
| iOS | Provisioning profile (`AbareyoMobile_Distribution.mobileprovision`) | 1Password → "Abareyo Ops / Mobile" vault | App Store Connect API key scoped to CI (`IOS_*` secrets) |
| iOS | Distribution certificate (`AbareyoMobile_Distribution.p12`) | 1Password → "Abareyo Ops / Mobile" vault | GitHub Encrypted Secrets (`IOS_SIGNING_CERT_*`) |

* Secrets injected via CI must match the property names referenced in [`android/app/build.gradle.kts`](../../android/app/build.gradle.kts)
  and [`packages/mobile/eas.json`](../../packages/mobile/eas.json). The CI templates in [`reports/ci`](../../reports/ci)
  show the expected variable names.

## Rotation Workflow

1. **Schedule a maintenance window.** Notify channel `#launch-readiness` at least 24 hours in advance and pause automatic
   deploys.
2. **Generate new credentials.**
   - Android: Use `keytool -genkeypair` to create a new keystore. Export the certificate fingerprint for the Play Console.
   - iOS: Regenerate the distribution certificate + provisioning profile inside App Store Connect.
3. **Update secure stores.**
   - Upload the new files to the 1Password vault and archive the previous version with a removal date.
   - Update the GitHub secrets listed in [`reports/ci/android.yml`](../../reports/ci/android.yml) and
     [`reports/ci/ios.yml`](../../reports/ci/ios.yml). Keep the old secrets for 24 hours in case a rollback is required.
4. **Refresh Gradle/EAS context.**
   - For Android, update the checksum metadata in CI by running the `Android signing rotation` workflow (uses the secrets
     referenced above) and ensure local developers pull the updated `android/gradle.properties` comments.
   - For iOS, run `bundle exec fastlane preview` to validate the provisioning profile before promoting to production.
5. **Audit & document.** Capture screenshots of the successful Play Console and App Store Connect uploads. Record the
   rotation in `reports/operations-log.md` with links to the CI runs and credential expiry dates.

## Emergency Revocation

If a key is compromised:

1. Immediately revoke the affected credential in the Play Console or App Store Connect.
2. Remove the corresponding CI secrets and invalidate any cached build artifacts.
3. Follow the rotation workflow above to generate replacement keys, then trigger the smoke tests (`npm run test:mobile:smoke`)
   to confirm the login/OTP flows remain operational.
4. File an incident in `docs/runbooks/incident-response.md` and coordinate with security for follow-up actions.
