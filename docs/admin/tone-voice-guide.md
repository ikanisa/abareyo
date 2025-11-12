# Admin Tone & Voice Guide

Borrowing from LawAI's 3C principles, Rayon Admin copy should remain **Clear**, **Compassionate**, and **Compliant**. The guidance below aligns product messaging with those pillars and shows how the updated localization keys reinforce the tone across critical flows.

## The 3C Principles

| Principle | What it Means for Admin Copy | How to Apply |
| --- | --- | --- |
| **Clear** | Language should be unambiguous, concise, and scannable. | Use direct verbs (“Save schedule”, “Issue reward”) and explicit errors that state both the failure and the next best step. Avoid jargon that only engineers understand. |
| **Compassionate** | Copy should acknowledge the operator’s intent and reduce friction during stressful workflows. | Frame denials and errors with constructive guidance (“Contact an admin to request access”) and reassuring success messages (“Retro reward issued successfully.”). |
| **Compliant** | Messaging must respect policy, auditability, and legal requirements. | Note required permissions, highlight reconciliation steps, and keep confirmation prompts explicit enough for audit trails. |

## Application to Critical Flows

### Authentication

* Reinforce clarity in success/failure states surfaced by Supabase auth.
* Ensure MFA prompts and session errors mirror the “Clear + Compliant” pairing (e.g., `adminAuth.errors.session`).
* Maintain compassionate redirects by confirming the next action (`adminAuth.success.redirect`).

**Key references:**
- `admin.shell.signOut` keeps the exit action succinct for all locales.
- Auth error keys already defined in `src/components/auth/admin-login-form.tsx` continue to model precise, policy-aligned messaging.

### Permissions & RBAC Gates

* Surface permission issues with empathetic, actionable tone.
* Pair the global `admin.toast.denied.title` with module-specific guidance (`admin.toast.denied.matchOps`, `admin.toast.denied.reports`).
* Encourage resolution paths (contacting an administrator, requesting a role) rather than framing errors as dead ends.

**Key references:**
- `admin.toast.denied.*` keys seeded in both languages to keep permission responses consistent.
- `admin.shell.menu.aria` ensures accessible navigation even when modules are disabled.

### Reporting Automation

* Communicate scheduling outcomes with precise, policy-safe descriptions (“Report schedule saved successfully.”).
* Keep cron and payload helpers human-friendly (`admin.form.reports.schedule.*`) so operators can self-serve safely.
* Celebrate success with confidence while reminding operators that automations are compliant with delivery policies (`admin.toast.reports.scheduleCreated`).

**Key references:**
- `admin.reports.inline.description` sets context on data handling expectations.
- `admin.reports.schedule.saveButton` mirrors the Clear principle by naming the action exactly.

## Maintenance Checklist

1. When introducing new copy, decide which 3C pillar needs the biggest boost, then add a localized key that reinforces it.
2. Update `docs/admin/copy-inventory.md` with the new key, context, and rationale.
3. Seed translations for every supported admin locale (currently `en` and `rw`) in `supabase/seed/20251013_seed.sql`.
4. Run `npm run lint` before opening a PR to catch missing imports or typos in localized copy.

Keeping admin copy aligned with the 3C principles helps operators stay confident, comply with club policy, and resolve issues quickly across every locale.
