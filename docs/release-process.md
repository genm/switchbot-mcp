# Release Process

## Versioning

- SemVer is used.
- Breaking changes require major version bump.

## Release path

1. Merge a fully verified PR into `main`.
2. Update `package.json` and `server.json` with the same intended SemVer version
   in a normal PR.
3. Create and publish a GitHub Release tagged `v<package version>`.
4. The `Release` workflow reruns the full repository check.
5. The workflow packs and smoke-tests the exact npm artifact, creates a build
   provenance attestation, attaches the tarball to the GitHub Release, and
   publishes it to npm and the official MCP Registry.

## npm trusted publishing prerequisite

Configure the npm package trusted publisher for:

- repository: `genm/switchbot-mcp`;
- workflow: `release.yml`;
- package: `@genm-dev/switchbot-mcp`.

The workflow uses GitHub OIDC and does not store a long-lived npm token. A
missing or incorrect trusted-publisher configuration fails the release instead
of reporting synthetic success.

MCP Registry publication also uses GitHub OIDC. `package.json#mcpName`,
`server.json#name`, and all package versions must match; the package smoke test
enforces this before release.

## Rollback

Published npm versions are immutable. Fix forward through a verified PR, bump
the patch version, and publish a new GitHub Release. Deprecate an affected npm
version when users must be warned.

## Changelog discipline

- Keep PR titles and commit messages clear and conventional.
- Document user-visible behavior changes in release notes.
- Confirm that the GitHub Release tag exactly matches `package.json`.
