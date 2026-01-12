# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

ccexportはClaude Codeの会話履歴をMarkdownにエクスポートするGo製CLIツールです。

## 開発コマンド

```bash
# ビルド
go build -o ccexport ./cmd/ccexport

# テスト実行
go test ./...

# 特定パッケージのテスト
go test ./internal/config/...
go test ./internal/session/...

# カバレッジ付きテスト
go test -cover ./...

# リント（golangci-lintを使用）
golangci-lint run
```

## プロジェクト構成

```
ccexport/
├── cmd/ccexport/main.go    # エントリーポイント
├── internal/
│   ├── config/             # 設定ファイル読み書き
│   ├── export/             # エクスポート処理
│   ├── hook/               # Claude Codeフック管理
│   └── session/            # JSONLパーサー
├── docs/                   # ドキュメント
└── .goreleaser.yaml        # リリース設定
```

## アーキテクチャ方針

- **シンプルさ優先**: 過度な抽象化を避け、読みやすいコードを維持
- **エラーハンドリング**: 致命的でないエラーは警告を出して継続
- **テスタビリティ**: 依存性注入を活用し、モック可能な設計

## 開発ガイドライン

### テスト駆動開発（TDD）

1. テストを先に書く（Red）
2. テストが通る最小限のコードを書く（Green）
3. リファクタリング（Refactor）

### コーディング規約

- Go標準のフォーマッタ（gofmt）に従う
- エラーは適切にラップして返す（`fmt.Errorf("context: %w", err)`）
- 公開APIにはGoDocコメントを付ける

### コミットメッセージ

Conventional Commitsに従う:
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `test:` テスト追加・修正
- `refactor:` リファクタリング

## 主要な依存ライブラリ

| ライブラリ | 用途 |
|-----------|------|
| `github.com/spf13/cobra` | CLIフレームワーク |
| `github.com/BurntSushi/toml` | TOMLパーサー |
| `github.com/fatih/color` | ターミナル色付け |

## 重要な仕様

### セッションファイルの場所

```
~/.claude/projects/{project-hash}/{session-id}.jsonl
```

### フィルタリング対象

以下を含むメッセージは出力から除外:
- `<system-reminder>`
- `<local-command`
- `<command-name>`
- `<task-notification>`
- `No response requested`で始まる応答
- subagentsディレクトリ配下のセッション

### エラーハンドリング方針

| 状況 | 終了コード | 動作 |
|------|-----------|------|
| 設定ファイルがない | 1 | エラー終了 |
| 出力先ディレクトリがない | 0 | 自動作成 |
| JSONパースエラー | 0 | スキップして継続 |
| Git操作失敗 | 0 | 警告して継続 |

## 参考ドキュメント

- [詳細仕様](docs/spec.md)
- [設定リファレンス](docs/configuration.md)
- [Hooks連携](docs/hooks.md)
