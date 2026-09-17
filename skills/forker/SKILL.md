---
name: forker
description: Set up a new fork of a GitHub repo with forker - fork it via gh, add the generic build/publish/update layer, then hand off to the create-or-repair-build skill for the project-specific forker/build.sh. Use when asked to fork a repo with forker or set up a forker fork.
---

# forker

forker adds a generic layer to a fork. Every part of it works for any repo except
`forker/build.sh`, because building depends on the source. Your job is to set up
the fork, then get that one script written by the `create-or-repair-build` skill.

Layer inside the fork (don't restructure it):

| File | Role | Generic? |
|---|---|---|
| `Makefile` (or `forker.mk` if upstream has a Makefile) | `build`, `publish VERSION=vX`, `update`, `service-install/-status/-uninstall` | yes |
| `forker/config` | `UPSTREAM`, `UPSTREAM_BRANCH` (source branch to follow), `FORK`, `FORK_BRANCH` | yes |
| `forker/publish.sh` | `gh release create` on the fork with `forker/dist/*` | yes |
| `forker/update.sh` | merge latest upstream release, open issue on conflict | yes |
| `forker/service.sh` | daily systemd user timer running `update.sh` | yes |
| `forker/build.sh` | **project-specific, written by `create-or-repair-build`** | no |

## 1. Fork

If you're already inside a fork that has `forker/config`, skip to step 2.

```sh
gh auth status                       # must be logged in
command -v forker || npm install -g https://codeload.github.com/mchristoffers/forker/tar.gz/main   # from GitHub, not on npm
forker fork <owner/repo> [--dir <path>] [--source-branch <branch>]
cd <path>
```

Pass `--source-branch` if the user wants to follow a branch other than upstream's default
(e.g. `release/1.x`). It can be changed later as `UPSTREAM_BRANCH` in `forker/config`.

The `make` command is `make`, or `make -f forker.mk` when forker printed that.

## 2. Build script

Invoke the **`create-or-repair-build`** skill (in Claude Code: `forker:create-or-repair-build`) inside the fork
and follow it until `make build` succeeds and the script is committed.

## 3. Finish

Don't run `make publish` unless the user asks for it.
Offer `make service-install` (daily auto-update on this machine), but only install it once the user agrees.

Report back: the fork URL, the artifacts, where the build commands came from, and the `make` commands to use.
