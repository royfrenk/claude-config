#!/bin/bash
# Naming Convention Guard - Enforces kebab-case for source files
# Warns when new files use PascalCase or camelCase

FILE="$CLAUDE_FILE_PATH"
if [ -z "$FILE" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE")

# Only check JS/TS source files
if echo "$BASENAME" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  # Skip test/spec/stories files
  if echo "$BASENAME" | grep -qE '\.(test|spec|stories)\.'; then
    exit 0
  fi
  # Check for uppercase letters (PascalCase or camelCase)
  if echo "$BASENAME" | grep -qE '[A-Z]'; then
    echo "[Warning] $BASENAME uses PascalCase/camelCase. Source files should be kebab-case per ~/.claude/rules/coding-style.md (e.g., episode-selector.tsx not EpisodeSelector.tsx)" >&2
  fi
fi
