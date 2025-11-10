# OWASP Penetration Testing Report – Q2 FY24

**Assessment window:** 2024-05-06 → 2024-05-10  \
**Testers:** SecOps Guild (internal)  \
**Scope:** Next.js PWA (`app/`), mobile API surface (`/v1/mobile/*`), and Supabase edge functions

## Methodology

We aligned to the OWASP Web Security Testing Guide v4 and Mobile Top 10. Each category below lists the tooling and approach:

- **Authentication & Session Management** – manual fuzzing with Burp Suite, replay of admin cookies, inspection of Supabase JWT
  claims.
- **Access Control** – exercised admin RBAC permutations with crafted cookies and GraphQL introspection where available.
- **Input Validation** – ZAP active scan against staging + bespoke SSRF payloads to the image proxy endpoints.
- **Cryptographic Practices** – reviewed TLS ciphers via `sslscan`, validated JWT signing algorithms, and ensured secure cookie
  flags.
- **API Security** – Insomnia suite for schema fuzzing, checking rate limits, and verifying audit log generation.

## Findings & Remediation Tickets

| Ticket | Severity | Category | Affected Surface | Remediation | Owner | Target Fix |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-201 | High | Access Control | Admin refund endpoint | Harden permission normalization + add regression tests | Backend Team | 2024-05-20 |
| SEC-202 | Medium | Secrets Management | Legacy deploy key in git history | Purge via `gitleaks` SARIF & rotate automation token | DevOps | 2024-05-17 |
| SEC-203 | Medium | API Security | Mobile notifications rate limiting | Enforce 60 req/min throttle in API gateway | Platform | 2024-05-24 |
| SEC-204 | Low | Cryptography | Missing HSTS on preview environment | Enable at CDN + document exception path | Infra | 2024-05-27 |

All tickets live on the Security Kanban with linked PRs required before closure. Regression tests referenced here are located in
`backend/src/modules/admin/rbac/*.spec.ts` and must stay green before sign-off.

## Retest Plan

- Verify closure of SEC-201/SEC-202 via automated CI (dependency + secret scans) on each merged PR.
- Conduct focused regression pen-test on the mobile notification endpoints after rate limiting ships.
- Include CDN configuration validation (HSTS, TLS 1.2+) in the June release readiness review.

## Artifacts

- Burp project archive: `reports/security/owasp-q2-2024.burp` (uploaded to the secure share).
- ZAP scan: `reports/security/owasp-q2-2024.html` (see Confluence link in the Security Kanban card).
