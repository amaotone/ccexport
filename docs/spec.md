# 詳細仕様

## セッションファイルの仕様

### 保存場所

```
~/.claude/projects/{project-hash}/{session-id}.jsonl
```

- `project-hash`: プロジェクトパスをエスケープしたもの（例: `-Users-amane-work-myapp`）
- `session-id`: UUIDベースのセッション識別子

### JSONL形式

各行が1つのJSONオブジェクト:

```jsonl
{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"質問内容"}}
{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"回答内容"}]}}
```

## 出力フォーマット

### Markdownファイル構造

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

### フィルタリング（除外対象）

以下のメッセージは出力から除外する:

- `<system-reminder>` を含むメッセージ
- `<local-command` を含むメッセージ
- `<command-name>` を含むメッセージ
- `<task-notification>` を含むメッセージ
- `No response requested` で始まるClaudeの応答
- subagentsディレクトリ配下のセッション

## エラーハンドリング

| 状況 | 終了コード | 動作 |
|------|-----------|------|
| 設定ファイルがない | 1 | エラーメッセージを表示し終了 |
| 出力先ディレクトリがない | 0 | 自動作成 |
| セッションファイルがない | 0 | 警告を出力し、空のまま終了 |
| JSONパースエラー | 0 | その行をスキップして継続 |
| Git操作失敗 | 0 | 警告を出力して継続（エクスポート自体は成功扱い） |
| 設定ファイルのパースエラー | 1 | エラーメッセージを表示し終了 |

## CLIインターフェース詳細

### `ccexport export`

会話履歴をエクスポートする。引数なしで `ccexport` を実行した場合もこのコマンドが実行される。

```
Usage:
  ccexport export [flags]

Flags:
  -o, --output string    出力先ディレクトリ（設定ファイルより優先）
  -d, --date string      対象日付（YYYY-MM-DD形式、デフォルト: 今日）
  -p, --project string   対象プロジェクトのパス
      --all              全日付をエクスポート
      --dry-run          実行せずに出力内容を標準出力に表示
  -h, --help             ヘルプを表示
```

**使用例**:

```bash
# 設定ファイルに従って今日の会話をエクスポート
ccexport
ccexport export

# 特定の日付をエクスポート
ccexport export -d 2026-01-10

# 出力先を一時的に変更
ccexport export -o ~/Desktop

# 特定プロジェクトのみ
ccexport export -p /Users/amane/work/myproject

# 全日付をエクスポート
ccexport export --all

# dry-run（ファイルに書き込まず標準出力に表示）
ccexport export --dry-run
```

### `ccexport init`

設定ファイルを対話的に作成する。

```
Usage:
  ccexport init [flags]

Flags:
      --force   既存の設定ファイルを上書き
  -h, --help    ヘルプを表示
```

**使用例**:

```bash
$ ccexport init
出力先ディレクトリ: ~/obsidian/claude
ファイル名フォーマット [2006-01-02]:
Git自動コミット (y/N): n
プロジェクトモード (merge/separate) [merge]:

✅ 設定ファイルを作成しました: ~/.config/ccexport/config.toml

次のステップ:
  ccexport hook install   # Claude Codeフックを設定
```

### `ccexport hook`

Claude Codeのフックを設定・解除する。

```
Usage:
  ccexport hook [command]

Commands:
  install     フックをインストール
  uninstall   フックをアンインストール
  status      フックの状態を表示
```

### `ccexport config`

設定の表示・編集を行う。

```
Usage:
  ccexport config [command]

Commands:
  show        現在の設定を表示
  edit        エディタで設定ファイルを開く
  set         設定値を変更
  path        設定ファイルのパスを表示
```

**使用例**:

```bash
# 現在の設定を表示
$ ccexport config show
output_dir = "/Users/amane/obsidian/claude"
filename_format = "2006-01-02"
git_commit = false
project_mode = "merge"

# エディタで開く（$EDITORを使用）
$ ccexport config edit

# 個別の設定を変更
$ ccexport config set output_dir ~/Documents/claude-logs
✅ output_dir を更新しました

# 設定ファイルのパスを表示
$ ccexport config path
/Users/amane/.config/ccexport/config.toml
```

## 将来の拡張案（スコープ外）

- 要約の自動生成（LLM連携）
- トピックごとの自動分類
- Web UIでの閲覧
- 検索機能
- watchモード（ポーリング監視）
