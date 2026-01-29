---
description: Sync roadmap.md with Linear. Run after making changes in Linear.
---

# Sync Roadmap

Synchronize `docs/roadmap.md` with Linear status changes.

## When to Run

- After making changes in Linear (manual)
- At sprint start (invoked by `/sprint`)
- At sprint end (invoked by `/sprint`)

## Workflow

1. Read `CLAUDE.md` to get Linear team and issue prefix
2. Query Linear for all issues in the team (`mcp__linear__list_issues`)
3. Read `docs/roadmap.md` to get current statuses
4. Compare each issue and apply reconciliation rules:

### Reconciliation Rules

| Status in Linear | Source of Truth | Action |
|------------------|-----------------|--------|
| Backlog | Linear | Update roadmap.md |
| Todo | Linear | Update roadmap.md |
| Canceled | Linear | Update roadmap.md (remove or mark canceled) |
| In Progress | roadmap.md | Flag discrepancy for user decision |
| In Review | roadmap.md | Flag discrepancy for user decision |
| Done | roadmap.md | Flag if not deployed to production |

### Why This Split?

- **Backlog/Todo/Canceled:** User manages these in Linear — agents respect user's decisions
- **In Progress/In Review/Done:** Agents manage these — roadmap.md tracks actual work state

## Output

Present findings before making changes:

```
## Roadmap Sync

### Synced from Linear (automatic)
- [Issue]: [old status] → [new status]

### Discrepancies (need decision)
- [Issue]: Linear shows [X], roadmap.md shows [Y]
  - Keep Linear? / Keep roadmap.md?

### Issues in Linear but not in roadmap.md
- [Issue]: [title] — Add to roadmap.md?

### Issues in roadmap.md but not in Linear
- [Issue]: [title] — Was this deleted? Remove from roadmap.md?
```

## After User Confirms

1. Apply approved changes to `docs/roadmap.md`
2. Update Sync Status table:
   ```
   | ✅ In sync | [date] | [what changed] |
   ```
3. If discrepancies were resolved by keeping roadmap.md status, update Linear to match

## Rules

- Always present changes before applying
- Never auto-sync In Progress/In Review/Done — these need confirmation
- Flag any "Done" issues that aren't actually deployed to production
- If Linear MCP fails, report the error and skip sync
