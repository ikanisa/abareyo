# GIKUNDIRO Fullstack & UX Audit

_Date: 2025-02-14_

## Executive summary
- **Frontend experience:** The home surface is largely static, navigation scaffolding is unfinished, and several interactive patterns bypass accessibility best practices. Key views rely on mocked data and emoji-based affordances, creating broken flows for real users. (High)
- **Backend & platform:** NestJS services are thoughtfully structured but lack guardrails for configuration, WebSocket access, and telemetry endpoints. PWA helpers auto-register a remote Workbox script without CSP vetting, exposing production builds to runtime failures. (Medium)
- **Operations & responsiveness:** Notification prompts, service-worker registration, and realtime sockets are all triggered on load without capability checks or fallbacks, while responsive grids and modals exhibit layout issues on smaller devices and with assistive tech. (Medium)

## Architecture observations
### Frontend
- Next.js App Router with extensive client components; the root layout imports both `index.css` (tailwind layer utilities) and `globals.css` (brand styles) and wraps children in PWA helpers and custom providers.【F:app/layout.tsx†L1-L34】
- Providers bootstrap React Query, theming, realtime sockets, auth, toast systems, and PWA hooks. They immediately register the service worker and request notification permission as soon as the bundle mounts, even before the UI signals why notifications are needed.【F:app/providers.tsx†L14-L45】【F:app/providers.tsx†L73-L87】
- Navigation scaffolding is inconsistent: the App Router `app/navigation.tsx` stub returns `null`, while a polished bottom nav lives in `src/components/layout/BottomNav.tsx` but is only rendered by the unused `(routes)` layout segment.【F:app/navigation.tsx†L1-L3】【F:src/components/layout/BottomNav.tsx†L18-L51】【F:app/(routes)/layout.tsx†L1-L11】

### Backend
- Fastify-backed NestJS service with structured logging, validation, and security middleware. However, enabling CSP still whitelists arbitrary `connect-src '*';` which reopens the platform to data exfiltration if CSP is activated.【F:backend/src/main.ts†L1-L183】
- Realtime gateway allows any origin by default (`cors: { origin: true }`) and only tightens origins if configured post-initialisation, meaning socket.io accepts cross-origin handshakes until configuration catches up.【F:backend/src/modules/realtime/realtime.gateway.ts†L16-L47】
- Membership workflows rely on configuration-driven USSD codes but never assert that the payment config exists; missing environment variables will crash checkout at runtime.【F:backend/src/modules/membership/membership.service.ts†L35-L102】

## Code quality & maintainability
- The home page and quick-action tiles are hard-coded (opponent names, CTA copy, mock feed) with no loading, error, or data connectivity paths, making regression to real APIs fragile.【F:app/page.tsx†L21-L64】【F:app/_components/home/Feed.tsx†L1-L18】
- Quick actions and gamification features are implemented as emoji-only buttons that rely on router pushes, with no semantic distinction or disabled states. The three-column gamification grid is fixed even on 320px screens, causing horizontal overflow and cramped tap targets on phones.【F:app/_components/ui/QuickTiles.tsx†L1-L18】【F:app/_components/ui/GamificationStrip.tsx†L1-L10】
- The onboarding modal manipulates DOM refs directly, lacks focus trapping / ESC handling, and queues fake assistant responses via `setTimeout`, which risks leaking timers when the component unmounts.【F:app/_components/onboarding/OnboardingModal.tsx†L1-L35】

## Backend & API issues
- `connectSrc: ['*']` in the optional CSP undermines the helmet policy; tighten to explicit origins or reuse the validated CORS list.【F:backend/src/main.ts†L164-L183】
- WebSocket gateway exposes realtime events without authentication (no token or session verification), so anyone can subscribe to fan ticket events if they know the endpoint.【F:backend/src/modules/realtime/realtime.gateway.ts†L16-L47】
- Membership service builds USSD strings from config but allows zero/negative pricing and missing shortcode values; add validation and guard rails before storing pending memberships.【F:backend/src/modules/membership/membership.service.ts†L35-L102】

## Frontend UX & navigation findings
### Navigation and information architecture
- App Router navigation component is effectively empty, and the intended bottom navigation never renders because no route participates in the `(routes)` segment. Users landing on `/tickets` or `/community` lose a consistent global nav.【F:app/navigation.tsx†L1-L3】【F:app/(routes)/layout.tsx†L1-L11】
- Top app bar relies on emoji buttons with minimal labelling. There is no actual notification centre, search dialog, or language switcher backing these controls, so they act as dead affordances.【F:app/_components/ui/TopAppBar.tsx†L4-L23】

### Responsiveness & layout
- `GamificationStrip` enforces three columns at all breakpoints, squeezing CTAs below 360px widths. Use responsive grid definitions (e.g., `grid-cols-1 sm:grid-cols-3`).【F:app/_components/ui/GamificationStrip.tsx†L1-L8】
- Hero CTA stack on the home page uses flexbox without guardrails; long match names or localised copy will overflow the buttons container on smaller screens.【F:app/page.tsx†L27-L37】
- Modal content uses fixed widths and padding; on small devices the combination of `max-w-lg` and large border radii consumes the viewport, while the background click-to-close lacks keyboard equivalence.【F:app/_components/onboarding/OnboardingModal.tsx†L16-L33】

### Accessibility
- Emoji icons in the top bar and quick tiles rely on default font rendering; screen readers only announce the emoji unless additional `aria-label`s or visually hidden text is provided. Only the hero buttons have ARIA labels; tiles and gamification CTAs need similar treatment.【F:app/_components/ui/TopAppBar.tsx†L15-L21】【F:app/_components/ui/QuickTiles.tsx†L3-L16】
- Onboarding modal renders outside of a dialog primitive, providing no focus trap, escape key handling, or announcement of dynamic assistant messages; this breaks WCAG 2.1.1 and 2.4.3 for keyboard users.【F:app/_components/onboarding/OnboardingModal.tsx†L4-L35】

## Platform, performance, and PWA
- Service worker is registered automatically on every visit and loads Workbox from a public CDN, which conflicts with the CSP settings and introduces third-party availability risk. Bundle Workbox locally and gate registration behind user consent or capability checks.【F:app/providers.tsx†L17-L31】【F:public/service-worker.js†L1-L56】【F:backend/src/main.ts†L164-L183】
- Notification permission is requested immediately after mount, without a user gesture explaining the benefit, leading to poor opt-in rates and possible Chrome console warnings.【F:app/providers.tsx†L33-L45】
- Realtime provider attempts to open socket.io connections whenever an env var exists, but does not surface connection errors or retry backoffs. Consider exposing connection state to the UI and avoiding `transports` mutation unless necessary.【F:src/providers/realtime-provider.tsx†L10-L137】

## Recommendations
1. **Navigation:** Implement a shared shell that renders `BottomNav` (or an equivalent) for all consumer routes, and populate `app/navigation.tsx` with structured metadata for the App Router.【F:app/navigation.tsx†L1-L3】【F:src/components/layout/BottomNav.tsx†L18-L51】
2. **Responsive UI:** Refactor home CTAs and gamification tiles to collapse into single-column layouts under 640px, and move CTA copy into data-driven configs rather than hard-coded strings.【F:app/page.tsx†L21-L63】【F:app/_components/ui/GamificationStrip.tsx†L1-L8】
3. **Accessibility:** Replace custom onboarding modal with a dialog primitive (Radix Dialog already exists in deps) to gain focus management, aria attributes, and escape handling out of the box.【F:app/_components/onboarding/OnboardingModal.tsx†L4-L35】
4. **PWA hardening:** Delay service worker registration until after a user opt-in, host Workbox locally, and align CSP `connect-src` with actual backend origins to avoid mixed policy signals.【F:app/providers.tsx†L17-L45】【F:public/service-worker.js†L1-L56】【F:backend/src/main.ts†L164-L183】
5. **Realtime security:** Require authenticated fan sessions or signed tokens when establishing socket connections, and configure origin allowlists directly in the gateway decorator to avoid transient permissive states.【F:backend/src/modules/realtime/realtime.gateway.ts†L16-L47】
6. **Config validation:** Add startup checks that assert presence and validity of payment shortcodes, socket paths, and telemetry endpoints so that production deploys fail fast instead of throwing runtime errors when env vars are missing.【F:backend/src/modules/membership/membership.service.ts†L35-L102】【F:app/providers.tsx†L92-L107】

## Next steps

### 1. Cross-functional navigation & onboarding workshop
- **Owner:** Design lead (Rudo) with engineering manager support.
- **Timing:** 90-minute working session scheduled for the next sprint planning cycle (target: 2025-02-19, invite sent 2025-02-14).
- **Participants:** Product/design (2), frontend (2), backend (1), QA (1) to ensure feasibility checks across stacks.
- **Agenda:**
  1. Walk through current navigation gaps (App Router shell, BottomNav adoption, onboarding modal flaws).
  2. Prioritise fixes against launch goals and engineering capacity.
  3. Define acceptance criteria for navigation consistency, onboarding accessibility, and copy.
- **Deliverables:** Agreed roadmap in Linear including owners, story points, and acceptance criteria; updated Figma navigation map.
- **Status update (2025-02-14):** Session details captured in [`docs/workshops/navigation-onboarding-workshop.md`](workshops/navigation-onboarding-workshop.md), with the calendar invite at [`docs/workshops/navigation-onboarding-workshop.ics`](workshops/navigation-onboarding-workshop.ics) distributed to attendees.

### 2. Mobile-first Playwright regression suite
- **Owner:** Frontend platform engineer (Tariro).
- **Scope:** Build Playwright smoke tests covering home, tickets, onboarding modal, and bottom navigation flows.
- **Breakpoints:** Run specs at 320px (iPhone SE) and 768px (iPad Mini) viewports in CI.
- **Tasks:**
  - Scaffold Playwright project with mobile emulation devices and add to CI workflow.
  - Capture baseline screenshots for key surfaces and fail builds on diff regressions.
  - Integrate Lighthouse assertions for key performance metrics in mobile contexts.
- **Success criteria:** All PRs trigger the suite; failures block merges until responsive issues are addressed.
- **Status update (2025-02-14):** Mobile regression specs live under [`tests/e2e/mobile`](../tests/e2e/mobile) and execute via the new Playwright multi-project configuration.

### 3. Backend deployment configuration checklist
- **Owner:** Backend lead (Kuda).
- **Artifact:** [`docs/backend-config-checklist.md`](backend-config-checklist.md) enumerates required secrets for payment gateways, realtime services, and metrics exporters, now with a deployment log template for sign-off.
- **Process:**
  - Checklist reviewed during release readiness; CI gate verifies completion before production deploy.
  - Secrets managed via 1Password -> GitHub OIDC workflow, with rotation dates logged in Grafana annotations.
- **Next action:** Present checklist during the next platform sync and integrate with existing release runbook.

