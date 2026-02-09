#!/bin/bash
# checkpoint-reminder-compact.sh
# Reminds to checkpoint before context compaction

echo "" >&2
echo "⏸️  CHECKPOINT REMINDER - Context Compaction Imminent" >&2
echo "" >&2
echo "Context window is filling (>83% full). About to compact." >&2
echo "" >&2
echo "📝 STRONGLY RECOMMENDED: Checkpoint NOW before compaction:" >&2
echo "  - Run '/checkpoint' to save current work state" >&2
echo "  - Update spec file with progress and next steps" >&2
echo "  - Checkpoints survive compaction; context does not" >&2
echo "" >&2

exit 0
