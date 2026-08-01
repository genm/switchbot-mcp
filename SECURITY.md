# Security Policy

## Supported versions

Before the first package release, security fixes apply to the current `main`
branch. After publication, fixes are provided for the latest published major
version.

## Reporting a vulnerability

Do not disclose vulnerabilities in public issues, pull requests, or discussions.
Use the repository's
[private vulnerability reporting form](https://github.com/genm/switchbot-mcp/security/advisories/new).

If GitHub does not show a private reporting form, do not include vulnerability
details in a public issue. Open a
[security contact request](https://github.com/genm/switchbot-mcp/issues/new?template=security_contact.yml)
containing no technical details, affected versions, device identifiers, or
credentials. The maintainer will establish a private channel before asking for
the report.

Include the affected version, impact, reproduction steps, and any proposed
mitigation. Do not include real SwitchBot credentials or device data. The
maintainer will acknowledge a report as soon as practical and coordinate a fix
and disclosure through the private advisory.

The project cannot promise a response or resolution deadline. If a report may
involve an exposed credential, revoke and rotate it through its owning service
without waiting for project triage.

The maintained trust boundaries, dangerous-operation assumptions, and
compromise response are documented in [docs/security-model.md](./docs/security-model.md).
