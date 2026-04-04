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

Only one active sprint is allowed at a time. Multiple active sprint files indicate a process error.

```
❌ BLOCKING ERROR

Found [N] active sprints:
[list files with their branches]

Only one active sprint is allowed at a time.

Options:
1. Resume existing sprint: /sprint (will pick up the active sprint)
2. Close existing sprint first: rename .active.md → .done.md
3. Rename if mislabeled: fix the filename to .done.md

CANNOT PROCEED until only one (or zero) active sprints remain.
```

**EXIT** - Do not proceed. User must resolve before starting a new sprint.

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
**Branch:** `sprint/sprint-###-[name]`
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

**Create sprint branch:**

After creating the sprint file, create the sprint branch:

```bash
# Ensure we're on develop and up to date
git checkout develop
git pull origin develop

# Create sprint branch
SPRINT_BRANCH="sprint/sprint-###-[name]"
git checkout -b "$SPRINT_BRANCH"
git push -u origin "$SPRINT_BRANCH"
```

The sprint branch name must match the sprint file name (e.g., `sprint-019-admin-tabs` becomes branch `sprint/sprint-019-admin-tabs`).

**Resuming a sprint:** When resuming an existing sprint (one active sprint found), check out the sprint branch:
```bash
# Read branch name from sprint file **Branch:** field
git checkout sprint/sprint-###-[name]
```

**Example sprint number calculation:**
```bash
# Existing files in docs/sprints/:
sprint-001-auth.done.md
sprint-002-payments.done.md
sprint-003-search.done.md
sprint-004-rag-memory.done.md

# New sprint starting:
# Scan finds: 001, 002, 003, 004
# Highest = 004
# New sprint gets: 005

# Result:
docs/sprints/sprint-005-notifications.active.md
```

### 3. Execute EM Protocol (Inline)

**Now that sprint file exists and issues are selected, follow the EM protocol directly in this conversation.**

Read `~/.claude/guides/em-protocol.md` and execute it. You ARE the engineering manager for this sprint — all orchestration happens here, visible to the User.

**Sprint context to carry forward:**
- Sprint file: [sprint file path]
- Sprint branch: [sprint branch name, e.g., sprint/sprint-019-admin-tabs]
- Issues: [issue IDs from step 2b]
- Linear enabled: [true/false]
- Team ID: [team-id]
- Issue prefix: [prefix]

**Execute these phases (details in em-protocol.md):**

**PHASE 0 — Design-Planner Gate (BEFORE any exploration):**
1. For EACH issue, classify: UI work or backend-only?
   - UI indicators: issue mentions UI/UX/layout/design/style/component/screen/button/modal/menu/page/form/card/navigation/header/drawer/sheet/dialog/toast
   - UI indicators: files to modify include src/components/, src/screens/, *.css, *.swift (native shell)
   - UI indicators: issue labels include UI, UX, design, frontend, Improvement (with UI scope)
2. Log classification to sprint file for EVERY issue
3. For ALL UI-classified issues: Spawn Design-Planner agents (can be parallel)
4. WAIT for ALL Design-Planner agents to complete
5. VERIFY: docs/design-specs/{ISSUE_ID}-design.md exists for every UI-classified issue
6. Only after ALL design specs confirmed → proceed to Phase 1

**PHASE 1 — Exploration & Planning:**
1. Spawn Explorer(s) to analyze scope (skip for trivial fixes)
2. Spawn Plan-Writer to create implementation plan
3. Present plan to User for approval ← CHECKPOINT

**PHASE 2 — Execution:**
4. Once approved: Execute ALL issues CONTINUOUSLY without stopping
   - If issues depend on existing pipelines: Developer should verify pipeline health early (stability.md Section 24)
   - Spawn Developer(s) for execution (parallel when possible)
   - Spawn Design-Reviewer (if UI work) and Code Reviewer
   - Deploy each issue to staging immediately after review passes
5. ONLY stop execution when:
   - Design approval needed (UI work)
   - v0 visual iteration in progress (wait for "v0 is ready")
   - Plan approval needed (always)
   - Review fails after 3 rounds (escalate)
   - All issues deployed to staging (present wrap-up)
   - Blocking error occurs
6. Update sprint file with checkpoints throughout
7. Use linear-sync agent for all Linear operations (non-blocking)
8. Apply sprint label `S###` to all sprint issues (see linear-sync agent Section 4)
9. Update roadmap.md as work progresses
10. After all issues complete: Present sprint wrap-up with staging URLs

**Sprint file is your shared memory.** Update it with checkpoints after each phase, Linear sync status, issue progress, and pending manual syncs.

### 4. Sprint Completion

When all issues are complete:

1. Present sprint wrap-up (see em-protocol.md Autonomous Mode & Sprint Closure)
2. User tests on staging
3. User says "close the sprint" or "deploy to production"
4. Validate all safety checks:
   - All acceptance criteria met
   - Automated verification passed
   - Reviewer approval exists for all issues
   - Infrastructure changes have User approval
   - OpenAI Codex peer review complete (optional)
5. If all checks pass: Invoke Developer to merge sprint branch to `develop` and deploy to production
   - Developer merges sprint branch to `develop`: `git checkout develop && git merge sprint/sprint-###-[name] && git push origin develop`
   - Developer merges `develop` to `main`: `git checkout main && git merge develop && git push origin main`
   - Developer deletes sprint branch: `git branch -d sprint/sprint-###-[name] && git push origin --delete sprint/sprint-###-[name]`
6. Rename sprint file: `.active.md` → `.done.md`
7. Update roadmap.md: Move to "Recently Completed"
8. Use linear-sync for final status sync (non-blocking)

## Rules

- **Setup then orchestrate:** Steps 1-2 handle config, issue selection, sprint file creation. Step 3 switches to EM protocol for orchestration.
- **EM protocol runs inline:** Read `~/.claude/guides/em-protocol.md` and follow it directly in the main conversation. Do NOT spawn it as a subagent.
- **Non-blocking Linear:** Use `linear-sync` agent with 30s timeouts, fallback to roadmap.md
- **Sprint file = shared memory:** Update it with checkpoints throughout
- **Resume support:** Can read sprint file to resume interrupted work
- **No PROJECT_STATE.md read here:** Explorer will read it when needed (saves ~500 tokens)
- **Single sprint:** Only one active sprint at a time. Block new sprints if one is active.

## Output

When sprint starts:

```
## Sprint [###] Started — [date]

**Issues in sprint:** [issue IDs]
**Sprint file:** docs/sprints/sprint-###-[name].active.md
**Sprint branch:** sprint/sprint-###-[name]
**Staging preview:** [Vercel preview URL from sprint branch push]
**Linear sync:** [success / unavailable - using roadmap.md fallback]

**Now executing EM protocol (inline):**
- Checking each issue for UI/UX work
- Full workflow: Design → Explore → Plan → Approve → Execute → Review → Deploy
- Sprint file updated with checkpoints
- Linear syncs via linear-sync agent (non-blocking)
- Roadmap.md updated as work progresses
```

---

**Start now. Read CLAUDE.md and begin workflow.**
