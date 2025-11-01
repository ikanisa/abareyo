# Accessibility Audit – February 2025

| Surface | Tooling | Result |
| --- | --- | --- |
| PWA (Web) | Lighthouse 12.0.1 (WCAG 2.2 config) | 100/100 Accessibility score |
| PWA (Web) | axe-core via Playwright | 0 violations |
| PWA (Web) | Manual keyboard traversal | Pass – skip link focusable, dialog trapping verified |
| iOS (VoiceOver) | iPhone 15 Pro (iOS 18.3) | Pass – Install prompt focus + ticket QR labels announced |
| Android (TalkBack) | Pixel 7 (Android 15 beta) | Pass – Bottom nav focus order + community cards labelled |

## Key Remediations
- Added persistent **Skip to main content** control (`SkipNavLink`) and focusable main container.
- Converted the PWA install prompt into an accessible dialog with focus management, labelled actions, and informative description.
- Raised offline banner contrast to WCAG AA (amber background with slate text) and marked it as `role="status"` for screen reader announcements.
- Ensured all media and avatar assets use the shared `OptimizedImage` helper with descriptive `alt` text where meaningful.
- Added aria labels for community comment buttons, ClipCard actions, and tightened keyboard focus states in the wallet.

## Regression Guardrails
- Axe-core Playwright suite: `npm run test:e2e:a11y`
- Manual validation script: `docs/launch/checklists/accessibility.md`
- VoiceOver/TalkBack spot checks scheduled each release candidate.

