-- Disaster recovery data integrity checks for Rayon Sports
-- Usage: Run via `psql $DATABASE_URL -f scripts/db/verify-integrity.sql`
-- Note: `$DATABASE_URL` must be set to a valid PostgreSQL connection string in the format:
--   postgresql://user:password@host:port/database
-- If `$DATABASE_URL` is not set or is invalid, the script will fail to connect.

\echo 'Checking critical table row counts and recency metrics...'

-- Verify wallet transactions exist and were created recently
SELECT
  'transactions' AS table_name,
  COUNT(*) AS row_count,
  MAX(created_at) AS last_created_at
FROM transactions;

-- Verify commerce orders exist and review status distribution
SELECT
  status,
  COUNT(*) AS total
FROM orders
GROUP BY status
ORDER BY status;

-- Confirm upcoming and completed matches are tracked
SELECT
  status,
  COUNT(*) AS total
FROM matches
GROUP BY status
ORDER BY status;

-- Ensure wallet balances are populated
SELECT
  SUM(balance) AS total_wallet_balance
FROM wallet;

-- Summarize transaction amounts by kind for reconciliation
SELECT
  COALESCE(kind, 'unknown') AS transaction_kind,
  SUM(amount) AS total_amount
FROM transactions
GROUP BY transaction_kind
ORDER BY transaction_kind;

-- Surface the most recent payment event if available
SELECT
  MAX(created_at) AS last_payment_recorded_at
FROM payments;

\echo 'Integrity checks complete.'
