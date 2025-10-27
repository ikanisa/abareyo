-- verify-integrity.sql
-- Disaster recovery validation checklist for Supabase Postgres.
-- Run with: psql "$DATABASE_URL" -f scripts/db/verify-integrity.sql

\echo 'Checking expected schemas exist'
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('public', 'auth')
ORDER BY schema_name;

\echo 'Ensuring critical tables are present'
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'wallet',
    'transactions',
    'ticket_orders',
    'orders',
    'payments'
  )
ORDER BY table_name;

\echo 'Row count spot checks (must be >= 0)'
SELECT
  'wallet' AS table,
  CASE
    WHEN to_regclass('public.wallet') IS NOT NULL THEN (SELECT COUNT(*) FROM public.wallet)
    ELSE NULL
  END AS row_count
UNION ALL
SELECT
  'transactions' AS table,
  CASE
    WHEN to_regclass('public.transactions') IS NOT NULL THEN (SELECT COUNT(*) FROM public.transactions)
    ELSE NULL
  END
UNION ALL
SELECT
  'ticket_orders' AS table,
  CASE
    WHEN to_regclass('public.ticket_orders') IS NOT NULL THEN (SELECT COUNT(*) FROM public.ticket_orders)
    ELSE NULL
  END
UNION ALL
SELECT
  'orders' AS table,
  CASE
    WHEN to_regclass('public.orders') IS NOT NULL THEN (SELECT COUNT(*) FROM public.orders)
    ELSE NULL
  END
UNION ALL
SELECT
  'payments' AS table,
  CASE
    WHEN to_regclass('public.payments') IS NOT NULL THEN (SELECT COUNT(*) FROM public.payments)
    ELSE NULL
  END
UNION ALL
SELECT
  'users' AS table,
  CASE
    WHEN to_regclass('public.users') IS NOT NULL THEN (SELECT COUNT(*) FROM public.users)
    ELSE NULL
  END;

\echo 'Referential integrity: wallets without users'
SELECT w.id
FROM public.wallet w
LEFT JOIN public.users u ON u.id = w.user_id
WHERE w.user_id IS NOT NULL AND u.id IS NULL
LIMIT 20;

\echo 'Referential integrity: transactions referencing missing users'
SELECT t.id
FROM public.transactions t
LEFT JOIN public.users u ON u.id = t.user_id
WHERE t.user_id IS NOT NULL AND u.id IS NULL
LIMIT 20;

\echo 'Referential integrity: ticket orders without users'
SELECT o.id
FROM public.ticket_orders o
LEFT JOIN public.users u ON u.id = o.user_id
WHERE o.user_id IS NOT NULL AND u.id IS NULL
LIMIT 20;

\echo 'Referential integrity: payments missing parent ticket order'
SELECT p.id
FROM public.payments p
LEFT JOIN public.ticket_orders o ON o.id = p.order_id
WHERE p.order_id IS NOT NULL AND o.id IS NULL
LIMIT 20;

\echo 'Recent writes within RPO window'
SELECT GREATEST(
  COALESCE(
    CASE
      WHEN to_regclass('public.wallet') IS NOT NULL THEN (SELECT MAX(updated_at) FROM public.wallet)
    END,
    to_timestamp(0)
  ),
  COALESCE(
    CASE
      WHEN to_regclass('public.transactions') IS NOT NULL THEN (SELECT MAX(created_at) FROM public.transactions)
    END,
    to_timestamp(0)
  ),
  COALESCE(
    CASE
      WHEN to_regclass('public.ticket_orders') IS NOT NULL THEN (SELECT MAX(created_at) FROM public.ticket_orders)
    END,
    to_timestamp(0)
  )
) AS latest_update;
