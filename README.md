# Archived: use the official SwitchBot MCP

This repository is archived and no longer maintained.

Please use the official SwitchBot implementation maintained by OpenWonderLabs:

- [Official repository: OpenWonderLabs/switchbot-openapi-cli](https://github.com/OpenWonderLabs/switchbot-openapi-cli)
- [npm: @switchbot/openapi-cli](https://www.npmjs.com/package/@switchbot/openapi-cli)
- [Agent/MCP guide](https://github.com/OpenWonderLabs/switchbot-openapi-cli/blob/main/docs/agent-guide.md)

## Quick start

```bash
npm install -g @switchbot/openapi-cli
switchbot auth login
switchbot mcp serve
```

The official MCP server supports stdio for local clients:

```bash
switchbot mcp serve
```

It also supports HTTP for a long-lived or remotely hosted agent worker:

```bash
switchbot mcp serve --port 8765
```

For Codex or Claude Code, use the official setup commands documented upstream:

```bash
switchbot codex setup
switchbot claude-code setup
```

If browser authentication is not available, configure an API token and secret with:

```bash
switchbot config set-token <token> <secret>
```

This repository is retained for historical reference only. Do not use its old package name, source-build instructions, or configuration examples for new deployments.
