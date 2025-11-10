# Security Program Overview

This document summarizes the security posture of the Rayon Sports Digital Platform. It extends the hardening checklist in [`SECURITY_HARDENING.md`](../SECURITY_HARDENING.md) with operational guardrails, review cadences, and emergency handling guidance.

## Platform Threat Model

| Asset | Risks | Mitigations |
| --- | --- | --- |
| Supabase Postgres | Credential theft, privilege escalation | Row Level Security enabled on all public tables, service role keys stored in secret manager, migrations reviewed via PR. |
| Edge Functions | Injection, replay attacks | HMAC-authenticated webhooks, per-function secrets rotated quarterly, `supabase secrets set` gated by release checklist. |
| Next.js App Router | XSS, SSRF, session fixation | Helmet headers enabled, CSP opt-in via `APP_ENABLE_CSP`, server routes prohibit arbitrary fetch destinations. |
| Admin Console | Account takeover | SSO enforced for `/admin/*`, `ADMIN_SESSION_SECRET` rotated quarterly, MFA required via identity provider. |

## Baseline Controls

- **Headers & CSP**
  - Helmet is registered in Fastify. To enforce CSP in production, set `APP_ENABLE_CSP=1` and configure the directive set maintained in `config/security-headers.mjs`.
  - Enable HSTS at the ingress layer once TLS termination is handled by Cloudflare or the Kubernetes ingress controller.
- **Sessions**
  - Admin cookie: `ADMIN_SESSION_COOKIE` (default `admin_session`) with `Secure`, `HttpOnly`, `SameSite=Lax` in non-local environments.
  - Fan cookie: `FAN_SESSION_COOKIE` (default `fan_session`), same security attributes.
  - Secrets required for both cookies: `ADMIN_SESSION_SECRET` and `FAN_SESSION_SECRET`. Boot fails without them in production.
- **CORS & Metrics**
  - `CORS_ORIGIN` must be a comma-delimited allowlist in production. Wildcards are rejected at boot.
  - `/metrics` requires the `METRICS_TOKEN` bearer value.
- **Dependency Hygiene**
  - Run `pnpm audit --prod` weekly. High/critical advisories trigger an incident ticket and must be patched before the next production deploy.
  - GitHub Advanced Security is enabled; review Dependabot PRs within two business days.

## Security Reviews & Monitoring

- **Static Analysis**: `pnpm lint` and `pnpm type-check` run in CI. ESLint security rules are enforced for API routes and Edge Functions.
- **Dynamic Testing**: Playwright smoke tests cover authentication, payment confirmation, and admin moderation flows (`make e2e`).
- **Logging**: Supabase functions emit structured logs to Logflare; correlate `request_id` across app and backend logs for investigations.
- **Alerting**: Sentry issues tagged `security` page the on-call engineer. Prometheus alerts for elevated 401/403 rates tie into the disaster recovery runbook.

## Credential Management

Follow the lifecycle documented in [`docs/env.md`](env.md#secret-management-policy). Additional requirements for payment channels are captured in [`docs/payments-policy.md`](payments-policy.md#credential-lifecycle).

## Incident Response

1. Contain by revoking compromised tokens in Supabase (`supabase secrets unset`) and rotating session secrets.
2. Follow the emergency steps in [`docs/runbooks/disaster-recovery.md`](runbooks/disaster-recovery.md) and notify stakeholders via the #match-ops channel.
3. File a retro in `incident-response/` within 48 hours, including remediation items and owners.

## Change Management

- Security-affecting changes require two reviewers and a linked ticket in the security board.
- Run `pnpm lint`, `pnpm type-check`, and `pnpm test --coverage` locally before requesting review.
- Update this document and `SECURITY_HARDENING.md` whenever controls are added or removed.

## Verification Checklist

Before promoting a release:

- [ ] `pnpm validate:security` (runs lint, dependency checks, and ensures `APP_ENABLE_CSP` is set for prod).
- [ ] Confirm `ADMIN_SESSION_SECRET`/`FAN_SESSION_SECRET` rotation date is < 90 days old.
- [ ] Verify monitoring dashboards (Grafana & Sentry) are green.
- [ ] Ensure payment webhooks return 2xx by replaying from the Supabase dashboard.

For additional resources, review [`docs/runbooks/operations.md`](runbooks/operations.md), [`docs/runbooks/incident-response.md`](runbooks/incident-response.md), and the
security control library under [`docs/security/`](security/README.md).
