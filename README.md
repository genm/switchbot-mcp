# @genm-dev/switchbot-mcp

SwitchBot MCP Server v2 for AI assistants.

[![smithery badge](https://smithery.ai/badge/@genm-dev/switchbot-mcp)](https://smithery.ai/server/@genm-dev/switchbot-mcp)

[日本語](./README.ja.md)

## Quick Install

### Cursor (one click)

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=switchbot&config=eyJzd2l0Y2hib3QiOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZ2VubS1kZXYvc3dpdGNoYm90LW1jcCJdLCJlbnYiOnsiU1dJVENIQk9UX1RPS0VOIjoiWU9VUl9TV0lUQ0hCT1RfVE9LRU4iLCJTV0lUQ0hCT1RfU0VDUkVUIjoiWU9VUl9TV0lUQ0hCT1RfU0VDUkVUIiwiTUNQX1RSQU5TUE9SVCI6InN0ZGlvIn19fQ%3D%3D)

Set `SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` in Cursor after installation.

### VS Code

```bash
code --add-mcp '{"switchbot":{"command":"npx","args":["-y","@genm-dev/switchbot-mcp"],"env":{"SWITCHBOT_TOKEN":"YOUR_SWITCHBOT_TOKEN","SWITCHBOT_SECRET":"YOUR_SWITCHBOT_SECRET","MCP_TRANSPORT":"stdio"}}}'
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

- v2.0.0 with breaking changes
- Layered architecture (SwitchBot client / MCP tools / transports)
- `stdio` and Streamable HTTP transports
- API key required for HTTP transport
- Structured MCP tool outputs (`structuredContent`)
- Polyrepo-first gated flow for maintainable OSS operations

## Requirements

- Node.js 22+
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
- `MCP_HTTP_PORT` (default: `8787`)
- `MCP_HTTP_PATH` (default: `/mcp`)

### Runtime

- `SWITCHBOT_TIMEOUT_MS` (default: `10000`)
- `SWITCHBOT_LIST_CACHE_TTL_MS` (default: `30000`)
- `LOG_LEVEL=debug|info|warn|error` (default: `info`)

### Test-only (optional)

- `SWITCHBOT_BASE_URL` (override SwitchBot API endpoint for deterministic e2e tests)

## MCP tools (v2)

1. `switchbot_list_devices`
2. `switchbot_get_device_status`
3. `switchbot_set_power`
4. `switchbot_send_command`
5. `switchbot_list_scenes`
6. `switchbot_execute_scene`
7. `switchbot_list_devices_raw` (advanced, raw upstream fields)

See migration details: [docs/migration-v1-to-v2.md](./docs/migration-v1-to-v2.md)

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
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
```

`npm run test` includes stdio and HTTP process e2e tests.

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
- [docs/gated-github-flow.md](./docs/gated-github-flow.md)
- [docs/release-process.md](./docs/release-process.md)

## Secrets management policy

Use secret managers as primary storage (`AWS Secrets Manager`, `AWS SSM Parameter Store`, `Doppler`).
Environment variable injection at runtime is supported, but plaintext `.env` files are not the recommended primary workflow.

## License

ISC
