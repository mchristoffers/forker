# forker

Fork a GitHub repo with `gh` and add a small layer on top: a `Makefile` with `build`, `publish` and `update`.
The layer is the same for every repo. Only `forker/build.sh` is project-specific, and the `forker` skill has an AI agent write it.

## Install

CLI (Node >= 20, plus `gh` (logged in), `git`, `make`):

```sh
npm install -g github:mchristoffers/forker
```

### Plugin / skill (Claude Code + Codex)

This repo is a plugin in the `mchristoffers` marketplace (`mchristoffers/claude-marketplace`).
It's published in two formats that share `skills/`: `.claude-plugin/plugin.json` (Claude Code) and
root `plugin.json` ([Agent Plugins](https://agent-plugins.org)).

User-level install from a checkout (copies, no symlinks):

```sh
rm -rf ~/.claude/skills/forker && mkdir -p ~/.claude/skills/forker
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' . ~/.claude/skills/forker/   # Claude Code
npx skills add . --skill forker --global --agent codex --copy --yes                              # Codex
```

Rerun after changing the skill, and bump `version` in both manifests.
Then ask your agent: *"set up a fork of owner/repo with forker"*.

## CLI

```sh
forker fork owner/repo [--dir path] [--source-branch branch]
```

This forks and clones the repo, then commits and pushes:

- `Makefile` (or `forker.mk` if upstream has one): `make build`, `make publish VERSION=v1.0.0`, `make update`, `make service-install`
- `forker/build.sh`: a stub until the skill generates it. Writes artifacts to `forker/dist/` (gitignored)
- `forker/publish.sh`: creates a GitHub release on the fork with `forker/dist/*`
- `forker/update.sh`: merges the latest upstream release. On a conflict it opens an issue on the fork
- `forker/service.sh`: `make service-install` / `service-status` / `service-uninstall` for a daily systemd user timer that runs `update`
- `forker/config`: `UPSTREAM`, `UPSTREAM_BRANCH` (source branch to follow), `FORK`, `FORK_BRANCH`

See [docs/logic.md](docs/logic.md) and [docs/techstack.md](docs/techstack.md).
