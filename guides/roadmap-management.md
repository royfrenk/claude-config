# Roadmap Management Guide

How EM manages roadmap.md, syncs with Linear, and handles reconciliation.

---

## Roadmap.md Sync Rules

- **roadmap.md:** Mirror/ledger maintained by you (EM)
- **Sync timing:**
  1. Immediately after creating an issue
  2. After agent-initiated status changes
  3. At sprint start: invoke `/sync-roadmap`
  4. At sprint end: invoke `/sync-roadmap`
  5. On-demand: User runs `/sync-roadmap` after making Linear changes
- **Contains:** Active Sprint, Recently Completed (~15-20 most recent with brief outcomes and sprint links), Backlog (prioritized: High/Medium/Low)

## Roadmap Structure

- Shows brief Context (1-2 lines) for quick scanning
- Full details always in spec file (click spec link)
- When presenting issues to User, include Context from roadmap for quick understanding
- Recently Completed includes brief Outcome (1-2 lines summarizing achievement)

## Status Ownership

- **Backlog, Todo:** User can change in Linear -> respect and replicate to roadmap.md
- **In Progress, In Review, Done:** Agent-controlled. roadmap.md is source of truth.
- **Done = Deployed to production.** Never mark Done until code is live on main branch.

## EM Permissions

- Can change priority order
- Can break items into subtasks
- Can move items between sections
- Can add items to "Suggested"
- CANNOT add items to "Backlog" (User approves suggestions first)
- CANNOT remove items (only User)

## Task Sizing

- Small: Isolated change, <4 hours, touches 1-3 files
- Large: Cross-cutting, >4 hours, or requires design decisions

Assign multiple small tasks to Dev simultaneously. One large task at a time.

## Labels (when creating issues)

- **"agent"** -- Add to ALL issues created by agents (not humans)
- **"technical"** -- Add IN ADDITION for backend/infrastructure/tech-debt issues that agent inferred or initiated

---

## Linear Integration

**Before any Linear operation:**
1. Read `CLAUDE.md` -> extract `linear_enabled` and `Team ID`
2. If `linear_enabled: false` -> skip Linear, use roadmap.md only
3. If `linear_enabled: true`: Pass `team: "<Team ID>"` to all Linear MCP calls

**Use MCP tools only:** `mcp__linear__*` (not CLI commands like `linear-cli`)

**Pattern for all Linear operations:**
```markdown
1. Read CLAUDE.md -> extract linear_enabled and Team ID
2. If linear_enabled: false -> skip Linear, use roadmap.md only
3. If linear_enabled: true:
   - Pass team: "<Team ID>" to all Linear MCP calls
   - Handle failures with soft retry logic
   - Fall back to roadmap.md if Linear unavailable
```

**Why this matters:**
- Prevents cross-project Linear pollution
- Supports projects that don't use Linear (roadmap.md-only workflow)
- Explicit configuration over assumptions

---

## Linear Sync Strategy (if enabled)

Use `/sync-roadmap` for bidirectional sync at 3 touchpoints:
1. **Sprint start:** Pull latest from Linear, push any pending updates
2. **Staging deploy:** Push "In Review" status (soft retry)
3. **Production deploy:** Push "Done" status (soft retry)

All syncs are non-blocking. Failed syncs tracked in sprint file "Pending Manual Sync".

**Soft retry logic:**
- Attempt 1: Try Linear MCP call
- If fails: Wait 2 seconds
- Attempt 2: Try again
- If still fails: Log warning, track in sprint file "Pending Manual Sync", continue sprint

**If Linear is unavailable:**
- roadmap.md becomes source of truth
- Continue updating roadmap.md as work progresses
- Track failed syncs in sprint file
- Run `/sync-roadmap` at sprint end for manual reconciliation

---

## Reconciliation (at sprint start or when Linear restored)

1. Compare roadmap.md against Linear
2. For **Backlog, Todo**: If user changed in Linear, respect it -> update roadmap.md
3. For **In Progress, In Review, Done**: roadmap.md is source of truth
   - Flag issues where Linear status differs from roadmap.md
   - Flag issues marked "Done" in Linear that aren't deployed to production
4. Present reconciliation plan to User:
   ```
   ## Reconciliation Plan

   ### User Changes (will replicate to roadmap.md)
   - [Issue ID]: Linear [status] -- updating roadmap.md

   ### Status Discrepancies (default: revert to roadmap.md)
   - [Issue ID]: Linear shows [status], roadmap.md shows [status]
   - Revert? (yes/no)

   ### Not Actually Done (marked Done but not deployed)
   - [Issue ID]: Marked Done in Linear but not deployed -- revert to In Review?
   ```
5. Wait for User approval before reverting
6. Update Linear and/or roadmap.md based on approval
