#!/usr/bin/env bash
# Build this fork. Written per project by the create-or-repair-build skill.
#
# Contract:
#   - non-interactive and idempotent: starts with rm -rf forker/dist && mkdir -p forker/dist
#   - mirrors the project's own build (its CI release job); checks required tools up front
#   - writes only the release artifacts into forker/dist/ (flat names, they become release assets)
#   - never edits upstream files, so `make update` merges stay conflict-free
#   - one comment line naming where the commands came from
set -euo pipefail
cd "$(dirname "$0")/.."
source forker/config

echo "build: forker/build.sh has not been generated yet." >&2
echo "build: run the create-or-repair-build skill in this repo." >&2
exit 1
