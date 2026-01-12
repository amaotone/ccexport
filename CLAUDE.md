# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

ccexportはClaude Codeの会話履歴をMarkdownにエクスポートするTypeScript製CLIツールです。

## 開発コマンド

```bash
# 開発実行
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# テスト（watchモード）
pnpm test:watch

# 型チェック
pnpm lint
```

## プロジェクト構成

```
ccexport/
├── src/
│   ├── cli.ts              # CLIエントリーポイント
│   ├── index.ts            # ライブラリエントリーポイント
│   ├── config/             # 設定ファイル読み書き
│   ├── session/            # JSONLパーサー
│   ├── export/             # エクスポート処理
│   └── hook/               # Claude Codeフック管理
├── docs/                   # ドキュメント
├── package.json
└── tsconfig.json
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

- TypeScript strictモードを使用
- ESM（ES Modules）を使用
- エラーは適切な型で返す

### バージョン管理（jj）

このプロジェクトはjj（Jujutsu）を使用しています。

```bash
# 状態確認
jj status
jj log

# 変更をコミット
jj commit -m "feat: add new feature"

# 変更を確認
jj diff
```

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
| `commander` | CLIフレームワーク |
| `toml` | TOMLパーサー |
| `chalk` | ターミナル色付け |
| `vitest` | テストフレームワーク |

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
