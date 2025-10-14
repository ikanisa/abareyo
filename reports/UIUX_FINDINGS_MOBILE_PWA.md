# UI/UX Mobile & PWA Findings

## Mobile Home Review
- **Hero & CTA:** Headline and CTAs present but no responsive imagery or countdown; hero actions rely on plain buttons without analytics instrumentation.【F:app/(routes)/_components/HomeClient.tsx†L31-L81】
- **Content Modules Missing:** No stories carousel, live ticker, upcoming fixtures, wallet mini, sponsors, or community highlights; only placeholder feed cards render static copy.【F:app/(routes)/_components/HomeClient.tsx†L92-L110】【F:app/_components/home/Feed.tsx†L1-L19】
- **Quick Actions:** Grid uses emoji tiles without minimum 44px tap height on small screens and lacks `prefers-reduced-motion` handling.【F:app/_components/ui/QuickTiles.tsx†L1-L20】
- **Gamification Strip:** Cards misaligned (extra indentation) and no progress indicators or motion easing controls.【F:app/_components/ui/GamificationStrip.tsx†L7-L24】
- **Top App Bar:** Static emoji icons for notifications/search/language; language switch lacks actual i18n hook, and onboarding entry hidden behind emoji button with no badge state.【F:app/_components/ui/TopAppBar.tsx†L9-L38】

## PWA & Onboarding
- Service worker only registers after a hidden `PWA_OPT_IN` flag is set, so first-time users get no offline caching; modal or FAB needs to surface opt-in affordance with analytics.【F:app/providers.tsx†L45-L147】
- Manifest and icons exist, but no install prompt or `beforeinstallprompt` handling to inform users.

## Accessibility Observations
- Feed cards use `<section>` without heading hierarchy context, and hero sections duplicate `h1` semantics without `aria-describedby` for kicker text.【F:app/(routes)/_components/HomeClient.tsx†L31-L38】【F:app/_components/home/Feed.tsx†L1-L19】
- Emoji buttons (TopAppBar) rely on glyphs without visually hidden labels beyond `aria-label`, but no focus visible styling is defined for keyboard users.【F:app/_components/ui/TopAppBar.tsx†L20-L35】

## Recommended UX Enhancements
1. Introduce modular sections for live ticker, stories, wallet balance, membership carousel, sponsors, and FAB onboarding entry with progress state.【F:app/(routes)/_components/HomeClient.tsx†L92-L115】
2. Replace emoji icons with design-system buttons (Lucide/Tailwind), ensure 44px touch targets, and add analytics events for hero/quick actions.【F:app/_components/ui/QuickTiles.tsx†L1-L20】【F:app/_components/ui/TopAppBar.tsx†L20-L35】
3. Implement skeleton loaders and offline placeholders for feed/gamification modules to avoid blank states when network stalls.【F:app/_components/home/Feed.tsx†L1-L19】【F:app/_components/ui/GamificationStrip.tsx†L7-L24】
4. Surface PWA opt-in via modal/FAB with choice persistence, and auto-register service worker on accept to deliver offline experience.【F:app/providers.tsx†L45-L147】

## Phase Completion Update
- Home modules now hydrate from the consolidated surface builder, shipping live ticker, stories, wallet, and sponsor rails with analytics and skeletons to satisfy the mobile experience goals.【F:app/(routes)/_components/HomeClient.tsx†L1-L260】【F:src/lib/home/surface-data.ts†L1-L230】
- Quick actions, gamification strips, and top app bar controls have adopted Lucide icons, 44px touch targets, and reduced-motion fallbacks, closing the accessibility findings.【F:app/_components/ui/QuickTiles.tsx†L1-L120】【F:app/_components/ui/GamificationStrip.tsx†L1-L120】
- The onboarding + PWA helpers persist timestamped opt-in preferences and expose install prompts across iOS/Android, keeping offline experiences consistent while respecting TTL-based expiry.【F:app/_components/pwa/PwaHelpers.tsx†L1-L120】【F:app/_lib/pwa.ts†L1-L115】
