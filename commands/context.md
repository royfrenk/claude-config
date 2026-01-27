# Load Project Context

Load the project context for: $ARGUMENTS

## Instructions

1. Look in `~/documents/repos/$ARGUMENTS/` for a `CLAUDE.md` file
2. Read and internalize the contents of CLAUDE.md (how to operate)
3. Read `docs/PROJECT_STATE.md` for current codebase state
4. **Check for missing folders and create them if needed:**
   - `docs/technical-specs/` — for spec files
   - `docs/sprints/` — for sprint iteration tracking
   - If a folder is missing, create it with a `.gitkeep` file
5. Summarize the key context points for the user
6. Use this context to inform all subsequent interactions about this project

If the project or CLAUDE.md file is not found, inform the user and list available projects in `~/documents/repos/`.
