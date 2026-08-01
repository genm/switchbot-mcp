# Contributing

Thanks for contributing to `switchbot-mcp`.

## Contribution scope and licensing

Contributions are accepted under the repository's [ISC license](./LICENSE)
(inbound equals outbound). By submitting a contribution, you represent that you
have the right to provide it under those terms.

Identify copied, generated, or third-party material in the pull request. For
AI-assisted changes, disclose the tool use when it materially produced code,
tests, documentation, or assets, and review the output for confidential data,
license compatibility, and correctness before submitting it.

Propose large or compatibility-breaking changes in an issue before investing in
an implementation. See [GOVERNANCE.md](./GOVERNANCE.md) for decision authority.

## Branch model

- `main` is the default branch and must be protected by the live ruleset
  described in [docs/github-flow.md](./docs/github-flow.md) before release work.
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
  packed-package execution, production SBOM completeness, and container
  behavior. Protect `main` with the stable `ci/required` job.
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

The scheduled live job is disabled unless the repository variable
`SWITCHBOT_LIVE_TESTS_ENABLED` is exactly `true`. When enabled, both
`SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` repository secrets are required; a
missing secret fails the job instead of reporting synthetic success.

The `@hono/node-server` override in `package.json` keeps the MCP Node adapter
above the vulnerable range in GHSA-frvp-7c67-39w9. Remove it only after the
upstream MCP package requires a patched release.

Changes to authentication, transports, outbound requests, tool annotations, or
mutation behavior must update [docs/security-model.md](./docs/security-model.md)
when they change a trust boundary or security assumption.

## Labels

Repository policy defines these labels:

- `manual-review`
- `security`
- `dependencies`

Hosted labels are separate state. An authorized maintainer must sync and read
them back before relying on label-based routing:

```bash
npm run labels:sync
```

## Security reporting

Do not open public issues for vulnerabilities.
Follow [SECURITY.md](./SECURITY.md) and use GitHub private security advisories.

Questions, usage help, and ordinary bug reports follow
[SUPPORT.md](./SUPPORT.md).

All participation follows [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Scope note

This repository is operated as a polyrepo (single service). Monorepo
affected/Nx/Turbo flows are out of scope for current operations.
