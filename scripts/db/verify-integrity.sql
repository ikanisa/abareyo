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
    'wallet_transactions',
    'orders',
    'missions',
    'profiles'
  )
ORDER BY table_name;

\echo 'Row count spot checks (must be >= 0)'
SELECT 'wallet_transactions' AS table, COUNT(*) AS row_count FROM public.wallet_transactions
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'missions', COUNT(*) FROM public.missions
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;

\echo 'Referential integrity: orphaned wallet transactions'
SELECT wt.id
FROM public.wallet_transactions wt
LEFT JOIN public.profiles p ON p.id = wt.profile_id
WHERE p.id IS NULL
LIMIT 20;

\echo 'Referential integrity: pending orders without missions'
SELECT o.id
FROM public.orders o
LEFT JOIN public.missions m ON m.id = o.mission_id
WHERE o.status = 'pending' AND m.id IS NULL
LIMIT 20;

\echo 'Recent writes within RPO window'
SELECT MAX(updated_at) AS latest_update
FROM public.wallet_transactions;
