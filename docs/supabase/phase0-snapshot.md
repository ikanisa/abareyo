# Supabase Phase 0 Snapshot (bduokvxvnscoknwamfle)

_Generated: 2025-10-18 (UTC)_

Phase 0 asks us to reconcile schema history, capture a usable inventory, document secrets, and confirm the infra tier assumptions before tightening security. Everything below is based on the repository state on main (`supabase/config.toml` → project `bduokvxvnscoknwamfle`); remote parity still needs human validation against the live Supabase project.

## 1. Migration Alignment

- Supabase SQL history contains 17 files under `supabase/migrations`. The table below captures the intent of each file and any notable drift risks we spotted.

| Seq | File | Scope & Notes |
| --- | --- | --- |
| 1 | `20240505120000_fan_profile_codes.sql` | Adds `user_code` (+ index) and rebuilds `public_members` view for fan directory tooling. |
| 2 | `20251011000000_core.sql` | Establishes the current core tables (users, ticketing, memberships, shop, fundraising, admin/audit) without dropping the MVP prototype data. |
| 3 | `202510110001_rls.sql` | Enables baseline RLS for public tables and grants public read on matches/products/projects. |
| 4 | `20251012_rayon_schema.sql` | Attempts to reset the original MVP tables via `drop table` / `create table` with custom enums. This conflicts with later migrations that expect the `public.*` variant (for example `wallet` vs `public.wallets`). |
| 5 | `202510130001_mvp_schema.sql` | Recreates MVP tables with `create table if not exists` in the `public` schema. Leaves both `wallet` **and** `wallets`, `tickets` **and** `ticket_orders`, etc. |
| 6 | `202510130002_admin_indexes.sql` | Adds shop/product indexes, ticket/order indexes, and ensures `shop_products.images` exists. |
| 7 | `202510130003_rayon_ticket_orders.sql` | Introduces `ticket_orders` + `ticket_order_items` (non-schema-qualified) to bridge legacy ticket data. |
| 8 | `202510130004_rewards_engine.sql` | Creates `public.rewards_events` and a trigger to award points on `transactions`. |
| 9 | `202510130005_shop_promotions.sql` | Adds `public.shop_promotions` with activation index. |
| 10 | `20251020_admin_alignment.sql` | Normalises match/ticket structures, migrates legacy ticket rows, adds `match_zones`, `match_gates`, admin session tables, feature flags, translations, etc. |
| 11 | `20251021_add_partner_slug.sql` | Adds `slug` to `public.partners` **but no migration ever creates `public.partners`**. Confirm whether the table comes from Prisma or production-only DDL. |
| 12 | `20251025000000_p4_dashboard_i18n.sql` | Seeds dashboard/translation permissions. |
| 13 | `202510251001_p4_dashboard_views.sql` | Installs admin KPI & SMS analytics views on top of ticket/orders/payments. |
| 14 | `20251030_member_directory.sql` | Extends `public.users`, rebuilds `public_members` view with richer metadata. |
| 15 | `20251106_security_views.sql` | Blanket-enables + forces RLS across nearly every table and reapplies public/owner policies. Keeps permissive `p_service_role_all` fallback for the service role. |
| 16 | `20251109_security_hardening.sql` | Refines owner policies, introduces wallet/transaction select guards, and locks down insurance/SACCO flows. |
| 17 | `20251110_personalization_schema.sql` | Adds personalization tables (`user_prefs`, `user_favorites`, `content_items`, `community_*`). |

- Prisma migrations live in `backend/prisma/migrations` (8 directories ending in `202502051900_fan_sessions`). `npx prisma generate` succeeds locally. We **did not** run `prisma migrate status` because it requires real `DATABASE_URL`/`DATABASE_SHADOW_URL`.
- Evidence of drift:
  - Dual tables (`wallet` vs `wallets`, `tickets` vs `ticket_orders`, `products` vs `shop_products`) mean the live database needs inspection. Decide which tables remain canonical and drop/rename the obsolete copies during Phase 1.
  - `partners` table is referenced in SQL but absent from repo migrations. Track down the source (Prisma, manual DDL, or Supabase UI) and backfill a migration if it is needed.
  - `docs/supabase-hardening-roadmap.md` still references project `paysnhuxngsvzdpwlosv`; update after confirming the real project ID with the team.
- Remote parity checklist (requires Supabase CLI login):
  1. `supabase migration list` → confirm the timestamps above exist remotely in the same order.
  2. `supabase db remote commit --project-ref bduokvxvnscoknwamfle` (dry run) to dump production schema.
  3. Run `diff` between the commit output and the SQL above; capture mismatches for Phase 1 backlog.

## 2. Schema Inventory vs. Code

We scanned the repository (excluding migration folders) for explicit table references to understand coverage.

- **Heavily used tables (≥300 code references):** `matches`, `orders`, `payments`, `tickets`, `wallet`. Any breaking change here will ripple across frontend, backend, and edge functions.
- **Moderate usage (30–299 references):** `wallets`, `ticket_orders`, `ticket_passes`, `insurance_quotes`, `permissions`, `translations`, `shop_products`, `products`, `sms_parsed`, `sacco_deposits`, `polls`, `transactions`, `memberships`, `roles_permissions`, `admin_users`, `admin_sessions`, `feature_flags`, `community_*`.
- **Low / zero references (≤5 references):**
  - `content_items` (0 hits) – new personalization table not yet wired up.
  - `fund_projects`, `fund_donations`, `gamification_events`, `user_prefs`, `user_favorites`, `match_gates`, `match_zones`, `shop_promotions`, `rewards_events`, `admin_users_roles` – referenced only in seeding, views, or admin utilities. Verify whether they are still needed or can be consolidated.
- Use these counts to prioritise ERD review: start with the high-touch tables, then verify whether the low-touch tables should be deprecated or need follow-up stories.
- DDL sources for runbooks:
  - Supabase tables/views/funcs → `supabase/migrations/**.sql`.
  - Prisma-backed Nest backend → `backend/prisma/migrations/**/migration.sql` and `backend/prisma/schema.prisma`.
  - Edge functions that depend on specific columns are under `supabase/functions/**/index.ts`; keep those references in sync with DDL changes.

## 3. Secrets & Environment Snapshot

We inventoried env files committed to the repo. Sensitive values left in plaintext here should be rotated as part of Phase 1.

| Source | Keys Present | Notable Gaps / Actions |
| --- | --- | --- |
| `.env` | Supabase project/id/anon key, feature flags | `OPENAI_API_KEY`, `SMS_WEBHOOK_TOKEN`, `JWT_SECRET`, `REALTIME_SIGNING_SECRET`, `ANALYTICS_WRITE_KEY` are placeholders. Replace with secure values or load from Vault. |
| `.env.production` | Real admin session secrets, metrics token, OpenAI key | `SUPABASE_SERVICE_ROLE_KEY` is still `<insert…>`. The file contains production secrets in git; move them to Vercel/Supabase/Vault and purge from the repo after rotation. |
| `.vercel/.env.development.local` | Local onboarding tokens, OIDC token | Treat as development only; confirm they are not reused in production. |
| `.env.example` / `backend/.env.example` | Developer defaults | Backend example includes MoMo pay codes but no Twilio/Stripe secrets. Document the expected third-party keys (Twilio, Stripe, Slack, etc.) for the Vault task. |

Additional observations:
- No Twilio/Stripe environment variables exist in the repo beyond docs. Phase 1 must add them before rotating keys.
- Supabase project keys (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, publishable key) match the values committed in `.env`. Generate fresh publishable/secret keys and update Vercel/Supabase before removing these copies from git.
- Capture the authoritative env matrix (Vercel, Supabase Functions, backend) in `docs/` once the secrets are rotated.

## 4. Tier & Platform Considerations

- Current Supabase usage includes:
  - Row Level Security on almost every table (`20251106` migration forces RLS + service-role policy).
  - 11 edge functions (`supabase/functions/**`) for MoMo/insurance/ticket flows.
  - Admin KPI views and heavy transactional tables (`orders`, `tickets`, `payments`).
- The Free tier lacks:
  - Connection pooling and read replicas — needed once Edge Functions and Prisma share the database.
  - Point-in-time recovery (PITR) beyond 1 day — risky given audit_logs and financial data requirements.
  - pg_cron/queues — required for the cron/queue wrappers planned in Phase 3.
- Recommendation: budget for Supabase **Pro** (or at least the Teams plan) before completing Phase 1 so we can enable read replicas, PITR, and Cron/Queues without surprise downtime.

## 5. Next Actions Before Entering Phase 1

1. **Validate remote schema:** Run the Supabase CLI commands above, export the ERD from Supabase Studio, and attach both assets to the repo (e.g., `docs/supabase/erd-2025-10-18.svg`).
2. **Decide canonical tables:** Confirm whether `wallet` → `wallets`, `tickets` → `ticket_orders`, etc. remain; author follow-up migrations to drop/rename the legacy copies.
3. **Backfill missing DDL:** Either add Prisma migration(s) or Supabase SQL to create `public.partners` (or remove the slug migration if obsolete).
4. **Secrets plan:** Move real values out of `.env.production`, populate Vault + Vercel, and schedule rotations for publishable/service-role keys, JWT signer, metrics token.
5. **Tier sign-off:** Confirm with stakeholders that we will upgrade Supabase to the Pro tier once Phase 1 starts; note the billing impact alongside the Cron/Queues rollout.
6. **Documentation:** Update `docs/supabase-hardening-roadmap.md` with the correct project ID and link back to this snapshot so the Ops runbook stays consistent.

Once the above checklist is complete (and verified against production), Phase 0 can be marked done and we can proceed with RLS rewrites and secret rotation in Phase 1.
