---
name: repair-build
description: Repair the build job in .github/workflows/forker-build.yml of a forker fork when it fails, e.g. after an upstream update ("forker: build failed" issue).
---

# repair-build

1. Read `.github/workflows/forker-build.yml`. Its header is the contract.
2. Get the error: `gh run list --workflow forker-build.yml`, then `gh run view <id> --log-failed`.
3. Diff the build-relevant files between the previous and the new upstream release tag.
4. Fix the build job, and change nothing else.
5. Commit, push, `gh workflow run forker-build.yml -f version=<version of the failed run>`, `gh run watch <id> --exit-status`. Iterate until it passes.
6. Close the "forker: build failed" issue.
