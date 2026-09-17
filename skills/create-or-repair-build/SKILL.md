---
name: create-or-repair-build
description: Create or repair forker/build.sh in a forker fork (a repo with forker/config). Inspects how the source builds and writes a build script that puts release artifacts into forker/dist/, or fixes a broken one, e.g. after `make build` failed following an upstream update. Called by the forker skill after forking; also use it directly when a fork's build is missing or broken.
---

# create-or-repair-build

Run this inside a forker fork, i.e. a repo that has `forker/config`. If there isn't one, use the `forker` skill first.
`forker/build.sh` is the only project-specific file in the forker layer. Don't touch the rest
(`Makefile`/`forker.mk`, `forker/config`, `publish.sh`, `update.sh`, `service.sh`).

The `make` command is `make`, or `make -f forker.mk` if that file exists.

## 1. Choose the mode

- **Create**: `forker/build.sh` is still the stub (it prints "has not been generated yet"). Go to step 2.
- **Repair**: a real script exists. Run `make build`, keep the error, and find out what changed upstream:
  `git log --oneline -20 --merges`, then `git diff <previous release tag> <new tag> --stat` focused on
  CI workflows, build manifests and toolchain files. Fix the script to match, then go to step 4.
  If the build approach itself changed, treat it as **Create**.

## 2. Understand how the source builds

Check these, most reliable first:

1. `.github/workflows/*.yml`: the release/build jobs show the exact commands, toolchain versions and artifacts
2. README / CONTRIBUTING / docs build sections
3. Manifests: `package.json` scripts, `Cargo.toml`, `go.mod`, `pyproject.toml`, `pom.xml`/`build.gradle`, `CMakeLists.txt`, the upstream `Makefile`, `Dockerfile`, `flake.nix`, `justfile`, `Taskfile.yml`
4. The latest upstream release (`source forker/config; gh release view --repo "$UPSTREAM"`): its assets show what "the build output" should be

The artifacts should be the same kind of files upstream attaches to its releases.
If upstream ships no assets, pick the natural distributable (binary, tarball, wheel, `.tgz` from `npm pack`, ...).
If it's genuinely unclear, ask the user.

## 3. Write `forker/build.sh`

Contract:

- `#!/usr/bin/env bash`, `set -euo pipefail`, `cd "$(dirname "$0")/.."`, `source forker/config`
- Non-interactive and idempotent: start with `rm -rf forker/dist && mkdir -p forker/dist`
- Use the project's own build tooling and commands (mirror its CI), and pin nothing the project doesn't pin
- Check required tools up front with a clear error (`command -v cargo >/dev/null || { echo "build: cargo required" >&2; exit 1; }`)
- Copy **only** the final artifacts into `forker/dist/`, with flat, descriptive file names (they become release assets)
- Don't edit upstream files. Anything that has to change goes in `build.sh` itself, which keeps `make update` merges conflict-free
- Keep it short and readable, and add a one-line comment saying where the commands came from (e.g. `# mirrors .github/workflows/release.yml`)

## 4. Verify

```sh
make build            # must succeed
ls -la forker/dist    # must contain the expected artifacts, nothing else
git status --short    # only forker/build.sh may be changed
```

Iterate until it works. If a toolchain is missing on this machine, tell the user what to install instead of silently working around it.

## 5. Commit

```sh
git add forker/build.sh
git commit -m "forker: create build script"   # or "forker: repair build script for <tag>"
git push origin HEAD
```

Don't run `make publish` unless the user asks for it.

Report back: create or repair, the artifacts, where the build commands came from, and (for repair) what upstream change broke it.
