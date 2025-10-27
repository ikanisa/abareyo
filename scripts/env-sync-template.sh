#!/usr/bin/env bash
set -euo pipefail

# Environment bootstrap helper for self-hosted deployments.
# Prompts for required secrets and writes them to `.env.sync` so they can
# be copied into your chosen secret manager (Docker, Kubernetes, fly.io,
# Supabase, etc.).
#
# SECURITY NOTICE:
# This script collects both client-safe and SERVER-ONLY secrets.
# Variables prefixed with NEXT_PUBLIC_ are embedded in the browser bundle.
# SERVER-ONLY secrets (SUPABASE_SERVICE_ROLE_KEY, SITE_SUPABASE_SECRET_KEY,
# OPENAI_API_KEY, ADMIN_SESSION_SECRET, etc.) must NEVER be:
#   - Prefixed with NEXT_PUBLIC_
#   - Used in client-side code (app/, src/components/, public/)
#   - Exposed to the browser in any way

if command -v openssl >/dev/null 2>&1; then
  REQUIRE_OPENSSL=0
else
  REQUIRE_OPENSSL=1
fi

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

generate_secret_if_missing() {
  local var_name="$1"
  if [ -z "${!var_name-}" ]; then
    if [ "$REQUIRE_OPENSSL" -eq 0 ]; then
      eval "$var_name=\"$(openssl rand -hex 32)\""
    else
      echo "Warning: openssl not found. Supply a value for $var_name manually." >&2
      prompt_env "$var_name" "$var_name"
    fi
  fi
}

echo "Collecting environment variables for deployment..."

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
  "Supabase anon/publishable key (client-safe)"

echo ""
echo "=== SERVER-ONLY SECRETS (NEVER use NEXT_PUBLIC_ prefix) ==="
echo ""

prompt_env "SUPABASE_SERVICE_ROLE_KEY" \
  "Supabase service role key (SERVER-ONLY)"

prompt_env "SITE_SUPABASE_URL" \
  "Server-side Supabase URL override" \
  "$NEXT_PUBLIC_SUPABASE_URL"

prompt_env "SITE_SUPABASE_SECRET_KEY" \
  "Server-side Supabase secret key (SERVER-ONLY, defaults to service role key)" \
  "$SUPABASE_SERVICE_ROLE_KEY"

prompt_env "NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN" \
  "Onboarding public token (client-safe)"

prompt_env "ONBOARDING_API_TOKEN" \
  "Onboarding server token (SERVER-ONLY)"

prompt_env "OPENAI_API_KEY" \
  "OpenAI API key (SERVER-ONLY)"

prompt_env "OPENAI_BASE_URL" \
  "OpenAI base URL (SERVER-ONLY)" \
  "https://api.openai.com/v1"

prompt_env "NEXT_PUBLIC_OPENAI_BASE_URL" \
  "OpenAI base URL exposed to the client (client-safe, optional)" \
  "$OPENAI_BASE_URL"

echo ""
echo "WARNING: Do NOT expose server-only secrets by adding NEXT_PUBLIC_ prefix."
echo "Always keep OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, etc. as server-only."
echo ""

prompt_env "NEXT_PUBLIC_ADMIN_SESSION_COOKIE" \
  "Admin session cookie name" \
  "admin_session"

prompt_env "CORS_ORIGIN" \
  "CORS_ORIGIN (comma-separated, no trailing slash)" \
  "https://app.abareyo.com,https://admin.abareyo.com"

prompt_env "SENTRY_DSN" \
  "Sentry DSN (optional)"

prompt_env "NEXT_PUBLIC_SENTRY_DSN" \
  "Public Sentry DSN (optional)" \
  "$SENTRY_DSN"

prompt_env "AUTOMATION_BYPASS_SECRET" \
  "Automation bypass secret (optional)"

generate_secret_if_missing "FAN_SESSION_SECRET"
generate_secret_if_missing "ADMIN_SESSION_SECRET" # SERVER-ONLY: Session secret for admin authentication

declare -a REQUIRED_VARS=(
  NEXT_PUBLIC_BACKEND_URL
  NEXT_PUBLIC_SITE_URL
  NEXT_PUBLIC_ENVIRONMENT_LABEL
  NEXT_PUBLIC_TELEMETRY_URL
  NEXT_PUBLIC_SOCKET_PATH
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SITE_SUPABASE_URL
  SITE_SUPABASE_SECRET_KEY
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN
  ONBOARDING_API_TOKEN
  OPENAI_API_KEY
)

for var in "${REQUIRED_VARS[@]}"; do
  require_non_empty "$var"
done

OUTPUT_FILE=${OUTPUT_FILE:-.env.sync}
: > "$OUTPUT_FILE"

all_vars=(
  NEXT_PUBLIC_BACKEND_URL
  NEXT_PUBLIC_SITE_URL
  NEXT_PUBLIC_ENVIRONMENT_LABEL
  NEXT_PUBLIC_TELEMETRY_URL
  NEXT_PUBLIC_SOCKET_PATH
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SITE_SUPABASE_URL
  SITE_SUPABASE_SECRET_KEY
  NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN
  ONBOARDING_API_TOKEN
  OPENAI_API_KEY
  OPENAI_BASE_URL
  NEXT_PUBLIC_OPENAI_BASE_URL
  NEXT_PUBLIC_ADMIN_SESSION_COOKIE
  CORS_ORIGIN
  SENTRY_DSN
  NEXT_PUBLIC_SENTRY_DSN
  AUTOMATION_BYPASS_SECRET
  FAN_SESSION_SECRET
  ADMIN_SESSION_SECRET
)

for var in "${all_vars[@]}"; do
  value="${!var-}"
  if [ -n "$value" ]; then
    printf '%s=%s\n' "$var" "$value" >> "$OUTPUT_FILE"
  fi
done

echo "\nSaved $OUTPUT_FILE with the collected environment variables." \
  "Copy these values into your secret manager or `.env.local` as needed."
