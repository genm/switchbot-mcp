# @genm-dev/switchbot-mcp

SwitchBot MCP Server v3 for AI assistants.

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![CI](https://github.com/genm/switchbot-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/genm/switchbot-mcp/actions/workflows/ci.yml)
[![CodeQL](https://github.com/genm/switchbot-mcp/actions/workflows/codeql.yml/badge.svg)](https://github.com/genm/switchbot-mcp/actions/workflows/codeql.yml)

[日本語](./README.ja.md)

## Project status

The source repository is public, but v3 is not yet published to npm or the
official MCP Registry. The npm, `npx`, and one-click commands in this README
become usable only after the first release tracked in
[Issue #7](https://github.com/genm/switchbot-mcp/issues/7). Build from source for
current evaluation.

This is an unofficial community integration and is not affiliated with or
endorsed by SwitchBot. Tool calls can control physical devices and execute
scenes. Review requested actions, credential access, and network exposure before
use; do not treat an AI client's confirmation as an authorization boundary.

## Build from source (available now)

```bash
git clone https://github.com/genm/switchbot-mcp.git
cd switchbot-mcp
npm ci --ignore-scripts
npm run build
```

Run `node build/index.js` with the required configuration below. The process
fails closed when credentials are missing.

## Package install (after the first release)

### One-click install

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=switchbot&config=eyJzd2l0Y2hib3QiOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZ2VubS1kZXYvc3dpdGNoYm90LW1jcCJdLCJlbnYiOnsiU1dJVENIQk9UX1RPS0VOIjoiWU9VUl9TV0lUQ0hCT1RfVE9LRU4iLCJTV0lUQ0hCT1RfU0VDUkVUIjoiWU9VUl9TV0lUQ0hCT1RfU0VDUkVUIiwiTUNQX1RSQU5TUE9SVCI6InN0ZGlvIn19fQ%3D%3D)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_MCP-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white)](vscode:mcp/install?%7B%22name%22%3A%22switchbot%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40genm-dev%2Fswitchbot-mcp%22%5D%2C%22env%22%3A%7B%22SWITCHBOT_TOKEN%22%3A%22YOUR_SWITCHBOT_TOKEN%22%2C%22SWITCHBOT_SECRET%22%3A%22YOUR_SWITCHBOT_SECRET%22%2C%22MCP_TRANSPORT%22%3A%22stdio%22%7D%7D)

These links currently target the planned public npm package. After publication,
replace `SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` with your credentials and review
the configuration before starting the server.

### VS Code

```bash
code --add-mcp '{"name":"switchbot","command":"npx","args":["-y","@genm-dev/switchbot-mcp"],"env":{"SWITCHBOT_TOKEN":"YOUR_SWITCHBOT_TOKEN","SWITCHBOT_SECRET":"YOUR_SWITCHBOT_SECRET","MCP_TRANSPORT":"stdio"}}'
```

### Claude Desktop

```json
{
  "mcpServers": {
    "switchbot": {
      "command": "npx",
      "args": ["-y", "@genm-dev/switchbot-mcp"],
      "env": {
        "SWITCHBOT_TOKEN": "YOUR_SWITCHBOT_TOKEN",
        "SWITCHBOT_SECRET": "YOUR_SWITCHBOT_SECRET",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

## Highlights

- v3.0.0 on the Node.js 24 LTS platform
- MCP SDK v2 with explicit MCP 2026-07-28 protocol negotiation coverage
- Native `fetch` with strict upstream response validation
- Layered architecture (SwitchBot client / MCP tools / transports)
- `stdio` and Streamable HTTP transports
- API key required for HTTP transport
- Same-host Origin and Host validation for HTTP deployments
- Structured MCP tool outputs (`structuredContent`)
- MCP risk annotations and bounded retries for read-only SwitchBot requests
- Redacted JSONL operational logs
- Public-repository CI across supported runtimes, package artifacts, and containers

## Requirements

- Node.js 24.15+
- SwitchBot Open API token and secret

## Install

Available after the first release:

```bash
npm install @genm-dev/switchbot-mcp
```

## Configuration

### Required

- `SWITCHBOT_TOKEN`
- `SWITCHBOT_SECRET`

### Transport

- `MCP_TRANSPORT=stdio|http` (default: `stdio`)
- `MCP_SERVER_API_KEY` (required for `http`; use a high-entropy secret without surrounding whitespace)
- `MCP_HTTP_HOST` (default: `127.0.0.1`)
- `MCP_HTTP_ALLOWED_HOSTS` (optional comma-separated proxy/public hostnames)
- `MCP_HTTP_PORT` (default: `8787`)
- `MCP_HTTP_PATH` (default: `/mcp`)

HTTP requests with an `Origin` header must use a hostname from the same
allowlist as the `Host` header. Localhost and the configured bind host are
included automatically. Add reverse-proxy hostnames explicitly; malformed or
cross-origin requests are rejected.

### Runtime

- `SWITCHBOT_TIMEOUT_MS` (default: `10000`)
- `SWITCHBOT_LIST_CACHE_TTL_MS` (default: `30000`)
- `LOG_LEVEL=debug|info|warn|error` (default: `info`)

### Test-only (optional)

- `SWITCHBOT_BASE_URL` (override SwitchBot API endpoint for deterministic e2e tests)

The override is accepted only when `NODE_ENV=test` and the URL uses
`localhost`, `127.0.0.0/8`, or `[::1]`. This prevents production credentials
from being redirected to another origin.

## MCP tools (v3)

1. `switchbot_list_devices`
2. `switchbot_get_device_status`
3. `switchbot_set_power`
4. `switchbot_send_command`
5. `switchbot_list_scenes`
6. `switchbot_execute_scene`
7. `switchbot_list_devices_raw` (advanced, raw upstream fields)

See migration details: [docs/migration-v2-to-v3.md](./docs/migration-v2-to-v3.md)

## Usage

### stdio (package / npx, after the first release)

```json
{
  "mcpServers": {
    "switchbot": {
      "command": "npx",
      "args": ["-y", "@genm-dev/switchbot-mcp"],
      "env": {
        "SWITCHBOT_TOKEN": "...",
        "SWITCHBOT_SECRET": "...",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

### stdio (local development build)

```json
{
  "mcpServers": {
    "switchbot": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "SWITCHBOT_TOKEN": "...",
        "SWITCHBOT_SECRET": "...",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

### HTTP (Streamable HTTP)

```bash
MCP_TRANSPORT=http \
MCP_SERVER_API_KEY=your_api_key \
SWITCHBOT_TOKEN=... \
SWITCHBOT_SECRET=... \
npx -y @genm-dev/switchbot-mcp
```

Endpoint: `http://127.0.0.1:8787/mcp`

Generate the bearer credential with a cryptographically secure generator, for
example `openssl rand -hex 32`, and inject it from your secret manager. The Node
server speaks plain HTTP. For any non-loopback deployment, terminate TLS at a
trusted reverse proxy, restrict network access, and configure its hostname in
`MCP_HTTP_ALLOWED_HOSTS`; do not expose the Node listener directly to the public
internet.

### Optional third-party integration: Smithery

Smithery is not an official distribution channel for this project. npm, the
Official MCP Registry, and the direct client configurations above are the
canonical installation and discovery paths.

The retained Smithery configuration uses its legacy repository format and has
not been revalidated against Smithery's current MCPB/URL publication model. The
command below is informational and must not be advertised as supported until it
is verified separately after the first release.

```bash
npx -y @smithery/cli@latest install @genm-dev/switchbot-mcp --client claude
```

## Testing strategy

### Required gates (deterministic)

```bash
npm run check
npm run test:coverage
```

`npm run check` includes type-checking, linting, formatting, MCP protocol and
transport tests, a build, package metadata validation, installation/execution
of the packed artifact, and a validated production-dependency SBOM. `npm run
test:coverage` enforces coverage thresholds.

When changing the Docker runtime, also run:

```bash
npm run smoke:container
```

This verifies missing-configuration failure, HTTP authentication, MCP
initialization, and the non-root runtime user.

### Optional live test (real SwitchBot API)

Run this only when you want to validate real API connectivity with your own credentials.

```bash
SWITCHBOT_TOKEN=... SWITCHBOT_SECRET=... npm run test:live
```

- Uses real SwitchBot API (not mocked)
- Read-only checks (`list_devices` and `list_scenes`)
- If credentials are missing, the live test suite is skipped

## MCP Inspector (manual debugging)

Use Inspector only for local manual debugging. Do not expose it to public networks.

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

Pass env vars with `-e`, for example:

```bash
npx @modelcontextprotocol/inspector \
  -e SWITCHBOT_TOKEN=... \
  -e SWITCHBOT_SECRET=... \
  -e MCP_TRANSPORT=stdio \
  -- node build/index.js
```

This repository does not pin Inspector as a dependency. Use `npx` to get the latest patched release.

## Data handling and removal

- The server sends SwitchBot API requests only to the fixed official API origin.
  The test-only override is restricted to loopback addresses.
- Device and scene lists are cached in process memory only. The server does not
  persist SwitchBot device data, run analytics, send telemetry, or perform
  automatic update checks.
- Operational logs are structured JSON on stderr. Credential-shaped fields are
  redacted, and API operation logs do not include device or scene identifiers.
- To uninstall, remove the MCP client/server configuration and the installed npm
  package or container. Remove or rotate credentials separately in the secret
  manager or client configuration that owns them; this server has no persistent
  credential store to clean up.

## Maintainer docs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [GOVERNANCE.md](./GOVERNANCE.md)
- [SECURITY.md](./SECURITY.md)
- [docs/security-model.md](./docs/security-model.md)
- [SUPPORT.md](./SUPPORT.md)
- [docs/github-flow.md](./docs/github-flow.md)
- [docs/release-process.md](./docs/release-process.md)

## Secrets management policy

Use secret managers as primary storage (`AWS Secrets Manager`, `AWS SSM Parameter Store`, `Doppler`).
Environment variable injection at runtime is supported, but plaintext `.env` files are not the recommended primary workflow.

## License

[ISC](./LICENSE). SwitchBot names and marks belong to their respective owners;
the software license does not grant trademark rights.
