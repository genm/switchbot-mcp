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
- HTTP deployments validate both `Host` and browser `Origin` headers. Add
  reverse-proxy or public hostnames to `MCP_HTTP_ALLOWED_HOSTS`.
- Read-only upstream requests retry transient `429`, `502`, `503`, and `504`
  responses at most twice within the original request timeout. Mutating
  requests are never retried automatically.
- Logs are emitted as redacted JSON Lines on stderr.
- The MCP SDK v2 runtime supports both established 2025 clients and explicit
  `2026-07-28` protocol negotiation.

These checks intentionally fail closed. If an integration depended on malformed
or undocumented upstream response shapes, update that integration rather than
disabling validation.
