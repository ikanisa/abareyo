#!/usr/bin/env bash
set -euo pipefail

# Legacy helper retained for historical context: generates Vercel env vars
# for this project. The primary deployment pipeline now uses hosting
# platform runbooks instead. Only run this when backfilling the archived
# Vercel setup.
# - Requires: vercel CLI installed and logged in (vercel login)

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' is required." >&2; exit 1; }
}

require_cmd vercel
require_cmd openssl

prompt_env() {
  local var_name="$1"
  local prompt_text="$2"
  local default_value="${3-}"
  local current_value="${!var_name-}"

  if [ -z "$current_value" ] && [ -n "$default_value" ]; then
    current_value="$default_value"
  fi

  if [ -n "$current_value" ]; then
    read -rp "$prompt_text [$current_value]: " input_value
    if [ -n "$input_value" ]; then
      eval "$var_name=\"$input_value\""
    else
      eval "$var_name=\"$current_value\""
    fi
  else
    read -rp "$prompt_text: " input_value
    eval "$var_name=\"$input_value\""
  fi
}

require_non_empty() {
  local var_name="$1"
  if [ -z "${!var_name-}" ]; then
    echo "Error: $var_name is required." >&2
    exit 1
  fi
}

echo "Linking current folder to a Vercel project (if not already linked)..."
if [ ! -f .vercel/project.json ]; then
  vercel link --yes || true
fi

prompt_env "NEXT_PUBLIC_BACKEND_URL" \
  "Backend API URL (absolute https://... or /api when proxying)" \
  "https://backend.abareyo.com/api"

prompt_env "NEXT_PUBLIC_SITE_URL" \
  "Primary site URL (used for metadata and canonical links)" \
  "https://app.abareyo.com"

prompt_env "NEXT_PUBLIC_ENVIRONMENT_LABEL" \
  "Environment ribbon label" \
  "production"

prompt_env "NEXT_PUBLIC_TELEMETRY_URL" \
  "Telemetry endpoint" \
  "/api/telemetry/app-state"

prompt_env "NEXT_PUBLIC_SOCKET_PATH" \
  "Socket path (leave /api/socket unless customized)" \
  "/api/socket"

prompt_env "NEXT_PUBLIC_SUPABASE_URL" \
  "Supabase project URL" \
  "https://paysnhuxngsvzdpwlosv.supabase.co"

prompt_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "Supabase anon/publishable key"

prompt_env "SUPABASE_SERVICE_ROLE_KEY" \
  "Supabase service role key"

prompt_env "SITE_SUPABASE_URL" \
  "Server-side Supabase URL override" \
  "$NEXT_PUBLIC_SUPABASE_URL"

prompt_env "SITE_SUPABASE_SECRET_KEY" \
  "Server-side Supabase secret key" \
  "$SUPABASE_SERVICE_ROLE_KEY"

prompt_env "NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN" \
  "Onboarding public token"

prompt_env "ONBOARDING_API_TOKEN" \
  "Onboarding server token"

prompt_env "OPENAI_API_KEY" \
  "OpenAI API key"

prompt_env "OPENAI_BASE_URL" \
  "OpenAI base URL" \
  "https://api.openai.com/v1"

prompt_env "NEXT_PUBLIC_OPENAI_BASE_URL" \
  "OpenAI base URL exposed to the client" \
  "$OPENAI_BASE_URL"

prompt_env "NEXT_PUBLIC_ADMIN_SESSION_COOKIE" \
  "Admin session cookie name" \
  "admin_session"

prompt_env "CORS_ORIGIN" \
  "CORS_ORIGIN (comma-separated, no trailing slash)" \
  "https://app.abareyo.com,https://admin.abareyo.com"

read -rp "Add optional Sentry DSN? (leave blank to skip): " input_sentry_dsn
if [ -n "$input_sentry_dsn" ]; then
  SENTRY_DSN="$input_sentry_dsn"
fi

read -rp "Add optional public Sentry DSN? (leave blank to skip): " input_public_sentry_dsn
if [ -n "$input_public_sentry_dsn" ]; then
  NEXT_PUBLIC_SENTRY_DSN="$input_public_sentry_dsn"
fi

require_non_empty NEXT_PUBLIC_BACKEND_URL
require_non_empty NEXT_PUBLIC_SITE_URL
require_non_empty NEXT_PUBLIC_SUPABASE_URL
require_non_empty NEXT_PUBLIC_SUPABASE_ANON_KEY
require_non_empty SUPABASE_SERVICE_ROLE_KEY
require_non_empty SITE_SUPABASE_URL
require_non_empty SITE_SUPABASE_SECRET_KEY
require_non_empty NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN
require_non_empty ONBOARDING_API_TOKEN
require_non_empty OPENAI_API_KEY

METRICS_TOKEN=$(openssl rand -hex 32)
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
FAN_SESSION_SECRET=$(openssl rand -hex 32)

add_env() {
  local name="$1" val="$2"
  if [ -z "$val" ]; then
    return
  fi
  printf "%s\n" "$val" | vercel env add "$name" production || true
  printf "%s\n" "$val" | vercel env add "$name" preview || true
  printf "%s\n" "$val" | vercel env add "$name" development || true
}

echo "Adding Vercel environment variables (production/preview/development)..."

add_env NEXT_PUBLIC_BACKEND_URL "$NEXT_PUBLIC_BACKEND_URL"
add_env NEXT_PUBLIC_SITE_URL "$NEXT_PUBLIC_SITE_URL"
add_env NEXT_PUBLIC_ENVIRONMENT_LABEL "$NEXT_PUBLIC_ENVIRONMENT_LABEL"
add_env NEXT_PUBLIC_TELEMETRY_URL "$NEXT_PUBLIC_TELEMETRY_URL"
add_env NEXT_PUBLIC_SOCKET_PATH "$NEXT_PUBLIC_SOCKET_PATH"
add_env NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"
add_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
add_env SITE_SUPABASE_URL "$SITE_SUPABASE_URL"
add_env SITE_SUPABASE_SECRET_KEY "$SITE_SUPABASE_SECRET_KEY"
add_env NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN "$NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN"
add_env ONBOARDING_API_TOKEN "$ONBOARDING_API_TOKEN"
add_env OPENAI_API_KEY "$OPENAI_API_KEY"
add_env OPENAI_BASE_URL "$OPENAI_BASE_URL"
add_env NEXT_PUBLIC_OPENAI_BASE_URL "$NEXT_PUBLIC_OPENAI_BASE_URL"
add_env NEXT_PUBLIC_ADMIN_SESSION_COOKIE "$NEXT_PUBLIC_ADMIN_SESSION_COOKIE"
add_env CORS_ORIGIN "$CORS_ORIGIN"
add_env METRICS_TOKEN "$METRICS_TOKEN"
add_env ADMIN_SESSION_SECRET "$ADMIN_SESSION_SECRET"
add_env FAN_SESSION_SECRET "$FAN_SESSION_SECRET"
add_env NEXT_PUBLIC_SENTRY_DSN "${NEXT_PUBLIC_SENTRY_DSN-}"
add_env SENTRY_DSN "${SENTRY_DSN-}"

echo "Done. Values used:"
printf "NEXT_PUBLIC_BACKEND_URL=%s\n" "$NEXT_PUBLIC_BACKEND_URL"
printf "NEXT_PUBLIC_SITE_URL=%s\n" "$NEXT_PUBLIC_SITE_URL"
printf "NEXT_PUBLIC_SUPABASE_URL=%s\n" "$NEXT_PUBLIC_SUPABASE_URL"
printf "NEXT_PUBLIC_SUPABASE_ANON_KEY=***%s\n" "${NEXT_PUBLIC_SUPABASE_ANON_KEY: -4}"
printf "SUPABASE_SERVICE_ROLE_KEY=***%s\n" "${SUPABASE_SERVICE_ROLE_KEY: -4}"
printf "NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN=***%s\n" "${NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: -4}"
printf "ONBOARDING_API_TOKEN=***%s\n" "${ONBOARDING_API_TOKEN: -4}"
printf "OPENAI_API_KEY=***%s\n" "${OPENAI_API_KEY: -4}"
printf "CORS_ORIGIN=%s\n" "$CORS_ORIGIN"
printf "NEXT_PUBLIC_SOCKET_PATH=%s\n" "$NEXT_PUBLIC_SOCKET_PATH"
printf "NEXT_PUBLIC_TELEMETRY_URL=%s\n" "$NEXT_PUBLIC_TELEMETRY_URL"
printf "NEXT_PUBLIC_ENVIRONMENT_LABEL=%s\n" "$NEXT_PUBLIC_ENVIRONMENT_LABEL"
printf "METRICS_TOKEN=%s\n" "$METRICS_TOKEN"
printf "ADMIN_SESSION_SECRET=%s\n" "$ADMIN_SESSION_SECRET"
printf "FAN_SESSION_SECRET=%s\n" "$FAN_SESSION_SECRET"
if [ -n "${NEXT_PUBLIC_SENTRY_DSN-}" ]; then
  printf "NEXT_PUBLIC_SENTRY_DSN=***%s\n" "${NEXT_PUBLIC_SENTRY_DSN: -4}"
fi
if [ -n "${SENTRY_DSN-}" ]; then
  printf "SENTRY_DSN=***%s\n" "${SENTRY_DSN: -4}"
fi

echo "Note: DATABASE_URL, REDIS_URL, and other provider credentials remain managed outside Vercel."

