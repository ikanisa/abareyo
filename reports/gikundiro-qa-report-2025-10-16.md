# QA Test Report: Gikundiro.com (Rayon Sports Fan App)

- **Test date:** 16 October 2025
- **Tester:** QA analyst (desktop session)
- **Environment:** Desktop Chromium browser (mobile-first responsive layout, 1440×900 viewport)
- **Scope:** Full click-through of primary navigation, quick actions, commerce flows, membership journeys, and settings modules for https://gikundiro.com.
- **Limitations:** `tel:` USSD invocations and `wa.me` deep links are blocked in desktop browsers; execution stops at invocation attempt. External submission steps (e.g., finalising onboarding forms) were not completed to avoid creating real data.

## Executive Summary
Gikundiro.com delivers a polished, mobile-inspired fan experience with consistent navigation, skeleton loading states, and rich matchday content. Every in-app link exercised during the 16 October 2025 session routed successfully; however, monetisation flows depend entirely on mobile-only USSD or WhatsApp handoffs, settings controls are largely unimplemented, and the public member directory fails to surface data. Addressing these gaps is critical to providing a complete desktop experience ahead of wider rollout.

## Test Scope & Methodology
- Navigated bottom navigation tabs (Home, Matches, Tickets, Shop, More) and verified active state changes.
- Exercised quick actions on the home page and validated routing to Tickets, Shop, Services, and Rewards modules.
- Traversed matchday experiences, including `/matchday` live centre, modal overlays from `/matches`, and ticket purchase flows.
- Evaluated commerce catalogue by opening each primary product tile, verifying detail page content, and attempting payment initiation.
- Reviewed profile subsections (Wallet & Passes, Rewards, Insurance & Savings, Settings) plus Help & Legal support content.
- Initiated the onboarding wizard and attempted to access the Members directory without completing final submission.
- Captured UX, performance, and accessibility observations during the walkthrough.

## Functional Coverage & Outcomes
| Area | Observations & Behaviour | Evidence |
| --- | --- | --- |
| **Home** | Hero card advertises next match ("Rayon vs APR — Sat 18:00") with Buy Ticket → `/tickets` and Match Centre → `/matchday`. Quick actions surface Tickets, Shop, Services, Rewards. Skeleton loaders precede content; scroll is smooth. | `https://gikundiro.com/`, `https://gikundiro.com/matchday` |
| **Tickets** | `/tickets` lists fixtures with VIP/Regular/Blue pricing; empty state renders "No upcoming matches" when inventory closed. Individual match detail pages expose category selectors and **Pay via USSD** CTA generating `tel:*182*…#` link (blocked on desktop). | `https://gikundiro.com/tickets` |
| **Match Centre** | `/matchday` page loads video player with quality dropdown, chat, and tabs (Highlights, Timeline, Stats, H2H). `/matches` cards open modal overlay with live stats, timeline, line-ups, and Buy Ticket routing. | `https://gikundiro.com/matches`, `https://gikundiro.com/matchday` |
| **Shop** | `/shop` displays merchandise grid (home/away/heritage jerseys, training wear, hoodies, accessories). Product detail pages include gallery, size/colour selectors, description, material & care, shipping info, **Pay via USSD** button (blocked). | `https://gikundiro.com/shop`, `https://gikundiro.com/shop/<product>` |
| **Wallet & Passes** | `/more/wallet` lists issued passes with match, date, gate, and "Collect at gate" labels; no interactions available. | `https://gikundiro.com/more/wallet` |
| **Rewards** | `/more/rewards` shows user points (180 in test account), tier (Silver), "Redeem Free Ticket" CTA linking back to `/tickets`. Latest Perk, History, and How it works sections show placeholder/static content only. | `https://gikundiro.com/more/rewards` |
| **Insurance & Savings** | `/more/insurance-savings` presents partner cards. Insurance → WhatsApp deep link (blocked). Savings → USSD `tel:` link (blocked). No desktop fallback or copyable code. | `https://gikundiro.com/more/insurance-savings` |
| **Settings & Support** | Settings lists Language, Theme, Notifications, Help & Legal; only Help & Legal is actionable. Support hub provides hotline (`*651#`), email (`support@gikundiro.rw`), and shortcuts to Tickets, Shop, Services guides. | `https://gikundiro.com/more/settings`, `https://gikundiro.com/support` |
| **Membership** | Home CTA "Join & be visible" launches three-step onboarding (Full Name → Display Name → Language). Submission halted before final send. `/members` directory returns "Unable to load members" message, implying backend outage or empty dataset. | `https://gikundiro.com/members` |

## UX, Performance & Accessibility Notes
- **Responsiveness:** Layout targets mobile devices; on desktop (1440px) the generous spacing is still usable but could be tightened for wide screens.
- **Loading states:** Skeleton loaders are consistent yet linger at times on slower responses. Consider progressive data fetching or loader-to-content transitions.
- **Desktop parity:** Reliance on mobile tel/WhatsApp handoffs prevents completion of high-value flows from desktop browsers.
- **Accessibility:** Icon buttons lack text alternatives, gradient overlays reduce text contrast in sections, and keyboard focus order is not clearly indicated. Additional accessibility QA is recommended.

## Defects & Impact Assessment
| ID | Issue | Impact | Affected Areas |
| --- | --- | --- | --- |
| D-01 | USSD/WhatsApp-only payment & partner flows fail on desktop | High – blocks ticket purchase, merchandise checkout, savings & insurance leads | Tickets, Shop, Services |
| D-02 | Settings (Language, Theme, Notifications) are non-functional | Medium – prevents user customisation and undermines expectations | Settings |
| D-03 | Members directory shows persistent "Unable to load members" error | Medium – community feature inaccessible, potential backend/API fault | Members |
| D-04 | Rewards history and perk sections are static placeholders | Low – reduces engagement and clarity on programme value | Rewards |

## Recommendations & Next Steps
1. **Introduce desktop-friendly payment fallbacks:** Embed web-based mobile money or card checkout, and add copy-to-clipboard USSD instructions when `tel:` schemes are unavailable.
2. **Provide alternative partner service contact paths:** Offer web forms or mailto links for Insurance/Savings modules alongside WhatsApp/USSD.
3. **Complete settings functionality:** Implement toggles for language, theme (light/dark), and notifications with immediate visual confirmation and persisted state.
4. **Stabilise members directory:** Investigate API/data feed; if empty, replace error with informative empty state encouraging opt-in.
5. **Enrich rewards content:** Surface redemption history, perk details, and earning tips to drive engagement.
6. **Tune skeleton loaders and accessibility:** Optimise loader timing, add descriptive labels/aria text to icon controls, and ensure contrast ratios meet WCAG requirements.

## Conclusion
The October 2025 QA session confirms the fan app’s navigation, matchday content, and commerce catalog load reliably, yet highlights key blockers for desktop users. Resolving mobile-only dependencies, shipping core settings, and restoring community data should be prioritised before broad marketing pushes or desktop launch campaigns.
