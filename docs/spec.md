# Detailed Specification

## Session File Specification

### Storage Location

```
~/.claude/projects/{project-hash}/{session-id}.jsonl
```

- `project-hash`: Escaped project path (e.g., `-path-to-work-myapp`)
- `session-id`: UUID-based session identifier

### JSONL Format

Each line is a single JSON object:

```jsonl
{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"Question content"}}
{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"Answer content"}]}}
```

## Output Format

### Markdown File Structure

```markdown
# 2026-01-12 Claude Conversation Log

## 10:30 projectA

**User**: How do I watch files in TypeScript?

**Claude**: You can use Node.js's `fs.watch` or the `chokidar` library...

---

## 14:15 projectB

**User**: Explain Rust lifetimes

**Claude**: Lifetimes specify how long references are valid...
```

### Filtering (Exclusions)

The following messages are excluded from output:

- Messages containing `<system-reminder>`
- Messages containing `<local-command`
- Messages containing `<command-name>`
- Messages containing `<task-notification>`
- Claude responses starting with `No response requested`
- Sessions under subagents directory

## Error Handling

| Situation | Exit Code | Behavior |
|-----------|-----------|----------|
| Config file not found | 1 | Display error message and exit |
| Output directory not found | 0 | Auto-create |
| Session file not found | 0 | Output warning and exit normally |
| JSON parse error | 0 | Skip that line and continue |
| Git operation failed | 0 | Output warning and continue (export itself succeeds) |
| Config file parse error | 1 | Display error message and exit |

## CLI Interface Details

### `ccexport export`

Export conversation history. Running `ccexport` without arguments also executes this command.

```
Usage:
  ccexport export [flags]

Flags:
  -o, --output string    Output directory (overrides config file)
  -d, --date string      Target date (YYYY-MM-DD format, default: today)
  -p, --project string   Target project path
      --all              Export all dates
      --dry-run          Display output content without writing to files
  -h, --help             Show help
```

**Usage Examples**:

```bash
# Export today's conversations according to config file
ccexport
ccexport export

# Export specific date
ccexport export -d 2026-01-10

# Temporarily change output directory
ccexport export -o ~/Desktop

# Specific project only
ccexport export -p ~/work/myproject

# Export all dates
ccexport export --all

# Dry-run (display to stdout without writing files)
ccexport export --dry-run
```

### `ccexport init`

Create configuration file interactively.

```
Usage:
  ccexport init [flags]

Flags:
      --force   Overwrite existing config file
  -h, --help    Show help
```

**Usage Examples**:

```bash
$ ccexport init
Output directory: ~/obsidian/claude
Filename format [yyyy-MM-dd]:
Git auto-commit (y/N): n
Project mode (merge/separate) [merge]:

✅ Created config file: ~/.config/ccexport/config.toml

Next steps:
  ccexport hook install   # Configure Claude Code hook
```

### `ccexport hook`

Configure/remove Claude Code hooks.

```
Usage:
  ccexport hook [command]

Commands:
  install     Install hook
  uninstall   Uninstall hook
  status      Show hook status
```

### `ccexport config`

View/edit configuration.

```
Usage:
  ccexport config [command]

Commands:
  show        Show current configuration
  edit        Open config file in editor
  set         Change configuration value
  path        Show config file path
```

**Usage Examples**:

```bash
# Show current configuration
$ ccexport config show
output_dir = "~/obsidian/claude"
filename_format = "yyyy-MM-dd"
git_commit = false
project_mode = "merge"

# Open in editor (uses $EDITOR)
$ ccexport config edit

# Change individual settings
$ ccexport config set output_dir ~/Documents/claude-logs
✅ Updated output_dir

# Show config file path
$ ccexport config path
~/.config/ccexport/config.toml
```

## Future Extension Ideas (Out of Scope)

- Automatic summary generation (LLM integration)
- Automatic topic classification
- Web UI for browsing
- Search functionality
- Watch mode (polling)
