# 設定リファレンス

## 設定ファイルの場所

```
~/.config/ccexport/config.toml
```

## 設定項目

### output_dir（必須）

出力先ディレクトリのパス。`~`はホームディレクトリに展開されます。

```toml
output_dir = "~/obsidian/claude"
```

### filename_format

ファイル名のフォーマット。Go の time.Format 形式で指定します。

```toml
filename_format = "2006-01-02"
```

**デフォルト**: `"2006-01-02"`

#### Go time.Format形式について

Goでは参照時刻 `Mon Jan 2 15:04:05 MST 2006` を使ってフォーマットを指定します:

| フォーマット | 出力例 |
|-------------|--------|
| `2006-01-02` | 2026-01-12 |
| `2006-01-02-Mon` | 2026-01-12-Sun |
| `2006_01_02` | 2026_01_12 |
| `20060102` | 20260112 |

### git_commit

エクスポート後に自動でgit commitを実行するかどうか。

```toml
git_commit = false
```

**デフォルト**: `false`

有効にすると、出力先ディレクトリがGitリポジトリの場合、変更を自動コミットします。

### project_mode

プロジェクトごとの出力方法を指定します。

```toml
project_mode = "merge"
```

**デフォルト**: `"merge"`

#### merge モード

全プロジェクトを1つのファイルにまとめます。

```
~/obsidian/claude/
├── 2026-01-10.md
├── 2026-01-11.md
└── 2026-01-12.md
```

#### separate モード

プロジェクトごとにサブディレクトリを作成します。

```
~/obsidian/claude/
├── projectA/
│   ├── 2026-01-10.md
│   └── 2026-01-12.md
└── projectB/
    └── 2026-01-11.md
```

## 設定例

### Obsidian向け（デフォルト推奨）

```toml
output_dir = "~/obsidian/claude"
filename_format = "2006-01-02"
git_commit = false
project_mode = "merge"
```

### プロジェクト別に整理したい場合

```toml
output_dir = "~/Documents/claude-logs"
filename_format = "2006-01-02"
git_commit = false
project_mode = "separate"
```

### Git管理したい場合

```toml
output_dir = "~/claude-history"
filename_format = "2006-01-02"
git_commit = true
project_mode = "merge"
```

## CLIでの設定変更

```bash
# 現在の設定を表示
ccexport config show

# 個別の設定を変更
ccexport config set output_dir ~/Documents/claude-logs
ccexport config set git_commit true
ccexport config set project_mode separate

# エディタで開く
ccexport config edit

# 設定ファイルのパスを表示
ccexport config path
```
