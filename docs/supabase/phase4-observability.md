# Phase 4 – Observability & Ops Readiness (Status: Oct 18 2025)

## Metrics & scraping
- `/metrics` endpoint requires `Authorization: Bearer $METRICS_TOKEN` (validated by backend startup check in `backend/src/main.ts`).
- Prometheus sample configuration lives in `docs/observability.md`; alert rules provided in `docs/observability/prometheus-rules.yml` (HTTP error rate, latency, SMS queue depth).
- TODO: import the alert rules into Grafana/Prometheus and verify targets (`rayon-backend` job) once Prometheus is pointed at the live API.

## Logging & tracing
- Supabase Edge Functions logs are only accessible via the Supabase dashboard/API; no centralized shipping configured yet.
- Backend currently relies on Fastify logging; no automatic export to Datadog/Grafana Loki.
- TODO: choose log sink (Datadog, Grafana Loki, or Supabase Log Drains) and configure shipping from the hosting platform/Nest.

## Sentry / error tracking
- `docs/production-env.md` lists `SENTRY_DSN` but no concrete configuration exists; backend/frontend do not initialize Sentry clients.
- TODO: enable Sentry in both Next.js and NestJS once DSNs are issued; add environment-specific DSNs to the vault map.

## Smoke tests & automation
- GitHub Actions smoke tests not yet implemented for `/metrics` / `/health`.
- TODO: create a CI workflow that runs on schedule (e.g., hourly) calling key endpoints and paging on failure.

## Secrets & config
- `METRICS_TOKEN` already tracked in `docs/supabase/vault-secret-map.md`.
- Additional observability secrets pending (SENTRY_DSN, DATADOG_API_KEY, etc.); add to vault map when chosen.

## Outstanding checklist
1. Point Prometheus/Grafana stack at production `/metrics` and import `prometheus-rules.yml`.
2. Decide on central log sink (Datadog, Loki, Supabase Log Drains) and wire backend + edge functions.
3. Configure Sentry (or alternative) for frontend/backend; update vault/secrets map.
4. Add scheduled smoke tests/alerts in GitHub Actions or external uptime monitors.
5. Document dashboard URLs, on-call rotation, and alert routing in the ops runbook.
