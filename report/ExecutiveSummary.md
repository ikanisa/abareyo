# Executive Summary

| Surface | Quality | Security | Performance | Accessibility | Compliance | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| Client PWA | 45 | 40 | 50 | 55 | 50 | 48 |
| Admin PWA | 40 | 30 | 45 | 50 | 45 | 42 |
| Android | 35 | 35 | 40 | 45 | 35 | 38 |
| iOS | 30 | 40 | 35 | 45 | 40 | 38 |
| Shared Backend | 45 | 35 | 45 | 50 | 40 | 43 |

Major build and test commands fail due to missing environment configuration and red unit tests. The Next.js build aborts because the validated environment schema requires production-ready secrets even in local builds, blocking deploys to Vercel until overrides or CI scaffolding populate the variables.【583a95†L1-L86】 Frontend Vitest suites fail from missing dependencies and hoisted mocks, so core OTP flows lack automated verification coverage.【e7aaba†L79-L161】 The NestJS backend test suite fails due to Prisma filter regressions and an unguarded DTO import that dereferences optional metadata during module initialization.【e3a3c5†L1-L46】 Android and iOS projects ship without hardened release signing, shrinkers, or environment parity, leaving the mobile channel unready for store submission.【1012b9†L1-L83】【a7a201†L24-L78】 Admin tooling exposes privileged tokens through public environment keys, undermining access control guarantees.【320662†L147-L219】

## Top Risks (P0/P1)
1. **Env-gated build failure (P0)** – Strict Zod validation in `config/validated-env.mjs` halts `next build` unless all production secrets are set, preventing reproducible CI/CD without secret scaffolding.【4054fa†L36-L216】【583a95†L1-L86】 *Mitigation:* Introduce environment profiles or CI secrets management; patch proposal in `report/patches/0001-next-env-guard.diff`. ETA: 4h. Owner: Platform.
2. **Frontend OTP unit tests broken (P0)** – Missing `@testing-library/user-event` dependency and hoisted mocks block three critical OTP suites, masking regressions in auth flows.【e7aaba†L79-L161】 *Mitigation:* Add dependency and refactor mocks per `report/patches/0002-vitest-fixes.diff`. ETA: 3h. Owner: Web.
3. **Backend admin orders filter regression (P0)** – Prisma query expectations diverge from implementation, failing tests and risking incorrect search behaviour for admin dashboards.【e3a3c5†L1-L33】 *Mitigation:* Align DTO mapping and test fixtures; see `report/patches/0003-admin-orders.diff`. ETA: 2h. Owner: Backend.
4. **Tickets controller crashes in tests (P0)** – `RotatePassDto` decorator resolves undefined metadata during import, indicating runtime crashes when DTO metadata missing.【e3a3c5†L33-L46】 *Mitigation:* Load `reflect-metadata` in specs and add guard per `report/patches/0005-tickets-reflect.diff`. ETA: 3h. Owner: Backend.
5. **Admin token leaked to clients (P0)** – `src/lib/api/tickets.ts` ships `NEXT_PUBLIC_ADMIN_API_TOKEN`, allowing any authenticated client to hit steward endpoints with admin privileges.【320662†L147-L219】 *Mitigation:* Move token to server-only API proxy and enforce server-side RBAC. ETA: 6h. Owner: Web+Backend.
6. **Mobile release signing absent (P0)** – Android gradle config disables minify and lacks signing configs; iOS lacks provisioning & ATS tightening.【1012b9†L18-L83】【a7a201†L24-L78】 *Mitigation:* Add release signing, enable R8, document App Store assets. ETA: 8h. Owner: Mobile.
7. **Service worker lacks offline fallbacks (P1)** – Current Workbox routes omit offline fallback and version messaging, so cache misses lead to blank screens under loss of connectivity.【bda78f†L1-L116】 *Mitigation:* Add fallback handler per `report/patches/0004-service-worker.diff`. ETA: 2h. Owner: Web.
8. **Admin layout retries without exponential backoff (P1)** – Admin fetch uses synchronous redirect/return with no resilience, causing blank dashboards during transient outages.【9f6213†L1-L170】 *Mitigation:* Add retry/backoff and operational alerts. ETA: 4h. Owner: Web.
9. **Security headers require CSP hardening (P1)** – Next config defers to `buildSecurityHeaders` yet CSP/default-src not enforced, risking script injection.【63f378†L1-L34】 *Mitigation:* Extend CSP in security headers patch. ETA: 3h. Owner: Platform.
10. **SBOM/licensing gaps (P1)** – No SBOM artifacts or license policy exist; risk of undisclosed GPL transitive dependencies across workspace.【7b0ce2†L51-L157】【19e125†L21-L68】 *Mitigation:* Adopt CycloneDX generation in CI and review license compliance. ETA: 5h. Owner: Platform.
