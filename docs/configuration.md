# Configuration Reference

## Configuration File Location

```
~/.config/ccexport/config.toml
```

## Configuration Options

### output_dir (Required)

Path to the output directory. `~` is expanded to home directory.

```toml
output_dir = "~/obsidian/claude"
```

### filename_format

Filename format. Specify in date-fns format.

```toml
filename_format = "yyyy-MM-dd"
```

**Default**: `"yyyy-MM-dd"`

#### date-fns Format

| Format | Output Example |
|--------|----------------|
| `yyyy-MM-dd` | 2026-01-12 |
| `yyyy-MM-dd-EEE` | 2026-01-12-Sun |
| `yyyy_MM_dd` | 2026_01_12 |
| `yyyyMMdd` | 20260112 |

### git_commit

Whether to automatically run git commit after export.

```toml
git_commit = false
```

**Default**: `false`

When enabled, if the output directory is a Git repository, changes are automatically committed.

### project_mode

Specifies how to output per project.

```toml
project_mode = "merge"
```

**Default**: `"merge"`

#### merge Mode

Combines all projects into a single file.

```
~/obsidian/claude/
├── 2026-01-10.md
├── 2026-01-11.md
└── 2026-01-12.md
```

#### separate Mode

Creates subdirectories for each project.

```
~/obsidian/claude/
├── projectA/
│   ├── 2026-01-10.md
│   └── 2026-01-12.md
└── projectB/
    └── 2026-01-11.md
```

## Configuration Examples

### For Obsidian (Recommended Default)

```toml
output_dir = "~/obsidian/claude"
filename_format = "yyyy-MM-dd"
git_commit = false
project_mode = "merge"
```

### Organize by Project

```toml
output_dir = "~/Documents/claude-logs"
filename_format = "yyyy-MM-dd"
git_commit = false
project_mode = "separate"
```

### Git Managed

```toml
output_dir = "~/claude-history"
filename_format = "yyyy-MM-dd"
git_commit = true
project_mode = "merge"
```

## Changing Configuration via CLI

```bash
# Show current configuration
ccexport config show

# Change individual settings
ccexport config set output_dir ~/Documents/claude-logs
ccexport config set git_commit true
ccexport config set project_mode separate

# Open in editor
ccexport config edit

# Show config file path
ccexport config path
```
