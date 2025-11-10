# Data Handling Approvals

_Last updated: 2025-10-22_

## Summary
- Legal, privacy, and security stakeholders reviewed supporter data flows covering account onboarding, ticketing, payments, and behavioural analytics.
- DPIA outcomes and retention schedules align with the controls documented in the security and observability handbooks to maintain auditability.
- Approval artefacts live in this repo to support regulator or app store submissions on request.

## Approval log
| Area | Approver | Decision date | Evidence |
| --- | --- | --- | --- |
| Data Protection Impact Assessment (DPIA) | Nadine U., Data Protection Officer | 2025-10-18 | DPIA record summarised in [`docs/security.md`](../security.md#platform-threat-model) with mitigations mapped to Supabase and Next.js services. |
| Privacy Notice & User Rights | Leonidas M., Legal Counsel | 2025-10-19 | Public-facing copy published at `/legal/privacy`, `/legal/terms`, and `/legal/cookies` (see `app/legal/*`). |
| Cookie Classification & Consent | Esther K., Support Lead | 2025-10-20 | Cookie inventory reviewed against session management guidance in [`src/lib/auth.ts`](../../src/lib/auth.ts) and the fan/admin session policies documented in [`docs/security.md`](../security.md#baseline-controls). |
| Observability Data Governance | Patrick B., SRE | 2025-10-20 | Logging & metrics retention approved per [`docs/observability.md`](../observability.md#log-shipping-grafana-loki) and Prometheus alert rules in [`docs/observability/prometheus-rules.yml`](../observability/prometheus-rules.yml). |

## Notes
- Support can reference this page when responding to privacy export or deletion requests to confirm organisational approval.
- Any changes to data processors or retention schedules must be re-reviewed; update this log with new dates and evidence links.
