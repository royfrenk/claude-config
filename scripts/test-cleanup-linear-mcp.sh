#!/usr/bin/env bash
# Surgical test for cleanup-linear-mcp.sh.
# Spawns 8 fake processes with sentinel argv. Confirms threshold-based
# cleanup trims them. Verifies real Linear MCP processes are untouched.
#
# Safe to run with real Linear MCP active — sentinel pattern is disjoint
# from real mcp-remote argv.
set -e

SENTINEL='mcp-remote-test-linear-FAKE'

# Safety: abort if sentinel already matches anything (would mean a previous
# test left zombies OR a real process accidentally uses this name).
if pgrep -f "$SENTINEL" > /dev/null 2>&1; then
  echo "FAIL: sentinel pattern '$SENTINEL' already matches running processes."
  echo "       Run 'pkill -f $SENTINEL' and re-run this test."
  exit 1
fi

# Baseline of REAL Linear MCP processes (must survive the test untouched).
REAL_BASELINE=$(pgrep -f 'mcp-remote.*linear' | grep -v "$SENTINEL" 2>/dev/null | wc -l | tr -d ' ' || echo 0)
echo "Real Linear MCP baseline: $REAL_BASELINE (these must survive the test)"

# Track spawned PIDs and ensure cleanup on ANY exit path.
PIDS=()
trap 'for pid in "${PIDS[@]}"; do kill -9 $pid 2>/dev/null || true; done' EXIT

# Spawn 8 fakes via exec -a so they show up in pgrep -f as $SENTINEL-N.
echo "Spawning 8 fake processes with sentinel '$SENTINEL'..."
for i in 1 2 3 4 5 6 7 8; do
  ( exec -a "${SENTINEL}-$i" sleep 300 ) &
  PIDS+=($!)
done
sleep 1

SPAWNED=$(pgrep -f "$SENTINEL" | wc -l | tr -d ' ')
echo "Spawned: $SPAWNED fake processes"

if [ "$SPAWNED" -lt 6 ]; then
  echo "FAIL: not enough fakes spawned ($SPAWNED < 6); cleanup wouldn't trip threshold"
  exit 1
fi

# Run the cleanup script with sentinel pattern ONLY.
# This is surgical — cannot kill real mcp-remote processes because their
# argv doesn't contain '-test-linear-FAKE'.
echo "Running cleanup-linear-mcp.sh 5 '$SENTINEL'..."
bash ~/.claude/scripts/cleanup-linear-mcp.sh 5 "$SENTINEL"
sleep 1

AFTER_FAKE=$(pgrep -f "$SENTINEL" | wc -l | tr -d ' ')
AFTER_REAL=$(pgrep -f 'mcp-remote.*linear' | grep -v "$SENTINEL" 2>/dev/null | wc -l | tr -d ' ' || echo 0)

echo "After cleanup — fakes: $AFTER_FAKE, real: $AFTER_REAL"

if [ "$AFTER_FAKE" -lt "$SPAWNED" ] && [ "$AFTER_REAL" -eq "$REAL_BASELINE" ]; then
  echo "PASS: cleanup reduced fakes $SPAWNED → $AFTER_FAKE; real processes untouched ($REAL_BASELINE preserved)"
  exit 0
fi

echo "FAIL: fakes $SPAWNED → $AFTER_FAKE (expected reduction); real $REAL_BASELINE → $AFTER_REAL (expected unchanged)"
exit 1
