#!/bin/bash
# checkpoint-reminder-edits.sh
# Reminds to checkpoint after 15+ file edits

COUNTER_FILE="/tmp/claude-edit-counter-$$"
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')

# Initialize counter if not exists
if [ ! -f "$COUNTER_FILE" ]; then
  echo "0" > "$COUNTER_FILE"
fi

# Increment counter
EDIT_COUNT=$(cat "$COUNTER_FILE")
EDIT_COUNT=$((EDIT_COUNT + 1))
echo "$EDIT_COUNT" > "$COUNTER_FILE"

# Remind at 15 edits
if [ "$EDIT_COUNT" -eq 15 ]; then
  echo "" >&2
  echo "⏸️  CHECKPOINT REMINDER" >&2
  echo "" >&2
  echo "You've made 15+ file edits. Consider checkpointing:" >&2
  echo "  - Run '/checkpoint' for guided process" >&2
  echo "  - Or manually update spec file with current progress" >&2
  echo "" >&2
  # Reset counter
  echo "0" > "$COUNTER_FILE"
fi

exit 0
