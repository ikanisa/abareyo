# Compliance & Data Subject Runbook

This runbook inventories customer data stores, documents automated retention, and lists manual purge steps required to honour privacy requests (GDPR/NDPR/CCPA).

## 1. Data Inventory (Supabase Postgres)

| Domain | Tables | Contains PII? | Retention / TTL |
| --- | --- | --- | --- |
| Identity & Access | `users`, `admin_users`, `admin_sessions`, `feature_flags`, `permissions`, `roles_permissions`, `admin_roles`, `admin_user_roles`, `admin_permissions` | ✅ (`users`, `admin_users`, `admin_sessions`) | `admin_sessions` auto-purged after expiry; `users` retained until DSR purge. |
| Ticketing & Access Control | `matches`, `ticket_orders`, `ticket_order_items`, `ticket_passes`, `match_gates`, `match_zones` | ✅ (`ticket_orders`, `ticket_passes`) | Orders retained for 18 months; QR exports cleared via S3 lifecycle. |
| Commerce & Payments | `products`, `shop_products`, `shop_promotions`, `orders`, `order_items`, `payments`, `fund_projects`, `fund_donations`, `sacco_deposits` | ✅ (`orders`, `payments`, `fund_donations`, `sacco_deposits`) | Payments retained 7 years (financial audit). Manual purge requires finance sign-off. |
| Engagement & Gamification | `gamification_events`, `leaderboards`, `rewards_events`, `polls` | ✅ (user IDs) | Purge-on-request via DSR SQL (see §3). |
| Community | `community_posts`, `community_reports`, `content_items`, `fan_clubs`, `fan_posts` | ✅ (user-generated content) | Purged on DSR using cascade policies. |
| Messaging | `sms_raw`, `sms_parsed` | ✅ (MSISDNs, payment refs) | Automated cleanup: raw after 90 days, parsed after 180 days. |
| Audit & Ops | `audit_logs`, `report_schedules`, `_prisma_migrations` | ✅ (`audit_logs`) | Automated cleanup: audit logs after 400 days. |

> Canonical table definitions live in `supabase/migrations` and the generated types in `src/integrations/supabase/types.ts`.

## 2. Storage Buckets

### Supabase Storage

| Bucket | Purpose | Access Policy | Retention |
| --- | --- | --- | --- |
| `avatars` | Fan profile photos (small, public) | Public read, owner/admin write | 365-day rotation (manual purge if inactive user). |
| `tickets` | Generated QR/PKPass exports | Owner-only | 30-day lifecycle rule (files rotated weekly). |
| `media` | Marketing & news assets | Public read, admin managed | No automatic purge; remove on request. |

### S3 / R2 Bucket (`S3_BUCKET`)

Single bucket with logical prefixes:

| Prefix | Purpose | Retention |
| --- | --- | --- |
| `exports/` | CSV exports, manual reports | 30 days (auto-expire via lifecycle). |
| `archives/sms/` | Archived `sms_raw` payloads before deletion | 400 days. |
| `assets/` | Long-lived marketing assets synced from CMS | Keep until replaced (manual). |

Lifecycle configuration template: `infra/storage/s3-lifecycle.json`.

## 3. Automated Retention

Nightly retention tasks now execute from the managed GitHub Actions workflow
[`managed-schedules.yml`](../../.github/workflows/managed-schedules.yml). The
workflow invokes `npm run cron:data-retention`, which calls the Supabase
functions below and records the outcome in `public.job_run_audit` for
observability dashboards.

| Function | Trigger (GitHub Actions job id) | Dataset | TTL |
| --- | --- | --- | --- |
| `public.cleanup_sms_raw()` | `cleanup_sms_raw_daily` | `sms_raw` | 90 days |
| `public.cleanup_sms_parsed()` | `cleanup_sms_parsed_daily` | `sms_parsed` | 180 days |
| `public.cleanup_audit_logs()` | `cleanup_audit_logs_daily` | `audit_logs` | 400 days |
| `public.cleanup_admin_sessions()` | `cleanup_admin_sessions_hourly` | `admin_sessions` | 36 h grace + 1-day buffer |

The helper view `public.data_retention_windows` continues to surface these TTLs
for Grafana and health checks, and `public.job_run_audit` stores one row per
run with rows deleted or failure messages.

## 4. Manual Purge Procedure

Use the Supabase SQL editor or `psql` with the service role.

1. **Freeze automations** (optional): temporarily disable the "Managed
   Schedules" workflow in GitHub Actions or run it manually with
   `run_data_retention=false` to pause future executions.
2. **Locate subject records**:
   - `select id from public.users where phone_mask ilike '%0788%';`
   - `select id from public.audit_logs where actor->>'user_id' = '<USER_ID>';`
3. **Delete or anonymise** (respecting cascade):
   ```sql
   delete from public.audit_logs where user_id = '<USER_ID>';
   delete from public.community_posts where user_id = '<USER_ID>';
   update public.users set display_name = 'Deleted user', phone_mask = null, public_profile = '{}'::jsonb where id = '<USER_ID>';
   ```
4. **Run cleanup helpers** (or trigger the GitHub Action manually) to guarantee
   TTL enforcement immediately:
   ```sql
   select public.cleanup_sms_raw();
   select public.cleanup_sms_parsed();
   select public.cleanup_audit_logs();
   select public.cleanup_admin_sessions();
   ```
5. **Verify** via `select * from public.data_retention_windows;` and targeted selects.

## 5. Data Subject Request (DSR) Workflow

1. **Ticket intake** via support: capture identifiers (phone, email, order code).
2. **Identity verification** (2FA or admin backchannel).
3. **Execute purge** using §4 steps; confirm S3 lifecycle coverage for exported assets.
4. **Supabase Storage cleanup**:
   ```bash
   supabase storage objects remove avatars <user-id-prefix>/ --bucket avatars
   supabase storage objects remove tickets <user-id-prefix>/ --bucket tickets
   ```
5. **S3 cleanup** (if subject appears in archives):
   ```bash
   aws s3 rm s3://$S3_BUCKET/archives/sms/<user-id>/ --recursive
   aws s3 rm s3://$S3_BUCKET/exports/<user-id>/ --recursive
   ```
6. **Record completion** in the trust & safety tracker (link in Notion) and email confirmation to the requester.

## 6. Audit & Monitoring

- Grafana panels consume both `public.data_retention_windows` and
  `public.job_run_audit` (filter `job_name`/`status`) to flag drift or repeated
  failures.
- The managed schedule posts a GitHub job summary with rows deleted; failures
  are captured in Sentry (`job.retention.*` tags) and PagerDuty via the probes
  workflow.
- S3 lifecycle status can be checked via `aws s3api get-bucket-lifecycle-configuration`.

## 7. References

- `supabase/migrations/20250218120000_managed_schedules.sql`
- `supabase/migrations/20251212090000_data_retention.sql`
- `infra/storage/s3-lifecycle.json`
- `docs/supabase/phase2-schema-alignment.md`
- `docs/architecture/data-model-and-config.md`
