# On-Call Enablement Checklist

Use this checklist during on-call handoff meetings and quarterly readiness reviews to ensure responders can execute the Incident Response and Disaster Recovery runbooks effectively.

## Access & Tooling
- [ ] PagerDuty (or designated alerting tool) schedule updated with current rotation and contact overrides.
- [ ] Slack channels `#incident-response` and `#on-call` joined and notifications configured.
- [ ] Hosting platform access verified for production and failover deployments.
- [ ] Supabase dashboard permissions confirmed (database, storage, edge functions).
- [ ] Kubernetes context for production and failover clusters saved locally via `kubectl config use-context rayon-prod` / `rayon-failover`.
- [ ] Secrets manager/vault entries tested for read access to API keys and service accounts.

## Runbook Familiarity
- [ ] Reviewed the [Incident Response Runbook](./incident-response.md) and acknowledged alert triage + escalation steps.
- [ ] Reviewed the [Disaster Recovery Runbook](./disaster-recovery.md), including quarterly failover drill expectations.
- [ ] Confirmed location of post-incident templates under `docs/runbooks/post-incident/` and `reports/operations-log.md`.
- [ ] Practiced communications templates (Slack + email) with the product communications lead.

## Environment Health Pre-checks
- [ ] Smoke tests executed within the last 7 days (`node scripts/preflight.mjs`, `npm run smoke:telemetry`).
- [ ] Grafana dashboards bookmarked with personalized alerts for latency, error rate, and resource saturation panels.
- [ ] Sentry alert rules reviewed for threshold accuracy and notification routing.
- [ ] Feature flag dashboard access confirmed (admin panel → Admin → Feature Flags).

## Handoff Ritual
- [ ] Outgoing on-call shared summary of open incidents, mitigations, and outstanding follow-ups.
- [ ] Deployment freeze windows noted (matchdays, campaigns) and added to shared calendar.
- [ ] Escalation contact list (`config/oncall-contacts.yaml`) reviewed and updates communicated to engineering manager.
- [ ] Next quarterly failover drill date acknowledged and prep owner assigned.

## Distribution
- Share this checklist and the linked runbooks in the `#on-call` Slack channel at the start of each rotation.
- Archive completed checklists in `reports/operations-log.md` with timestamp and assignee signature.

