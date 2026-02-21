# @genm/switchbot-mcp

SwitchBot MCP Server v2 for AI assistants.

[![smithery badge](https://smithery.ai/badge/@genm/switchbot-mcp)](https://smithery.ai/server/@genm/switchbot-mcp)

[日本語](./README.ja.md)

## Highlights

- v2.0.0 with breaking changes
- Layered architecture (SwitchBot client / MCP tools / transports)
- `stdio` and Streamable HTTP transports
- API key required for HTTP transport
- Structured MCP tool outputs (`structuredContent`)

## Requirements

- Node.js 22+
- SwitchBot Open API token and secret

## Install

```bash
npm install @genm/switchbot-mcp
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

## MCP tools (v2)

1. `switchbot_list_devices`
2. `switchbot_get_device_status`
3. `switchbot_set_power`
4. `switchbot_send_command`
5. `switchbot_list_scenes`
6. `switchbot_execute_scene`

See migration details: [docs/migration-v1-to-v2.md](./docs/migration-v1-to-v2.md)

## Usage

### stdio (Claude Desktop / Smithery)

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
node build/index.js
```

Endpoint: `http://127.0.0.1:8787/mcp`

## Development

```bash
npm ci
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
```

## Secrets management policy

Use secret managers as primary storage (`AWS Secrets Manager`, `AWS SSM Parameter Store`, `Doppler`).
Environment variable injection at runtime is supported, but plaintext `.env` files are not the recommended primary workflow.

## License

ISC
