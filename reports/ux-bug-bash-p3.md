# P3 UX Bug Bash Summary

_Date: 2025-10-21_

## Participants
- Product design (Ange)
- Frontend (Tariro)
- QA (Mwiza)

## Scope
- Mobile home surface (stories, live ticker, feed, gamification)
- Offline failover and cached content bannering
- Accessibility quick sweep (screen reader labels, focus order)

## Findings & Fixes
| Area | Issue | Resolution |
| --- | --- | --- |
| Feed offline state | Feed rendered blank cards when offline with no cached data | Added skeletons, offline messaging, and retry action in `Feed` leveraging cached payloads. |
| Missions progress | Gamification grid did not communicate offline state, confusing testers | Introduced inline offline banner and offline-specific empty state while keeping keyboard focus order intact. |
| Retry affordance | No manual retry option after reconnect | Added `Retry now` action wired to React Query `refetch` for the feed module. |
| Copy clarity | Offline banner copy referenced "resync" with jargon | Updated copy to plain language in both feed and gamification banners. |
| Runbook gap | Operators lacked guidance to verify cache freshness | Expanded `docs/runbooks/operations.md` with offline validation steps. |

## Accessibility Spot Checks
- Verified offline banners announce via `aria-live="polite"`.
- Confirmed skeleton containers have `aria-hidden` to avoid double announcements.
- Ensured retry button uses semantic `<button>` with underline styling for visibility.

## Follow-ups
- Localise new offline strings in Kinyarwanda before launch.
- Extend Playwright suite with offline simulation once browsers are available in CI.
