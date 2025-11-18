# Mobile secret storage & rotation

The mobile CI workflows (`.github/workflows/mobile-android.yml` and `.github/workflows/mobile-ios.yml`) require a shared set of
secrets so Android and iOS artifacts can be produced deterministically. Store the canonical versions in the GitHub organisation
secret store and scope repository-level copies only when you need to test forks.

| Secret | Purpose | Rotation playbook |
| --- | --- | --- |
| `EAS_TOKEN` | Authenticates Expo Application Services for TestFlight exports. | Regenerate quarterly from the Expo dashboard and update the org-level secret. Revoke tokens that have not been used in 30 days. |
| `ANDROID_KEYSTORE_*` | Upload/keystore credentials for signed AABs (`ANDROID_KEYSTORE_B64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`). | Rotate twice a year: create a new keystore in the Android team HSM, upload to 1Password, update GitHub secrets, and archive the old Play Console keystore after verifying the replacement. |
| `SUPABASE_*` | Backend access for onboarding and telemetry endpoints (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`). | Issue new service role keys from the Supabase dashboard at least every six months. Update CI secrets and invalidate the previous keys via Supabase Vault. |

Document the date of the most recent rotation in `DEPLOYMENT_AUDIT_SUMMARY.md` and alert the release channel when secrets are
refreshed so queued builds can be restarted with the new credentials.
