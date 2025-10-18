# Canonical Table Decisions (Phase 0 Follow-Up)

This note captures the proposed “single source of truth” for overlapping tables discovered during the Phase 0 audit. Target audience: platform/back-end teams preparing Phase 1 migrations.

## Ticketing Domain

- **Keep:** `ticket_orders`, `ticket_order_items`, `ticket_passes`
- **Archive:** legacy `tickets` table (rename to `tickets_legacy` or drop once data is copied).
- **Actions:**
  1. Confirm production still writes to `ticket_orders` (`app/api/...`, edge functions already do).
  2. Snapshot historical rows from `tickets` (if any) into `ticket_passes` using the logic introduced in `20251020_admin_alignment.sql`.
  3. Drop or lock `tickets` to prevent drift.

## Wallet Domain

- **Keep:** `wallet` (singular) for fan balances and `transactions` for ledger history.
- **Archive:** `wallets` (plural) introduced during early MVP.
- **Actions:**
  1. Ensure every fan has a row in `wallet` (enforced in API `app/api/wallet/route.ts`).
  2. Export any rows from `wallets` and reconcile balances against `wallet`.
  3. Drop `wallets` once parity is audited.

## Products & Orders

- **Keep:** `shop_products`, `orders`, `order_items`.
- **Archive:** legacy `products` table still referenced in migrations for backfill support.
- **Actions:**
  1. Verify admin UI/seed scripts no longer read from `products`.
  2. Run `supabase db remote commit` to check for live data; migrate remaining rows into `shop_products`.
  3. Drop `products` table after confirming `order_items.product_id` points at `shop_products`.

## Rewards & Promotions

- **Keep:** `rewards_events`, `shop_promotions`.
- **Confirm usage:** Minimal code references today. Validate with stakeholders whether these features are active; if not, park the tables in a “future feature” schema or drop until reintroduced.

## Partners Table Gap

- Migration `20251021_add_partner_slug.sql` assumes a `public.partners` table. No create statement exists in repo migrations or Prisma schema.
- **Decision:** Either (a) add a Supabase migration to define `public.partners` (id uuid PK, name text, metadata jsonb) or (b) delete the slug migration if partners now live in another service.
- Needs product confirmation before Phase 1 – add as a backlog ticket.

## Next Steps

1. Produce SQL scripts to archive/drop the legacy tables (wrap with `if exists`).
2. Run them against staging after creating full backups.
3. Update Prisma schema if any of the canonical tables need new indexes/relations.
4. Document the decision in runbooks and update Supabase Studio ERD.
