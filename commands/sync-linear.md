---
description: Manually reconcile Linear with local state when syncs failed during sprint
---

# Sync Linear

Manually sync Linear issues with local state. Use this when Linear MCP calls failed during `/sprint` or `/iterate`.

> **Purpose:** Recover from Linear sync failures without blocking sprint progress.

## When to Use

- After sprint completes and "Pending Manual Sync" section shows failed syncs
- When Linear was down during sprint and needs reconciliation
- Before closing sprint file (rename to .done.md)
- On demand: when you notice Linear status doesn't match staging/production

## Workflow

1. **Find active sprint file:**
   ```bash
   find docs/sprints/ -name "*.active.md" 2>/dev/null
   ```

2. **Read sprint file and extract pending syncs:**
   - Look for "Pending Manual Sync" sections in check-ins
   - Look for "Linear sync: failed" notes
   - Build list of issues that need status updates

3. **Read current deployment state:**
   - Check `docs/PROJECT_STATE.md` for what's deployed
   - Check `docs/roadmap.md` for status
   - For each issue, determine correct Linear status:
     - **In staging only:** "In Review"
     - **In production:** "Done"
     - **Neither:** Depends on spec file status

4. **Perform sync with soft retry:**
   ```
   For each issue needing sync:

   Issue: [ISSUE-ID]
   Current Linear status: [query via mcp__linear__get_issue]
   Expected status: [from step 3]

   If statuses differ:
     Attempt 1: mcp_linear_update_issue(issueId, status: "<UUID>")
     If fails: Wait 2s
     Attempt 2: mcp_linear_update_issue(issueId, status: "<UUID>")
     If still fails: Report to user
   ```

5. **Update sprint file:**
   - Remove issues from "Pending Manual Sync" that synced successfully
   - Add "Linear Sync Complete" check-in:
     ```markdown
     ## Check-in: Linear Sync Complete — [YYYY-MM-DD HH:MM]

     **Synced Issues:** [X] successful
     **Failed Issues:** [Y] failed (requires manual intervention)

     **Successful:**
     - [ISSUE-ID]: Updated to [status]

     **Failed (still pending):**
     - [ISSUE-ID]: [error message] - please update manually in Linear UI
     ```

6. **Report to user:**
   ```
   ## Linear Sync Complete

   **Successfully Synced:** [X] issues
   **Failed:** [Y] issues (see details below)

   | Issue | Status | Result |
   |-------|--------|--------|
   | [ISSUE-ID] | In Review | ✅ Synced |
   | [ISSUE-ID] | Done | ❌ Failed - [error] |

   **Next Steps:**
   - For failed syncs: Update manually in Linear UI
   - Sprint file updated with results
   - Ready to close sprint (rename .active.md → .done.md)
   ```

## Error Handling

**If Linear is still unavailable:**
```
⚠️ Linear is still unavailable (all sync attempts failed).

Options:
1. Wait and try `/sync-linear` again later
2. Update issues manually in Linear UI
3. Proceed without syncing (sprint file is source of truth)

Recommendation: Update manually in Linear UI using sprint file as reference.
```

**If some issues sync, some fail:**
- Update sprint file with partial results
- Report which issues need manual intervention
- Don't block sprint closure on Linear sync

## Rules

- **Non-blocking:** Failed syncs don't prevent sprint completion
- **Soft retry:** 2 attempts per issue (with 2s delay)
- **Track results:** Update sprint file with sync outcomes
- **Manual fallback:** User can always update Linear UI directly

## Command Shorthand

```bash
/sync-linear          # Sync all pending issues from active sprint
```

---

**Start by finding and reading the active sprint file.**
