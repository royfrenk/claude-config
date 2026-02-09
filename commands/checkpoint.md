---
description: Save current work state to spec file before context compaction or breaks.
---

# Checkpoint

Save the current work state to the active spec file. Use this:
- When the hook reminds you (after 15+ edits)
- Before taking a break from a task
- Before switching to a different type of work
- When context feels "full" (responses getting slower)

## Process

1. **Identify the active spec file**
   - Check recent context for which issue you're working on
   - Spec file is at `docs/technical-specs/{ISSUE_ID}.md`

2. **Update the spec file with checkpoint**

   Add to the spec file:
   ```markdown
   ## Checkpoint: [YYYY-MM-DD HH:MM]

   **Completed:**
   - [List what was accomplished]

   **Key changes:**
   - [file]: [what changed]

   **Current state:**
   - [Where things stand right now]

   **Next steps:**
   - [What should happen next]

   **Notes:**
   - [Any important context that shouldn't be lost]
   ```

3. **Update task progress**
   - Update 🟥→🟨→🟩 status for completed items
   - Update progress percentage

4. **Confirm checkpoint**
   ```
   Checkpoint saved to docs/technical-specs/{ISSUE_ID}.md

   Summary:
   - Completed: [X] items
   - In progress: [task name]
   - Next: [what's coming]

   Context can now be safely compacted.
   ```

## When NOT to Checkpoint

- In the middle of an incomplete thought/implementation
- If you haven't made meaningful progress since last checkpoint
- For trivial tasks that don't need state preservation

## Notes

- Checkpoints survive context compaction
- They serve as "save points" for long work sessions
- Reviewer and future sessions can understand where you left off
- Keep checkpoints concise — key facts only, not full file contents
