---
description: Bidirectional sync between Linear and roadmap.md. Run after manual Linear changes or after sprint with failed syncs.
---

# Sync Roadmap

Synchronize `docs/roadmap.md` with Linear in BOTH directions.

**This command handles:**
1. **Pull changes FROM Linear** (Backlog/Todo/Canceled) → roadmap.md
2. **Push changes TO Linear** (In Progress/In Review/Done) → Linear
3. **Reconcile conflicts** when both have changes

## Prerequisites

**This command requires Linear integration to be enabled.**

Before running:
1. Read `CLAUDE.md`
2. Check `linear_enabled` field
3. If `false`: Report "Linear integration not enabled for this project" and EXIT
4. If `true`: Proceed with bidirectional sync

**For projects without Linear:** Use roadmap.md as single source of truth, no sync needed.

## When to Run

- After making changes in Linear UI manually
- After sprint completes with "Pending Manual Sync" entries
- At sprint start (invoked by `/sprint`)
- At sprint end (invoked by `/sprint`)
- When Linear was down during sprint
- On demand: when you notice Linear ↔ roadmap.md are out of sync

## Workflow

### Step 1: Read Configuration

1. Read `CLAUDE.md` to validate Linear configuration:
   - Check `linear_enabled: true/false`
   - If `false`: EXIT with message "Linear not enabled for this project"
   - If `true`: Extract team ID and issue prefix, proceed with sync

### Step 2: Pull from Linear (Linear → roadmap.md)

Query Linear for all issues in the team (`mcp__linear__list_issues` with team filter).

**Apply reconciliation rules:**

| Status in Linear | Source of Truth | Action |
|------------------|-----------------|--------|
| Backlog | Linear | Update roadmap.md to match Linear |
| Todo | Linear | Update roadmap.md to match Linear |
| Canceled | Linear | Update roadmap.md (remove or mark canceled) |
| In Progress | roadmap.md | Flag discrepancy (handled in Step 3) |
| In Review | roadmap.md | Flag discrepancy (handled in Step 3) |
| Done | roadmap.md | Flag if not deployed to production |

**Track issues:**
- Issues in Linear but not in roadmap.md → Add to roadmap.md
- Issues in roadmap.md but not in Linear → Flag for user decision

### Step 3: Push to Linear (roadmap.md → Linear)

**Check for pending syncs:**
1. If active sprint file exists, read "Pending Manual Sync" sections
2. Check `docs/roadmap.md` for In Progress/In Review/Done statuses
3. Check `docs/PROJECT_STATE.md` for deployment state

**Determine correct Linear status for each issue:**
- **In staging only:** Should be "In Review"
- **In production:** Should be "Done"
- **Work in progress:** Should be "In Progress"

**Push updates to Linear:**
```
For each issue needing sync:

Issue: [ISSUE-ID]
Current Linear status: [query via mcp__linear__get_issue]
Expected status: [from roadmap.md/deployment state]

If statuses differ:
  Attempt 1: mcp_linear_update_issue(issueId, status: "<UUID>")
  If fails: Wait 2s
  Attempt 2: mcp_linear_update_issue(issueId, status: "<UUID>")
  If still fails: Report to user
```

### Step 4: Handle Conflicts

**Conflict scenarios:**

| Linear Status | roadmap.md Status | Resolution |
|---------------|-------------------|------------|
| Backlog | In Progress | Linear wins (user changed priority) → Update roadmap.md |
| Todo | In Review | roadmap.md wins (agent work state) → Update Linear |
| In Progress | Done | Check deployment state → If deployed: roadmap.md wins, else: flag for decision |
| Done | In Review | Flag for user: "Linear shows Done but not in production?" |

**Present conflicts to user:**
```
## Sync Conflicts Detected

| Issue | Linear | roadmap.md | Recommendation |
|-------|--------|------------|----------------|
| QUO-42 | Backlog | In Progress | Keep Linear (user demoted) |
| QUO-43 | Done | In Review | Keep roadmap.md (not deployed yet) |

Apply recommendations? (yes/no/review each)
```

## Output Format

Present all changes before applying:

```
## Roadmap Sync — Bidirectional

### Phase 1: Pull from Linear (Linear → roadmap.md)

**Synced from Linear (automatic):**
- QUO-42: Backlog → Todo (user changed in Linear)
- QUO-45: New issue in Linear → Adding to roadmap.md

**New issues to add:**
- QUO-46: [Title] — Add to roadmap.md Backlog?

**Missing in Linear:**
- QUO-41: [Title] in roadmap.md but not in Linear — Was this deleted?

### Phase 2: Push to Linear (roadmap.md → Linear)

**Pushing agent status updates:**
- QUO-40: In Review (staged) → Updating Linear
- QUO-39: Done (deployed) → Updating Linear

**Pending manual syncs resolved:**
- 2 issues from sprint-003 "Pending Manual Sync" updated

### Phase 3: Conflicts (need decision)

- QUO-43: Linear shows "Done", roadmap.md shows "In Review"
  - Not deployed to production yet
  - **Recommendation:** Keep roadmap.md, update Linear to "In Review"
  - Approve? (yes/no)

---

**Apply all changes?** (yes/no/review)
```

## After User Confirms

1. Apply approved changes to `docs/roadmap.md`
2. Push approved changes to Linear (with soft retry)
3. Update sprint file (if exists): Clear "Pending Manual Sync" entries
4. Update Sync Status in roadmap.md:
   ```
   | ✅ In sync | [date] | Pulled [X] from Linear, Pushed [Y] to Linear |
   ```

## Error Handling

**If Linear is unavailable:**
```
⚠️ Linear is unavailable (all sync attempts failed).

Completed:
- ✅ Phase 1: Pull from Linear — SKIPPED (Linear down)
- ✅ Phase 2: Push to Linear — FAILED [X] issues
- ✅ Phase 3: Conflicts — N/A

Options:
1. Wait and try `/sync-roadmap` again later
2. Update issues manually in Linear UI
3. Proceed without syncing (roadmap.md is source of truth)

Recommendation: Update manually in Linear UI using roadmap.md as reference.
```

**Partial sync success:**
- Report which operations succeeded/failed
- Update roadmap.md with successful pulls
- Track failed pushes in sprint file "Pending Manual Sync"
- Don't block workflow on failures

## Rules

- **Bidirectional:** Handles both Linear → roadmap.md AND roadmap.md → Linear
- **Non-blocking:** Failed syncs don't prevent workflow continuation
- **Soft retry:** 2 attempts per push operation (with 2s delay)
- **User confirmation:** Always present changes before applying
- **Source of truth split:**
  - Linear: Backlog, Todo, Canceled (user-managed)
  - roadmap.md: In Progress, In Review, Done (agent-managed)
- **Deployment check:** Flag "Done" issues that aren't actually in production
- **Roadmap structure:** Respect "Active Sprint", "Recently Completed Sprints", and "Backlog" sections

## Command Shorthand

```bash
/sync-roadmap          # Bidirectional sync: Linear ↔ roadmap.md
```

---

**Start by reading CLAUDE.md to check linear_enabled, then proceed with bidirectional sync.**
