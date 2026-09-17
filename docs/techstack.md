# Tech stack

| Part | Choice | Why |
|---|---|---|
| CLI language | TypeScript | Types, familiar tooling |
| Runtime | Node.js >= 20 | Most widely available JS runtime, npm distribution |
| CLI deps | none (`node:util` parseArgs, `node:child_process`) | Nothing to audit or update |
| Compiler | `tsc` | Plain, no bundler needed |
| GitHub | `gh` CLI | Forking, releases, issues; reuses the user's gh auth |
| Git ops | `git` | fetch / merge / push |
| Build + release | GitHub Actions (`.github/workflows/forker-*.yml`) | Free for public repos, big runners, no local toolchains |
| Fork scripts | bash, in `forker/` | Run in Actions without forker or Node; no clash with upstream files |
| Build job | generated per repo by an AI agent | No general way to build an unknown source |
| Agent skill | Agent Skills format (`SKILL.md`), `skills/forker` | Open Agent Skills standard |
| Distribution | plugin in `mchristoffers/claude-marketplace` (`.agents/plugins/marketplace.json` + `.claude-plugin/marketplace.json`); Agent Plugins `plugin.json` + `.claude-plugin/plugin.json` | One marketplace for all personal plugins, used with Claude Code; open-standard layout keeps Codex and others possible |
| Update signal | latest upstream GitHub release, one check per daily `forker-update` run | Simple, stateless |
| Scheduling | `schedule` trigger in `forker-update.yml`, daily at a random time | No machine of your own needed; logs in the Actions run |
