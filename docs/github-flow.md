# GitHub Flow

This public repository uses one protected default branch, `main`, and short-lived
PR branches. The repository belongs to a personal GitHub account, so merge queue
is not part of the flow.

## Pull request lifecycle

1. Create a short-lived branch from current `main`.
2. Open a Draft PR while implementation is incomplete.
3. Rebase on `origin/main`, finish the local checks, and mark the PR ready.
4. Wait for the complete CI and security checks.
5. Merge through the GitHub UI; do not push directly to `main`.

Draft PRs deliberately skip the costly CI matrix. The `ready_for_review` event
starts it without relying on a new commit.

## Required repository rule

Configure a ruleset for `main` with:

- pull requests required;
- resolved review conversations;
- linear history;
- required status check `ci/required`.

Require one approving review and dismiss stale approvals when an independent
maintainer is available. A single-maintainer repository must not require an
approval that the PR author cannot provide.

`ci/required` is an aggregator with a stable name. It only succeeds after static
analysis, the operating-system/runtime test matrix, coverage, packed-package
execution, and container verification have all succeeded. Do not require matrix
job names individually.

CodeQL and dependency review remain visible security checks, but are not folded
into the aggregator because GitHub security availability can differ for
Dependabot-authored and forked PRs.

## Repository settings

After the workflows first run successfully:

- add `ci/required` to the `main` ruleset;
- enable automatic deletion of merged head branches;
- enable Dependabot alerts and security updates;
- enable private vulnerability reporting before advertising the security
  advisory form;
- keep secret scanning and push protection enabled;
- configure npm trusted publishing as described in
  [release-process.md](./release-process.md).

## Worktree and push rule

Before every push:

```bash
git fetch origin main --prune
git rebase origin/main
```

No push is allowed until rebase conflicts are fully resolved.
