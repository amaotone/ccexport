# ccexport

A CLI tool that exports Claude Code conversation history to Markdown

## Quick Start

```bash
# Install
npm install -g ccexport

# Create configuration file
ccexport init

# Install Claude Code hook (for automatic export)
ccexport hook install

# Manual export
ccexport export
```

## Overview

ccexport automatically saves your conversations with Claude Code as Markdown files. It integrates with Claude Code's hooks feature to export automatically when sessions end.

## Configuration

Configuration file: `~/.config/ccexport/config.toml`

```toml
# Output directory (required)
output_dir = "~/obsidian/claude"

# Filename format (date-fns format)
filename_format = "yyyy-MM-dd"

# Project handling: "merge" or "separate"
project_mode = "merge"
```

## Commands

```
ccexport [command]

Commands:
  export      Export conversation history (default)
  init        Create configuration file interactively
  hook        Configure/remove Claude Code hooks
  config      View/edit configuration

Flags:
  -c, --config string   Configuration file path
  -v, --verbose         Output detailed logs
  -h, --help            Show help
      --version         Show version
```

### Usage Examples

```bash
# Export today's conversations
ccexport

# Export specific date
ccexport export -d 2025-01-10

# Export all dates
ccexport export --all
```

## Output Example

```markdown
## 10:30 projectA

User: How do I watch files in TypeScript?

Claude: You can use Node.js's `fs.watch` or the `chokidar` library...

---

## 14:15 projectB

User: Explain Rust lifetimes

Claude: Lifetimes specify how long references are valid...
```

## License

MIT
