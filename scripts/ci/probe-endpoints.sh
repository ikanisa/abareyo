#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BASE_URL:-}" ]]; then
  echo "BASE_URL environment variable is required" >&2
  exit 1
fi

BASE_URL="${BASE_URL%%/}"
METRICS_TOKEN="${METRICS_TOKEN:-}"
SUMMARY_LIMIT=${SUMMARY_LIMIT:-40}
ARTIFACT_DIR="${ARTIFACT_DIR:-artifacts}";
mkdir -p "${ARTIFACT_DIR}"

declare -i failures=0

append_summary() {
  local title="$1"
  local file="$2"
  if [[ -z "${GITHUB_STEP_SUMMARY:-}" || ! -f "${file}" ]]; then
    return
  fi
  {
    echo "### ${title}"
    echo '```'
    head -n "${SUMMARY_LIMIT}" "${file}"
    echo '```'
  } >>"${GITHUB_STEP_SUMMARY}"
}

probe() {
  local name="$1"
  local url="$2"
  shift 2
  local outfile="${ARTIFACT_DIR}/${name}.txt"

  echo "Probing ${url}" >&2
  set +e
  curl --silent --show-error --fail-with-body "$@" "${url}" --output "${outfile}"
  local status=$?
  set -e

  append_summary "${name}" "${outfile}"

  if [[ ${status} -ne 0 ]]; then
    echo "::error title=${name} probe failed::${url}" >&2
    failures+=1
  fi
}

probe "health" "${BASE_URL}/api/health"

if [[ -n "${METRICS_TOKEN}" ]]; then
  probe "metrics" "${BASE_URL}/metrics" -H "Authorization: Bearer ${METRICS_TOKEN}"
else
  probe "metrics" "${BASE_URL}/metrics"
fi

if [[ ${failures} -ne 0 ]]; then
  echo "${failures}" >"${ARTIFACT_DIR}/failures.count"
  exit ${failures}
fi

echo "0" >"${ARTIFACT_DIR}/failures.count"
