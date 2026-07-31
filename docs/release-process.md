# Release Process

## Versioning

- SemVer is used.
- Breaking changes require a major version bump.

## Release path

1. Merge a fully verified PR into `main`.
2. Update `package.json` and `server.json` with the same intended SemVer version
   in a normal PR.
3. Create and push the annotated tag `v<package version>` from the intended
   `main` commit.
4. The `Release` workflow reruns the complete machine-readable repository check
   and packs one exact npm tarball.
5. The workflow attests that tarball, publishes or verifies it on npm, publishes
   or verifies the matching official MCP Registry record, and only then creates
   the GitHub Release with the tarball attached.

Do not create the GitHub Release manually. Creating it last prevents a failed
npm or Registry publication from appearing as a successful public release.

## Trusted publishing prerequisites

Create a protected GitHub environment named `release`. Configure the npm
package trusted publisher with:

- repository: `genm/switchbot-mcp`;
- workflow: `release.yml`;
- environment: `release`;
- package: `@genm-dev/switchbot-mcp`.

The workflow uses GitHub OIDC and does not store a long-lived npm token. A
missing or incorrect trusted-publisher configuration fails the release instead
of reporting synthetic success.

MCP Registry publication also uses GitHub OIDC. `package.json#mcpName`,
`server.json#name`, and all package versions must match; the package smoke test
enforces this before release.

## Safe retries

Rerunning the same tag is supported. The workflow compares the exact tarball
SHA-512 integrity with npm before skipping an already-published package and
compares the immutable Registry version with `server.json`. Any mismatch fails
closed. The GitHub Release is created or updated only after both publications
are verified.

## Rollback

Published npm and MCP Registry versions are immutable. Fix forward through a
verified PR, bump the patch version, and push a new version tag. Deprecate an
affected npm version when users must be warned.

## Changelog discipline

- Keep PR titles and commit messages clear and conventional.
- Document user-visible behavior changes in release notes.
- Confirm that the version tag exactly matches `package.json`.
