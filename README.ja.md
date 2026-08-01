# @genm-dev/switchbot-mcp

AIアシスタント向けの SwitchBot MCP Server v3 です。

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![CI](https://github.com/genm/switchbot-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/genm/switchbot-mcp/actions/workflows/ci.yml)
[![CodeQL](https://github.com/genm/switchbot-mcp/actions/workflows/codeql.yml/badge.svg)](https://github.com/genm/switchbot-mcp/actions/workflows/codeql.yml)

[English](./README.md)

## プロジェクトの状態

source repository は公開済みですが、v3 は npm と公式 MCP Registry へまだ
公開されていません。この README の npm、`npx`、ワンクリックの各コマンドは、
[Issue #7](https://github.com/genm/switchbot-mcp/issues/7) で追跡する
初回 release 後に利用可能になります。現時点の評価には source build を利用してください。

本プロジェクトは非公式の community integration であり、SwitchBot との提携や
承認を示すものではありません。tool call は物理デバイスの制御や scene の実行を
行えます。利用前に要求された操作、資格情報へのアクセス、network 公開範囲を確認し、
AI client の確認画面を認可境界として扱わないでください。

## source からの build（現在利用可能）

```bash
git clone https://github.com/genm/switchbot-mcp.git
cd switchbot-mcp
npm ci --ignore-scripts
npm run build
```

以下の必須設定を渡して `node build/index.js` を実行してください。資格情報が
不足している場合、process は fail closed します。

## package install（初回 release 後）

### ワンクリックインストール

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=switchbot&config=eyJzd2l0Y2hib3QiOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZ2VubS1kZXYvc3dpdGNoYm90LW1jcCJdLCJlbnYiOnsiU1dJVENIQk9UX1RPS0VOIjoiWU9VUl9TV0lUQ0hCT1RfVE9LRU4iLCJTV0lUQ0hCT1RfU0VDUkVUIjoiWU9VUl9TV0lUQ0hCT1RfU0VDUkVUIiwiTUNQX1RSQU5TUE9SVCI6InN0ZGlvIn19fQ%3D%3D)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_MCP-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white)](vscode:mcp/install?%7B%22name%22%3A%22switchbot%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40genm-dev%2Fswitchbot-mcp%22%5D%2C%22env%22%3A%7B%22SWITCHBOT_TOKEN%22%3A%22YOUR_SWITCHBOT_TOKEN%22%2C%22SWITCHBOT_SECRET%22%3A%22YOUR_SWITCHBOT_SECRET%22%2C%22MCP_TRANSPORT%22%3A%22stdio%22%7D%7D)

これらの link は公開予定の npm package を参照します。公開後、
`SWITCHBOT_TOKEN` と `SWITCHBOT_SECRET` を実際の資格情報へ置き換え、起動前に
設定内容を確認してください。

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

## 概要

- Node.js 24 LTS を基盤とする v3.0.0
- MCP SDK v2とMCP 2026-07-28プロトコル交渉の明示的な検証
- 標準 `fetch` と厳密な上流レスポンス検証
- レイヤー分離（SwitchBotクライアント / MCPツール / トランスポート）
- `stdio` と Streamable HTTP を正式サポート
- HTTPモードは APIキー必須
- HTTPデプロイ向けの同一ホストOrigin / Host検証
- 全ツールで `structuredContent` を返却
- MCPリスク注釈と読み取り専用SwitchBotリクエストの上限付きリトライ
- シークレットをマスクするJSONL運用ログ
- 対応ランタイム・配布パッケージ・コンテナを横断する公開repo向けCI

## 必要条件

- Node.js 24.15+
- SwitchBot Open API の token / secret

## インストール

初回 release 後に利用可能です。

```bash
npm install @genm-dev/switchbot-mcp
```

## 設定

### 必須

- `SWITCHBOT_TOKEN`
- `SWITCHBOT_SECRET`

### トランスポート

- `MCP_TRANSPORT=stdio|http`（デフォルト: `stdio`）
- `MCP_SERVER_API_KEY`（`http`時は必須。前後空白を含まない高エントロピーなsecretを使用）
- `MCP_HTTP_HOST`（デフォルト: `127.0.0.1`）
- `MCP_HTTP_ALLOWED_HOSTS`（任意: proxy / 公開ホスト名のカンマ区切り）
- `MCP_HTTP_PORT`（デフォルト: `8787`）
- `MCP_HTTP_PATH`（デフォルト: `/mcp`）

`Origin` ヘッダーを持つHTTPリクエストは、`Host` と同じ許可リストの
ホスト名を使う必要があります。localhostとbind hostは自動的に含まれます。
リバースプロキシのホスト名は明示的に追加してください。不正なリクエストや
cross-originリクエストは拒否されます。

### 実行オプション

- `SWITCHBOT_TIMEOUT_MS`（デフォルト: `10000`）
- `SWITCHBOT_LIST_CACHE_TTL_MS`（デフォルト: `30000`）
- `LOG_LEVEL=debug|info|warn|error`（デフォルト: `info`）

### テスト用（任意）

- `SWITCHBOT_BASE_URL`（決定論的E2E用にSwitchBot APIエンドポイントを上書き）

この上書きは `NODE_ENV=test` かつ URL が `localhost`、`127.0.0.0/8`、
`[::1]` のいずれかを使う場合に限り受け付けます。production credential が別originへ
送信されることを防ぎます。

## MCPツール（v3）

1. `switchbot_list_devices`
2. `switchbot_get_device_status`
3. `switchbot_set_power`
4. `switchbot_send_command`
5. `switchbot_list_scenes`
6. `switchbot_execute_scene`
7. `switchbot_list_devices_raw`（上級者向け: 上流の生フィールドを返却）

移行手順は [docs/migration-v2-to-v3.md](./docs/migration-v2-to-v3.md) を参照してください。

## 使い方

### stdio（package / npx、初回 release 後）

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

bearer credential は `openssl rand -hex 32` などの暗号学的に安全な生成器で作成し、
secret manager から注入してください。Node server 自体は平文HTTPを提供します。
loopback外へ配置する場合は信頼できるreverse proxyでTLSを終端し、network accessを
制限して、そのhostnameを `MCP_HTTP_ALLOWED_HOSTS` に設定してください。Node listenerを
public internetへ直接公開しないでください。

### 任意の第三者 integration: Smithery

Smithery は本プロジェクトの公式配布経路ではありません。npm、Official MCP Registry、
および上記の client 直接設定を、正規の install / discovery 経路とします。

保持している Smithery 設定は旧 repository 形式であり、現在の MCPB / URL publish
方式に対する再検証は行っていません。以下の command は参考情報であり、初回 release 後に
別途検証が完了するまで、対応済みの install 方法として案内しないでください。

```bash
npx -y @smithery/cli@latest install @genm-dev/switchbot-mcp --client claude
```

## テスト戦略

### 必須ゲート（決定論的）

```bash
npm run check
npm run test:coverage
```

`npm run check` は型・lint・format、MCPプロトコル/トランスポート、build、
package metadata、pack後のインストール/実行、およびproduction dependencyを網羅する
検証済みSBOMを確認します。
`npm run test:coverage` はカバレッジ下限を強制します。

Docker実行環境を変更した場合は、次も実行してください。

```bash
npm run smoke:container
```

設定欠落時の失敗、HTTP認証、MCP initialize、非root実行を実コンテナで検証します。

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

## データ処理と削除

- server は固定された公式SwitchBot API originにだけリクエストを送信します。
  テスト用overrideはloopback addressに限定されます。
- device / scene listはprocess memory内だけにcacheされます。SwitchBot device dataの
  永続化、analytics、telemetry、automatic update checkは行いません。
- 運用logはstderrへstructured JSONで出力します。credentialを示すfieldはredactし、
  API operation logにはdevice / scene identifierを含めません。
- uninstall時はMCP client/server設定とinstall済みnpm packageまたはcontainerを削除します。
  credentialは、その正本であるsecret managerまたはclient設定から別途削除・rotateしてください。
  このserverには削除対象となるpersistent credential storeはありません。

## メンテナ向けドキュメント

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [GOVERNANCE.md](./GOVERNANCE.md)
- [SECURITY.md](./SECURITY.md)
- [docs/security-model.md](./docs/security-model.md)
- [SUPPORT.md](./SUPPORT.md)
- [docs/github-flow.md](./docs/github-flow.md)
- [docs/release-process.md](./docs/release-process.md)

## Secrets運用方針

機密情報の正本は `AWS Secrets Manager` / `AWS SSM Parameter Store` / `Doppler` を推奨します。
実行時の環境変数注入はサポートしますが、平文 `.env` の常用は推奨しません。

## ライセンス

[ISC](./LICENSE) です。SwitchBot の名称および商標は各権利者に帰属し、software
license は trademark rights を付与しません。
