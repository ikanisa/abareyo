# Security, Performance & Accessibility Notes

## Security
- **Headers:** No CSP, Referrer-Policy, or frame protections defined; configure via `next.config.mjs` or middleware.【F:next.config.mjs†L6-L21】
- **Locale Rewrites:** Middleware rewrites based on `referer`, allowing crafted headers to redirect users; validate against allowlist or signed cookie before redirect.【F:middleware.ts†L3-L46】
- **Env Enforcement:** Client config throws on missing env vars inside browser bundle, potentially exposing env requirements and breaking runtime; restrict throwing to server build path and fallback gracefully.【F:src/config/client.ts†L23-L78】
- **Opt-in Storage:** PWA opt-in stored in localStorage without expiry; consider using indexed preference with TTL and telemetry audit trail.【F:app/providers.tsx†L45-L147】

## Performance
- **Build Failures:** Production build currently fails, preventing any profiling or bundle analysis.【f5c711†L1-L122】
- **Component Structure:** Home modules are client components even where static data would suffice; convert hero/sections to server components to reduce bundle weight.【F:app/(routes)/_components/HomeClient.tsx†L1-L118】
- **Animations:** Framer Motion used without `prefers-reduced-motion` checks, risking performance and accessibility on low-end devices.【F:app/_components/ui/TopAppBar.tsx†L9-L38】【F:app/(routes)/_components/HomeClient.tsx†L74-L81】

## Accessibility
- **Form Controls:** Onboarding modal resets input without null guard, risking runtime error that would break assistive tech flows.【F:app/_components/onboarding/OnboardingModal.tsx†L55-L77】
- **Keyboard Support:** Emoji buttons in top bar lack focus-visible styling; add Tailwind `focus-visible` utilities to ensure compliance.【F:app/_components/ui/TopAppBar.tsx†L20-L35】
- **Heading Hierarchy:** Feed uses repeated `<section>` without headings, confusing screen readers; replace with list semantics and accessible headings.【F:app/_components/home/Feed.tsx†L1-L19】

## Actions
1. Add `next-safe-middleware` with CSP + security headers and restrict locale redirects.【F:next.config.mjs†L6-L21】【F:middleware.ts†L3-L46】
2. Refactor `clientConfig` to tolerate missing env variables locally, log warnings, and ensure defaults for socket path.【F:src/config/client.ts†L23-L78】
3. Convert hero/top bar to respect `prefers-reduced-motion` and add focus-visible styling to all actionable elements.【F:app/(routes)/_components/HomeClient.tsx†L74-L81】【F:app/_components/ui/TopAppBar.tsx†L20-L35】

## Status Update — Outstanding Items Closed
- CSP, referrer policy, and transport headers now ship via the central security helper used by both runtime headers and middleware, satisfying the hardening requirement.【F:config/security-headers.mjs†L1-L66】【F:next.config.mjs†L6-L24】
- Locale-based redirects only trigger for trusted hosts and known locales, preventing crafted `Referer` headers from hijacking navigation while keeping language affordances intact.【F:middleware.ts†L1-L64】
- PWA opt-in preferences persist with timestamped records and a 180-day TTL, ensuring stale choices expire automatically and analytics receive structured events.【F:app/_lib/pwa.ts†L1-L115】【F:app/providers.tsx†L7-L73】
