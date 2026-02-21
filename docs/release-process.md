# Release Process

## Versioning

- SemVer is used.
- Breaking changes require major version bump.

## Release path

1. Merge feature PRs into `integration`
2. Open promotion PR `integration -> main`
3. Wait for `ci-release-gate` + `irreversible-check`
4. Merge/promotion to `main`
5. `main-release` builds package artifact and optionally publishes to npm

## Optional npm publish from CI

`main-release` publishes only when both are true:

- Repository variable `ENABLE_NPM_PUBLISH=true`
- Secret `NPM_TOKEN` is configured

## Rollback

1. Revert problematic commit on `integration`
2. Promote revert to `main` through standard gate
3. If required, republish patched version

## Changelog discipline

- Keep PR titles and commit messages clear and conventional.
- Document user-visible behavior changes in release notes.
