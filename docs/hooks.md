# Claude Code Hooks Integration

## Overview

ccexport integrates with Claude Code's hooks feature to automatically execute exports when sessions end.

## How Hooks Work

Claude Code configures hooks in `~/.claude/settings.json`.

Reference: https://docs.anthropic.com/en/docs/claude-code/hooks

## Hook Used

Uses **SessionEnd** hook (session termination) as trigger:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/ccexport export"
          }
        ]
      }
    ]
  }
}
```

**Note:** SessionEnd fires on clean termination (`/exit`, Ctrl+D). It does not fire on forced termination (Ctrl+C). Sessions terminated with Ctrl+C will be exported on the next manual run or next SessionEnd.

## Hook Management

### Install

```bash
$ ccexport hook install
✅ Claude Code hook configured

The following was added to ~/.claude/settings.json:
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/ccexport export"
          }
        ]
      }
    ]
  }
}
```

### Check Status

```bash
$ ccexport hook status
✅ Hook is installed
   Trigger: SessionEnd
   Command: /usr/local/bin/ccexport export
```

### Uninstall

```bash
$ ccexport hook uninstall
✅ Hook removed
```

## Environment Variables During Hook Execution

The following environment variables are set when Claude Code calls the hook:

| Environment Variable | Description |
|---------------------|-------------|
| `CLAUDE_WORKING_DIRECTORY` | Project path |

## Manual Execution

You can also export manually without configuring hooks:

```bash
# Export today's conversations
ccexport export

# Export specific date
ccexport export -d 2026-01-10

# Export all dates
ccexport export --all
```

## Troubleshooting

### Hook Not Working

1. Check ccexport path:
   ```bash
   which ccexport
   ```

2. Check settings.json contents:
   ```bash
   cat ~/.claude/settings.json
   ```

3. Run command manually to check for errors:
   ```bash
   ccexport export -v
   ```

### Conflicts with Existing Hooks

If other hooks are already configured, `ccexport hook install` preserves existing settings while adding the ccexport hook.
