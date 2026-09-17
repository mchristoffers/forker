# forker logic

forker splits a fork into two parts:

- a **generic layer**, the same for every repo: `.github/workflows/forker-update.yml`, the `publish` and `report` jobs of `forker-build.yml`, `forker/config`, `forker/update.sh`, `forker/workflows.sh`
- one **project-specific** part, the `build` job(s) in `.github/workflows/forker-build.yml`, written by an AI agent (Claude Code or Codex) through the `create-build` skill (called by the `forker` skill), and fixed by `repair-build`

Everything runs on GitHub Actions; nothing needs to run locally after setup.

## Setup: `forker` skill

```mermaid
flowchart TD
  U[user: set up a fork of owner/repo] --> S[agent loads forker skill]
  S --> F[forker fork owner/repo]
  F --> CR[agent invokes create-build skill]
  CR --> I[inspect source: CI workflows, README, manifests, upstream releases]
  I --> W[write build job in forker-build.yml, push]
  W --> B{gh workflow run + gh run watch: ok, dist-* artifacts only?}
  B -- no --> L[gh run view --log-failed] --> W
  B -- yes --> P[run with version=TAG-forker: first release]
  X["build failed issue (after an update)"] --> R[agent invokes repair-build skill]
  R --> D[diff upstream build files between release tags]
  D --> W
```

## `forker fork <owner/repo>`

```mermaid
flowchart TD
  A["forker fork owner/repo [--dir] [--source-branch]"] --> B{gh auth status ok?}
  B -- no --> X[exit: run gh auth login]
  B -- yes --> SB{source branch exists upstream?}
  SB -- no --> X2[exit: source branch not found]
  SB -- yes --> C[gh repo fork owner/repo --clone]
  C --> D[ensure 'upstream' remote → owner/repo]
  D --> E[enable issues + Actions, secret FORKER_TOKEN = gh auth token]
  E --> G[copy forker/ + workflows, fill config and random daily cron]
  G --> W[disable upstream workflows on the fork]
  W --> P[git commit + push to fork]
```

## GitHub Actions

```mermaid
flowchart LR
  S[schedule daily / manual] --> UW[forker-update.yml]
  UW --> SU[forker/update.sh]
  UW --> DW[forker/workflows.sh disable-upstream]
  SU -- merged TAG --> BW["forker-build.yml version=TAG-forker"]
  M[manual: gh workflow run] --> BW
  BW --> BJ[build jobs → dist-* artifacts]
  BJ --> PJ{version set?}
  PJ -- yes --> R[gh release create on fork with the artifacts]
  BJ & R -. failure .-> I[issue: forker: build failed]
```

The update workflow dispatches the build with `gh workflow run`, because pushes don't trigger other workflows reliably and the build must know the version.
Release tags get a `-forker` suffix, since the fork already carries upstream's tags pointing at upstream commits.

## `forker/update.sh`

One check per run, no loop and no state file. Runs in `forker-update.yml`, or by hand in a clone.

```mermaid
flowchart TD
  U[forker/update.sh] --> L[load forker/config]
  L --> C{working tree clean?}
  C -- no --> Err[exit 1]
  C -- yes --> F[fetch upstream UPSTREAM_BRANCH + tags, fast-forward FORK_BRANCH]
  F --> R["gh release list --repo UPSTREAM (newest first, no drafts/prereleases)"]
  R --> H{newest release whose tag is on UPSTREAM_BRANCH?}
  H -- none --> Done[exit 0]
  H -- found --> A0{tag already merged?}
  A0 -- yes --> Done
  A0 -- no --> M[git merge --no-edit TAG]
  M --> K{conflict?}
  K -- no --> P[git push, output merged=TAG] --> Done
  K -- yes --> A[git merge --abort]
  A --> I{"open issue 'forker: conflict merging TAG' exists?"}
  I -- no --> O[gh issue create on FORK] --> Done
  I -- yes --> Done
```

Git history is the only state: a release counts as handled once its tag is in `FORK_BRANCH`.
Releases whose tag is not on `UPSTREAM_BRANCH` are ignored, so a fork can follow e.g. `release/1.x`.
Rerunning after a conflict finds the open issue, so no duplicate issue gets created.
Everything forker adds lives in `forker/` and `.github/workflows/forker-*.yml`, so upstream merges rarely conflict with it.
