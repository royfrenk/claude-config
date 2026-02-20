---
description: Run the engineering sprint autonomously. Reads the roadmap and executes Priority 1 task with spec-first workflow.
---

# Autonomous Sprint Execution

Run the engineering sprint autonomously. Reads Linear for Priority 1 task and executes with proper spec creation and plan approval.

> **Tip:** Clear context before starting a new sprint to maximize available context and avoid mid-sprint compaction.
>
> **Shorthand:** If user writes "CC" (not referencing something else), it means "clear context".

## Linear Configuration

This command checks `CLAUDE.md` for Linear integration settings:

- `linear_enabled: true` → Use Linear for issue tracking, sync bidirectionally with roadmap.md
- `linear_enabled: false` → Use roadmap.md only, skip all Linear MCP calls
- Missing field → Default to `false` (roadmap.md only)

**If Linear is disabled:**
- Skip all Linear sync attempts
- Use roadmap.md as single source of truth
- No Linear MCP calls, no retry logic
- Sprint operates entirely on roadmap.md

**If Linear is enabled:**
- Use `linear-sync` agent for all Linear operations
- Graceful failure handling with 30s timeouts
- Use Team ID from CLAUDE.md for all MCP calls

## Workflow

### 1. Read CLAUDE.md

Get configuration:
- `linear_enabled: true/false` (default: false)
- Linear team ID and issue prefix (if enabled)
- If `linear_enabled: false`: Skip Linear sync, use roadmap.md only

### 2. Sync with Linear (if enabled)

**If `linear_enabled: true`:**
- Run `/sync-roadmap` to reconcile any Linear changes before starting work
- If sync fails: Log warning, continue with roadmap.md as fallback

**If `linear_enabled: false`:**
- Skip sync, proceed directly to issue selection

### 2b. Handle Issue Selection

#### If user provided issue IDs in command

Example: `/sprint QUO-57 QUO-58`
- Parse issue IDs from arguments
- Skip to step 2a (sprint file check) with these specific issues

#### If no issue IDs provided

User typed just `/sprint`:

**If `linear_enabled: true`:**
- Spawn `linear-sync` agent: "Pull Todo issues from team <team-id>"
- If Linear available: Get issues with "Todo" status, ordered by priority
- If Linear unavailable: Read `docs/roadmap.md` Backlog section for Todo items

**If `linear_enabled: false`:**
- Read `docs/roadmap.md` Backlog section for Todo items

**If Todo issues found:**
```
Found [N] issues in Todo status (ordered by priority):

1. [ISSUE-ID] (Priority): [Title]
2. [ISSUE-ID] (Priority): [Title]
...

Add all these issues to the sprint? (yes/no)
If no, specify which issues: (e.g., "57, 58" or "QUO-57, QUO-58")
```

**Wait for user response:**
- If "yes" → Use all Todo issues for the sprint
- If "no" with specific issues → Parse issue numbers (support both "57" and "QUO-57" formats)
- If "no" without issues → Prompt: "Which issues should I work on? (provide issue IDs or say 'Priority 1' to use highest priority issue)"

**If NO Todo issues found:**
```
No issues found in Todo status.

Please specify which issues to work on, or I can:
- Query for highest Priority issue in Backlog
- Wait for you to move issues to Todo in Linear

What would you like to do?
```

### 2a. Check for Existing Active Sprint or Create New One

#### Search for active sprint file

```bash
find docs/sprints/ -name "*.active.md" 2>/dev/null
```

#### If multiple active sprints found

```
❌ BLOCKING ERROR

Found multiple active sprint files:
[list files]

Only ONE active sprint should exist at a time.

Please resolve manually:
1. Rename completed sprint to .done.md
2. Or delete the old sprint file
3. Then run /sprint again

CANNOT PROCEED until resolved.
```

**EXIT - Do not proceed**

#### If one active sprint found

```
✓ Resuming active sprint: [filename]

Current sprint: [name]
Issues in sprint: [list from sprint file]
Status: [status from sprint file]
```

**CONTINUE** - Use this sprint file for all subsequent work, delegate to EM (step 3)

#### If no active sprint found

**Determine next sprint number:**
- Scan ALL sprint files: `find docs/sprints/ -name "sprint-*.md" 2>/dev/null`
- Extract all sprint numbers from both `*.active.md` and `*.done.md` files
- Parse numbers handling suffixes (e.g., sprint-004a → 004)
- Use highest number + 1 (or 001 if no sprints exist)
- Example: If sprint-003.done.md, sprint-004a.done.md, sprint-004b.done.md exist, use 005

**Parallel sprint validation (only check issue overlap, skip file overlap):**
- Get list of issues for new sprint (from step 2b)
- For each existing `*.active.md` sprint file:
  - Read the "Issues in Sprint" table
  - Extract issue IDs
  - **If overlap detected (same issue ID in both sprints):**
    ```
    ❌ BLOCKING ERROR

    Issue [ISSUE-ID] is already in an active sprint:
    - Active sprint: [filename]

    Cannot run parallel sprints on the same issue.

    Options:
    1. Resume existing sprint with /sprint [ISSUE-ID]
    2. Wait for existing sprint to complete
    3. Remove [ISSUE-ID] from the active sprint first

    CANNOT PROCEED.
    ```
    **EXIT - Do not proceed**

**Note:** File overlap calculation is expensive and rarely useful. Skipping it during initialization saves ~2K context tokens. EM agent will handle merge conflict resolution if parallel sprints touch overlapping files.

**Create new sprint file:**
- Path: `docs/sprints/sprint-###-[name].active.md`
- Name: short descriptor from first issue title
- **Blocking enforcement:**
  - Directory creation must succeed or EXIT with error
  - File write must succeed or EXIT with error
  - If file created but unreadable, WARN and ask user to continue/cancel

**Initial content (skeleton format):**
```markdown
# Sprint [###]: [Placeholder - will update after EM starts]

**Status:** 🔵 Starting
**Started:** [date]
**Issues:** [Will be populated by EM]

## Issues in Sprint

| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| — | — | — | — |

## Phase Timeline

| Issue | Phase | Started | Completed | Notes |
|-------|-------|---------|-----------|-------|
| — | — | — | — | — |

## Iteration Log

[Will be populated during iteration]

## New Acceptance Criteria Discovered

| Issue | New AC | Added to Spec |
|-------|--------|---------------|
| — | — | — |

## Notes
[Context, decisions, blockers will be added as work progresses]

**Linear Sync Status:**
- Sprint start: [pending EM]
```

**Example sprint number calculation:**
```bash
# Existing files in docs/sprints/:
sprint-001-auth.done.md
sprint-002-payments.done.md
sprint-003-search.done.md
sprint-004a-rag-memory.done.md    # Parallel sprint (finished)
sprint-004b-email-fix.done.md     # Parallel sprint (finished)
sprint-005-calendar.active.md     # Currently running

# New sprint starting:
# Scan finds: 001, 002, 003, 004a, 004b, 005
# Parse numbers: 1, 2, 3, 4, 4, 5
# Highest = 005
# New sprint gets: 006

# Result:
docs/sprints/sprint-006-notifications.active.md
```

This ensures unique sprint numbers even when multiple sprints run in parallel. If duplicates exist with suffixes (004a, 004b), the next sprint uses the next base number (005).

### 3. Delegate to EM Agent

**Now that sprint file exists and issues are selected, delegate everything else to EM:**

Spawn EM agent (EM has Task tool and will coordinate all subagents):

```
Role: Engineering Manager
Sprint: [sprint file path]
Issues: [issue IDs from step 2b]
Linear Config:
  - Enabled: [true/false]
  - Team ID: [team-id]
  - Issue Prefix: [prefix]

Instructions:
1. For each issue in sprint:
   - Check if this involves UI/UX work (lines 57-110 in em.md)
   - If YES: Spawn Design-Planner before Explorer
   - If NO: Skip directly to Explorer
2. Spawn Explorer(s) to analyze scope (skip for trivial fixes)
   - Can spawn multiple Explorers in parallel for complex issues
3. Spawn Plan-Writer to create implementation plan
4. Present plan to User for approval ← CHECKPOINT
5. Once approved: Execute ALL issues CONTINUOUSLY without stopping:
   - Spawn Developer(s) for execution (parallel when possible)
   - Spawn Design-Reviewer (if UI work) and Code Reviewer
   - Deploy each issue to staging immediately after review passes
   - Continue to next issue without pausing
6. ONLY stop execution when:
   - Design approval needed (UI work)
   - v0 visual iteration in progress (User iterating on v0.dev — wait for "v0 is ready")
   - Plan approval needed (always)
   - Review fails after 3 rounds (escalate)
   - All issues deployed to staging (present wrap-up)
   - Blocking error occurs
7. Update sprint file with checkpoints throughout (NOT User messages)
8. Use linear-sync agent for all Linear operations (non-blocking)
9. Update roadmap.md as work progresses
10. After all issues complete: Present sprint wrap-up with staging URLs

Sprint file is your shared memory. Update it with:
- Checkpoints after each phase
- Linear sync status (success/failure)
- Issue progress (spec status, review status)
- Pending manual syncs

Refer to em.md for full coordination protocol.
```

**EM agent handles:**
- UX detection and Design-Planner invocation
- Explorer spawning (single or parallel)
- Plan-Writer coordination
- User approval checkpoint
- Developer coordination (sequential or parallel waves)
- Design-Reviewer gate (for UI work)
- Code Reviewer gate (mandatory)
- Linear syncs via linear-sync agent
- Sprint file updates with checkpoints
- Roadmap.md updates
- Escalation to User when blocked

**Sprint command tracks progress:**
- Read sprint file periodically for status
- EM updates sprint file with checkpoints
- Sprint command can resume if interrupted

### 4. Sprint Completion

When EM completes all issues:

1. EM presents sprint wrap-up (see em.md lines 422-514)
2. User tests on staging
3. User says "close the sprint" or "deploy to production"
4. EM validates all safety checks (see em.md lines 218-365):
   - All acceptance criteria met
   - Automated verification passed
   - Reviewer approval exists for all issues
   - Infrastructure changes have User approval
   - OpenAI Codex peer review complete (optional)
5. If all checks pass: EM invokes Developer to deploy to production
6. EM renames sprint file: `.active.md` → `.done.md`
7. EM updates roadmap.md: Move to "Recently Completed"
8. EM uses linear-sync for final status sync (non-blocking)

## Rules

- **Thin sprint command:** Only handles config, issue selection, sprint file creation
- **Delegate early:** EM handles all orchestration (UX detection, exploration, planning, execution)
- **Non-blocking Linear:** Use `linear-sync` agent with 30s timeouts, fallback to roadmap.md
- **Sprint file = shared memory:** Both sprint command and EM update it with checkpoints
- **Resume support:** Can read sprint file to resume interrupted work
- **No PROJECT_STATE.md read here:** EM or Explorer will read it when needed (saves ~500 tokens)
- **Lazy validation:** Only check issue overlap, skip expensive file overlap calculation

## Output

When sprint starts:

```
## Sprint [###] Started — [date]

**Issues in sprint:** [issue IDs]
**Sprint file:** docs/sprints/sprint-###-[name].active.md
**Linear sync:** [success / unavailable - using roadmap.md fallback]

**Delegated to EM agent:**
- EM will check each issue for UI/UX work
- Design-Planner invoked before Explorer if UI work detected
- Full workflow: Design → Explore → Plan → Approve → Execute → Review → Deploy

**Tracking:**
- Sprint file updated with checkpoints
- Linear syncs via linear-sync agent (non-blocking)
- Roadmap.md updated as work progresses

**EM is now coordinating the sprint...**
```

When EM completes (or needs input):
- EM posts updates directly to User
- Sprint command can be run again to resume if interrupted

---

**Start now. Read CLAUDE.md and begin workflow.**
