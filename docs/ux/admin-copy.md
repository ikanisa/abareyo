# Admin Voice & Tone Guide

This guide extends the global content strategy and LawAI-inspired principles of clarity, accountability, and empathy. Admin copy must enable rapid decision-making without sacrificing trust or compliance.

## Core Principles
- **LawAI Integrity** – Default to language that is accurate, auditable, and bias-aware. Confirm actions, cite sources when relevant, and surface accountability paths.
- **Operational Clarity** – Lead with the outcome or required action, then provide the context needed to decide quickly. Keep the 3C’s (clear, concise, consistent) visible in every string.
- **Respect for Time & Attention** – Admins triage incidents. Use short sentences, front-load key facts, and reserve friction for irreversible changes.
- **Calm Authority** – Acknowledge issues without alarmism. Celebrate recoveries, not disruptions. Avoid blame and offer corrective guidance.
- **Inclusive Accessibility** – Support bilingual execution (EN/RW today) and keep copy screen-reader friendly. Prefer verbs over jargon, sentence case over title case, and inclusive naming.

## Tone by Scenario
| Scenario | Voice & Tone | Microcopy Pattern |
| --- | --- | --- |
| **Healthy system** | Confident, succinct, data-backed. | `Metric label → brief qualifier (e.g., “Last 7 days”)` |
| **Action required** | Direct, instructive, with a single next step. | `Imperative verb + condition + safety net.` |
| **Degraded state** | Calm acknowledgment, status detail, remediation path. | `Status summary. Impact sentence. Recovery action.` |
| **Permissions** | Respectful, policy-referencing. | `Access condition + request path.` |
| **Success toast** | Appreciative but brief. | `Outcome achieved + key detail.` |
| **Error toast** | Clear, non-technical fallback guidance. | `Failure + cause (if known) + next step.` |

## Writing Checklist
1. Does the string state the outcome first?
2. Is the verb active and does it match an admin capability?
3. Can the sentence survive without jargon or acronyms? If not, define them inline.
4. Are all destructive actions paired with a reversible cue or contact path?
5. Did you provide localization keys using `useAdminLocale` with meaningful namespaces (e.g., `admin.matchOps.toast.createSuccess`)?
6. Are times, currencies, and quantities formatted with helpers, never hard-coded?
7. Did you run `npm run lint:admin-copy` to catch untranslated JSX text?

## LawAI Alignment Reminders
- **Transparency:** Show where data came from or when it is stale. Use `Refreshed <timestamp>` patterns.
- **Accountability:** Mention who to contact when escalations are needed (Ops desk, Legal, Support) without assigning fault.
- **Fairness:** Avoid assumptive language about users or roles. Reference permissions, not personas.
- **Safety:** Flag irreversible operations and make protective defaults explicit.

Adopt these principles in PR descriptions, release notes, and in-app guidance to keep Rayon’s admin experience principled and dependable.
