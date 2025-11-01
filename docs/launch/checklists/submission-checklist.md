# Submission Checklist – App / Play Store

## Pre-Submission
- [x] Accessibility & performance checklists signed off (see `accessibility.md`, `performance.md`).
- [x] All store assets exported from `docs/launch/icons` and `docs/launch/screenshots` at required resolutions.
- [x] Promo copy synced with marketing (see `../promo-copy.md`).
- [x] `npm run build`, `npm run lint`, `npm run type-check` passing.
- [x] Playwright a11y suite (`npm run test:e2e:a11y`) green.

## Platform Specific
- [x] **Apple**: App Store Connect metadata updated, App Privacy answers reviewed, screenshots uploaded (6.7", 5.5").
- [x] **Google Play**: Content ratings confirmed, Data safety form re-submitted, screenshots uploaded (phone & 7" tablet).
- [x] **PWA (Vercel)**: `vercel --prod` dry run executed, manifest & service worker validated via `npm run lint:pwa`.

## Post-Submission Monitoring
- [x] Configure release notes referencing new accessibility improvements.
- [x] Schedule Lighthouse CI run (`npm run lint:pwa`) after production deploy.
- [x] Confirm Sentry release and Supabase edge functions deployed.

