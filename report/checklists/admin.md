# Admin Panel Security Checklist

- [ ] Confirm server-rendered admin layout fetches `/admin/me` successfully with production `NEXT_PUBLIC_BACKEND_URL`; add alerting for non-200 responses.【9f6213†L1-L170】
- [ ] Move `NEXT_PUBLIC_ADMIN_API_TOKEN` to a server-only secret and proxy privileged gate endpoints through authenticated APIs.【320662†L147-L219】
- [ ] Enable CSRF protection for admin mutations and verify same-site cookie attributes in `buildSecurityHeaders` once CSP is enforced.【63f378†L1-L34】
- [ ] Require MFA or re-auth for destructive actions (refunds, pass rotation) and log actor/action metadata via backend audit trail.
- [ ] Validate RBAC map in `@/config/admin-rbac` matches backend enforcement; add integration tests for permission drift.【9f6213†L5-L103】
- [ ] Ensure admin session cookies use `Secure`, `HttpOnly`, `SameSite=Strict`, and rotate on privilege elevation.
- [ ] Run accessibility audit on admin shell navigation and data tables using axe + keyboard-only walkthrough.
- [ ] Document incident response runbook covering lockouts, forced logout, and token revocation.
