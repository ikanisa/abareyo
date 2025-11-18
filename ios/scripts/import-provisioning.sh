#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROVISIONING_DIR="$ROOT_DIR/Provisioning"
mkdir -p "$PROVISIONING_DIR"

if [[ -z "${APPLE_PROVISIONING_PROFILE_BASE64:-}" ]]; then
  echo "[ios] APPLE_PROVISIONING_PROFILE_BASE64 is missing; skipping provisioning import." >&2
else
  echo "[ios] Writing provisioning profile to $PROVISIONING_DIR/AbareyoMobile_Distribution.mobileprovision"
  printf '%s' "$APPLE_PROVISIONING_PROFILE_BASE64" | base64 --decode > "$PROVISIONING_DIR/AbareyoMobile_Distribution.mobileprovision"
fi

if [[ -z "${APPLE_DISTRIBUTION_CERT_BASE64:-}" ]]; then
  echo "[ios] APPLE_DISTRIBUTION_CERT_BASE64 is missing; skipping certificate import." >&2
else
  echo "[ios] Writing distribution certificate to $PROVISIONING_DIR/AbareyoMobile_Distribution.p12"
  printf '%s' "$APPLE_DISTRIBUTION_CERT_BASE64" | base64 --decode > "$PROVISIONING_DIR/AbareyoMobile_Distribution.p12"
fi

cat > "$PROVISIONING_DIR/README.md" <<'DOC'
# iOS Provisioning Artifacts

Artifacts in this directory are generated dynamically by `ios/scripts/import-provisioning.sh`.
Secrets are sourced from GitHub Actions (`APPLE_*`) and 1Password per `docs/mobile/signing-keys.md`.
DOC
