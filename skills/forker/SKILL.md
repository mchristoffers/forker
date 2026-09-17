---
name: forker
description: Set up a new fork of a GitHub repo with forker - fork it via gh, add the generic build/publish/update layer, then inspect the source and generate the project-specific forker/build.sh. Use when asked to fork a repo with forker, set up a forker fork, or (re)generate a fork's build script, e.g. after `make build` broke following an upstream update.
---

# forker

forker adds a generic layer to a fork. Every part of it works for any repo except
`forker/build.sh`, because building depends on the source. Your job is to set up
the fork and write that one script.

Layer inside the fork (don't restructure it):

| File | Role | Generic? |
|---|---|---|
| `Makefile` (or `forker.mk` if upstream has a Makefile) | `build`, `publish VERSION=vX`, `update`, `service-install/-status/-uninstall` | yes |
| `forker/config` | `UPSTREAM`, `UPSTREAM_BRANCH` (source branch to follow), `FORK`, `FORK_BRANCH` | yes |
| `forker/publish.sh` | `gh release create` on the fork with `forker/dist/*` | yes |
| `forker/update.sh` | merge latest upstream release, open issue on conflict | yes |
| `forker/service.sh` | daily systemd user timer running `update.sh` | yes |
| `forker/build.sh` | **project-specific, you generate it** | no |

## 1. Fork

Skip this step if you're already inside a fork that has `forker/config`
(that means the build script is being regenerated).

```sh
gh auth status                       # must be logged in
command -v forker || npm install -g github:mchristoffers/forker
forker fork <owner/repo> [--dir <path>] [--source-branch <branch>]
cd <path>
```

Pass `--source-branch` if the user wants to follow a branch other than upstream's default
(e.g. `release/1.x`). It can be changed later as `UPSTREAM_BRANCH` in `forker/config`.

The `make` command is `make`, or `make -f forker.mk` when forker printed that.

## 2. Understand how the source builds

Check these, most reliable first:

1. `.github/workflows/*.yml`: the release/build jobs show the exact commands, toolchain versions and artifacts
2. README / CONTRIBUTING / docs build sections
3. Manifests: `package.json` scripts, `Cargo.toml`, `go.mod`, `pyproject.toml`, `pom.xml`/`build.gradle`, `CMakeLists.txt`, the upstream `Makefile`, `Dockerfile`, `flake.nix`, `justfile`, `Taskfile.yml`
4. The latest upstream release (`gh release view --repo <UPSTREAM>`): which assets it ships tells you what "the build output" should be

Decide what the artifacts are: the same kind of files upstream attaches to its releases.
If upstream ships no assets, choose the natural distributable (binary, tarball, wheel, `.tgz` from `npm pack`, ...).
If it is genuinely unclear, ask the user.

## 3. Write `forker/build.sh`

Replace the stub completely. Contract:

- `#!/usr/bin/env bash`, `set -euo pipefail`, `cd "$(dirname "$0")/.."`, `source forker/config`
- Non-interactive, idempotent: start with `rm -rf forker/dist && mkdir -p forker/dist`
- Use the project's own build tooling and commands (mirror its CI), and pin nothing the project doesn't pin
- Check required tools up front with a clear error (`command -v cargo >/dev/null || { echo "build: cargo required" >&2; exit 1; }`)
- Copy **only** the final artifacts into `forker/dist/`, with flat, descriptive file names (they become release assets)
- Don't edit upstream files. Anything that has to change goes in `build.sh` itself, which keeps `make update` merges conflict-free
- Keep it short and readable, and add a one-line comment saying where the commands came from (e.g. `# mirrors .github/workflows/release.yml`)

## 4. Verify

```sh
make build            # must succeed
ls -la forker/dist    # must contain the expected artifacts, nothing else
```

Iterate until it works. If a toolchain is missing on this machine, tell the user what to install instead of silently working around it.

## 5. Commit

```sh
git add forker/build.sh
git commit -m "forker: generate build script"
git push origin HEAD
```

Don't run `make publish` unless the user asks for it.
Offer `make service-install` (daily auto-update on this machine), but only install it once the user agrees.

Report back: the fork URL, the artifacts, where the build commands came from, and the `make` commands to use.
