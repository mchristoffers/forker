---
name: repair-build
description: Repair forker/build.sh in a forker fork when `make build` fails, e.g. after an upstream update.
---

# repair-build

1. Read `forker/build.sh`. Its header is the contract.
2. Run `make build` and keep the error.
3. Diff the build-relevant files between the previous and the new upstream release tag.
4. Fix the script, and change nothing else.
5. `make build` must pass, and `forker/dist/` must contain only the artifacts. Iterate. If a toolchain is missing, tell the user.
6. Commit and push `forker/build.sh`.
