# Claude Code Hooks連携

## 概要

ccexportはClaude Codeのhooks機能と連携し、セッション終了時に自動でエクスポートを実行できます。

## フックの仕組み

Claude Codeは `~/.claude/settings.json` でフックを設定できます。

参考: https://docs.anthropic.com/en/docs/claude-code/hooks

## 使用するフック

**PostToolUse** フックで **Stop** ツール（セッション終了）をトリガーにします:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/ccexport export"
          }
        ]
      }
    ]
  }
}
```

## フックの管理

### インストール

```bash
$ ccexport hook install
✅ Claude Codeフックを設定しました

~/.claude/settings.json に以下が追加されました:
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Stop",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/ccexport export"
          }
        ]
      }
    ]
  }
}
```

### 状態確認

```bash
$ ccexport hook status
✅ フックはインストール済みです
   トリガー: PostToolUse (Stop)
   コマンド: /usr/local/bin/ccexport export
```

### アンインストール

```bash
$ ccexport hook uninstall
✅ フックを削除しました
```

## フック実行時の環境変数

Claude Codeからフックが呼ばれる際、以下の環境変数が設定されます:

| 環境変数 | 説明 |
|---------|------|
| `CLAUDE_WORKING_DIRECTORY` | プロジェクトのパス |

## 手動実行

フックを設定せずに手動でエクスポートすることも可能です:

```bash
# 今日の会話をエクスポート
ccexport export

# 特定の日付をエクスポート
ccexport export -d 2026-01-10

# 全日付をエクスポート
ccexport export --all
```

## トラブルシューティング

### フックが動作しない場合

1. ccexportのパスを確認:
   ```bash
   which ccexport
   ```

2. settings.jsonの内容を確認:
   ```bash
   cat ~/.claude/settings.json
   ```

3. 手動でコマンドを実行してエラーを確認:
   ```bash
   ccexport export -v
   ```

### 既存のフックとの競合

既に他のフックが設定されている場合、`ccexport hook install`は既存の設定を保持しつつccexportのフックを追加します。
