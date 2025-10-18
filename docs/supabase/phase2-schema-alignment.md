# Phase 2 – Schema & Storage Alignment Snapshot (Oct 18 2025)

This note records the schema/storage work delivered in Phase 2 so teams can validate staging/production parity and plan remaining follow-ups.

## Applied migration: `20251113123000_phase2_schema_alignment`
- Dropped empty legacy tables (`wallets`, `tickets_legacy`, `transactions_legacy`, `products_legacy`). They are no longer referenced by Prisma or Supabase policies.
- Added useful fan-facing indexes:
  - `idx_ticket_orders_user` on `public.ticket_orders(user_id)`
  - `idx_orders_user` on `public.orders(user_id)`
  - `idx_payments_order` and `idx_payments_ticket_order` to speed payment joins.
- Provisioned new Supabase Storage buckets:
  - `avatars` (public read, owner/admin managed)
  - `tickets` (private per-user downloads)
  - `media` (public read, admin managed)
- Created storage policies enforcing those access rules while keeping a service-role escape hatch for automation.
- Enabled extensions `pg_stat_monitor`, `pgaudit`, `moddatetime`, and `tablefunc` (wrapped in graceful error handling for environments where they are unavailable).

## Storage policies overview
| Bucket | Read | Write/Update/Delete |
| --- | --- | --- |
| `avatars` | Everyone | Owner (`auth.uid`) & `role=admin` |
| `tickets` | Owner only | Owner only |
| `media` | Everyone | `role=admin` |
| (All) | `role=service_role` bypass via `storage_service_role_all` |

Policies live on `storage.objects`; adjust them if additional roles are introduced (e.g., partner uploads).

## Outstanding follow-ups
1. Seed baseline media/avatar assets via Supabase Storage CLI or dashboard (buckets are empty).
2. Update CI/CD runbooks to reference the new indexes and dropped tables.
3. Ensure backup/restore scripts ignore the removed legacy tables and include new buckets.
4. Monitor extension availability — if Supabase ever disables `pgaudit`/`pg_stat_monitor`, the migration will emit a NOTICE but the extension should remain enabled.

See also:
- `docs/supabase/vault-secret-map.md` for secret storage mapping.
- `docs/supabase/phase1-rls-hardening.md` for the preceding security changes.
