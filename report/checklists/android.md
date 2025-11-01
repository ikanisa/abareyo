# Android Release Checklist

- [ ] Increment `versionCode`/`versionName` in `android/app/build.gradle.kts` per semantic release plan.【1012b9†L8-L49】
- [ ] Enable `isMinifyEnabled = true` with R8 rules and configure resource shrinking for release builds.【1012b9†L23-L49】
- [ ] Provide signing keystore secrets (`ANDROID_KEYSTORE_*`) in GitHub Actions and verify bundle with `jarsigner`.
- [ ] Populate `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `API_BASE_URL` buildConfig fields from secure vault before Gradle sync.【1012b9†L18-L21】
- [ ] Run `npm run test:native:android` and Android instrumentation smoke tests on Firebase/Test Lab.
- [ ] Execute `./gradlew bundleRelease` and archive `app-release.aab`; upload to Play Console internal testing track.
- [ ] Validate Play Integrity/Google Play App Signing enrollment; store provisioning docs alongside keystore escrow.
- [ ] Review manifest permissions for minimal scope and confirm network security config enforces HTTPS-only requests.
- [ ] Capture startup/profiled traces ensuring cold start <2.5s on Pixel 6 (release build, no dev menu).
- [ ] Attach SBOM and license report for Android dependencies to release artifacts.
