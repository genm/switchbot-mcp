# @genm-dev/switchbot-mcp

SwitchBot MCP Server v3 for AI assistants.

[![smithery badge](https://smithery.ai/badge/@genm-dev/switchbot-mcp)](https://smithery.ai/server/@genm-dev/switchbot-mcp)
[![npm version](https://img.shields.io/npm/v/@genm-dev/switchbot-mcp.svg)](https://www.npmjs.com/package/@genm-dev/switchbot-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@genm-dev/switchbot-mcp.svg)](https://www.npmjs.com/package/@genm-dev/switchbot-mcp)
[![Node.js](https://img.shields.io/node/v/@genm-dev/switchbot-mcp.svg)](https://www.npmjs.com/package/@genm-dev/switchbot-mcp)
[![License](https://img.shields.io/npm/l/@genm-dev/switchbot-mcp.svg)](./LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-ready-5A67D8.svg)](./server.json)
[![CI](https://github.com/genm/switchbot-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/genm/switchbot-mcp/actions/workflows/ci.yml)
[![CodeQL](https://github.com/genm/switchbot-mcp/actions/workflows/codeql.yml/badge.svg)](https://github.com/genm/switchbot-mcp/actions/workflows/codeql.yml)

[日本語](./README.ja.md)

## Quick Install

### One-click install

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=switchbot&config=eyJzd2l0Y2hib3QiOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZ2VubS1kZXYvc3dpdGNoYm90LW1jcCJdLCJlbnYiOnsiU1dJVENIQk9UX1RPS0VOIjoiWU9VUl9TV0lUQ0hCT1RfVE9LRU4iLCJTV0lUQ0hCT1RfU0VDUkVUIjoiWU9VUl9TV0lUQ0hCT1RfU0VDUkVUIiwiTUNQX1RSQU5TUE9SVCI6InN0ZGlvIn19fQ%3D%3D)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_MCP-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white)](vscode:mcp/install?%7B%22name%22%3A%22switchbot%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40genm-dev%2Fswitchbot-mcp%22%5D%2C%22env%22%3A%7B%22SWITCHBOT_TOKEN%22%3A%22YOUR_SWITCHBOT_TOKEN%22%2C%22SWITCHBOT_SECRET%22%3A%22YOUR_SWITCHBOT_SECRET%22%2C%22MCP_TRANSPORT%22%3A%22stdio%22%7D%7D)

Replace `SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` with your credentials after
installation. The links install the public npm package through `npx`; review the
configuration before starting the server.

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

```bash
npm install @genm-dev/switchbot-mcp
```

## Configuration

### Required

- `SWITCHBOT_TOKEN`
- `SWITCHBOT_SECRET`

### Transport

- `MCP_TRANSPORT=stdio|http` (default: `stdio`)
- `MCP_SERVER_API_KEY` (required for `http`)
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

### stdio (package / npx)

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

### Alternative install (Smithery)

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
transport tests, a build, package metadata validation, and installation/execution
of the packed artifact. `npm run test:coverage` enforces coverage thresholds.

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

## Maintainer docs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [docs/github-flow.md](./docs/github-flow.md)
- [docs/release-process.md](./docs/release-process.md)

## Secrets management policy

Use secret managers as primary storage (`AWS Secrets Manager`, `AWS SSM Parameter Store`, `Doppler`).
Environment variable injection at runtime is supported, but plaintext `.env` files are not the recommended primary workflow.

## License

ISC
