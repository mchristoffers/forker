# forker

Fork a GitHub repo with `gh` and add a small layer on top: a `Makefile` with `build`, `publish` and `update`.
The layer is the same for every repo. Only `forker/build.sh` is project-specific. The `create-build` skill has an AI agent write it (the `forker` skill calls it during setup), and `repair-build` fixes it after an upstream update.

## Install

CLI (Node >= 20, plus `gh` (logged in), `git`, `make`):

```sh
npm install -g https://codeload.github.com/mchristoffers/forker/tar.gz/main   # from GitHub; not published to npm
```

### Plugin / skill (Claude Code)

forker is a plugin in the `mchristoffers` marketplace ([mchristoffers/claude-marketplace](https://github.com/mchristoffers/claude-marketplace)):

```sh
claude plugin marketplace add mchristoffers/claude-marketplace && claude plugin install forker@mchristoffers --scope user
```

It's published in two formats that share `skills/`: root `plugin.json` ([Agent Plugins](https://agent-plugins.org) open standard, so Codex and other clients can use it later) and
`.claude-plugin/plugin.json` (Claude Code). When you change the skill, bump `version` in both manifests so installs pick up the change.
`dist/` is committed, so installing the CLI from GitHub needs no build step. Run `npm run build` before committing changes to `src/`.

Then ask your agent: *"set up a fork of owner/repo with forker"*. If the `forker` CLI is missing, the skill installs it.

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
