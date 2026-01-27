---
description: Run the engineering sprint autonomously. Reads the roadmap and executes Priority 1 task with spec-first workflow.
---

# Autonomous Sprint Execution

Run the engineering sprint autonomously. Reads Linear for Priority 1 task and executes with proper spec creation and plan approval.

> **Tip:** Clear context before starting a new sprint to maximize available context and avoid mid-sprint compaction.

## Workflow

1. Read `CLAUDE.md` to get Linear team and issue prefix
2. **Reconciliation check:** Compare Linear vs `docs/roadmap.md` for status discrepancies:
   - For **In Progress, In Review, Done**: roadmap.md is source of truth
   - Flag any issues where Linear status differs from roadmap.md
   - Flag any issues marked "Done" in Linear that aren't deployed to production
   - Ask user before reverting: "Linear shows [X] as [status], but roadmap.md shows [status]. Revert to roadmap.md?"
   - For **Backlog, Todo**: respect user's Linear changes, replicate to roadmap.md
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
   - Analyze the codebase for integration points
   - Create `docs/technical-specs/{PREFIX}-##.md` with:
     - Summary of what needs to be built
     - Files to create/modify
     - Implementation plan with tasks (🟥 To Do status)
     - Acceptance criteria
   - **Present plan to User for approval** ← CHECKPOINT
   - Wait for User's "yes" before proceeding
7. **Update Linear status to "In Progress"** using UUID from CLAUDE.md
8. For each subtask in the spec:
   - Update spec status (🟥→🟨) when starting
   - Implement the code changes
   - Run tests to verify
   - Update spec status (🟨→🟩) when complete
   - Deploy to staging (push to `develop`)
   - **Verify deployment succeeded** (poll status using CLAUDE.md commands, or ask user if no check command configured)
   - Post update to Linear issue
9. When all subtasks complete and deployed to staging:
   - **MANDATORY: Verify ALL acceptance criteria are met** before proceeding
   - Generate acceptance criteria report (see Output section)
   - If any criteria are ⚠️ or ❌, get User approval before marking In Review
   - **Update Linear status to "In Review"** using UUID from CLAUDE.md
   - Update `docs/roadmap.md` status to 🟨 In Review
10. **Create/update sprint file:**
    - If no sprint file exists, create `docs/sprints/sprint-###-[name].md`
    - Sprint number: increment from last sprint file (or 001 if first)
    - Name: short descriptor of main issue (e.g., "zillow-search")
    - List all issues worked on in this sprint
    - Set status to 🟨 In Review (awaiting user testing)
    - Tell user: "Sprint file created at `docs/sprints/sprint-###-[name].md`. Use `/iterate` when you find issues during testing."
11. **Move to next issue:** Return to step 3 and repeat until:
    - All Active Sprint items are done
    - A task is blocked
    - A security issue is found
    - Critical decision needed from the User

## Rules

- **Spec-first:** Never implement without a technical spec file
- **Plan approval required:** Present the implementation plan and wait for User's approval before coding
- **No confirmation needed within a task:** Once a plan is approved, execute subtasks without asking
- **All acceptance criteria must be met:** Before marking any issue "In Review" or "Done", verify ALL acceptance criteria are implemented. If a criterion can't be met, flag it and get User approval to proceed without it.
- Push only to `develop` (staging) - never `main`
- Run tests before each commit
- Update spec file progress (🟥→🟨→🟩) as you complete tasks
- Post status updates to Linear issue as comments
- Update `docs/PROJECT_STATE.md` after completing a Priority item
- Update `docs/PROJECT_STATE.md` at sprint end (even if not deployed; mark "NOT UPDATED — reason")
- Update `docs/roadmap.md` when status changes (immediately, not just at sprint end)
- **Done = Deployed to production.** Never mark Done until code is live on main branch.
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
10. Push to develop
11. Post completion comment to Linear issue
12. Proceed to next subtask
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
