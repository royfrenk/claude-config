#!/usr/bin/env bash
# Threshold-based Linear MCP cleanup. Silent unless threshold tripped.
# Usage: cleanup-linear-mcp.sh [THRESHOLD] [PATTERN]
#   THRESHOLD: minimum alive count to trigger kill (default 5)
#   PATTERN:   pgrep -f pattern to match (default 'mcp-remote.*linear')
#
# Invoked async by PostToolUse hook after every mcp__linear__* call.
# Also invoked manually by /reset-linear (with default args) and by
# the test harness (with sentinel pattern).
#
# Platform guard: no-op on platforms without pgrep/pkill.
command -v pgrep >/dev/null 2>&1 || exit 0
command -v pkill >/dev/null 2>&1 || exit 0

THRESHOLD=${1:-5}
PATTERN=${2:-'mcp-remote.*linear'}

ALIVE=$(pgrep -f "$PATTERN" | wc -l | tr -d ' ')
if [ "$ALIVE" -gt "$THRESHOLD" ]; then
  pkill -f "$PATTERN" 2>/dev/null || true
  sleep 1
  AFTER=$(pgrep -f "$PATTERN" | wc -l | tr -d ' ')
  echo "Linear MCP cleanup: $ALIVE → $AFTER (threshold $THRESHOLD, pattern '$PATTERN')"
fi
