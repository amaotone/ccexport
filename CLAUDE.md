# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

ccexport is a TypeScript CLI tool that exports Claude Code conversation history to Markdown.

## Development Commands

```bash
# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm lint
```

## Project Structure

```
ccexport/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Library entry point
│   ├── config/             # Configuration file handling
│   ├── session/            # JSONL parser
│   ├── export/             # Export processing
│   └── hook/               # Claude Code hook management
├── docs/                   # Documentation
├── package.json
└── tsconfig.json
```

## Architecture Principles

- **Simplicity first**: Avoid over-abstraction, maintain readable code
- **Error handling**: Non-fatal errors emit warnings and continue
- **Testability**: Use dependency injection for mockable design

## Development Guidelines

### Test-Driven Development (TDD)

1. Write tests first (Red)
2. Write minimal code to pass tests (Green)
3. Refactoring (Refactor)

### Coding Standards

- Use TypeScript strict mode
- Use ESM (ES Modules)
- Return errors with appropriate types

### Version Control (jj)

This project uses jj (Jujutsu).

```bash
# Check status
jj status
jj log

# Commit changes
jj commit -m "feat: add new feature"

# View changes
jj diff
```

### Commit Messages

Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Add or modify tests
- `refactor:` Refactoring

## Key Dependencies

| Library | Purpose |
|---------|---------|
| `commander` | CLI framework |
| `toml` | TOML parser |
| `chalk` | Terminal coloring |
| `vitest` | Test framework |

## Important Specifications

### Session File Location

```
~/.claude/projects/{project-hash}/{session-id}.jsonl
```

### Filtering Targets

Messages containing the following are excluded from output:
- `<system-reminder>`
- `<local-command`
- `<command-name>`
- `<task-notification>`
- Responses starting with `No response requested`
- Sessions under subagents directory

### Error Handling Policy

| Situation | Exit Code | Behavior |
|-----------|-----------|----------|
| Config file not found | 1 | Exit with error |
| Output directory not found | 0 | Auto-create |
| JSON parse error | 0 | Skip and continue |
| Git operation failed | 0 | Warn and continue |

## Reference Documentation

- [Detailed Specification](docs/spec.md)
- [Configuration Reference](docs/configuration.md)
- [Hooks Integration](docs/hooks.md)
