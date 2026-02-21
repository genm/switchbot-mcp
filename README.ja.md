# @genm/switchbot-mcp

AIアシスタント向けの SwitchBot MCP Server v2 です。

[![smithery badge](https://smithery.ai/badge/@genm/switchbot-mcp)](https://smithery.ai/server/@genm/switchbot-mcp)

[English](./README.md)

## 概要

- v2.0.0（破壊的変更あり）
- レイヤー分離（SwitchBotクライアント / MCPツール / トランスポート）
- `stdio` と Streamable HTTP を正式サポート
- HTTPモードは APIキー必須
- 全ツールで `structuredContent` を返却

## 必要条件

- Node.js 22+
- SwitchBot Open API の token / secret

## インストール

```bash
npm install @genm/switchbot-mcp
```

## 設定

### 必須

- `SWITCHBOT_TOKEN`
- `SWITCHBOT_SECRET`

### トランスポート

- `MCP_TRANSPORT=stdio|http`（デフォルト: `stdio`）
- `MCP_SERVER_API_KEY`（`http`時は必須）
- `MCP_HTTP_HOST`（デフォルト: `127.0.0.1`）
- `MCP_HTTP_PORT`（デフォルト: `8787`）
- `MCP_HTTP_PATH`（デフォルト: `/mcp`）

### 実行オプション

- `SWITCHBOT_TIMEOUT_MS`（デフォルト: `10000`）
- `SWITCHBOT_LIST_CACHE_TTL_MS`（デフォルト: `30000`）
- `LOG_LEVEL=debug|info|warn|error`（デフォルト: `info`）

## MCPツール（v2）

1. `switchbot_list_devices`
2. `switchbot_get_device_status`
3. `switchbot_set_power`
4. `switchbot_send_command`
5. `switchbot_list_scenes`
6. `switchbot_execute_scene`

移行手順は [docs/migration-v1-to-v2.md](./docs/migration-v1-to-v2.md) を参照してください。

## 使い方

### stdio（Claude Desktop / Smithery）

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

### HTTP（Streamable HTTP）

```bash
MCP_TRANSPORT=http \
MCP_SERVER_API_KEY=your_api_key \
SWITCHBOT_TOKEN=... \
SWITCHBOT_SECRET=... \
node build/index.js
```

エンドポイント: `http://127.0.0.1:8787/mcp`

## 開発

```bash
npm ci
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
```

## Secrets運用方針

機密情報の正本は `AWS Secrets Manager` / `AWS SSM Parameter Store` / `Doppler` を推奨します。
実行時の環境変数注入はサポートしますが、平文 `.env` の常用は推奨しません。

## ライセンス

ISC
