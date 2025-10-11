#!/usr/bin/env bash
set -euo pipefail

# Generate and add required Vercel env vars for this project.
# - Requires: vercel CLI installed and logged in (vercel login)

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' is required." >&2; exit 1; }
}

require_cmd vercel
require_cmd openssl

echo "Linking current folder to a Vercel project (if not already linked)..."
if [ ! -f .vercel/project.json ]; then
  vercel link --yes || true
fi

default_backend_url="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:5000/api}"
read -rp "Backend API URL [/api or http://localhost:5000/api] [${default_backend_url}]: " input_backend
NEXT_PUBLIC_BACKEND_URL=${input_backend:-$default_backend_url}

default_cors_origin="${CORS_ORIGIN:-http://localhost:3000}"
read -rp "CORS_ORIGIN (comma-separated, no trailing slash) [${default_cors_origin}]: " input_cors
CORS_ORIGIN=${input_cors:-$default_cors_origin}

METRICS_TOKEN=$(openssl rand -hex 32)
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
FAN_SESSION_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_ADMIN_SESSION_COOKIE=${NEXT_PUBLIC_ADMIN_SESSION_COOKIE:-admin_session}

add_env() {
  local name="$1" val="$2"
  printf "%s\n" "$val" | vercel env add "$name" production || true
  printf "%s\n" "$val" | vercel env add "$name" preview || true
  printf "%s\n" "$val" | vercel env add "$name" development || true
}

echo "Adding Vercel environment variables (production/preview/development)..."
add_env NEXT_PUBLIC_BACKEND_URL "$NEXT_PUBLIC_BACKEND_URL"
add_env NEXT_PUBLIC_ADMIN_SESSION_COOKIE "$NEXT_PUBLIC_ADMIN_SESSION_COOKIE"
add_env CORS_ORIGIN "$CORS_ORIGIN"
add_env METRICS_TOKEN "$METRICS_TOKEN"
add_env ADMIN_SESSION_SECRET "$ADMIN_SESSION_SECRET"
add_env FAN_SESSION_SECRET "$FAN_SESSION_SECRET"

echo "Done. Values used:"
printf "NEXT_PUBLIC_BACKEND_URL=%s\n" "$NEXT_PUBLIC_BACKEND_URL"
printf "NEXT_PUBLIC_ADMIN_SESSION_COOKIE=%s\n" "$NEXT_PUBLIC_ADMIN_SESSION_COOKIE"
printf "CORS_ORIGIN=%s\n" "$CORS_ORIGIN"
printf "METRICS_TOKEN=%s\n" "$METRICS_TOKEN"
printf "ADMIN_SESSION_SECRET=%s\n" "$ADMIN_SESSION_SECRET"
printf "FAN_SESSION_SECRET=%s\n" "$FAN_SESSION_SECRET"

echo "Note: DATABASE_URL and other provider credentials are intentionally skipped per your request."

