-- Disaster recovery data integrity checks for Rayon Sports
-- Run via `psql $DATABASE_URL -f scripts/db/verify-integrity.sql`

\echo 'Checking critical table row counts and recency metrics...'

-- Verify wallet transactions exist and updated recently
SELECT
  'wallet_transactions' AS table_name,
  COUNT(*) AS row_count,
  MAX(updated_at) AS last_updated_at
FROM wallet_transactions;

-- Verify orders exist and status distribution
SELECT
  status,
  COUNT(*) AS total
FROM orders
GROUP BY status
ORDER BY status;

-- Confirm missions table has active missions
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS active_missions,
  COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_missions
FROM missions;

-- Ensure user balances and wallet transactions remain consistent
SELECT
  SUM(balance) AS total_user_balance
FROM user_wallets;

SELECT
  SUM(amount) AS total_transactions_amount
FROM wallet_transactions
WHERE status = 'completed';

-- Compare latest backup snapshot metadata if available
SELECT
  MAX(completed_at) AS last_backup_completed_at
FROM backup_jobs;

\echo 'Integrity checks complete.'
