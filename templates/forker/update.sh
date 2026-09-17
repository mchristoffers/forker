#!/usr/bin/env bash
# Merge the newest UPSTREAM release on UPSTREAM_BRANCH into FORK_BRANCH.
# Clean merge: push. Conflict: abort the merge and open an issue.
set -euo pipefail
cd "$(dirname "$0")/.."
source forker/config

if [[ -n "$(git status --porcelain)" ]]; then
  echo "update: working tree not clean, commit or stash first" >&2
  exit 1
fi

git fetch upstream --tags --force "+refs/heads/$UPSTREAM_BRANCH:refs/remotes/upstream/$UPSTREAM_BRANCH"
git fetch origin
git checkout "$FORK_BRANCH"
git merge --ff-only "origin/$FORK_BRANCH"

# Releases come newest first; take the first one whose tag is on the source branch.
releases=$(gh release list --repo "$UPSTREAM" --exclude-drafts --exclude-pre-releases --limit 100 --json tagName --jq '.[].tagName')
tag=""
for t in $releases; do
  if git merge-base --is-ancestor "refs/tags/$t" "upstream/$UPSTREAM_BRANCH" 2>/dev/null; then
    tag=$t
    break
  fi
done
if [[ -z "$tag" ]]; then
  echo "update: no release found on $UPSTREAM branch $UPSTREAM_BRANCH"
  exit 0
fi

if git merge-base --is-ancestor "refs/tags/$tag" HEAD; then
  echo "update: already up to date with $tag"
  exit 0
fi

if git merge --no-edit "refs/tags/$tag"; then
  git push origin "$FORK_BRANCH"
  echo "update: merged $tag"
  # In GitHub Actions, tell the workflow which release to build.
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then echo "merged=$tag" >> "$GITHUB_OUTPUT"; fi
  exit 0
fi

conflicts=$(git diff --name-only --diff-filter=U)
git merge --abort
if [[ -z "$conflicts" ]]; then
  echo "update: merge of $tag failed" >&2
  exit 1
fi

title="forker: conflict merging $tag"
if gh issue list --repo "$FORK" --state open --limit 200 --json title --jq '.[].title' | grep -Fxq "$title"; then
  echo "update: issue already open: $title"
  exit 0
fi

gh issue create --repo "$FORK" --title "$title" --body "$(cat <<BODY
Merging upstream release \`$tag\` from \`$UPSTREAM\` (\`$UPSTREAM_BRANCH\`) into \`$FORK_BRANCH\` produced conflicts.

Conflicting files:
\`\`\`
$conflicts
\`\`\`

Resolve locally:
\`\`\`
git fetch upstream --tags
git checkout $FORK_BRANCH
git merge $tag
# fix conflicts, commit, push
\`\`\`
BODY
)"
echo "update: opened issue: $title"
