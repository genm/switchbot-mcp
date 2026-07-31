# Contributing

Thanks for contributing to `switchbot-mcp`.

## Branch model

- `main` is the protected default branch.
- Use a short-lived branch for every change.
- Open a Draft PR while work is in progress, then mark it ready for review to run
  the complete required CI matrix.

Do not push directly to `main`.

## Required local checks

Run before opening/updating PRs:

```bash
npm run check
```

For behavior changes, also run coverage. For runtime image changes, verify the
actual container:

```bash
npm run test:coverage
npm run smoke:container
```

## Worktree and rebase policy (required)

Before push, always rebase on latest `origin/main`:

```bash
git fetch origin main --prune
git rebase origin/main
```

Do not push until all rebase conflicts are fully resolved.

Install the repository hooks once with `npm run hooks:install`. `lefthook`
then enforces this via the pre-push guard.

## CI responsibilities

- `CI`: static analysis, Node 24/26 on Linux/macOS/Windows, coverage,
  packed-package execution, and container behavior. Protect `main` with the
  stable `ci/required` job.
- `Dependency review`: blocks newly introduced moderate-or-higher known
  vulnerabilities.
- `CodeQL`: scans ready PRs, `main`, and a weekly schedule.
- `OpenSSF Scorecard`: reports repository supply-chain posture weekly.
- `Scheduled verification`: catches dependency, runtime, container, and
  optionally read-only live API drift.
- `Release`: verifies a version tag, publishes the exact attested package to npm
  and the MCP Registry, then creates the GitHub Release.

Actions are pinned to immutable commit SHAs. Downloaded CI tools and container
base images are checksum/digest pinned. Dependabot updates npm, GitHub Actions,
and Docker dependencies weekly.

The `@hono/node-server` override in `package.json` keeps the MCP Node adapter
above the vulnerable range in GHSA-frvp-7c67-39w9. Remove it only after the
upstream MCP package requires a patched release.

## Labels

Maintainers use these labels:

- `manual-review`
- `security`
- `dependencies`

Sync labels:

```bash
npm run labels:sync
```

## Security reporting

Do not open public issues for vulnerabilities.
Follow [SECURITY.md](./SECURITY.md) and use GitHub private security advisories.

## Scope note

This repository is operated as a polyrepo (single service). Monorepo
affected/Nx/Turbo flows are out of scope for current operations.
