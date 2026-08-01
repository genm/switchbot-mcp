# Security Model

This document records the trust boundaries and security assumptions that own
the consequential behavior of `switchbot-mcp`. Report implementation defects
through [SECURITY.md](../SECURITY.md).

## Assets and boundaries

- `SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` authorize requests to the SwitchBot
  Open API. They are injected by the operator and remain owned by that secret
  manager or MCP client configuration.
- In stdio mode, the launching MCP client controls process access and the
  inherited environment. The server adds no second authorization layer.
- In HTTP mode, every MCP request requires the configured bearer API key. Host
  and browser-origin validation reduce DNS rebinding and cross-origin access,
  but they do not replace network isolation or TLS.
- The production SwitchBot API origin is fixed. Its override is accepted only
  in test mode and only for loopback addresses so credentials cannot be routed
  to an arbitrary origin.
- Device and scene data is held in process memory and returned to the connected
  MCP client. It is not persisted by this server.

## Consequential operations

The MCP client or model can request physical device commands and scene
execution. Tool annotations describe read-only, idempotent, and destructive
properties to compatible clients, but annotations and client confirmation UI
are advisory metadata rather than an authorization boundary. Operators must
grant credentials only to clients and users they trust to control the associated
SwitchBot account.

Read-only SwitchBot calls may retry bounded transient failures. Mutating calls
are never automatically retried because an ambiguous upstream failure could
otherwise duplicate a physical action. Successful command responses mean the
SwitchBot API accepted the request; they do not prove that a physical device
completed the action.

## Deployment requirements

- Keep stdio as the default when remote access is unnecessary.
- Keep the HTTP listener on loopback unless a remote deployment is intentional.
- For non-loopback HTTP, terminate TLS at a trusted reverse proxy, restrict
  ingress, configure the exact proxy hostname allowlist, and use a separately
  generated high-entropy bearer key.
- Do not share SwitchBot or HTTP credentials in issue reports, logs, shell
  history, screenshots, or MCP prompts.
- Treat MCP client plugins, reverse proxies, process supervisors, container
  platforms, and secret managers as separate trusted components with their own
  update and access policies.

## Failure and response

Configuration, authentication, invalid upstream responses, redirects, and
release-integrity mismatches fail closed. Logs redact credential-shaped keys and
use stable operation names instead of device or scene identifiers.

If credentials may be exposed, revoke and rotate them at the owning service. If
a release or dependency is compromised, stop further publication, preserve the
artifact digest and SBOM as evidence, deprecate affected npm versions when
appropriate, and issue a fixed version through the verified release workflow.
There is no server-side credential database or persistent device cache to purge.

## Out of scope

SwitchBot account security, device firmware, cloud availability, physical safety,
and the behavior of MCP clients or models are not controlled by this repository.
This project is an unofficial community integration and does not provide a
fitness or safety certification for physical automation.
