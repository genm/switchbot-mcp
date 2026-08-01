# Release Process

## Versioning

- SemVer is used.
- Breaking changes require a major version bump.

## Publication boundary

The repository being public does not mean the package or Registry record exists.
Before the first release, the maintainer must resolve the ownership/provenance
review and read back all hosted prerequisites below.

## First-release prerequisites

- `main` has an active ruleset requiring pull requests and `ci/required`.
- The `v*` tag namespace is protected from deletion and unauthorized updates.
- Dependabot alerts/security updates and private vulnerability reporting are
  enabled and reach the maintainer.
- The `release` environment exists with the intended protection and no broad
  bypass path.
- The npm namespace and trusted publisher are controlled by the maintainer with
  MFA and recovery configured.
- The official MCP Registry namespace and GitHub OIDC identity are confirmed.
- `npm view @genm-dev/switchbot-mcp` and the Registry API are expected to report
  not found before the first release; README status must remain accurate until
  both become publicly installable.

Missing protection, reporting, namespace ownership, or publication authority is
a stop condition, not a reason to bypass the workflow.

## Release path

1. Merge a fully verified PR into `main`.
2. Update `package.json` and `server.json` with the same intended SemVer version
   in a normal PR.
3. Create and push the annotated tag `v<package version>` from the intended
   `main` commit.
4. The `Release` workflow reruns the complete machine-readable repository check
   and packs one exact npm tarball.
5. The workflow generates a validated, production-only CycloneDX SBOM, verifies
   that it contains every dependency reported by `npm ls --omit=dev --all`, and
   writes SHA-256 checksums for the tarball and SBOM.
6. The workflow verifies and attests the tarball, SBOM, and checksum manifest,
   publishes or verifies the tarball on npm, publishes or verifies the matching
   official MCP Registry record, and only then creates the GitHub Release with
   all three files attached.

Do not create the GitHub Release manually. Creating it last prevents a failed
npm or Registry publication from appearing as a successful public release.

Third-party distribution surfaces such as Smithery are optional follow-up work.
They must not run before the npm and Official MCP Registry release is verified,
and each surface needs its own current-format installation test before it is
advertised as supported.

## Trusted publishing prerequisites

Create a protected GitHub environment named `release`. Configure the npm
package trusted publisher with:

- repository: `genm/switchbot-mcp`;
- workflow: `release.yml`;
- environment: `release`;
- package: `@genm-dev/switchbot-mcp`.

The workflow uses GitHub OIDC and does not store a long-lived npm token. A
missing or incorrect trusted-publisher configuration fails the release instead
of reporting synthetic success. Release jobs invoke the `packageManager` version
through Corepack instead of installing an untracked global npm package.

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
