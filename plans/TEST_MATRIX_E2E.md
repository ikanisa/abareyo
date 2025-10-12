# E2E Smoke & Regression Matrix

| Flow | Scenario | Priority | Tooling | Notes |
| --- | --- | --- | --- | --- |
| Home load | Verify hero, quick actions, feed placeholders render at 390px | P0 | Playwright (mobile) | Ensure onboarding modal closed by default without query param.【F:app/(routes)/_components/HomeClient.tsx†L83-L115】 |
| Optional onboarding | Trigger via `?onboarding=1`, submit contact info, confirm optional reply | P0 | Playwright + Vitest | Assert modal closes gracefully, input resets without errors.【F:app/_components/onboarding/OnboardingModal.tsx†L55-L77】 |
| PWA opt-in | Accept opt-in CTA, confirm service worker registered & notifications prompt | P0 | Playwright + Workbox test harness | Validate localStorage flag set and SW active.【F:app/providers.tsx†L45-L147】 |
| Tickets CTA | Tap quick action `Tickets`, ensure navigation + bottom nav active state | P1 | Playwright | Assert `/tickets` route loads without locale rewrite loop.【F:app/_components/ui/QuickTiles.tsx†L1-L20】【F:middleware.ts†L3-L46】 |
| Wallet mini (future) | Validate wallet balance card renders and links to wallet page | P1 | Playwright | Pending feature; add once wallet module shipped.【F:app/(routes)/_components/HomeClient.tsx†L92-L110】 |
| Localization | Switch locale to Kinyarwanda, confirm text updates and middleware retains locale | P2 | Playwright | Ensure navigation persists `rw` prefix without redirect loops.【F:middleware.ts†L3-L46】 |
| Offline readiness | Simulate offline after opt-in, reload home, verify cached feed fallback | P2 | Playwright (service worker) | Depends on Workbox caching strategy; add tests after SW refactor.【F:public/service-worker.js†L1-L40】 |
| Admin login | Navigate to `/admin/login`, validate form loads, env warnings absent | P2 | Playwright (desktop) | Blocked until build succeeds without env throw.【F:src/config/client.ts†L23-L78】 |
