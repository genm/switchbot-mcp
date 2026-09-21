# アーカイブ済み：公式 SwitchBot MCP を利用してください

このリポジトリはアーカイブ済みで、今後メンテナンスされません。

現在は SwitchBot 運営元の OpenWonderLabs が提供する公式実装を利用してください。

- [公式リポジトリ：OpenWonderLabs/switchbot-openapi-cli](https://github.com/OpenWonderLabs/switchbot-openapi-cli)
- [npm：@switchbot/openapi-cli](https://www.npmjs.com/package/@switchbot/openapi-cli)
- [Agent / MCP ガイド](https://github.com/OpenWonderLabs/switchbot-openapi-cli/blob/main/docs/agent-guide.md)

## クイックスタート

```bash
npm install -g @switchbot/openapi-cli
switchbot auth login
switchbot mcp serve
```

公式 MCP サーバーは、ローカルクライアント向けの stdio に対応しています。

```bash
switchbot mcp serve
```

長時間稼働するエージェントやリモートホストで利用する HTTP モードもあります。

```bash
switchbot mcp serve --port 8765
```

Codex や Claude Code では、公式ドキュメントにあるセットアップコマンドを利用してください。

```bash
switchbot codex setup
switchbot claude-code setup
```

ブラウザ認証を利用できない場合は、API token と secret を次のように設定できます。

```bash
switchbot config set-token <token> <secret>
```

このリポジトリは履歴参照のために残しています。新しい環境では、旧パッケージ名・source build 手順・設定例を利用しないでください。
