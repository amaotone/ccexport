# ccexport

Claude Codeの会話履歴をMarkdownにエクスポートするCLIツール

## 概要

ccexportは、Claude Codeとの会話を自動的にMarkdownファイルとして保存するツールです。Claude Codeのhooks機能と連携し、セッション終了時に自動でエクスポートできます。

## インストール

### バイナリダウンロード（推奨）

```bash
# macOS (Apple Silicon)
curl -L https://github.com/amaotone/ccexport/releases/latest/download/ccexport-darwin-arm64 \
  -o /usr/local/bin/ccexport && chmod +x /usr/local/bin/ccexport

# macOS (Intel)
curl -L https://github.com/amaotone/ccexport/releases/latest/download/ccexport-darwin-amd64 \
  -o /usr/local/bin/ccexport && chmod +x /usr/local/bin/ccexport

# Linux (x86_64)
curl -L https://github.com/amaotone/ccexport/releases/latest/download/ccexport-linux-amd64 \
  -o /usr/local/bin/ccexport && chmod +x /usr/local/bin/ccexport
```

### ソースからビルド

```bash
go install github.com/amaotone/ccexport@latest
```

## クイックスタート

```bash
# 1. 設定ファイルを作成
ccexport init

# 2. Claude Codeフックをインストール（自動エクスポート）
ccexport hook install

# 3. 手動でエクスポートする場合
ccexport export
```

## 設定

設定ファイル: `~/.config/ccexport/config.toml`

```toml
# 出力先ディレクトリ（必須）
output_dir = "~/obsidian/claude"

# ファイル名フォーマット（Go time.Format形式）
filename_format = "2006-01-02"

# 変更時にgit commitを実行するか
git_commit = false

# プロジェクトの扱い: "merge" or "separate"
project_mode = "merge"
```

詳細は[設定リファレンス](docs/configuration.md)を参照してください。

## コマンド

```
ccexport [command]

Commands:
  export      会話履歴をエクスポート（デフォルト）
  init        設定ファイルを対話的に作成
  hook        Claude Codeフックを設定/解除
  config      設定の表示・編集

Flags:
  -c, --config string   設定ファイルのパス
  -v, --verbose         詳細ログを出力
  -h, --help            ヘルプを表示
      --version         バージョンを表示
```

### 使用例

```bash
# 今日の会話をエクスポート
ccexport

# 特定の日付をエクスポート
ccexport export -d 2026-01-10

# 全日付をエクスポート
ccexport export --all

# dry-run（ファイルに書き込まず確認）
ccexport export --dry-run
```

## 出力例

```markdown
# 2026-01-12 Claude会話ログ

## 10:30 projectA

**User**: TypeScriptでファイル監視する方法は？

**Claude**: Node.jsの`fs.watch`や`chokidar`ライブラリを使う方法があります...

---

## 14:15 projectB

**User**: Rustのライフタイムについて教えて

**Claude**: ライフタイムは参照の有効期間を...
```

## ドキュメント

- [設定リファレンス](docs/configuration.md)
- [Claude Code Hooks連携](docs/hooks.md)
- [詳細仕様](docs/spec.md)

## 参考

- [元記事: Claude Codeとの会話を自動でObsidianに記録する仕組みを作った](https://zenn.dev/pepabo/articles/ffb79b5279f6ee)
- [Claude Code Hooks ドキュメント](https://docs.anthropic.com/en/docs/claude-code/hooks)

## License

MIT
