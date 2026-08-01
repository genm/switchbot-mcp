# Governance

## Maintainer model

`switchbot-mcp` is currently a single-maintainer project. `@genm` owns repository
administration, technical direction, releases, security coordination, moderation,
and final merge decisions.

Repository files describe the intended workflow; hosted GitHub, npm, MCP
Registry, and third-party service settings remain authoritative for their own
state. A maintainer must read back those settings before claiming that a policy
is active.

## Decisions and review

- Small fixes and documentation changes use normal pull requests.
- Security, protocol, transport, release, licensing, and compatibility changes
  require explicit maintainer review and the complete applicable verification.
- Large features and breaking changes should begin with an issue that records
  alternatives, user impact, and migration requirements.
- The maintainer may reject changes that exceed sustainable maintenance capacity
  even when they are technically valid.

The project does not currently use voting, a technical steering committee, or a
CLA. Contributions use the inbound-equals-outbound terms in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Conflicts and succession

The maintainer must disclose a material conflict that affects a project decision.
If additional maintainers are added, access should be least privilege and the
review, moderation, release, registry, and recovery responsibilities must be
updated here before authority is delegated.

If maintenance stops, the maintainer should mark the repository and packages as
unmaintained or archived, disable release automation, document known security
limitations, and provide a migration or fork path when practical.
