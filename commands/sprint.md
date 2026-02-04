---
description: Run the engineering sprint autonomously. Reads the roadmap and executes Priority 1 task with spec-first workflow.
---

# Autonomous Sprint Execution

Run the engineering sprint autonomously. Reads Linear for Priority 1 task and executes with proper spec creation and plan approval.

> **Tip:** Clear context before starting a new sprint to maximize available context and avoid mid-sprint compaction.
>
> **Shorthand:** If user writes "CC" (not referencing something else), it means "clear context".

## Workflow

1. Read `CLAUDE.md` to get Linear team and issue prefix
2. **Run `/sync-roadmap`** to reconcile any Linear changes before starting work
2a. **Check for existing active sprint or create new one:**
   - **Search for active sprint file:**
     ```bash
     find docs/sprints/ -name "*.active.md" 2>/dev/null
     ```
   - **If multiple active sprints found:**
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

   - **If one active sprint found:**
     ```
     ✓ Resuming active sprint: [filename]

     Current sprint: [name]
     Issues in sprint: [list from sprint file]
     Status: [status from sprint file]
     ```
     **CONTINUE** - Use this sprint file for all subsequent work

   - **If no active sprint found:**
     - Create new sprint file at `docs/sprints/sprint-###-[name].active.md`
     - Sprint number: increment from highest existing sprint number (or 001 if none)
     - Name: short descriptor from Priority 1 issue (will update after step 3)
     - **Blocking enforcement:**
       - Directory creation must succeed or EXIT with error
       - File write must succeed or EXIT with error
       - If file created but unreadable, WARN and ask user to continue/cancel
     - **Initial content** (skeleton format):
       ```markdown
       # Sprint [###]: [Placeholder - will update after querying Linear]

       **Status:** 🔵 Starting
       **Started:** [date]
       **Issues:** [Will be populated as issues are worked on]

       ## Issues in Sprint

       | Issue | Title | Spec | Status |
       |-------|-------|------|--------|
       | — | — | — | — |

       ## Iteration Log

       [Will be populated during iteration]

       ## New Acceptance Criteria Discovered

       | Issue | New AC | Added to Spec |
       |-------|--------|---------------|
       | — | — | — |

       ## Notes
       [Context, decisions, blockers will be added as work progresses]
       ```
     - After creating, update sprint file title and first issue after step 3
3. Query Linear for Priority 1 issue in current sprint (`mcp__linear__list_issues`)
   - **If Linear unavailable (any MCP call fails):**
     - Use `docs/roadmap.md` as fallback
     - Add to roadmap.md Sync Status: "Linear unavailable - using roadmap.md"
   - If work was done while Linear was down, flag for reconciliation at sprint end
4. Read `docs/PROJECT_STATE.md` for current codebase state
5. **Check for technical spec at `docs/technical-specs/{PREFIX}-##.md`:**
   - **If spec exists:** Read it and proceed to step 7
   - **If spec does NOT exist:** Create it first (step 6)
6. **Create technical spec (if missing):**
   - **Analyze task complexity to decide on exploration strategy:**
     - Simple tasks (bug fix, one-file change): Single Explorer
     - Complex tasks (2+ areas: frontend, backend, db, integrations): Parallel Explorers
   - **Spawn Explorer(s) with Task tool:**
     - **Single Explorer:**
       ```
       Issue: {PREFIX}-## (Linear issue ID)
       Task: [short title]
       Context: [why this matters]
       Spec: [what to build]
       ```
     - **Parallel Explorers (if complex):**
       ```
       Issue: {PREFIX}-##
       Task: [short title]

       Spawning 3 Explorers in parallel:
       - Explorer A: Frontend UI exploration (src/components/, src/pages/)
       - Explorer B: Backend API exploration (src/api/, src/services/)
       - Explorer C: Database schema exploration (src/db/)
       ```
   - **Explorer(s) create `docs/technical-specs/{PREFIX}-##.md`** with exploration findings
   - **After exploration completes, spawn Plan-Writer** to add implementation plan to spec
7. **Update Linear status to "In Progress"** using UUID from CLAUDE.md
7a. **Parallelization Decision (after Plan-Writer, before User approval):**
   - Read the Implementation Plan from spec file
   - **Analyze task dependencies:**
     - Read "Task Dependencies" table from spec
     - Group tasks by dependency level (Level 0 = no deps, Level 1 = depends on Level 0, etc.)
   - **Within each level, analyze file conflicts:**
     - For each task, list files it will modify
     - Detect overlaps between tasks at same dependency level
     - **If no overlap:** Tasks can run in parallel
     - **If overlap exists:** Assign file zones OR sequence the tasks
   - **Create Execution Plan in spec file:**
     ```markdown
     ## Execution Plan

     **Wave 1 (parallel):**
     - Dev A: Task 1 [schema migration] - Files: src/db/*
     - Dev B: Task 4 [logging utility] - Files: src/utils/logger.ts

     **Wave 2 (after Wave 1, parallel):**
     - Dev C: Task 2 [backend API] - Files: src/api/*
     - Dev D: Task 5 [update docs] - Files: docs/*

     **Wave 3 (after Wave 2):**
     - Dev E: Task 3 [frontend UI] - Files: src/components/*

     **File Conflict Management:**
     | Developer | File Zone | Sequence Notes |
     |-----------|-----------|----------------|
     | Dev A | src/db/* | First |
     | Dev C | src/api/* | After Dev A (may need schema) |
     ```
   - **Present Execution Plan + Implementation Plan to User for approval** ← CHECKPOINT
   - Wait for User's "yes" before proceeding
8. **Execute according to Execution Plan:**

   **For each wave in the Execution Plan:**

   a. **Spawn Developer(s) using Task tool:**
      - **Single Developer (sequential):**
        ```
        Issue: {PREFIX}-##
        Task: [task name]
        Spec: docs/technical-specs/{PREFIX}-##.md
        Assigned Tasks: Task 1
        ```
      - **Multiple Developers (parallel wave):**
        ```
        # Spawn these in ONE message (parallel execution):

        Developer A:
          Issue: {PREFIX}-##
          Task: Task 1 - Schema migration
          Spec: docs/technical-specs/{PREFIX}-##.md
          Assigned Tasks: Task 1
          File Zone: src/db/*
          Parallel Mode: true
          Sequence: first

        Developer B:
          Issue: {PREFIX}-##
          Task: Task 4 - Logging utility
          Spec: docs/technical-specs/{PREFIX}-##.md
          Assigned Tasks: Task 4
          File Zone: src/utils/logger.ts
          Parallel Mode: true
          Sequence: independent
        ```

   b. **Each Developer (runs automatically):**
      - Updates spec status (🟥→🟨→🟩) for their assigned tasks
      - Implements code changes
      - Runs verification
      - **Automatically submits to Reviewer** (no user input)
      - Waits for Reviewer decision
      - If approved: Deploys to staging (automatic)
      - If changes requested: Fixes and resubmits (automatic loop, max 3 rounds)

   c. **Reviewer reviews all submissions from the wave:**
      - If multiple Developers in wave → spawn parallel Reviewer sub-agents
      - Each Reviewer posts approval/changes to Linear
      - Parent Reviewer consolidates: "Wave 1: All approved" or "Dev A approved, Dev B needs changes"

   d. **After wave approval:**
      - All Developers in wave deploy to staging (push to develop)
      - Update spec: mark wave complete
      - Post wave completion to Linear

   e. **Move to next wave** (if any)

   f. **Repeat until all waves complete**

9. **Pre-handoff verification (MANDATORY before user testing):**
   - Run full test suite (backend + frontend) — not just changed code
   - Check: do tests exist for the flows user will test?
     - If missing → create them or verify via API/curl yourself
   - Test the flow yourself locally (start servers, verify it works)
   - Only proceed after YOU confirm it works
10. When all subtasks complete and deployed to staging:
    - **MANDATORY: Verify ALL acceptance criteria are met** before proceeding
    - Generate acceptance criteria report (see Output section)
    - If any criteria are ⚠️ or ❌, get User approval before marking In Review
    - **Update Linear status to "In Review"** using UUID from CLAUDE.md
    - Update `docs/roadmap.md` status to 🟨 In Review
11. **Update sprint file:**
    - Add completed issue to sprint file Issues table (if not already there)
    - Update status to 🟨 In Review (awaiting user testing)
    - Add completion notes and next steps
    - Tell user: "Use `/iterate` when you find issues during testing."
12. **When sprint completes and user deploys to production:**
    - Rename sprint file from `.active.md` to `.done.md`
    - Update `docs/roadmap.md`:
      - Move issues from "Active Sprint" to new section under "Recently Completed Sprints"
      - Include sprint name, completion date, link to sprint file
      - Show table of completed issues with priority, issue, title, status, spec
      - Keep only 2-3 most recent completed sprints (remove older entries)
    - Clear "Active Sprint" section (or leave empty if no next sprint)
13. **Move to next issue:**
    - Ensure completed issue is tracked in active sprint file
    - Return to step 3 and repeat until:
    - All Active Sprint items are done
    - A task is blocked
    - A security issue is found
    - Critical decision needed from the User

## Sprint File Template

```markdown
# Sprint [###]: [Name]

**Status:** 🟨 In Review
**Started:** [date]
**Issues:** [QUO-##, QUO-##]

## Issues in Sprint

| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| QUO-## | [Title] | [spec](../technical-specs/QUO-##.md) | 🟨 In Review |

## Iteration Log

### Batch 1 — [date time]
Reported by User:
1. [ ] [description] → [QUO-## or "unclear"]
2. [x] [description] → fixed in [commit]

## New Acceptance Criteria Discovered

| Issue | New AC | Added to Spec |
|-------|--------|---------------|
| — | — | — |

## Notes
[Context, decisions, blockers]
```

## Rules

- **MANDATORY REVIEW GATE:** Cannot mark "In Review" or deploy to staging without Reviewer approval
- **Reviewer must approve before ANY deployment to develop branch**
- **If Reviewer requests changes, must re-submit for re-review before deploying**
- **"In Review" status means "Under review by Reviewer", not "ready for User"**
- Invoke Reviewer immediately after verification passes, before any deployment
- **Test before handoff:** Never ask user to test without first running all tests and verifying the flow yourself
- **Spec-first:** Never implement without a technical spec file
- **Plan approval required:** Present the implementation plan and wait for User's approval before coding
- **No confirmation needed within a task:** Once a plan is approved, execute subtasks without asking
- **All acceptance criteria must be met:** Before marking any issue "In Review" or "Done", verify ALL acceptance criteria are implemented. If a criterion can't be met, flag it and get User approval to proceed without it.
- Push only to `develop` (staging) by default
- **Production deployment:** When user explicitly says "deploy", "push to main", "deploy to production", or **"close the sprint"** (or variants like "finish sprint", "complete sprint"), merge develop → main and push immediately without asking for separate confirmation
  - **Safety requirement:** Before auto-pushing on "close the sprint", verify:
    - [ ] All acceptance criteria are ✅ (no ⚠️ or ❌)
    - [ ] All automated staging verification checks passed
    - [ ] No failing tests
    - [ ] No deployment errors on staging
  - **If any check fails:** STOP and ask user what to do before proceeding
  - **If ACs are incomplete:** STOP and confirm user wants to proceed anyway
- Run tests before each commit
- Update spec file progress (🟥→🟨→🟩) as you complete tasks
- Post status updates to Linear issue as comments
- Update `docs/PROJECT_STATE.md` after completing a Priority item
- Update `docs/PROJECT_STATE.md` at sprint end (even if not deployed; mark "NOT UPDATED — reason")
- Update `docs/roadmap.md` when status changes (immediately, not just at sprint end)
- **Done = Deployed to production.** Never mark Done until code is live on main branch.
- **Sprint file lifecycle:** When sprint is deployed to production:
  1. Rename `*.active.md` → `*.done.md`
  2. Update roadmap.md to move issues to "Recently Completed Sprints" section (with sprint file link)
  3. Keep 2-3 most recent completed sprints in roadmap (older ones remain accessible via sprint files)
- **Linear sync:** If any `mcp__linear__*` call fails:
  1. Continue using `docs/roadmap.md` as source of truth
  2. Add pending updates to roadmap.md Sync Status section
  3. Report sync issues in sprint summary at end
- Stop and report if:
  - Tests fail and can't be fixed
  - External dependency is missing (secrets, credentials, etc.)
  - Spec is ambiguous and blocks work

## Technical Spec Template

When creating a new spec file, use this structure:

```markdown
# {PREFIX}-##: [Title]

**Status:** 🟨 In Progress
**Created:** [date]

## Summary
[What needs to be built and why]

## Exploration
- Files to create/modify
- Integration points
- Dependencies
- Edge cases to handle

## Implementation Plan

**Progress:** 0%

- [ ] 🟥 Task 1: [description]
- [ ] 🟥 Task 2: [description]
- [ ] 🟥 Task 3: [description]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Notes
[Any risks, decisions, or context]
```

## Task Execution Format

For each subtask, work through:
```
1. Update spec status: 🟥 → 🟨 (starting task)
2. Read spec and acceptance criteria
3. Identify files to create/modify
4. Implement changes
5. Run verification loop:
   - Build check
   - Type check (if TypeScript)
   - Lint check
   - Run existing tests
   - Security scan (secrets, console.log)
6. Add E2E tests for user-facing changes (new UI, new flows, error messages)
7. Fix any issues found, repeat verification until all pass
8. Update spec status: 🟨 → 🟩 (task complete)
9. Commit with descriptive message
10. **MANDATORY: Submit to Reviewer for code review**
11. **Wait for Reviewer approval (may require multiple fix rounds)**
12. **GATE: Cannot proceed without approval**
13. After approval: Push to develop
14. Post completion comment to Linear issue
15. Proceed to next subtask
```

**Verification must pass before committing.** See Developer agent for full verification commands.

**E2E test requirement:** If a criterion involves user-visible behavior (UI, messages, flows), either:
- Add an E2E test that verifies it, OR
- Mark the criterion ⚠️ "Needs manual verification" in the acceptance criteria report

## Output

**Follow the formats in `~/.claude/rules/task-completion.md`:**
- After every commit → use commit format
- After completing a full issue → use task complete format with **full acceptance criteria report**

**MANDATORY: Acceptance Criteria Report for each issue** — Before marking any issue "In Review", output a table showing each acceptance criterion from the Linear issue, whether it's met (✅/⚠️/❌), and how you verified it. Do not skip this step.

**Always include** the staging URL from project's CLAUDE.md Deployment section.

After completing sprint (or when stopping):
```
## Sprint Wrap-Up — [date]

### Deployments
- Staging: [label](URL) — [what's live]
- Production: [label](URL) — [what's live / not deployed]

### Project State
- PROJECT_STATE.md: [updated YYYY-MM-DD / NOT UPDATED — reason]

### Completed This Sprint
- [Issue]: [one-line outcome]

### Acceptance Criteria Report

For each completed issue, verify all acceptance criteria:

| Criteria | Status | Verification |
|----------|--------|--------------|
| [Criterion 1] | ✅ | [How verified] |
| [Criterion 2] | ⚠️ | [Partial - what's missing] |

**Gap types to flag:**
- ⚠️ Criteria not fully met (e.g., pre-existing issues, partial implementation)
- ⚠️ Requires manual testing (can't be verified via code/build)
- ⚠️ Ambiguous criteria (needs clarification)

**Recommendations:** (if any gaps)
- [What to do: fix now / track as separate issue / needs User verification]

### What's Next
- [Next sprint focus / priority]

### What You Should Do Next
- [Action] — Owner: Roy

### Next Issues In Line
- [Issue IDs / titles]

### Next Steps
- [Action] — Owner: Roy/Claude

### Linear Sync Issues (if any)
⚠️ Linear was unavailable during this sprint. Pending updates:
- [Issue]: [what changed - status, created, etc.]

Please update Linear manually or ask User to repair integration.

### Before Closing Sprint
Run `/sync-roadmap` to reconcile any Linear changes made during the sprint.
```

---

## After Sprint: Iteration Phase

After initial implementation, users typically test and find bugs. Use `/iterate` to:
- Maintain protocol during bug-fix loops
- Track all reported issues in the sprint file
- Keep context via external memory (sprint file survives context compaction)

The sprint isn't truly done until iteration completes and user approves for production.

---

**Start now. Query Linear for Priority 1 task and begin with spec check.**
