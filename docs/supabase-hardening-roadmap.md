# Supabase Hardening Roadmap

This document captures the remaining production-readiness work for the Supabase project (`paysnhuxngsvzdpwlosv`). It is tailored to complement the new RLS migration (`supabase/migrations/20251109_security_hardening.sql`) and should be kept in sync with any future policy changes.

## 1. Database Security
- Apply the latest migrations locally (`supabase db reset --local`) and in the remote project (`supabase db push`) once reviewed.
- Audit every table for RLS coverage:
  - Confirm no table remains `Unrestricted` in the Supabase dashboard.
  - Ensure policies match expected access patterns (see migration for current rules).
- Implement regular security reviews:
  - Schedule a monthly check of the Security Advisor panel.
  - Track policy diffs in PRs and require dual review for migrations touching RLS.

## 2. API Key & JWT Rotation
- Generate the new **publishable** (`sb-publishable-…`) and **secret** (`sb-secret-…`) keys from **Project Settings → API → Generate new keys**.
- Update the application:
  - Replace usages of `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the publishable key.
  - Replace `SUPABASE_SERVICE_ROLE_KEY` in server/CLI contexts with the new secret key.
  - Keep previous keys temporarily in `.env` only if rollback is required, then delete.
- Rotate JWT signing keys:
  1. Navigate to **Authentication → Settings → JWT**.
  2. Create the new signing key pair and shorten the access token TTL (e.g., 3600s → 1800s).
  3. Update edge functions and services that verify Supabase JWTs to use the new keys.
  4. Trigger a “invalidate all refresh tokens” after rollout, forcing clients to re-auth.

## 3. Secrets Management
- Populate Supabase **Vault** with production secrets and reference them from Edge Functions:
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
  - `MOMO_API_KEY` or payment provider equivalents
  - `STRIPE_SECRET_KEY` (if Stripe wrapper is enabled)
  - Slack / Teams webhook URLs for alerts
  - `OPENAI_API_KEY`, `SMS_WEBHOOK_TOKEN`, etc. (migrate existing plain secrets)
- Mirror the same secrets in Vercel / Kubernetes manifests and document rotation cadence.
- Configure alerts for secrets expiring or being rotated.

## 4. Authentication Hardening
- Enable attack protection (**Authentication → Advanced Settings → Attack protection**):
  - Rate-limit sign-ins and password resets.
  - Enforce password complexity and login throttling.
- Decide on multi-factor requirements and configure available providers (TOTP or WebAuthn).
- Enable/disable auth providers explicitly; remove unused providers to reduce surface area.
- Customise email templates (verification, reset, magic link) with production branding.
- Implement auth hooks or functions:
  - Example: trigger `INSERT` into `public.users` on sign-up with default profile data.
  - Log suspicious or high-value actions for audit.

## 5. Storage Buckets & Policies
- Define required buckets (recommended: `avatars`, `tickets`, `media`).
- Create policies:
  - Allow authenticated users to upload only to their folder (`user_id/…`).
  - Block `anon` access except for explicitly public assets (serve via CDN if needed).
  - Enforce size/content-type constraints through `storage.object` policies or middleware.
- Add periodic clean-up (cron) for orphaned files.

## 6. Edge Functions & Integrations
- Deploy missing functions (`award_points`, `handle_momo_webhook`, `issue_policy`, `issue_ticket_perk`) from the repo:
  1. `supabase functions deploy <function-name> --import-map supabase/functions/import_map.json`
  2. Set secrets via `supabase secrets set`.
- Install official wrappers where required:
  - **Stripe** for payments.
  - **Cron** for scheduled jobs (e.g., nightly digests, ticket expiry).
  - **Queues** if asynchronous processing is needed.
- Write smoke tests for functions (simulate webhooks, failure cases) and run in CI.
- Review function timeouts, region, and logs weekly.

## 7. Monitoring & Observability
- Enable `pg_stat_statements` (already installed) and optionally `pg_stat_monitor` / `pgaudit`.
- Stream Supabase logs to an external sink (e.g., Logflare, Datadog, Grafana Loki) with retention rules.
- Create alerts for:
  - Auth anomalies (sudden sign-up spikes, failed login bursts).
  - Function failures or high latency.
  - Database connection saturation or slow queries.
- Document runbooks for responding to alerts (who to page, expected mitigations).

## 8. CI/CD Pipeline
- Wire Supabase CLI into GitHub Actions:
  - Validate migrations (`supabase db lint`) on PRs.
  - Deploy migrations & edge functions on merge after manual approval.
- Gate schema changes behind review and automatically publish ER diagram diffs.
- Include environment validation (ensuring `.env.production` has the new publishable/secret keys) before builds.

## 9. Operations & Governance
- Maintain an inventory of privileged accounts (Supabase + external providers).
- Set quarterly secret rotation reminders and track completion in the ops calendar.
- Add incident response contact information and escalation SLAs to `docs/`.
- Schedule regular backup tests (restore to staging and verify integrity).

## 10. Checklist Summary

| Area | Owner | Status | Notes |
| --- | --- | --- | --- |
| Apply 20251109 RLS migration | Backend | ☐ | Run against staging → production |
| Rotate API keys & JWT secrets | Platform | ☐ | Requires coordinated deploy |
| Populate Vault secrets | Platform | ☐ | Map secrets to Edge functions |
| Enable attack protection & MFA | Auth | ☐ | Capture policy decisions |
| Create storage buckets & RLS | Backend | ☐ | Document bucket naming |
| Deploy all edge functions | Platform | ☐ | Add CLI deploy script |
| Install Stripe / Cron / Queues wrappers | Platform | ☐ | Confirm billing impact |
| Configure log streaming & alerts | DevOps | ☐ | Slack channel #alerts |
| Integrate Supabase CLI into CI | DevOps | ☐ | Add manual approval step |
| Runbook & governance docs | Ops | ☐ | Publish in `docs/operations` |

Keep this checklist up to date as each task progresses. Mark items complete in PR descriptions and reference supporting commits/migrations for traceability.

