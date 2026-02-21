# Contributing

Thanks for contributing to `switchbot-mcp`.

## Branch model (Gated GitHub Flow)

- `feature/*`: short-lived feature/fix branches
- `integration`: integration gate (default branch)
- `main`: promotion/release branch only

Rules:

- Open PRs from `feature/*` to `integration`
- Never merge directly to `main`
- Promotion PRs must be `integration -> main`

## Required local checks

Run before opening/updating PRs:

```bash
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
```

## Worktree and rebase policy (required)

Before push, always rebase on latest `origin/integration`:

```bash
git fetch origin integration --prune
git rebase origin/integration
```

Do not push until all rebase conflicts are fully resolved.

`lefthook` enforces this via pre-push guard.

## CI responsibilities

- `ci-lite`: feature PR safety checks
- `ci-integration`: integration boundary checks
- `ci-release-gate`: release/promotion checks
- `irreversible-check`: blocks auto-promotion for risky changes
- `main-release`: release artifact/publish flow

## Labels

Maintainers use these labels:

- `safe-to-automerge`
- `manual-review`
- `irreversible`
- `security`

Sync labels:

```bash
npm run labels:sync
```

## Security reporting

Do not open public issues for vulnerabilities.
Use GitHub security advisories.

## Scope note

This repository is operated as a polyrepo (single service). Monorepo affected/Nx/Turbo flows are out of scope for current operations.
