#!/usr/bin/env bash
# Publish a build as a GitHub release on the fork.
# usage: make publish VERSION=v1.2.3
set -euo pipefail
cd "$(dirname "$0")/.."
source forker/config

version="${1:-}"
if [[ -z "$version" ]]; then
  echo "publish: VERSION is required, e.g. make publish VERSION=v1.2.3" >&2
  exit 1
fi

shopt -s nullglob
artifacts=(forker/dist/*)
if (( ${#artifacts[@]} == 0 )); then
  echo "publish: no artifacts in forker/dist/, run make build first" >&2
  exit 1
fi

gh release create "$version" --repo "$FORK" --title "$version" --generate-notes "${artifacts[@]}"
