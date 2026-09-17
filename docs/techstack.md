# Tech stack

| Part | Choice | Why |
|---|---|---|
| CLI language | TypeScript | Types, familiar tooling |
| Runtime | Node.js >= 20 | Most widely available JS runtime, npm distribution |
| CLI deps | none (`node:util` parseArgs, `node:child_process`) | Nothing to audit or update |
| Compiler | `tsc` | Plain, no bundler needed |
| GitHub | `gh` CLI | Forking, releases, issues; reuses the user's gh auth |
| Git ops | `git` | fetch / merge / push |
| Fork entry point | `make` | `build`, `publish`, `update` |
| Fork scripts | bash, in `forker/` | Forks run without forker or Node installed; no clash with upstream files |
| Build script | generated per repo by an AI agent | No general way to build an unknown source |
| Agent skill | Agent Skills format (`SKILL.md`), `skills/forker` | Same file for Claude Code and Codex |
| Distribution | plugin in `mchristoffers/claude-marketplace` (`.agents/plugins/marketplace.json` + `.claude-plugin/marketplace.json`); Agent Plugins `plugin.json` + `.claude-plugin/plugin.json` | One marketplace for all personal plugins, installable in Claude Code and Codex |
| Update signal | latest upstream GitHub release, one check per `make update` | Simple, stateless |
| Scheduling | systemd user timer (`forker/service.sh`), daily | No root needed, Persistent catches missed runs, logs in journald |
