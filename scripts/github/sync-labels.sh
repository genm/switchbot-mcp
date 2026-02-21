#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-genm/switchbot-mcp}"

upsert_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$description" --force >/dev/null
}

upsert_label "safe-to-automerge" "0E8A16" "Meets auto-merge safety criteria"
upsert_label "manual-review" "D73A4A" "Requires manual reviewer approval"
upsert_label "irreversible" "B60205" "Potentially irreversible change"
upsert_label "security" "5319E7" "Security-sensitive change"

echo "Label sync complete for ${REPO}."
