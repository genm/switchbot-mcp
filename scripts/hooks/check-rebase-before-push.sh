#!/usr/bin/env bash
set -euo pipefail

INTEGRATION_BRANCH="${INTEGRATION_BRANCH:-integration}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "${CURRENT_BRANCH}" == "${INTEGRATION_BRANCH}" || "${CURRENT_BRANCH}" == "main" ]]; then
  exit 0
fi

if ! git rev-parse --verify "origin/${INTEGRATION_BRANCH}" >/dev/null 2>&1; then
  echo "[pre-push] origin/${INTEGRATION_BRANCH} not found. Create/sync integration branch first." >&2
  exit 1
fi

git fetch origin "${INTEGRATION_BRANCH}" --prune >/dev/null 2>&1

if ! git merge-base --is-ancestor "origin/${INTEGRATION_BRANCH}" HEAD; then
  echo "[pre-push] Rebase required before push." >&2
  echo "Run: git fetch origin ${INTEGRATION_BRANCH} --prune" >&2
  echo "Run: git rebase origin/${INTEGRATION_BRANCH}" >&2
  echo "Resolve conflicts completely before pushing." >&2
  exit 1
fi
