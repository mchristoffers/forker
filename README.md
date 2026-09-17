# forker

Fork a GitHub repo with `gh` and add a small layer on top that builds, releases and updates the fork on GitHub Actions (free for public repos, nothing runs locally).
The layer is the same for every repo. Only the `build` job in `.github/workflows/forker-build.yml` is project-specific. The `create-build` skill has an AI agent write it (the `forker` skill calls it during setup), and `repair-build` fixes it after an upstream update.

## Install

CLI (Node >= 20, plus `gh` (logged in, `workflow` scope) and `git`):

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

This forks and clones the repo, enables Actions and issues on the fork, stores your gh token as the `FORKER_TOKEN` secret, disables upstream's own workflows, then commits and pushes:

- `.github/workflows/forker-build.yml`: manual (`gh workflow run forker-build.yml [-f version=v1]`). The `build` job is a stub until the skill writes it; with a `version` it creates a release on the fork with the `dist-*` artifacts. A failure opens an issue
- `.github/workflows/forker-update.yml`: daily and manual. Runs `forker/update.sh` (merges the latest upstream release, opens an issue on a conflict), then builds and releases `<tag>-forker`
- `forker/update.sh`, `forker/workflows.sh` (keeps upstream workflows disabled), `forker/config`: `UPSTREAM`, `UPSTREAM_BRANCH` (source branch to follow), `FORK`, `FORK_BRANCH`

`FORKER_TOKEN` is needed because `GITHUB_TOKEN` may not push merges that change upstream workflow files.

See [docs/logic.md](docs/logic.md) and [docs/techstack.md](docs/techstack.md).
