#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${GITHUB_BASE_REF:-integration}"
HEAD_SHA="${GITHUB_SHA:-HEAD}"

if ! git rev-parse --verify "origin/${BASE_REF}" >/dev/null 2>&1; then
  git fetch origin "${BASE_REF}" --prune --depth=100
fi

BASE_SHA="origin/${BASE_REF}"
if [[ -n "${GITHUB_EVENT_PATH:-}" ]] && [[ -f "${GITHUB_EVENT_PATH}" ]]; then
  PR_BASE_SHA=$(jq -r '.pull_request.base.sha // empty' "${GITHUB_EVENT_PATH}")
  if [[ -n "${PR_BASE_SHA}" && "${PR_BASE_SHA}" != "null" ]]; then
    BASE_SHA="${PR_BASE_SHA}"
  fi
fi

CHANGED_FILES=$(git diff --name-only "${BASE_SHA}"..."${HEAD_SHA}")

if [[ -z "${CHANGED_FILES}" ]]; then
  echo "No changed files detected."
  exit 0
fi

echo "Changed files:"
echo "${CHANGED_FILES}"

BLOCKED_PATTERNS=(
  '^migrations/'
  '^auth/'
  '^infra/'
  '^config/'
  'openapi'
  'schema'
  'contract'
)

blocked=0
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "${CHANGED_FILES}" | grep -Eiq "${pattern}"; then
    echo "Irreversible-risk path matched pattern: ${pattern}"
    blocked=1
  fi
done

if git diff "${BASE_SHA}"..."${HEAD_SHA}" | grep -E '^-.*(DROP TABLE|DROP COLUMN|ALTER COLUMN|required:|enum:|/[^ ]*:)' >/dev/null 2>&1; then
  echo "Potential contract/schema destructive change detected in diff."
  blocked=1
fi

if [[ "${blocked}" -eq 1 ]]; then
  echo "manual review required: irreversible change detector blocked auto-merge/promotion"
  exit 1
fi

echo "Irreversible check passed."
