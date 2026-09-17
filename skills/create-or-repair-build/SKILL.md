---
name: create-or-repair-build
description: Create or repair forker/build.sh in a forker fork, e.g. when it is still the stub or `make build` broke after an upstream update.
---

# create-or-repair-build

1. Read `forker/build.sh`. Its header is the contract.
   - **Create** (still the stub): work out how the source builds, most reliable first: CI release workflow, docs, build manifests, and the upstream release assets (they define the artifacts).
   - **Repair**: run `make build`, then diff the build-relevant files between the previous and the new upstream release tag.
2. Write the script, and change nothing else.
3. `make build` must pass, and `forker/dist/` must contain only the artifacts. Iterate. If a toolchain is missing, tell the user.
4. Commit and push `forker/build.sh`.
