# Alert Response Runbook

This runbook covers the automated alerts defined in [`infra/monitoring/prometheus/rules/rayon-slo.yml`](../../infra/monitoring/prometheus/rules/rayon-slo.yml).
Use it whenever Prometheus pages the on-call engineer or when Grafana dashboards show degraded SLOs.

## High HTTP 5xx rate (`RayonHighErrorRate`)
1. **Triage**
   - Confirm the alert fired by checking the "Error Budget Burn" and "HTTP Requests (by status)" panels on the Grafana _Rayon Observability_ dashboard.
   - Inspect the `/metrics` endpoint directly to ensure Prometheus is scraping fresh data.
2. **Scope the blast radius**
   - Query Sentry for new issues tagged with the active release and correlation IDs from failing requests.
   - Review Loki logs filtered by `correlationId=<value>` to tie user sessions to backend traces.
3. **Mitigation**
   - Roll back the most recent deployment if the regression correlates with the current release tag.
   - If the issue is limited to a single route, consider feature flagging the affected path off via the admin console.
4. **Follow-up**
   - Document the root cause in the operations log and link the Sentry issue.
   - File a ticket for any missing regression coverage uncovered during triage.

## Elevated latency (`RayonHighLatencyP95` / `RayonElevatedLatencyP99`)
1. Check the latency panels and compare p95 vs. p99 to determine whether the spike is systemic or isolated to slow endpoints.
2. Verify database health (connection counts, slow queries) and Supabase latency via its status page.
3. Scale the backend deployment if CPU saturation is observed. If the spike aligns with downstream outages, enable the graceful degradation path in the feature flags service.

## SMS queue backlog (`RayonSmsQueueBacklog`)
1. Confirm backlog in Grafana and cross-reference with the SMS provider dashboard.
2. Inspect Loki for `sms` logs with high retry counts; requeue failed messages via the admin console if necessary.
3. If the provider is degraded, announce the impact to support and pause non-critical SMS campaigns.

## Gate scan failures (`RayonGateScanFailures`)
1. Verify scanners in the field by contacting venue operations.
2. Audit recent gate updates in the admin UI and check Loki logs filtered by `gate` label.
3. Escalate to hardware support if rejection rate remains above 5% after verifying backend health.
