# @genm/switchbot-mcp

SwitchBot MCPサーバーは、AIアシスタントにSwitchBotデバイスの制御機能を提供するMCPサーバーです。
[![smithery badge](https://smithery.ai/badge/@genm/switchbot-mcp)](https://smithery.ai/server/@genm/switchbot-mcp)

[English](./README.md)

## 機能

- デバイス一覧の取得
- デバイスの状態取得
- デバイスの制御（オン/オフ）
- デバイスの設定変更
- シーン制御
- デバイスステータス監視

## インストール

### Smitheryを使用したインストール

[Smithery](https://smithery.ai/server/@genm/switchbot-mcp)を使用してClaude Desktop用にSwitchBot MCPサーバーを自動インストールする：

```bash
npx -y @smithery/cli install @genm/switchbot-mcp --client claude
```

### 手動インストール
```bash
npm install @genm/switchbot-mcp
```

## セットアップ手順

### 1. SwitchBot APIの設定

1. SwitchBotアプリをインストール
2. アカウントを作成してログイン
3. アプリのプロフィール画面から「設定」→「開発者向けオプション」を開く
4. トークンとシークレットキーを取得

### 2. MCPサーバー設定

`claude_desktop_config.json`に以下の設定を追加：

```json
{
  "mcpServers": {
    "switchbot": {
      "command": "node",
      "args": ["path/to/switchbot-mcp/build/index.js"],
      "env": {
        "SWITCHBOT_TOKEN": "your_token",
        "SWITCHBOT_SECRET": "your_secret"
      }
    }
  }
}
```

### 3. 環境変数

```env
SWITCHBOT_TOKEN=your_token
SWITCHBOT_SECRET=your_secret
```

## サポートしているデバイス

- プラグ
  - リビングのフロアライト
  - 書斎のPCの電源
- ボット
  - キッチンのコーヒーメーカー
  - リビングの空気清浄機
- カーテン
  - 寝室の窓のカーテン
  - 書斎の遮光カーテン
- エアコン
  - リビングのエアコン
  - 寝室のエアコン
- 加湿器
  - 寝室の加湿器
  - 書斎の加湿器
- ライト
  - キッチンの天井照明
  - 寝室の常夜灯
- リモコン
  - リビングのテレビ
  - 書斎の扇風機

## デバイス名の例

AIアシスタントが制御しやすいように、デバイスには場所や用途を含む具体的な名前をつけることをお勧めします：

- 「カーテン」ではなく「寝室のカーテン」
- 「エアコン」ではなく「リビングのエアコン」
- 「ボット」ではなく「キッチンのコーヒーメーカー」

このような命名規則により、AIアシスタントは各デバイスのコンテキストと場所を理解しやすくなります。

## サポートしている操作

### デバイス管理
- デバイスの一覧取得
- デバイスのステータス取得
- デバイスの電源オン/オフ
- デバイスの設定変更

### シーン管理
- シーンの一覧取得
- シーンの実行

### センサー情報
- 温度
- 湿度
- 明るさ
- モーション

## 開発

```bash
# ビルド
npm run build

# 開発モード（TypeScript）
npm run dev

# 起動
npm start
```

## エラー対処

### デバイスが応答しない場合

1. デバイスがBluetooth範囲内にあることを確認
2. デバイスのバッテリー状態を確認
3. SwitchBotハブとの接続状態を確認

### 認証エラー

1. トークンとシークレットキーの有効期限を確認
2. トークンとシークレットキーを再生成
3. 環境変数を更新

## ライセンス

ISC