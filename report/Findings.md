# Detailed Findings

## A. Discovery & Inventory
- **Monorepo topology:** Root `package.json` defines npm workspaces for shared packages alongside a Next.js App Router surface in `app/`, Expo mobile sources in `packages/mobile`, a NestJS backend in `/backend`, and Capacitor/Android projects for native shells.【7b0ce2†L1-L157】【19e125†L1-L68】【f183fc†L1-L30】【1012b9†L1-L83】【55bf56†L1-L30】 The repo also bundles a Swift package (`ios/Package.swift`) used for native WhatsApp auth utilities.【3e0275†L4-L22】
- **Applications & entry points:**
  - Client PWA (`app/layout.tsx`) serves fan experiences with Supabase integration via `src/integrations/supabase/client.ts` and Workbox-powered service worker in `public/service-worker.js`.【794343†L1-L51】【bda78f†L1-L116】
  - Admin PWA routes under `app/admin/(dashboard)` enforce server-rendered RBAC by calling the backend `/admin/me` endpoint before rendering the dashboard shell.【9f6213†L1-L170】
  - Android native wrapper (`android/app/build.gradle.kts`) consumes Capacitor exports and Compose UI modules.【1012b9†L1-L83】
  - iOS mobile experience combines Expo Router (`packages/mobile/app/_layout.tsx`) and a Swift Auth module for OTP flows.【935f75†L1-L23】【a7a201†L24-L78】
  - Backend API (`backend/src/main.ts`) runs NestJS on Fastify with Loki/Sentry observability hooks.【ce4d1d†L1-L211】
- **Dependency graph (simplified):**
  ```text
  client-pwa (Next.js)
    ├─ packages/contracts → backend (Prisma DTO parity)
    ├─ packages/mobile/widgets
    └─ supabase-js / Sentry / Workbox
  admin-pwa (Next.js route)
    └─ backend admin APIs
  mobile-expo
    ├─ packages/design-tokens
    └─ Supabase client wrappers
  android-compose
    └─ Capacitor dist export
  ios-swift
    └─ REST OTP endpoints (backend)
  backend-nest
    ├─ Prisma (Postgres)
    ├─ BullMQ (Redis)
    └─ S3/OpenAI integrations
  ```
- **Environment catalog:** `config/validated-env.mjs` mandates critical secrets for Supabase, onboarding, WhatsApp, JWT, and telemetry even during local builds.【4054fa†L36-L216】 `.env.example` now enumerates required keys for frontend, backend, observability, and native builds to standardize configuration handoff.【4a089b†L1-L85】 Backend tooling checks additional production keys (`DATABASE_URL`, `REDIS_URL`, object storage) via `backend/tools/validate-env.ts` to prevent runtime misconfiguration.【48c21f†L1-L25】

## B. Build Reproduction
- **Frontend:** `npm ci` installs dependencies with 11 low vulnerabilities; rerun monthly audit. `npm run lint` currently succeeds after installing toolchain.【bf0dcd†L1-L11】【40ccb9†L1-L6】 `npm run test:unit` fails (3 suites) due to missing `@testing-library/user-event` and hoisted mocks, blocking OTP coverage.【e7aaba†L79-L161】 `npm run build` aborts because Zod validation requires production secrets; this blocks deterministic Vercel deploys until CI injects sanitized defaults.【583a95†L1-L86】
- **Backend:** `npm run --prefix backend test` fails two suites—admin order filtering expectations and tickets controller metadata loading—indicating regressions before release.【e3a3c5†L1-L46】
- **Mobile:** No automated native build configured; Gradle and EAS pipelines proposed in `report/ci/android.yml` and `report/ci/ios.yml` wrap bundle/IPA generation with signing placeholders.
- **Recommendations:** Adopt deterministic build pipeline per `report/ci/*.yml`, add development-safe env defaults (`report/patches/0001-next-env-guard.diff`), and gate merges on green lint/test/build steps.

## C. Static Analysis & Code Health
- ESLint disables key rules such as `@typescript-eslint/no-unused-vars` and React hook exhaustiveness outside admin scope, reducing regression detection.【304015†L8-L41】 Enable rule overrides gradually and enforce Prettier/Stylelint for shared UI.
- TypeScript uses `strict` with incremental builds, but workspaces for mobile packages lack project references; consider enabling TS project references to speed `tsc --build` across packages.【483b0d†L1-L74】
- Vitest suites skip due to missing dependencies; patch `report/patches/0002-vitest-fixes.diff` introduces hoisted mocks and user-event to restore coverage.

## D. Security & Privacy Review
- **Secrets exposure:** `src/lib/api/tickets.ts` embeds `NEXT_PUBLIC_ADMIN_API_TOKEN`, exposing privileged steward APIs to the public bundle—move to server-only storage with authenticated proxy.【320662†L147-L219】
- **Build-time secret gating:** Strict env parsing (Zod) blocks builds without secrets; patch `0001` downgrades missing dev values to warnings to support CI while still failing production misconfigurations.【4054fa†L110-L216】【583a95†L1-L86】
- **Session hardening:** Admin layout relies on cookie header forwarding but lacks CSRF/token binding; extend `buildSecurityHeaders` to enforce CSP, `SameSite=Strict`, and add double-submit tokens for admin POSTs.【9f6213†L1-L170】【63f378†L1-L34】
- **Secret scanning:** Automated gitleaks invocation failed (CLI unavailable); install gitleaks in CI and review history before release.【a682ef†L1-L3】 Interim `report/sbom/gitleaks.json` captures the gap.
- **PII:** Supabase client caches tokens in localStorage when available; ensure logout clears storage to satisfy GDPR data minimization.【794343†L24-L48】 Backend logging warns when OpenAI keys missing; confirm data-sharing agreements before enabling AI flows.【ce4d1d†L88-L206】

## E. Performance & Reliability
- Workbox caches ticketing/community APIs but lacks offline document fallback; patch `0004` adds catch handler and offline shell to prevent blank screens offline.【bda78f†L1-L116】【78443a†L1-L107】
- `next.config.mjs` sets unoptimized images; consider enabling image optimization or CDN caching for match media.【63f378†L5-L18】
- Admin layout fetch has single attempt with 4s timeout and no retry/backoff, so transient backend blips render the dashboard unusable; add retry strategy and surface telemetry via `reportAdminAvailabilityIssue`.【9f6213†L45-L170】
- Backend request logging wraps Fastify with pino but should add circuit breakers/timeouts on upstream Supabase/OpenAI calls to avoid cascading failures.【ce4d1d†L30-L211】

## F. Accessibility & Internationalization
- ESLint enables `jsx-a11y` warnings but they are downgraded to warn globally; elevate critical rules to error and expand keyboard testing. Screen reader focus management for admin shell should be validated due to dynamic fetch gating.【304015†L16-L34】【9f6213†L134-L170】
- i18n config supports `en`, `fr`, `rw` with detection disabled; ensure language switcher surfaces to end users and add tests for locale routes.【63f378†L19-L23】

## G. PWA Readiness
- Manifest covers icons, shortcuts, protocol handlers; confirm referenced assets exist and match brand guidelines.【4c26c3†L1-L47】
- Service worker lacks install/activate lifecycle hooks and offline fallback; patch `0004` adds cache bootstrap, skipWaiting messaging, and offline handler.【78443a†L1-L107】
- Lighthouse CI script exists (`npm run lint:pwa`) but currently blocked by build failure; once env gating resolved, re-run and attach artifact to PR.【7b0ce2†L21-L49】【583a95†L1-L86】

## H. Mobile Readiness
- Android Gradle config disables minify and lacks signing configuration; enable R8, configure splits, and inject API secrets via environment variables instead of blank defaults.【1012b9†L12-L30】
- Expo mobile app uses Expo Router with API provider but lacks release config (EAS profiles). Document build instructions in README and adopt `eas.json` aligning with `report/ci/ios.yml`.
- Swift Auth module stores JWT tokens in Keychain and gracefully handles unsupported platforms; ensure bridging code clears tokens on logout and enforces ATS for backend requests.【f453f1†L6-L90】【a7a201†L24-L78】

## I. AuthN/AuthZ & Admin Panel
- Admin layout enforces backend session check but returns generic offline notice for missing env; add operational alerting and differentiate 401 vs 5xx states.【9f6213†L45-L170】
- Gatekeeper endpoints rely on static admin token header; replace with backend-issued session tokens validated server-side to avoid token leakage.【320662†L147-L219】

## J. Observability & Operations
- Backend bootstrap integrates Loki logging but depends on env-supplied credentials; ensure secrets populated and fallback to console logging only in dev.【ce4d1d†L30-L112】
- Metrics service extracts bearer tokens; document expected `METRICS_TOKEN` rotation process and add Prometheus alerts for latency SLO breaches.【ce4d1d†L30-L210】
- Frontend Sentry resolver normalises environment labels and looks up DSNs from `NEXT_PUBLIC_SENTRY_DSN_MAP`; configure secrets per environment and tighten sampling in production.【4054fa†L110-L216】【40360a†L2-L100】
