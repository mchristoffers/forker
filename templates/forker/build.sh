#!/usr/bin/env bash
# Build this fork. Generated per project by the forker skill.
#
# Contract:
#   - runs non-interactively from any directory
#   - installs/uses whatever toolchain the project needs
#   - writes the release artifacts (and only those) into forker/dist/
#   - exits non-zero on failure
set -euo pipefail
cd "$(dirname "$0")/.."
source forker/config

echo "build: forker/build.sh has not been generated yet." >&2
echo "build: run the forker skill (Claude Code or Codex) in this repo." >&2
exit 1
