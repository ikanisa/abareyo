# License Summary

| Component | License | Status | Notes |
| --- | --- | --- | --- |
| next@14.2.33 | MIT | Allow | Matches company policy for permissive OSS.【7b0ce2†L104-L118】 |
| react@18.3.1 | MIT | Allow | Bundled with Next.js runtime.【7b0ce2†L108-L113】 |
| @supabase/supabase-js@2.74.0 | Apache-2.0 | Allow | Requires attribution in docs.【7b0ce2†L87-L120】 |
| @sentry/react@10.22.0 | BSD-3-Clause | Review | Confirm DSN usage meets privacy notice obligations.【7b0ce2†L85-L122】 |
| @nestjs/core@11.0.0 | MIT | Allow | Backend HTTP stack.【19e125†L21-L48】 |
| fastify@5.4.0 | MIT | Allow | Ensure security headers plugin configured.【19e125†L21-L48】 |
| expo@51.0.0 | MIT | Allow | Requires Expo account for OTA updates.【f183fc†L13-L30】 |
| lottie-react-native@6.7.0 | Apache-2.0 | Allow | Include LICENSE in mobile OSS disclosure.【f183fc†L13-L25】 |
| com.squareup.retrofit2:retrofit@2.11.0 | Apache-2.0 | Allow | Document third-party usage in Play Store listing.【1012b9†L52-L83】 |
| openai@4.52.0 | MIT | Review | Validate data processing agreements before enabling in production.【19e125†L21-L48】 |

**Policy Actions**
- Document OSS attribution for Apache/BSD dependencies in app settings/help pages.
- Add automated `npx @cyclonedx/cyclonedx-npm` and Gradle license audit tasks to CI (`report/ci/web.yml`, `report/ci/android.yml`).
- Maintain allow/deny lists in SCM; block builds on introduction of GPL/AGPL packages.
