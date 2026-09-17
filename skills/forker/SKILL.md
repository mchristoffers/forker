---
name: forker
description: Fork a GitHub repo with forker (build, release and update on GitHub Actions), then create its build job.
disable-model-invocation: true
---

# forker

1. `command -v forker || npm install -g https://codeload.github.com/mchristoffers/forker/tar.gz/main`
2. `forker fork <owner/repo> [--dir <path>] [--source-branch <branch>]`, then `cd` into the clone.
3. Invoke the `create-build` skill.
