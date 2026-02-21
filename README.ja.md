# @genm-dev/switchbot-mcp

AIアシスタント向けの SwitchBot MCP Server v2 です。

[![smithery badge](https://smithery.ai/badge/@genm-dev/switchbot-mcp)](https://smithery.ai/server/@genm-dev/switchbot-mcp)

[English](./README.md)

## クイックインストール

### Cursor（ワンクリック）

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=switchbot&config=eyJzd2l0Y2hib3QiOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZ2VubS1kZXYvc3dpdGNoYm90LW1jcCJdLCJlbnYiOnsiU1dJVENIQk9UX1RPS0VOIjoiWU9VUl9TV0lUQ0hCT1RfVE9LRU4iLCJTV0lUQ0hCT1RfU0VDUkVUIjoiWU9VUl9TV0lUQ0hCT1RfU0VDUkVUIiwiTUNQX1RSQU5TUE9SVCI6InN0ZGlvIn19fQ%3D%3D)

インストール後、Cursor 側で `SWITCHBOT_TOKEN` と `SWITCHBOT_SECRET` を設定してください。

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

## 概要

- v2.0.0（破壊的変更あり）
- レイヤー分離（SwitchBotクライアント / MCPツール / トランスポート）
- `stdio` と Streamable HTTP を正式サポート
- HTTPモードは APIキー必須
- 全ツールで `structuredContent` を返却
- polyrepo前提の gated 運用でOSS保守性を重視

## 必要条件

- Node.js 22+
- SwitchBot Open API の token / secret

## インストール

```bash
npm install @genm-dev/switchbot-mcp
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

### テスト用（任意）

- `SWITCHBOT_BASE_URL`（決定論的E2E用にSwitchBot APIエンドポイントを上書き）

## MCPツール（v2）

1. `switchbot_list_devices`
2. `switchbot_get_device_status`
3. `switchbot_set_power`
4. `switchbot_send_command`
5. `switchbot_list_scenes`
6. `switchbot_execute_scene`

移行手順は [docs/migration-v1-to-v2.md](./docs/migration-v1-to-v2.md) を参照してください。

## 使い方

### stdio（package / npx）

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

### stdio（ローカルbuild）

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
npx -y @genm-dev/switchbot-mcp
```

エンドポイント: `http://127.0.0.1:8787/mcp`

### 代替インストール（Smithery）

```bash
npx -y @smithery/cli@latest install @genm-dev/switchbot-mcp --client claude
```

## テスト戦略

### 必須ゲート（決定論的）

```bash
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
```

`npm run test` には stdio / HTTP の実プロセスE2Eが含まれます。

### 任意: Liveテスト（実SwitchBot API）

実APIへの接続確認をしたい場合のみ、手元の資格情報で実行してください。

```bash
SWITCHBOT_TOKEN=... SWITCHBOT_SECRET=... npm run test:live
```

- モックではなく実SwitchBot APIを利用
- 読み取り系のみ（`list_devices` / `list_scenes`）
- 資格情報がない場合は Live テストはスキップされます

## MCP Inspector（手動デバッグ）

Inspector はローカルでの手動デバッグ専用です。外部ネットワークへ公開しないでください。

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

環境変数を渡す場合:

```bash
npx @modelcontextprotocol/inspector \
  -e SWITCHBOT_TOKEN=... \
  -e SWITCHBOT_SECRET=... \
  -e MCP_TRANSPORT=stdio \
  -- node build/index.js
```

このリポジトリでは Inspector を依存固定しません。`npx` で最新版を利用してください。

## メンテナ向けドキュメント

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [docs/gated-github-flow.md](./docs/gated-github-flow.md)
- [docs/release-process.md](./docs/release-process.md)

## Secrets運用方針

機密情報の正本は `AWS Secrets Manager` / `AWS SSM Parameter Store` / `Doppler` を推奨します。
実行時の環境変数注入はサポートしますが、平文 `.env` の常用は推奨しません。

## ライセンス

ISC
