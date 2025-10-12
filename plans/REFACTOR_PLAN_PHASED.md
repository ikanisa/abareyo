# Phased Refactor Plan (P0–P3)

## P0 — Stabilise Build & PWA Baseline (1–2 days)
| Task | Owner | Estimate | Acceptance |
| --- | --- | --- | --- |
| Provide safe defaults for socket/telemetry config and stop throwing in client bundle | Platform | 0.5d | `npm run build` passes without env overrides; warnings logged instead of crashes.【F:src/config/client.ts†L23-L78】 |
| Raise TS target to ES2020, re-enable Next type/lint checks after resolving errors | Platform | 0.5d | `npm run type-check` clean; remove `ignoreDuringBuilds` flags.【F:tsconfig.json†L3-L38】【F:next.config.mjs†L6-L21】 |
| Patch onboarding modal null guard + add vitest for submit/reset flow | Web | 0.5d | Vitest passes verifying optional onboarding remains non-blocking.【F:app/_components/onboarding/OnboardingModal.tsx†L55-L77】 |
| Surface PWA opt-in affordance and auto-register SW post accept | Web | 0.5d | New onboarding FAB triggers opt-in; offline refresh succeeds (manual).【F:app/providers.tsx†L45-L147】 |

## P1 — Complete Mobile Home Experience (2–4 days)
| Task | Owner | Estimate | Acceptance |
| --- | --- | --- | --- |
| Build live ticker, stories, upcoming fixtures, wallet snapshot, sponsors, community modules | Web UX | 2d | Modules render at 360–430px with skeletons and analytics events.【F:app/(routes)/_components/HomeClient.tsx†L92-L115】 |
| Replace emoji buttons with icon buttons respecting motion/accessibility | Web UX | 0.5d | Buttons >=44px, `focus-visible` styles, `prefers-reduced-motion` supported.【F:app/_components/ui/TopAppBar.tsx†L9-L38】 |
| Refine quick/gamification tiles with progress states and data sources | Web UX | 1d | Tiles display dynamic content, keyboard focus order validated.【F:app/_components/ui/QuickTiles.tsx†L1-L20】【F:app/_components/ui/GamificationStrip.tsx†L7-L24】 |

## P2 — Performance, Security, Observability (2–4 days)
| Task | Owner | Estimate | Acceptance |
| --- | --- | --- | --- |
| Introduce CSP, strict transport, and locale guard middleware | Platform | 0.5d | Security headers present in response, locale redirect tested.【F:next.config.mjs†L6-L21】【F:middleware.ts†L3-L46】 |
| Convert hero/CTA to server components and lazy-load heavy admin bundles | Platform | 1d | Bundle analysis shows ≥15% reduction; admin route chunks <200KB.【F:app/(routes)/_components/HomeClient.tsx†L1-L118】 |
| Add telemetry/error boundary + Sentry/Axiom integration | Platform | 1d | Error boundary catches runtime issues; events logged with opt-in.【F:app/providers.tsx†L111-L147】 |
| Establish Playwright smoke + Axe automation in CI | QA | 0.5d | CI pipeline runs headless smoke + axe with no critical failures. |

## P3 — Polish & Documentation (1–2 days)
| Task | Owner | Estimate | Acceptance |
| --- | --- | --- | --- |
| Implement offline/empty states and skeletons for feed and missions | Web UX | 0.5d | Offline mode shows cached content; skeleton placeholders visible.【F:app/_components/home/Feed.tsx†L1-L19】 |
| Author Ops runbook + ADR for PWA/onboarding decisions | Platform | 0.5d | Markdown docs added to `/docs`, reviewed by leadership. |
| Conduct UX bug bash + finalize accessibility audit fixes | Web UX | 0.5d | Axe/PA11y show zero critical; manual QA sign-off recorded. |
