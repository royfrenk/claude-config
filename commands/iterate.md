---
description: Continue iterating on current sprint. Use after /sprint when user reports bugs or issues.
---

# Sprint Iteration

Continue working on the current sprint after user testing reveals bugs or issues.

> **Purpose:** Maintain protocol and context during the bug-fix iteration loop.

## Workflow

1. **Load sprint context:**
   - **Search for active sprint file:**
     ```bash
     find docs/sprints/ -name "*.active.md" 2>/dev/null
     ```
   - **If no active sprint found:**
     ```
     ❌ ERROR: No active sprint found

     /iterate requires an active sprint file (.active.md)

     Please either:
     1. Run /sprint to start a new sprint
     2. If a sprint was completed, rename it from .done.md to .active.md

     Cannot proceed with iteration.
     ```
     **EXIT**

   - **If active sprint found:**
     - Read sprint file
     - Read all linked spec files
     - Show summary: "Sprint [name] — [X] issues, [Y] open bugs"

2. **Receive bug batch from user:**
   - User provides list of issues found
   - For each issue, determine:
     - Which spec file it belongs to (or "unclear")
     - Is it a bug (failed AC) or new AC?

3. **Update sprint file:**
   - Add new batch to Iteration Log
   - Mark each item as [ ] (open)

4. **Fix each issue:**
   - Follow full developer protocol (verification loop, commit format)
   - After fix: mark [x] in sprint file
   - After push: verify deployment succeeded
   - Continue until batch complete

4a. **Check-in: Batch Complete (Automatic):**
   - Update sprint file with checkpoint:
     ```markdown
     ## Check-in: Iteration Batch [#] Complete — [YYYY-MM-DD HH:MM]

     **Status:** 🟨 In Review (Staging)
     **Batch:** [#]
     **Fixed:** [X] issues
     **Commits:** [list commit hashes]
     **Deployed:** [staging URL]
     **Remaining Open:** [Y] issues
     **Next:** [More testing / Ready for production]
     ```
   - This check-in helps resume if iteration is interrupted mid-testing

5. **Report status:**
   - Show remaining open bugs
   - Ask: "More issues to report, or ready to wrap up?"

## Sprint File Location

`docs/sprints/sprint-###-[name].md`

Example: `docs/sprints/sprint-001-zillow-search.md`

**Template:** See `/sprint` → Sprint File Template section. The sprint file is created by `/sprint`, this command continues it.

## Protocol Checklist (Per Fix)

Follow this for EVERY bug fix — don't skip steps:

### Before Fixing
- [ ] Read sprint file to understand current state
- [ ] Read relevant spec file for context
- [ ] Identify which issue this bug belongs to

### Fixing
- [ ] Run verification loop (build, lint, types, tests)
- [ ] Commit with proper format (see `~/.claude/rules/task-completion.md`)

### After Fixing
- [ ] Push to `develop`
- [ ] **Run automated staging verification** (see `~/.claude/agents/developer.md` Phase 6)
  - API health checks
  - Response structure validation
  - Log analysis
  - Relevant E2E tests
  - Only proceed after checks pass
- [ ] Update sprint file: mark bug as [x] fixed with commit hash
- [ ] Post comment to Linear issue: "Fixed [description] in [commit]" with verification results

### After Each Batch
- [ ] Update sprint file with batch summary
- [ ] Show user: what's fixed, what's still open
- [ ] Ask: "More issues, or ready to wrap up?"

### When All Batches Accepted
- [ ] Update sprint file: all bugs marked [x], status → 🟨 Ready for Production
- [ ] **Sync with Linear (Push - Done status, soft retry):**
  - Attempt 1: Update all issues in sprint to "Done" status
  - If fails: Wait 2s, attempt 2
  - If still fails: Log warning, add to sprint file for manual sync via `/sync-linear`
- [ ] Output the **Sprint Wrap-Up** format from `/sprint` Output section:
  - Acceptance criteria report (all issues)
  - Linear status → "In Review" (if not already)
  - Update `docs/roadmap.md`
  - Update `docs/PROJECT_STATE.md`
- [ ] **Check if user already triggered deployment:**
  - If user said "deploy", "push to main", or **"close the sprint"** (or variants): Proceed to deployment immediately
  - If not: Ask "Ready to deploy to production?"
- [ ] **Before deploying:** Verify all safety gates (see `/sprint` production deployment rules)
- [ ] **After safety checks pass:** Merge develop → main and push immediately
- [ ] **After deploy:** Rename sprint file `.active.md` → `.done.md` and update roadmap.md

## Rules

- **Track everything:** Every bug goes in the iteration log
- **New ACs go to spec file:** If user discovers a new requirement, add it to the spec file (with approval)
- **Don't lose context:** Sprint file is your external memory — read it when unsure
- **Don't skip deployment verification:** Every push must be verified before marking fixed

## When to Use

- After `/sprint` completes and user starts testing
- When user says "I found some issues" or "here are bugs"
- When returning to a sprint after a break

## Output

After each batch:
```
## Iteration Update — [date]

### Fixed This Batch
- [x] [description] → [commit]
- [x] [description] → [commit]

### Still Open
- [ ] [description]

### Deployment
- Staging: [status] — [URL]

### Next
[What's left / waiting for more feedback]
```

---

**Start by reading the current sprint file from `docs/sprints/`.**

**Note:** `/iterate` requires an existing active sprint file. If none exists, use `/sprint` to start one.
