# Canonical Table Decisions (Phase 0 Follow-Up)

This note captures the proposed “single source of truth” for overlapping tables discovered during the Phase 0 audit. Target audience: platform/back-end teams preparing Phase 1 migrations.

## Guiding Principles

- **Supabase SQL migrations own the production schema.** We treat the lower_snake_case tables created there as canonical.
- **Prisma operates as a client definition only.** Its models must map onto the canonical Supabase tables by using `@@map`/`@map` or by adopting snake_case identifiers.
- **CamelCase duplicates must disappear.** They were introduced by early Prisma experiments and no longer carry data.

## Canonical Tables vs. Duplicates

| Domain | Keep | Drop (new migration) | Notes |
| --- | --- | --- | --- |
| Ticketing | `ticket_orders`, `ticket_order_items`, `ticket_passes`, `ticket_zones`, `match_gates` | `"TicketOrder"`, `"TicketOrderItem"`, `"TicketPass"`, `"TicketZone"`, `"MatchGate"` | RLS, policies, and admin views already target snake_case tables. |
| Wallets | `wallet`, `transactions` | `"User"`/`"Wallet"` permutations | Legacy plural tables (`wallets`) remain for audit; drop once data confirmed empty. |
| Orders & Payments | `orders`, `order_items`, `payments`, `shop_products` | `"Order"`, `"OrderItem"`, `"Payment"`, `"Product"` | Supabase SQL enforces snake_case FKs; camel versions had no data. |
| Admin/Auth | `admin_users`, `admin_roles`, `admin_sessions`, `admin_users_roles`, `audit_logs`, `feature_flags`, `translations`, `ussd_template`, `sms_parsed`, `sms_raw` | CamelCase equivalents | `20251112_cleanup_camelcase.sql` removes the duplicates. |
| Community/Content | `community_posts`, `community_reports`, `content_items`, `fan_posts` | `"Post"`, `"PostReaction"`, `"FanClub"`, `"FanClubMember"` | Preserve snake_case views powering dashboards. |

Partners gap addressed via `20251111_add_partners_table.sql`; keep `public.partners` canonical going forward.

## Completed Actions (Oct 18 2025)

1. Added `supabase/migrations/20251112_cleanup_camelcase.sql` to drop camelCase tables/enums left over from Prisma scaffolding.
2. Ran `npx prisma db pull` against production to align `backend/prisma/schema.prisma` with the canonical schema.
3. Documented the decision so future migrations extend snake_case definitions only.

## Upcoming Tasks

1. Snapshot/diff `wallets` vs. `wallet` before removing `wallets`.
2. Rebuild Prisma models with explicit `@@map` if we decide to keep camelCase field names in application code.
3. Update runbooks once the cleanup migration ships to staging/production.
