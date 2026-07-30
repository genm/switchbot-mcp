#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-main}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "${CURRENT_BRANCH}" == "${BASE_BRANCH}" ]]; then
  exit 0
fi

if ! git rev-parse --verify "origin/${BASE_BRANCH}" >/dev/null 2>&1; then
  echo "[pre-push] origin/${BASE_BRANCH} not found. Fetch the base branch first." >&2
  exit 1
fi

git fetch origin "${BASE_BRANCH}" --prune >/dev/null 2>&1

if ! git merge-base --is-ancestor "origin/${BASE_BRANCH}" HEAD; then
  echo "[pre-push] Rebase required before push." >&2
  echo "Run: git fetch origin ${BASE_BRANCH} --prune" >&2
  echo "Run: git rebase origin/${BASE_BRANCH}" >&2
  echo "Resolve conflicts completely before pushing." >&2
  exit 1
fi
