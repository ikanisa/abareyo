# Security Incident Response Playbooks

These playbooks supplement [`docs/runbooks/incident-response.md`](../runbooks/incident-response.md) with security-specific
procedures. Each playbook includes containment, eradication, recovery, and communications steps.

## 1. Credential Exposure (Secrets Leak)

**Trigger:** Gitleaks SARIF finding, suspicious commit to `main`, or third-party disclosure.

1. **Containment**
   - Freeze impacted CI tokens and rotate Supabase service role credentials immediately.
   - Disable automation accounts tied to the leaked secret in the identity provider.
2. **Eradication**
   - Purge the commit from git history (`git filter-repo` or GitHub UI) and force-push after approvals.
   - Validate the SARIF artifact is clean in a rerun of `security-scans.yml`.
3. **Recovery**
   - Deploy rotated secrets via the infrastructure pipeline; capture rotation timestamp in `docs/env.md`.
   - Monitor access logs (Supabase, Cloudflare) for 48 hours for anomalous use of the revoked credentials.
4. **Communication**
   - Update the Security Kanban ticket with remediation notes.
   - Notify stakeholders in `#match-ops` and include the rotation checklist link.

## 2. Privileged Account Compromise

**Trigger:** Suspicious admin login alert, RBAC bypass attempt, or pen-test finding.

1. **Containment**
   - Revoke active admin sessions via `AdminAuthService.revokeSession` CLI helper.
   - Temporarily disable affected admin accounts in Prisma (`adminUser.status = 'locked'`).
2. **Eradication**
   - Review audit logs (`auditLog` table) for scope, export to SIEM, and correlate IP/user agent pairs.
   - Rotate admin SSO credentials and enforce password reset in the IdP.
3. **Recovery**
   - Reinstate accounts with least-privilege roles after verifying MFA enrollment.
   - Deploy additional RBAC test coverage if the compromise exploited missing guards.
4. **Communication**
   - File an incident report within 24 hours per the compliance checklist.
   - Brief leadership with the impact summary and mitigation plan.

## 3. API Abuse / DDoS against Mobile Endpoints

**Trigger:** Alert for elevated 429/5xx responses or rate-limit breach on `/v1/mobile/*`.

1. **Containment**
   - Increase API Gateway throttling to emergency levels (25 req/min) and enable bot mitigation at Cloudflare.
   - Engage the on-call engineer to validate backend saturation metrics.
2. **Eradication**
   - Identify offending IP ranges from gateway logs; block via WAF rules for 24 hours.
   - Audit Supabase Edge Function logs to ensure no abuse persisted past throttling.
3. **Recovery**
   - Gradually relax throttles while monitoring latency and success rates.
   - Backfill missed push notifications via the mobile messaging queue.
4. **Communication**
   - Update customer support with a status page entry.
   - Close the associated SEC ticket once rate limiting automation is merged (`SEC-203`).

Each playbook must be rehearsed quarterly. Capture action items in the corresponding SEC ticket and update this document when
procedures evolve.
