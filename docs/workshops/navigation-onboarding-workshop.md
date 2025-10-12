# Navigation & Onboarding Remediation Workshop

**Status:** Scheduled (invite sent 2025-02-14)
**Calendar:** [Download `.ics` invite](navigation-onboarding-workshop.ics)

- **When:** Wednesday, 19 February 2025 — 14:00–15:30 CAT (before feature freeze for the fan launch).
- **Where:** Hybrid (Product squad war-room + Google Meet `meet.google.com/abc-defg-hij`).
- **Facilitators:** Rudo (Design Lead), Tino (Engineering Manager).
- **Participants:** Neo (Product), Tariro (Frontend Platform), Sifa (Frontend), Brighton (Backend), Chido (QA), Mercy (Support Ops).
- **Objectives:**
  1. Prioritise the navigation shell fixes (App Router metadata, BottomNav integration, top-bar affordances) for the fan release.
  2. Align onboarding accessibility improvements with design standards and analytics instrumentation.
  3. Produce an implementation sequence with owners and acceptance criteria captured in Linear tickets.
- **Pre-work checklist:**
  - ✅ Review the current `app/navigation.tsx`, `(routes)` layout gaps, and the onboarding modal implementation.
  - ✅ Collect analytics from the last closed beta (nav drop-off, onboarding completion).
  - ✅ Tariro to demo the new Playwright mobile regression run (see `tests/e2e/mobile`).
  - ☐ Share read-ahead deck covering proposed nav information architecture updates.
  - ☐ Confirm workshop room A/V works for hybrid dial-in.
- **Agenda:**
  1. 10 min — Walkthrough of identified UX gaps (Design).
  2. 20 min — Breakout to draft IA updates and onboarding flow (Design + Product).
  3. 20 min — Engineering feasibility review, spike estimation, and dependency mapping.
  4. 20 min — Define QA acceptance criteria and analytics instrumentation updates.
  5. 10 min — Recap, assign Linear tickets, confirm follow-up checkpoints.
- **Exit criteria:**
  - Linear project `NAV-ONBOARD-2025` populated with prioritised tickets, owners, and due dates.
  - Updated navigation sitemap in Figma shared with attendees.
  - Slack summary posted in `#fan-app` with workshop outcomes and decision log.

## Follow-up milestones

- **2025-02-20:** Distribute meeting minutes and attach recording to the Linear project.
- **2025-02-24:** Engineering to complete sizing on top 3 navigation backlog items.
- **2025-02-28:** QA to translate workshop acceptance criteria into test plans (including mobile Playwright cases).
