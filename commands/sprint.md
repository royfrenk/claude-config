---
description: Run the engineering sprint autonomously. Reads the roadmap and executes Priority 1 task without confirmation.
---

# Autonomous Sprint Execution

Run the engineering sprint autonomously. Reads Linear for Priority 1 task and executes without confirmation.

## Workflow

1. Read `CLAUDE.md` to get Linear team and issue prefix
2. Query Linear for Priority 1 issue in current sprint (`mcp__linear__list_issues`)
   - If Linear unavailable, use `docs/roadmap.md` as fallback
   - If work was done while Linear was down, flag for reconciliation at sprint end
3. Read `docs/PROJECT_STATE.md` for current codebase state
4. Read technical spec at `docs/technical-specs/{PREFIX}-##.md` if it exists
5. For each subtask:
   - Implement the code changes
   - Run tests to verify
   - Deploy to staging (push to `develop`)
   - Post update to Linear issue
6. Move to next subtask
7. Repeat until:
   - All Active Sprint items are done
   - A task is blocked
   - A security issue is found
   - Critical decision needed from the User

## Rules

- **Do not ask for confirmation** between tasks
- Push only to `develop` (staging) - never `main`
- Run tests before each commit
- Update spec file progress (🟥→🟨→🟩) as you complete tasks
- Post status updates to Linear issue as comments
- Update `docs/PROJECT_STATE.md` after completing a Priority item
- Stop and report if:
  - Tests fail and can't be fixed
  - External dependency is missing (secrets, credentials, etc.)
  - Spec is ambiguous and blocks work

## Task Assignment Format

For each subtask, work through:
```
1. Read spec and acceptance criteria from Linear/technical-spec
2. Identify files to create/modify
3. Implement changes
4. Run relevant tests
5. Commit with descriptive message
6. Push to develop
7. Post completion comment to Linear issue
8. Proceed to next subtask
```

## Output

After each completed subtask:
```
✓ [Subtask name] - Done
  Files: [list of files changed]
  Tests: [pass/fail count]
  Commit: [hash]
```

After completing a Priority item:
```
## Priority [N] Complete: [Item Name]

Subtasks completed: [X/Y]
Total commits: [N]
Deployed to: staging
Linear: [issue updated]

Next: Priority [N+1] - [Item Name]
```

---

**Start now. Query Linear for Priority 1 task and begin.**
