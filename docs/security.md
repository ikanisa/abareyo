Security Hardening

Headers & CSP

- Helmet is registered in Fastify. To enable a restrictive CSP in production, set `APP_ENABLE_CSP=1`.
- Default directives allow same-origin scripts/styles, inline styles, common image/font sources, and `connect-src '*'` for local dev. Tighten as needed for CDN domains.

Sessions

- Admin cookie name: `ADMIN_SESSION_COOKIE` (default `admin_session`)
- Fan cookie name: `FAN_SESSION_COOKIE` (default `fan_session`)
- In production, both cookies are `Secure`, `HttpOnly`, `SameSite=Lax`.
- Secrets are required in production (`ADMIN_SESSION_SECRET`, `FAN_SESSION_SECRET`), otherwise boot fails.

Headers

- By default, Helmet is enabled. To enable CSP, set `APP_ENABLE_CSP=1` and tune directives for your CDN domains.
- Consider enabling HSTS at the reverse proxy (nginx/ingress) once HTTPS is enforced.

CORS & Metrics

- `CORS_ORIGIN` must be an explicit allow-list in production; wildcard is rejected at boot.
- `/metrics` requires a bearer token in production (`METRICS_TOKEN`).

Playwright E2E Mocks

- Mocks are only served when `E2E_API_MOCKS=1`. In any other environment, the `/api/e2e/*` routes return 404.

Checks

- Verify response headers in staging/prod:
  - `content-security-policy` present if CSP enabled
  - `x-content-type-options: nosniff`
  - `x-frame-options: SAMEORIGIN` (via proxy or Helmet)
  - Cookies: `Secure; HttpOnly; SameSite=Lax`

