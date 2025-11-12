# Admin Microcopy Audit

Date: 2025-11-11
Reviewer: UX Copy & Localization

## Summary
We reviewed the highest-traffic admin modules and surfaces that gate daily operations. The audit focused on headings, helper text, toasts, and empty states to align them with the 3C’s (clear, concise, consistent) while ensuring every string is localizable via `useAdminLocale`.

## Findings & Actions
| Module | Issue | Impact | Action | Status |
| --- | --- | --- | --- | --- |
| `src/components/admin/AdminShell.tsx` | Nav labels, helper banners, and toasts mixed localized and hard-coded strings. Permission toasts were wordy and inconsistent. | Created friction when switching locales; tone felt abrupt in denials. | Routed all interactive copy through `useAdminLocale`, rewrote denied messages to state condition → next step, and added keys for search, language toggle, and account actions. | ✅ Resolved |
| `src/components/admin/AdminOfflineNotice.tsx` | Offline state strings were hard-coded, verbose, and lacked escalation guidance aligned with LawAI transparency. | Ops teams lacked a consistent script during incidents; no localization support. | Wrapped notice in the admin locale provider, defined reason-based headlines/helper text, added contact guidance, and trimmed instructions to one action per sentence. | ✅ Resolved |
| `src/views/AdminMatchOpsView.tsx` | Match Ops UI contained dense paragraphs, inconsistent sentence case, and non-localized toasts/empty states. | Risked misreads during incident response; impossible to translate. | Centralized copy via `useAdminLocale`, renamed sections for clarity, tightened empty states, and added translation keys for success/error toasts, forms, and metrics. | ✅ Resolved |
| `app/admin/(dashboard)/layout.tsx` | Backend failure messages remain server-side constants. | Localized fallback is deferred. | Documented for follow-up once server-side translation helpers land. | ⚠️ Tracked |

## Follow-Up Backlog
1. Expand localization coverage to additional admin views (Rewards, Services, SMS) once component-level `t` adoption matures.
2. Provide French (fr) dictionary once translation service is stabilized.
3. Evaluate server-rendered copy (`app/admin/(dashboard)/layout.tsx`) for SSR-friendly translation utilities.
4. Socialize `npm run lint:admin-copy` with engineering leads and add it to CI once the broader admin surfaces adopt `t`.

## Checklist Adoption
- [x] Voice guide published in `docs/ux/admin-copy.md`.
- [x] Localization coverage documented above.
- [x] `npm run lint:admin-copy` added to guardrails.
- [ ] Extend lint coverage to every admin workspace file (blocked by legacy strings).
