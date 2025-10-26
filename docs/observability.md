Observability Setup

Prometheus

- Scrape the backend `/metrics` endpoint using a bearer token.
- Example scrape config (replace variables accordingly):

  - job_name: rayon-backend
    metrics_path: /metrics
    scheme: http
    authorization:
      credentials: ${METRICS_TOKEN}
    static_configs:
      - targets: ['api.rayon.local:5000']

Metrics

- HTTP
  - `rayon_http_requests_total{method,route,status}`
  - `rayon_http_request_duration_seconds_bucket{method,route,status}`
- Queues
  - `rayon_sms_queue_depth`
- Domain events
  - `rayon_gate_scans_total`

Dashboards

- Example SLOs
  - HTTP 5xx rate < 1%
  - p95 latency < 500ms
  - SMS queue depth < 100

Alerts (PromQL examples)

- High error rate:
  - increase(rayon_http_requests_total{status=~"5.."}[5m]) / increase(rayon_http_requests_total[5m]) > 0.01
- High latency p95:
  - histogram_quantile(0.95, sum by (le, route) (rate(rayon_http_request_duration_seconds_bucket[5m]))) > 0.5

Importing alert rules

- Load `docs/observability/prometheus-rules.yml` in the Prometheus Alertmanager or Grafana Alerting UI:
  - Prometheus: copy the file into the `rules/` directory mounted for the Rayon stack and reload the configuration (`/-/reload`).
  - Grafana Alerting: navigate to **Alerting → Alert rules → Migrate rule**, choose **Import JSON/YAML**, and paste the file contents to seed the Rayon SLO alerts (HTTP error rate, latency, SMS queue depth).
- Pair the rules with the existing Grafana dashboard (`docs/grafana/backend-overview.json`) to visualise service health alongside alerts.

Log shipping (Grafana Loki)

- Both the Next.js frontend and the NestJS backend stream structured logs to Loki when `LOKI_URL` is configured.
- Supported environment variables:
  - `LOKI_URL`: Loki push endpoint (e.g. `https://logs-prod.grafana.net`).
  - `LOKI_BASIC_AUTH` **or** (`LOKI_USERNAME`, `LOKI_PASSWORD`): credentials for Grafana Cloud or self-hosted Loki.
  - `LOKI_TENANT_ID`: optional tenant/org identifier (adds `X-Scope-OrgID`).
  - `LOKI_BATCH_INTERVAL`: seconds between batch flushes (default `5`).
- Next.js request/console logs are mirrored to Loki through `instrumentation.ts`; backend request logs use a `pino-loki` transport configured in `backend/src/main.ts`.
- Logs retain an `env` label sourced from `NEXT_PUBLIC_ENVIRONMENT_LABEL`/`NODE_ENV` for per-environment filtering.

Sentry

- Environment-specific DSNs can be supplied either through discrete variables (`SENTRY_DSN_PRODUCTION`, `NEXT_PUBLIC_SENTRY_DSN_STAGING`, etc.) or JSON maps:
  - Server/backend map: `SENTRY_DSN_MAP='{"production":"https://example@sentry.io/123"}'`.
  - Client map: `NEXT_PUBLIC_SENTRY_DSN_MAP` with the same shape for browser bundles.
- The frontend resolves DSNs via `src/lib/observability/sentry-config.ts` and initialises Sentry in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.
- The backend enables Sentry during bootstrap (`backend/src/main.ts`), wiring the global `SentryInterceptor` to capture exceptions across controllers.

Synthetic probes

- GitHub Actions workflow `.github/workflows/observability-probes.yml` runs every 10 minutes and hits `/api/health` and `/metrics`.
- Configure the following repository secrets before enabling the cron job:
  - `PROBE_BASE_URL`: base URL of the deployed site (e.g. `https://app.rayon.gg`).
  - `PROBE_METRICS_TOKEN`: bearer token protecting `/metrics` (optional if the endpoint is public).
  - `PAGERDUTY_ROUTING_KEY`: PagerDuty Events API v2 key for paging on failures.
- Probe outputs are stored as GitHub Action artifacts and included in the job summary for quick triage.

