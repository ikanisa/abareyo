#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DB_URL="${PRODUCTION_DATABASE_SHADOW_URL:-${DATABASE_SHADOW_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  echo "Missing production shadow DB URL. Set PRODUCTION_DATABASE_SHADOW_URL (preferred) or DATABASE_SHADOW_URL." >&2
  exit 1
fi

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_CMD=(supabase)
else
  SUPABASE_CMD=(npx --yes supabase)
fi

echo "Checking for schema drift against production shadow DB..." >&2
DIFF_OUTPUT=$("${SUPABASE_CMD[@]}" db diff --linked --db-url "$DB_URL" --schema public --use-migra --file -)

# Trim whitespace-only output before evaluating
TRIMMED_DIFF=$(echo "$DIFF_OUTPUT" | sed '/^\s*$/d')

if [[ -n "$TRIMMED_DIFF" ]]; then
  echo "Detected uncommitted Supabase schema changes between migrations and production:" >&2
  echo "$DIFF_OUTPUT" >&2
  echo >&2
  echo "Run 'supabase db push' after applying migrations or sync the migrations directory before rerunning." >&2
  exit 1
fi

echo "No schema drift detected." >&2
