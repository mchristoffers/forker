---
name: forker
description: Fork a GitHub repo with forker (build/publish/update layer), then create its build script.
disable-model-invocation: true
---

# forker

1. `command -v forker || npm install -g https://codeload.github.com/mchristoffers/forker/tar.gz/main`
2. `forker fork <owner/repo> [--dir <path>] [--source-branch <branch>]`, then `cd` into the clone.
3. Invoke the `create-or-repair-build` skill.
4. Offer `make service-install` (daily update). Install it only if the user agrees.
