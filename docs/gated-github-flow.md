# Gated GitHub Flow (Polyrepo)

This repository uses a polyrepo-tailored gated flow.

## Branch-role map

| Branch | Role | Purpose |
| --- | --- | --- |
| `feature/*` | Work branch | Propose changes |
| `integration` | Integration gate | CI-based merge gate |
| `main` | Promotion/release | Release artifacts and publish |

## CI matrix (event-driven)

1. `pull_request` -> `integration`: `ci-lite` (light checks)
2. `merge_group` / `push` on `integration`: `ci-integration` (integration boundaries)
3. `pull_request` -> `main`: `ci-release-gate` + `irreversible-check` (heavy checks)
4. `push` on `main`: `main-release` (distribution)

## Concurrency policy

- PR workflows: PR-number based groups
- Push/Merge group workflows: ref-based groups
- `cancel-in-progress: true` enabled to reduce stale runs

## Irreversible change policy

Auto-promotion is blocked for risky domains and destructive signals.

Primary blocked domains:

- `migrations/**`
- `auth/**`
- `infra/**`
- `config/**`
- contract/schema paths (`openapi`, `schema`, `contract`)

## Branch protection targets (GitHub settings)

### integration

- Require pull request
- Require merge queue
- Require checks: `actionlint`, `ci-lite`, `ci-integration`, `irreversible-check`
- Disallow direct push

### main

- Require pull request
- Require checks: `ci-release-gate`, `irreversible-check`
- Disallow direct push
- Limit merge to CI/bot path only

## Promotion rule

- Auto-promotion allowed only when release gate is green and irreversible check passes
- Otherwise manual reviewer approval is required

## Worktree/push rule

Before every push:

```bash
git fetch origin integration --prune
git rebase origin/integration
```

No push is allowed until rebase conflicts are fully resolved.
