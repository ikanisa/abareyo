# Backend Deployment Configuration Checklist

_Updated: 2025-02-14_

Use this checklist before every staging or production deployment. Confirm each item, record in the release ticket, and capture any remediation follow-up tasks.

## Payment services
- [ ] `PAYMENT_PROVIDER` set to the active gateway (`stripe`, `paynow`, etc.).
- [ ] `PAYMENT_API_KEY` present in environment secrets.
- [ ] `PAYMENT_WEBHOOK_SECRET` configured and rotated within the last 90 days.
- [ ] `PAYMENT_CALLBACK_URL` matches the deployed domain (staging vs production).
- [ ] `PAYMENT_USSD_SHORTCODE` populated and validated for non-zero pricing.

| Service | Secret | Source of truth | Rotation owner |
| --- | --- | --- | --- |
| Payments | `PAYMENT_API_KEY` | 1Password › Payments Vault | Finance Ops |
| Payments | `PAYMENT_WEBHOOK_SECRET` | Stripe dashboard › Webhooks | Backend Lead |
| Payments | `PAYMENT_USSD_SHORTCODE` | MTN USSD console | Partnerships |

## Realtime infrastructure
- [ ] `REALTIME_SOCKET_ORIGIN_ALLOWLIST` includes all expected web/app domains.
- [ ] `REALTIME_SERVICE_API_KEY` present and scoped for fan-facing namespaces.
- [ ] `REALTIME_REDIS_URL` configured for socket.io adapter (if clustering enabled).
- [ ] TLS certificates renewed for realtime endpoints where applicable.
- [ ] Load balancer health checks updated after topology changes.

| Service | Secret | Source of truth | Rotation owner |
| --- | --- | --- | --- |
| Realtime | `REALTIME_SERVICE_API_KEY` | 1Password › Platform Vault | Platform Eng |
| Realtime | `REALTIME_REDIS_URL` | Terraform outputs (`infra/realtime.tfstate`) | SRE |
| Realtime | TLS cert bundle | ACM / Let’s Encrypt automation | DevOps |

## Metrics & observability
- [ ] `METRICS_EXPORTER_API_KEY` present for Grafana/Loki/Prometheus push gateways.
- [ ] `METRICS_ENDPOINT_URL` accessible from the deployment environment.
- [ ] `LOG_DRAIN_URL` configured for centralized logging provider.
- [ ] `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT` set when tracing is enabled.
- [ ] Alerting rules reviewed; on-call schedule confirmed for launch window.

| Service | Secret | Source of truth | Rotation owner |
| --- | --- | --- | --- |
| Observability | `METRICS_EXPORTER_API_KEY` | Grafana Cloud portal | Observability Lead |
| Observability | `LOG_DRAIN_URL` | Logflare workspace settings | Platform Eng |
| Observability | `OTEL_EXPORTER_OTLP_ENDPOINT` | SRE config repo (`infra/otel.yaml`) | SRE |

## Deployment log template

Record the checklist completion in the release ticket and copy the summary below:

| Date | Environment | Release tag | Reviewer | Notes |
| --- | --- | --- | --- | --- |
| | | | | |

## Sign-off
- [ ] Checklist reviewed and signed by backend lead.
- [ ] Linked in release runbook entry for the deployment.
- [ ] CI `npm run test:e2e` step references this checklist before tagging a fan-facing release.
