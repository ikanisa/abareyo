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

