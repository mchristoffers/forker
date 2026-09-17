---
name: create-build
description: Create forker/build.sh in a forker fork while it is still the stub.
---

# create-build

1. Read `forker/build.sh`. Its header is the contract.
2. Work out how the source builds, most reliable first: CI release workflow, docs, build manifests, and the upstream release assets (they define the artifacts).
3. Write the script, and change nothing else.
4. `make build` must pass, and `forker/dist/` must contain only the artifacts. Iterate. If a toolchain is missing, tell the user.
5. Commit and push `forker/build.sh`.
