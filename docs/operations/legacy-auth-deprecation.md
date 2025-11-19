# Legacy Auth Deprecation and Cutover Plan

## Objectives
- Decommission legacy authentication in production with minimal downtime and predictable rollback.
- Migrate remaining users to the new auth stack via email-based invites when accounts cannot be auto-mapped.
- Preserve auditability and customer communication throughout the change window.

## Maintenance Window and Toggle Strategy
- **Feature toggle:** Ship the new auth behind `auth.new_stack_enabled`. Default **off** in prod until the window opens.
- **Freeze scope:** Block non-essential deploys for 2 hours before the window. Confirm on-call coverage (SRE + Auth engineer).
- **Pre-window checks:**
  - Verify backups/snapshots for auth DB tables and invitation templates are < 24h old.
  - Export a CSV of legacy accounts (user ID, email, roles, MFA flags) for reconciliation.
  - Confirm observability dashboards (below) are green and alerts are routed to `#ops-auth` + pager.
- **Window execution (target ≤ 30 minutes):**
  1. Announce start in `#announcements` and status page; place banner on login surfaces.
  2. Flip `auth.new_stack_enabled` to **on** in production and disable legacy login endpoints via gateway rules.
  3. Run data migration script to map legacy users; queue email invites for accounts lacking new credentials.
  4. Smoke-test primary flows (login, invite acceptance, QR scan) using test tenants.
- **Post-window:** Keep toggle override ready for 24 hours. Remove banner/status entry once validation checklist passes.

## User Migration (Email Invites)
- **Auto-mapping:** For users with matching verified emails, migrate credentials and preserve roles + MFA requirements.
- **Invite flow:**
  - Send signed invitation links (one-time, 24h expiry) to unmapped users.
  - Include instructions to set a new password and enroll MFA if required.
  - Track invite state in `auth_invites` table with status transitions (`sent`, `accepted`, `expired`, `failed`).
- **Retries and support:**
  - Automatic retry for transient email failures (3 attempts, exponential backoff); surface failures in the invites dashboard.
  - Provide support runbook link in the email and in the admin console for manual re-issue.

## Observability Dashboards & Alerts
- **Dashboards (Grafana/Datadog):**
  - Auth health: login success rate, latency p50/p95, error codes, MFA step-up failures.
  - Invitation pipeline: send vs. accept counts, delivery latency, bounce/deferral reasons, retry volume.
  - QR token flows: generation/validation counts, signature verification failures, token age distribution.
- **Alerts:**
  - `auth_error_rate > 2% for 5m` or `login latency p95 > 800ms for 5m` → page on-call.
  - `invite_failure_rate > 3% for 10m` or `email bounce spikes (>20 in 10m)` → page and open incident.
  - `qr_token_validation_failures > 20/5m` or `token_clock_skew > 10s` → warn channel + create Jira.
  - Route all alerts to `#ops-auth` with links to runbooks and Grafana panels; ensure annotations capture deploy window.

## Post-Deploy Validation Checklist
- [ ] Toggle `auth.new_stack_enabled` is **on** and legacy endpoints are blocked.
- [ ] New login flow succeeds (fresh session, existing session, MFA challenge) for at least two test tenants.
- [ ] Invitation issuance + acceptance works end-to-end (email delivered, link redeemable, user activated).
- [ ] QR token generation and validation succeed from mobile + web, including expired token handling.
- [ ] Dashboards show healthy rates/latency; no active alerts for auth/invite/QR pipelines.
- [ ] Customer-facing banner removed and status page updated to “operational.”

## Rollback Steps
- Flip `auth.new_stack_enabled` to **off** and re-enable legacy login endpoints in the gateway.
- Redeploy the previous stable release (tagged before the window) to all app tiers.
- Restore auth DB tables from the pre-window snapshot **only if** data corruption is detected; otherwise keep migrated data.
- Invalidate QR tokens issued during the failed window; re-issue invitations if invites were sent under the new stack.
- Postmortem within 24 hours with metrics from dashboards and invite retry logs.
