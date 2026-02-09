# Claude Code Hooks

This directory contains hooks that run at specific points in the Claude Code workflow.

## Installed Hooks

### `checkpoint-reminder-edits.sh`

**Trigger:** `PostToolUse` with `Edit|Write` matcher - Runs after every file edit or write

**Purpose:** Reminds agents to checkpoint after 15+ file edits

**What it does:**
1. Tracks edit count in session-specific temp file (`/tmp/claude-edit-counter-$$`)
2. Increments counter on every Edit or Write tool call
3. At 15 edits, displays checkpoint reminder to stderr
4. Resets counter after reminder

**Output Example:**
```
⏸️  CHECKPOINT REMINDER

You've made 15+ file edits. Consider checkpointing:
  - Run '/checkpoint' for guided process
  - Or manually update spec file with current progress
```

### `checkpoint-reminder-compact.sh`

**Trigger:** `PreCompact` - Runs before context compaction

**Purpose:** Reminds agents to checkpoint before context window compaction

**What it does:**
1. Fires when context usage reaches ~83% (auto-compaction threshold)
2. Displays urgent checkpoint reminder to stderr
3. Urges immediate action before compaction occurs

**Output Example:**
```
⏸️  CHECKPOINT REMINDER - Context Compaction Imminent

Context window is filling (>83% full). About to compact.

📝 STRONGLY RECOMMENDED: Checkpoint NOW before compaction:
  - Run '/checkpoint' to save current work state
  - Update spec file with progress and next steps
  - Checkpoints survive compaction; context does not
```

## Hook Configuration

Hooks are registered in `settings.json` (or `~/.claude/settings.json`):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/royfrenkiel/.claude/hooks/checkpoint-reminder-edits.sh"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/Users/royfrenkiel/.claude/hooks/checkpoint-reminder-compact.sh"
          }
        ]
      }
    ]
  }
}
```

## Installation

1. **Copy hook scripts to global hooks directory:**
   ```bash
   mkdir -p ~/.claude/hooks
   cp checkpoint-reminder-*.sh ~/.claude/hooks/
   chmod +x ~/.claude/hooks/checkpoint-reminder-*.sh
   ```

2. **Update `~/.claude/settings.json`** with hook configuration (see above)

3. **Test hooks:**
   ```bash
   # Test edit counter (should be silent on first few runs, remind at 15)
   echo '{"tool_name":"Edit","tool_input":{"file_path":"test.txt"}}' | ~/.claude/hooks/checkpoint-reminder-edits.sh

   # Test pre-compaction (should show reminder immediately)
   ~/.claude/hooks/checkpoint-reminder-compact.sh
   ```

## Available Hook Triggers

See [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks) for full list:

- `SessionStart` - Beginning of Claude Code session
- `PreToolUse` - Before any tool executes
- `PostToolUse` - After tool execution
- `PreCompact` - Before context compaction
- `Stop` - When Claude finishes responding
- `SessionEnd` - End of session
- And more...

## Debugging Hooks

If a hook isn't running:

1. **Check file permissions:**
   ```bash
   ls -la ~/.claude/hooks/
   # Should show -rwxr-xr-x (executable)
   ```

2. **Verify settings.json syntax:**
   ```bash
   cat ~/.claude/settings.json | jq . > /dev/null
   # Should output "Valid JSON" or parse successfully
   ```

3. **Test script directly:**
   ```bash
   echo '{"tool_name":"Edit"}' | ~/.claude/hooks/checkpoint-reminder-edits.sh 2>&1
   ```

4. **Enable verbose mode:** Toggle with `Ctrl+O` in Claude Code to see hook output

## See Also

- [rules/performance.md](../rules/performance.md) - Context efficiency and checkpointing guidelines
- [agents/developer.md](../agents/developer.md) - Developer agent checkpointing workflow
- [commands/checkpoint.md](../commands/checkpoint.md) - /checkpoint command documentation
