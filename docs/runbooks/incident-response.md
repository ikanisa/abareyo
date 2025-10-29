# Incident Response Runbook

This runbook equips the Rayon Sports digital operations team to detect, triage, and resolve production incidents that affect the fan experience or core revenue flows.

## 1. Detection & Initial Response
- **Monitoring sources**: Grafana (latency/error dashboards), Sentry (unhandled exceptions), Supabase status page, real-time admin alerts, and user reports via support inbox or social channels.
- **On-call activation**: The on-call engineer keeps PagerDuty and Slack notifications enabled 24/7 during the rotation. Acknowledgement is required within 5 minutes of an alert.
- **Immediate tasks**:
  1. Acknowledge the alert in PagerDuty or the alerting channel.
  2. Log start time in `reports/operations-log.md` with incident ID (e.g., `INC-2025-10-22-01`).
  3. Capture snapshots of affected dashboards (Grafana panel export or Sentry event link) for later analysis.

## 2. Alert Triage & Severity Classification
1. **Gather context**:
   - Check Grafana for correlated spikes in latency, error counts, or resource exhaustion.
   - Review the last deployment in the hosting platform and Supabase change log for recent configuration changes.
   - Inspect Sentry issues for stack traces, tags (release, route, locale), and user impact.
2. **Determine severity** using the following rubric:
   - **SEV1** – Complete outage for matchday-critical surfaces (home feed, ticketing, wallet) with >50% of active users impacted.
   - **SEV2** – Degraded functionality or elevated error rates affecting revenue or engagement funnels but with workarounds available.
   - **SEV3** – Non-critical regressions, background job failures, or instrumentation gaps that do not block users.
3. **Decide next steps**:
   - SEV1: Page the engineering manager and product lead immediately; freeze deployments.
   - SEV2: Notify engineering manager, continue mitigation, and evaluate rollback options.
   - SEV3: Create a task in Linear/Jira and schedule follow-up within 24 hours.

## 3. Escalation Paths
- **Primary on-call engineer**: Responds to alerts, coordinates debugging, and keeps the incident channel updated.
- **Secondary engineer**: Jumps in if primary is unresponsive for 10 minutes or requests assistance. Responsible for code-level fixes.
- **Engineering manager**: Engaged for SEV1/SEV2 incidents to coordinate cross-team resources and approve rollbacks.
- **Product & communications lead**: Drafts customer-facing updates when downtime exceeds 15 minutes or impacts revenue paths.
- **Vendor contacts**: Supabase, payment processor, and hosting platform support. Keep access credentials in the secure vault and copy links in the incident Slack channel topic.

Escalation flow:
1. Primary on-call acknowledges alert.
2. If mitigation not underway within 15 minutes or impact is SEV1, escalate to engineering manager and secondary engineer via PagerDuty multi-page.
3. For sustained outages (>30 minutes) inform executive sponsor via phone/SMS per contact list in `config/oncall-contacts.yaml`.

## 4. Mitigation & Remediation
- Capture diagnostics: relevant logs, metrics queries, database snapshots (read-only).
- Evaluate mitigations in order: feature flag rollback, redeploy from last known good build, Supabase function revert, backend scaling adjustments.
- Confirm mitigation success by observing recovery in Grafana and verifying user flows manually (home feed, wallet top-up, ticket purchase).
- Document commands or toggles executed in the incident channel for postmortem accuracy.

## 5. Communications & Status Updates
- **Cadence**: Provide updates every 15 minutes for SEV1 and every 30 minutes for SEV2 until resolved.
- **Channels**: `#incident-response` Slack channel (internal), status email template (external stakeholders), and platform status note if applicable.

### Slack template
```
:rotating_light: Incident Update – {{incident_id}}
Severity: {{sev_level}}
Impact: {{summary of affected surfaces}}
Current action: {{mitigation or investigation step}}
Next update: {{timestamp in local timezone}}
Owner: {{on-call engineer}}
```

### Email template (stakeholders)
```
Subject: [Incident {{incident_id}}] {{sev_level}} impact to Rayon digital platform

Team,

We are investigating a {{sev_level}} incident affecting {{summary of impact}}.

Current status: {{one-line summary of mitigation or rollback}}
Estimated next update: {{time}}

We will provide the next update via email and Slack #stakeholder-updates.

Thanks,
{{on-call engineer name}}
Rayon Sports Digital Ops
```

## 6. Resolution & Post-Incident Actions
1. Declare resolution when metrics and smoke tests (`npm run smoke:telemetry`, `npm run test:unit -- --run tests/unit/home-interactive-layer.test.tsx`) pass and manual verification is successful.
2. Post a final Slack update summarizing root cause, mitigation, and follow-up tasks.
3. Open a postmortem doc under `docs/runbooks/post-incident/` within 24 hours, capturing timeline, contributing factors, and preventive actions.
4. Schedule backlog tasks for long-term fixes; ensure owners and due dates are recorded.

## 7. Documentation & Continuous Improvement
- Review this runbook quarterly with the on-call rotation.
- Update escalation contacts whenever the engineering roster changes.
- Incorporate lessons learned from postmortems into alert thresholds, feature flag policies, and deployment checklists.

