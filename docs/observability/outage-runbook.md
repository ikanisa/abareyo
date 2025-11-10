# Major Incident & Outage Runbook

Follow this checklist when the platform experiences a customer-facing outage or degradation lasting more than five minutes.

## 1. Declare & communicate
- Page the primary on-call engineer and announce the incident in the `#alerts` Slack channel.
- Post an initial status message referencing the affected SLO (HTTP error rate, latency, SMS backlog, or gate scans).
- Assign roles: incident commander, communications lead, and subject-matter expert.

## 2. Stabilise the service
1. **Use the Grafana dashboard** to confirm the scope of the outage and identify which SLO breached first.
2. **Check Sentry** for spikes in the current release; if the failures correlate with a fresh deploy, initiate an automated rollback using the deployment pipeline.
3. **Inspect Prometheus targets** to ensure `/metrics` is still reachable. If the scrape fails, treat it as a platform-level outage and escalate to infrastructure immediately.
4. **Leverage Loki** by filtering for the correlation IDs surfaced in Sentry. This ties together mobile, web, and backend events so we can identify cross-cutting failures.

## 3. Recovery actions
- Roll back the most recent release or disable the offending feature flag.
- Scale backend replicas via Kubernetes or the hosting provider if saturation is the cause.
- Switch SMS delivery to the contingency provider if `RayonSmsQueueBacklog` persists beyond 10 minutes.
- For ticket gate issues, coordinate with venue operations to fall back to manual validation while engineering restores the scanners.

## 4. Verification
- Confirm the Grafana _Rayon Observability_ dashboard returns to baseline (error rate < 1%, p95 < 500ms).
- Ensure Prometheus alerts auto-resolve and that Sentry issue counts drop.
- Validate that mobile and web clients report healthy correlation IDs by observing a few synthetic transactions end-to-end.

## 5. Post-incident
- File an incident report in `reports/operations-log.md` within 24 hours.
- Capture key correlation IDs, Sentry links, Grafana panel snapshots, and code commits involved in the rollback.
- Schedule a blameless retrospective and open follow-up tickets for monitoring gaps or automation improvements.
