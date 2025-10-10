Cutover Readiness Checklist

Technical
- CI green: lint, unit, e2e smokes (mocked or against staging)
- Backend migrations applied to staging, seed executed
- Images published (frontend/backend) and pulled in staging
- CORS_ORIGIN, session secrets, METRICS_TOKEN validated in staging
- /api/health 200; /metrics 401 without token, 200 with token

Security
- CSP enabled (APP_ENABLE_CSP=1) with correct asset/CDN domains (optional)
- Cookies `Secure; HttpOnly; SameSite=Lax` verified
- No e2e mocks exposed (E2E_API_MOCKS unset)

Observability
- Prometheus scraping /metrics
- Grafana dashboards live (import docs/grafana/backend-overview.json)
- Alert rules applied (docs/observability/prometheus-rules.yml)

Operations
- Rollback runbook dry-run complete (docs/runbooks/rollback.md)
- Deploy runbook clear (docs/runbooks/deploy.md)

Stakeholders
- Product sign-off
- Ops sign-off
- Support aware of rollout window and contact paths

