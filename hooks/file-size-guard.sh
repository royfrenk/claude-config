#!/bin/bash
# File Size Guard - Enforces coding-style.md file size limits
# Warns at 400+ lines, errors at 800+ lines for source files

FILE="$CLAUDE_FILE_PATH"
if [ -z "$FILE" ]; then
  exit 0
fi

# Only check source files
if echo "$FILE" | grep -qE '\.(ts|tsx|js|jsx|py|swift)$'; then
  LINES=$(wc -l < "$FILE" 2>/dev/null)
  if [ "$LINES" -gt 800 ]; then
    echo "[BLOCKING] $FILE is $LINES lines (max 800). Refactor into smaller files per ~/.claude/rules/coding-style.md" >&2
  elif [ "$LINES" -gt 400 ]; then
    echo "[Warning] $FILE is $LINES lines (target <400). Consider splitting per ~/.claude/rules/coding-style.md" >&2
  fi
fi
