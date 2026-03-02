---
description: Kill stuck Linear MCP processes and reset connections. Use when Linear calls hang or time out repeatedly.
---

# Reset Linear

Kill all Linear MCP processes so the connection resets on next use.

## When to Use

- Linear MCP calls are hanging or timing out repeatedly
- After restarting a session that was stuck on a Linear call
- Preemptive cleanup when Linear is acting slow
- Stale processes accumulating from previous sessions

## Process

1. **Find and kill all Linear MCP processes:**

   ```bash
   # Count processes before kill
   BEFORE=$(pgrep -f 'mcp-remote.*linear' | wc -l | tr -d ' ')

   # Kill all mcp-remote processes connected to linear.app
   # This catches both: npm exec mcp-remote https://mcp.linear.app/sse
   # and: node .../mcp-remote/dist/index.js https://mcp.linear.app/sse
   pkill -f 'mcp-remote.*linear' 2>/dev/null

   # Wait for processes to terminate
   sleep 2

   # Verify they are dead
   AFTER=$(pgrep -f 'mcp-remote.*linear' | wc -l | tr -d ' ')

   # Force kill any survivors
   if [ "$AFTER" -gt 0 ]; then
     pkill -9 -f 'mcp-remote.*linear' 2>/dev/null
     sleep 1
     AFTER=$(pgrep -f 'mcp-remote.*linear' | wc -l | tr -d ' ')
   fi
   ```

2. **Report results:**

   ```
   Linear MCP Reset Complete

   Processes killed: [BEFORE count]
   Remaining: [AFTER count — should be 0]
   Status: Linear MCP will auto-reconnect on next mcp__linear__* call

   Next: Try your Linear operation again.
   ```

3. **Verify reconnection works** by running a simple Linear call:

   ```
   mcp__linear__list_teams (limit: 1)
   ```

   If this succeeds, Linear MCP is healthy. If it fails, the issue is upstream (Linear API down, auth expired, network).

## Limitation

This command runs inside a Claude Code session. If your **current session is blocked** waiting on a stuck Linear MCP call, you cannot invoke `/reset-linear` in that same session.

**Workaround:** Open a second terminal and run manually:
```bash
pkill -f 'mcp-remote.*linear'
```

Then return to the stuck session — it should error out and become responsive again.

## Rules

- Always verify processes are dead after killing (check count)
- Use `pkill -9` only as fallback if graceful kill fails
- Do not kill non-Linear MCP processes (v0, etc.)
- After reset, test with a simple Linear call before resuming workflow
