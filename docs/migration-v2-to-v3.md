# Migration from v2 to v3

Version 3 modernizes the runtime and dependency baseline. MCP tool names and
environment variable names are unchanged.

## Required changes

- Upgrade the runtime to Node.js 24.15 or newer.
- Rebuild container images from the v3 Dockerfile if you deploy with Docker.

## Behavior changes

- Upstream redirects are rejected so SwitchBot authentication headers cannot be
  forwarded to another origin.
- Device and scene identifiers are URL-encoded before requests are sent.
- Malformed successful responses from the SwitchBot API now fail explicitly
  instead of being accepted through TypeScript-only assertions.

These checks intentionally fail closed. If an integration depended on malformed
or undocumented upstream response shapes, update that integration rather than
disabling validation.
