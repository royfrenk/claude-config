# Load Project Context

Load the project context for: $ARGUMENTS

## Instructions

1. Look in `~/documents/repos/$ARGUMENTS/` for a `CLAUDE.md` file
2. Read and internalize the contents of CLAUDE.md (how to operate)
3. Read `docs/PROJECT_STATE.md` for current codebase architecture
4. **Check for missing folders and create them if needed:**
   - `docs/technical-specs/` — for spec files
   - `docs/sprints/` — for sprint iteration tracking
   - If a folder is missing, create it with a `.gitkeep` file
5. **Check for active sprint (use Bash find, not Glob):**
   - Use Bash to find active sprint files: `find docs/sprints/ -name "*.active.md" -type f 2>/dev/null`
   - If directory doesn't exist, create it: `mkdir -p docs/sprints && touch docs/sprints/.gitkeep`
   - If found, read and summarize:
     - What issues are in progress
     - What's pending (e.g., "awaiting device testing")
     - Resume instructions from the file
   - If multiple active sprints exist, list them all
   - If no active sprints but spec files show "In Progress", warn: "Orphaned spec files detected - no sprint file exists"
6. Summarize the key context points for the user
7. Use this context to inform all subsequent interactions about this project

If the project or CLAUDE.md file is not found, inform the user and list available projects in `~/documents/repos/`.

## Troubleshooting

### If no active sprint detected but work is in progress

1. **Manually check for sprint files:**
   ```bash
   ls -la docs/sprints/*.active.md
   ```

2. **If sprint file exists but wasn't detected:**
   - Report bug: Glob search failed
   - Use Bash find as fallback: `find docs/sprints/ -name "*.active.md"`

3. **If sprint file missing:**
   - Check `docs/technical-specs/` for "In Progress" spec files
   - If found, ask user: "Should I create a sprint file for these issues?"
   - Create sprint file with template from `/sprint` command

### If sprint file exists but shows stale status

- Read spec files for latest checkpoints
- Sprint file is updated by `/sprint` and `/iterate` commands
- If out of sync, use spec files as source of truth
