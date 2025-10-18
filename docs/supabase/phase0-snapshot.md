# Supabase Phase 0 Snapshot (paysnhuxngsvzdpwlosv)

_Generated: 2025-10-18 (UTC)_

This update captures the Phase 0 due diligence now that we have CLI access to the live Supabase project (`supabase link --project-ref paysnhuxngsvzdpwlosv`). Use this document alongside `docs/supabase/secret-rotation-plan.md` and `docs/supabase/canonical-table-plan.md` as the authoritative baseline before moving into Phase 1.

## 1. Migration Alignment

- `supabase/migrations` contains 18 SQL files. The table below lists their intent and whether production has applied each file (`supabase migration list --linked`, Oct 18 2025).

| Seq | File | Scope & notes | Remote |
| --- | --- | --- | --- |
| 1 | `20240505120000_fan_profile_codes.sql` | Adds `user_code` + index; rebuilds `public_members` view. | applied |
| 2 | `20251011000000_core.sql` | Establishes core ticketing/membership/shop/admin tables without dropping MVP data. | applied |
| 3 | `202510110001_rls.sql` | Baseline RLS + grants on matches/products/projects. | applied |
| 4 | `20251012_rayon_schema.sql` | Recreates MVP tables without schema qualification; leaves snake_case copies. | applied |
| 5 | `202510130001_mvp_schema.sql` | Adds `create table if not exists` variants in `public`, leaving duplicate tables (`wallet` vs `wallets`, etc.). | applied |
| 6 | `202510130002_admin_indexes.sql` | Adds admin/shop indexes and ensures `shop_products.images`. | applied |
| 7 | `202510130003_rayon_ticket_orders.sql` | Creates bridge tables for legacy ticket data. | applied |
| 8 | `202510130004_rewards_engine.sql` | Creates `public.rewards_events` + trigger on `transactions`. | applied |
| 9 | `202510130005_shop_promotions.sql` | Adds `public.shop_promotions` with activation index. | applied |
| 10 | `20251020_admin_alignment.sql` | Normalises ticket/match schema, adds admin sessions, feature flags, translations, KPI views. | applied |
| 11 | `20251021_add_partner_slug.sql` | Adds `slug` to `public.partners`; table itself is still missing. | applied |
| 12 | `20251025000000_p4_dashboard_i18n.sql` | Seeds dashboard permissions/translations. | applied |
| 13 | `202510251001_p4_dashboard_views.sql` | Installs admin KPI/SMS analytics views. | applied |
| 14 | `20251030_member_directory.sql` | Extends `public.users`; rebuilds `public_members` view. | applied |
| 15 | `20251106_security_views.sql` | Forces RLS across tables; introduces service-role bypass. | applied |
| 16 | `20251109_security_hardening.sql` | Tightens owner policies for wallets/transactions/insurance. | applied |
| 17 | `20251110_personalization_schema.sql` | Adds personalization tables (`content_items`, `community_*`, etc.). | applied |
| 18 | `20251111_add_partners_table.sql` | Creates `public.partners` + `updated_at` trigger. | **pending** |

- `supabase/config.toml` still references project `bduokvxvnscoknwamfle`. Update it once the team confirms that `paysnhuxngsvzdpwlosv` is the canonical production project.
- `supabase migration list --linked` output is stored in the appendix below for tracking.
- Remote DDL snapshot captured at `docs/supabase/phase0-production-schema.sql` (generated with `supabase db dump --db-url postgresql://postgres:***@db.paysnhuxngsvzdpwlosv.supabase.co:5432/postgres --schema public`). Use this file for runbooks until a new dump replaces it.
- Prisma migrations live under `backend/prisma/migrations` (8 directories through `202502051900_fan_sessions`). `npx prisma generate --schema backend/prisma/schema.prisma` succeeds. A diff against production (`npx prisma migrate diff --from-url <REMOTE_URL> --to-schema-datamodel backend/prisma/schema.prisma`) reveals:
  - Missing tables on production relative to Prisma: `OnboardingSession`, `OnboardingMessage`, `PostComment`.
  - Prisma expects camelCase tables; production still contains snake_case duplicates (e.g., `wallets` vs `wallet`, `orders` vs `Order`). Legacy data must be migrated/dropped during Phase 1.
  - Prisma enums (`OnboardingStatus`, `PaymentKind`, etc.) do not exist remotely; confirm whether supabase SQL migrations or Prisma should be authoritative before rolling forward.

### Migration list (CLI output, Oct 18 2025)

```
Local          | Remote         | Time (UTC)
20240505120000 | 20240505120000 | 2024-05-05 12:00:00
20251011000000 | 20251011000000 | 2025-10-11 00:00:00
202510110001   | 202510110001   | 202510110001
...
20251110       | 20251110       | 20251110
20251111       |                | 20251111
```

_(Full output retained in project notes; final row confirms the pending `partners` deployment.)_

## 2. Schema Inventory vs. Code

- Remote currently exposes 97 tables in `public`; 40+ are snake_case legacy copies. The canonical Prisma models cover the camelCase set only. `psql` query: `select table_name from information_schema.tables where table_schema='public';`
- Tables/enums Prisma expects but production lacks:
  - Tables: `OnboardingSession`, `OnboardingMessage`, `PostComment`.
  - Enums: `OnboardingStatus`, plus the camelCase variants of `PaymentKind`, `PaymentStatus`, etc.
- Tables present in production but unused by Prisma (candidates for retirement):
  - Core duplicates: `orders`, `order_items`, `payments`, `tickets`, `wallets`, `users`, `products`, `shop_products`.
  - MVP features: `sacco_deposits`, `insurance_quotes`, `fan_posts`, `community_reports`, `fund_projects`, `fund_donations`, `rewards_events`, `user_prefs`, `user_favorites`, `transactions_legacy`, `tickets_legacy`.
- Existing SQL views (`admin_dashboard_*`) depend on the legacy snake_case tables; any cleanup must refresh those views.
- `docs/supabase/phase0-production-schema.sql` and `docs/supabase/erd-20251018.svg` form the current schema baseline. If Studio’s ERD diverges, regenerate both assets and update this section.
- ERD snapshot generated Oct 18 2025 via `eralchemy2 -i postgresql://... -s public -o docs/supabase/erd-20251018.svg`. Re-run the command after future schema changes.

## 3. Secrets & Environment Snapshot

| Source | Notable values | Required follow-up |
| --- | --- | --- |
| `.env` | Publishable Supabase key + legacy project ID (`bduokvxvnscoknwamfle`); placeholders for JWT/metrics secrets. | Replace project ID once we confirm the canonical ref; keep sensitive values out of git. |
| `.env.production` | Real session secrets, OpenAI key, metrics token, default admin credentials. | Move to Vercel/Supabase Vault and purge from git after rotation (Phase 1). |
| `.vercel/.env.development.local` | Local OIDC/development tokens. | Confirm they stay scoped to preview; document rotation cadence. |
| `backend/.env.example` | MoMo pay codes & backend defaults. | Expand to include Twilio/Stripe/Slack placeholders so Vault list is complete. |

Additional gaps identified during review:
- No committed values for `SUPABASE_SERVICE_ROLE_KEY`, Twilio, Stripe, Slack, CSP, or metrics bearer token in the repo. Ensure Vault + Vercel hold the definitive copies.
- Generate fresh Supabase publishable/service-role keys as part of Phase 1, then delete the old values from `.env`/`.env.production`.
- Capture a single source of truth for environment variables (Prod/Preview/Dev) in `docs/` once rotation completes.

## 4. Tier & Platform Considerations

- Production uses RLS on nearly every table, multiple edge functions, and admin analytics views. Free-tier limits on connection pooling, PITR, cron/queues, and observability will block later phases.
- Recommendation: plan the Supabase **Pro** upgrade before Phase 1 so we can:
  - Enable longer PITR (financial data + audit logs require it).
  - Use pg_cron/queues for scheduled digests and cleanup jobs.
  - Provision read replicas to isolate Prisma + Edge Function traffic.
  - Increase connection pool limits for admin dashboards and upcoming partners work.

## 5. Outstanding Phase 0 Actions

1. (Done Oct 18 2025) `20251111_add_partners_table.sql` applied via `supabase migration up --linked`; `public.partners` now exists remotely.
2. (Done Oct 18 2025) ERD exported (CLI substitute via eralchemy2) to `docs/supabase/erd-20251018.svg`.
3. Decide canonical tables vs. legacy duplicates (`wallet` vs `wallets`, etc.) and author follow-up migrations to drop/rename during Phase 1. Track decisions in `docs/supabase/canonical-table-plan.md`.
4. Confirm whether Prisma or Supabase SQL drives schema ownership. If Prisma is authoritative, backfill migrations for the missing onboarding/post comment tables; otherwise adjust Prisma schema to match production.
5. Move secrets out of `.env.production`, rotate Supabase/VerceI keys, and update Vault entries per `docs/supabase/secret-rotation-plan.md`.
6. Update `supabase/config.toml` and repository env files to the correct project ref once stakeholders verify the production project ID.

Phase 0 is considered complete once the pending migration is deployed, the ERD is captured, secrets are staged for rotation, and the team agrees on the canonical schema plan.
