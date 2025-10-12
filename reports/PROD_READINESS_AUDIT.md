# Production Readiness Audit — Rayon Sports Super App

## Executive Summary
- **Code Health:** ⚠️ Medium risk. TypeScript and ESLint are disabled during production builds, masking five current compiler errors and 16 lint violations that touch onboarding, config, and wallet/tickets flows.【F:next.config.mjs†L6-L21】【F:app/_components/onboarding/OnboardingModal.tsx†L21-L134】【F:src/config/client.ts†L1-L80】
- **Build Stability:** ❌ Blocked. `npm run build` aborts because `NEXT_PUBLIC_SOCKET_PATH` is required at build time, preventing static generation for every core route.【F:src/config/client.ts†L23-L78】【f5c711†L1-L122】
- **PWA & Native Integration:** ⚠️ Partial. Service worker registration is opt-in and never triggered in a fresh session, so offline support depends on a hidden localStorage flag.【F:app/providers.tsx†L45-L147】
- **Security & Compliance:** ⚠️ Gaps. No hardened HTTP headers or CSP. Locale middleware rewrites user-entered paths without validation, creating potential open redirect surface when combined with referer spoofing.【F:next.config.mjs†L6-L21】【F:middleware.ts†L3-L46】
- **UX & Feature Completeness:** ⚠️ Incomplete. Home screen lacks live ticker, stories, wallet snapshot, sponsors, and offline states. Feed uses static placeholder content and omits accessibility metadata.【F:app/(routes)/_components/HomeClient.tsx†L92-L115】【F:app/_components/home/Feed.tsx†L1-L19】

## Priority Findings (P0)
1. **Unrecoverable production build** — `clientConfig` throws when socket env is unset, blocking deployments. Add safe default and warnings rather than throwing in browser bundle.【F:src/config/client.ts†L23-L78】
2. **Type safety regression** — Onboarding modal mutates `inputRef.current.value` without null guard, causing runtime crash when Radix returns null ref.【F:app/_components/onboarding/OnboardingModal.tsx†L21-L134】
3. **Telemetry & realtime config** — Regexes rely on ES2018 `u` flag yet TS target is ES5, so builds in strict mode fail. Raise `compilerOptions.target` to at least `es2018` and enable `strict` after fixing any fallout.【F:src/config/client.ts†L1-L20】【F:tsconfig.json†L3-L38】
4. **Production masking of lint/type errors** — `next.config.mjs` disables lint/type enforcement, letting regressions merge undetected. Re-enable once blockers fixed.【F:next.config.mjs†L6-L21】

## Additional Risks (P1–P2)
- **UX debt:** Quick actions and gamification components lack motion-safe fallbacks, do not meet 44px tap minimum on small devices, and miss analytics hooks.【F:app/_components/ui/QuickTiles.tsx†L1-L20】【F:app/_components/ui/GamificationStrip.tsx†L7-L24】
- **Locale middleware** rewrites based on referer, enabling potential loop or redirect on crafted headers; add allowlist and signed locale cookie.【F:middleware.ts†L3-L46】
- **Telemetry dispatch** uses fetch without timeout, risking hung requests on unload; wrap with abort controller or rely on `navigator.sendBeacon` only.【F:app/providers.tsx†L111-L147】

## Recommended Immediate Actions
1. Ship fallback socket path + `.env.example` updates so builds succeed across environments.【F:src/config/client.ts†L23-L78】
2. Patch onboarding modal for null-safe reset and add tests for optional onboarding path.【F:app/_components/onboarding/OnboardingModal.tsx†L21-L134】
3. Update `tsconfig.json` target to `es2020`, enable `strict`, and clean lint rules before re-enabling Next build checks.【F:tsconfig.json†L3-L38】【F:next.config.mjs†L6-L21】
4. Introduce `next-safe-middleware` or custom headers in `next.config.mjs` to establish CSP, Referrer-Policy, and frame protections.【F:next.config.mjs†L6-L21】

## Observability & CI/CD Gaps
- No mention of error boundaries or logging sinks; add Sentry/Axiom integration with environment gating.【F:app/providers.tsx†L111-L147】
- CI scripts lack smoke tests post deploy; add `npm run build` + Playwright smoke in pipeline.

## Data Sources
- Type-check errors: `npm run type-check` (TS18047, TS1501).【211a06†L1-L25】
- ESLint violations: 16 blocking errors across onboarding, tickets, wallet, and more.【17a959†L1-L25】
- Build failure trace: `npm run build`.【f5c711†L1-L122】
