---
name: create-build
description: Write the build job in .github/workflows/forker-build.yml of a forker fork while it is still the stub.
---

# create-build

1. Read `.github/workflows/forker-build.yml`. Its header is the contract.
2. Work out how the source builds, most reliable first: upstream's CI release workflow, docs, build manifests, and the upstream release assets (they define the artifacts). If the user named platforms, build only those.
3. Replace the stub `build` job, and change nothing else.
4. Commit, push, then `gh workflow run forker-build.yml` and `gh run watch <id> --exit-status`. On failure read `gh run view <id> --log-failed`, fix, repeat. It must pass and the `dist-*` artifacts must contain only release artifacts.
5. Publish the current upstream release: `gh workflow run forker-build.yml -f version=<latest upstream tag in the fork branch>-forker`, watch it, and check the release on the fork.
