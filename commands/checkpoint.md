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

## Sprint-Level Checkpoint

When working on a multi-wave sprint, also checkpoint the sprint file:

1. **Identify the active sprint file**
   - Check `docs/sprints/` for `*.active.md`

2. **Add wave progress to sprint file**
   ```markdown
   ## Check-in: Wave [X] Complete — [YYYY-MM-DD HH:MM]

   **Completed Waves:** [list]
   **Remaining Waves:** [list with task descriptions]
   **Execution Plan:** docs/technical-specs/{ISSUE_ID}.md — Execution Plan section

   **Resume Instructions:**
   1. Read this sprint file for latest checkpoint
   2. Read spec file execution plan for remaining waves
   3. Start next incomplete wave
   ```

3. **When to use sprint-level checkpoint:**
   - After each wave completes (MANDATORY)
   - Before stopping mid-sprint for any reason
   - When context feels full during a multi-wave sprint

## When NOT to Checkpoint

- In the middle of an incomplete thought/implementation
- If you haven't made meaningful progress since last checkpoint
- For trivial tasks that don't need state preservation

## Notes

- Checkpoints survive context compaction
- They serve as "save points" for long work sessions
- Reviewer and future sessions can understand where you left off
- Keep checkpoints concise — key facts only, not full file contents
