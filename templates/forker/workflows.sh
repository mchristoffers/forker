#!/usr/bin/env bash
# Disable every Actions workflow on the fork except forker's own, so upstream CI does not run here.
# usage: forker/workflows.sh disable-upstream
set -euo pipefail
cd "$(dirname "$0")/.."
source forker/config

[[ "${1:-}" == "disable-upstream" ]] || { echo "usage: forker/workflows.sh disable-upstream" >&2; exit 1; }

gh api "repos/$FORK/actions/workflows" --paginate --jq '.workflows[] | select(.state == "active") | "\(.id) \(.path)"' |
  while read -r id path; do
    case "$path" in
      .github/workflows/forker-*) ;;
      *) gh api -X PUT "repos/$FORK/actions/workflows/$id/disable" --silent && echo "workflows: disabled $path" ;;
    esac
  done
