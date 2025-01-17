# @genm/switchbot-mcp

SwitchBot MCPサーバーは、AIアシスタントにSwitchBotデバイスの制御機能を提供するMCPサーバーです。

## 機能

- デバイス一覧の取得
- デバイスの状態取得
- デバイスの制御（オン/オフ）
- デバイスの設定変更
- シーン制御
- デバイスステータス監視

## インストール

```bash
npm install @genm/switchbot-mcp
```

## セットアップ手順

### 1. SwitchBot APIの設定

1. SwitchBotアプリをインストール
2. アカウントを作成してログイン
3. アプリのプロフィール画面から「設定」→「開発者向けオプション」を開く
4. トークンを取得

### 2. MCPサーバー設定

`recline_mcp_settings.json`または`claude_desktop_config.json`に以下の設定を追加：

```json
{
  "mcpServers": {
    "switchbot": {
      "command": "node",
      "args": ["path/to/switchbot-mcp/build/index.js"],
      "env": {
        "SWITCHBOT_TOKEN": "your_token"
      }
    }
  }
}
```

### 3. 環境変数

```env
SWITCHBOT_TOKEN=your_token
```

## サポートしているデバイス

- プラグ
- ボット
- カーテン
- エアコン
- 加湿器
- ライト
- リモコン

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

1. トークンの有効期限を確認
2. トークンを再生成
3. 環境変数を更新

## ライセンス

ISC
