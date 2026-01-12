# ccexport

A CLI tool that exports Claude Code conversation history to Markdown

## Overview

ccexport automatically saves your conversations with Claude Code as Markdown files. It integrates with Claude Code's hooks feature to export automatically when sessions end.

## Installation

### npm (Recommended)

```bash
npm install -g ccexport
```

### Build from Source

```bash
git clone https://github.com/amaotone/ccexport.git
cd ccexport
pnpm install
pnpm build
npm link
```

## Quick Start

```bash
# 1. Create configuration file
ccexport init

# 2. Install Claude Code hook (for automatic export)
ccexport hook install

# 3. Manual export
ccexport export
```

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

See [Configuration Reference](docs/configuration.md) for details.

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

**User:** How do I watch files in TypeScript?

**Claude:** You can use Node.js's `fs.watch` or the `chokidar` library...

---

## 14:15 projectB

**User:** Explain Rust lifetimes

**Claude:** Lifetimes specify how long references are valid...
```

## Documentation

- [Configuration Reference](docs/configuration.md)
- [Claude Code Hooks Integration](docs/hooks.md)
- [Detailed Specification](docs/spec.md)

## References

- [Original Article: Building a system to automatically record Claude Code conversations to Obsidian](https://zenn.dev/pepabo/articles/ffb79b5279f6ee)
- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)

## License

MIT
