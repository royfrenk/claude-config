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
   - After fix verification passes: proceed to 4a

4a. **N-iteration circuit breaker:**
   - Track number of attempts for each bug in sprint file
   - If this is the 3rd failed attempt on same bug:
     - STOP before making 4th attempt
     - Invoke Reviewer to review approach
     - Post to Linear: "⚠️ 3 failed attempts - requesting reviewer guidance"
     - Wait for Reviewer's recommendations before continuing

4b. **Submit to Reviewer (BLOCKING GATE - MANDATORY):**

**This is a HARD GATE. Cannot proceed to 4c without explicit approval.**

**ENFORCEMENT PROTOCOL:**

1. **Before submitting, create checkpoint:**
   - Update spec file: Add note "## Status: AWAITING_REVIEW ([timestamp])"
   - Post to Linear: "⏸️ Submitted for review - deployment blocked until approved"
   - Output to user: "Submitted to Reviewer. Waiting for approval before deployment..."

2. **Submit to Reviewer:**
   - Invoke Reviewer agent with:
     - Issue ID
     - Bug description
     - Fix applied (files changed, approach)
     - Commit hash
     - Verification report (build, lint, tests all PASS)
   - Reviewer posts response to Linear (approval or changes requested)

3. **BLOCKING STATE - Cannot exit until approved:**

   **You are now in a blocking loop. Check Linear for Reviewer response:**

   **Required to proceed:**
   - ✅ Linear issue has comment: "✅ Review: Approved" from reviewer agent
   - ✅ Comment references current commit hash (or iteration batch)
   - ✅ No "🔄 Changes Requested" or "🚫 Blocked" comments AFTER the approval

   **While waiting:**
   - Do NOT push to develop
   - Do NOT skip this step even if user says "urgent" or "deploy now"
   - If user asks status: Report "Waiting for Reviewer approval"
   - You can continue to other bugs in the batch while waiting

   **If review takes >30 minutes:**
   - Check if Reviewer agent is still active
   - If Reviewer not responding: Alert user and suggest invoking Reviewer again

4. **Handle review outcomes:**

   **Outcome A - Approved:**
   - Reviewer posts "✅ Review: Approved" to Linear
   - Update spec file: "## Status: APPROVED ([timestamp])"
   - **Proceed to step 4c (Deploy)**

   **Outcome B - Changes Requested:**
   - Reviewer posts "🔄 Review: Changes Requested (Round [X])" with issues list
   - Update spec file: "## Status: CHANGES_REQUESTED (Round [X])"
   - **Return to step 3 (Fix bugs)** to address feedback
   - After fixing: Return to step 4a (verification)
   - Then resubmit to Reviewer (this becomes Round X+1)

   **Outcome C - Blocked:**
   - Reviewer posts "🚫 Review: Blocked" (security issue, architectural problem)
   - Update spec file: "## Status: BLOCKED"
   - **Escalate to user** - may require architecture change or security fix
   - Do NOT proceed with deployment

5. **Circuit breaker (3 rounds max):**
   - Track review round count in spec file
   - If this is 3rd round of changes requested without approval:
     - Post to Linear: "⚠️ 3 review rounds without approval - escalating"
     - Alert user: "Reviewer has requested changes 3 times. Need guidance."
     - Wait for user decision before continuing

**Fast-track protocol (Production incidents):**
- If Linear issue has label "CRITICAL - Production Incident":
  - Reviewer response time target: 15 minutes (vs 30 min normal)
  - Reviewer prioritizes: security, data integrity, breaking changes
  - Reviewer may defer: style issues, minor optimizations
  - **Fast-track does NOT mean skip review** - approval still required
  - All blocking gates still apply - just faster response

4c. **Deploy after approval:**
   - Push to develop
   - Mark [x] in sprint file with commit hash
   - Verify deployment succeeded
   - Continue until batch complete

4d. **Check-in: Batch Complete (Automatic):**
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
- [ ] Check iteration count - if 3rd attempt, invoke Reviewer before proceeding
- [ ] Commit with proper format (see `~/.claude/rules/task-completion.md`)

### After Fixing
- [ ] **MANDATORY: Submit to Reviewer**
  - [ ] Invoke Reviewer with fix details
  - [ ] Wait for approval before deploying
  - [ ] If changes requested: fix and resubmit
  - [ ] Track iteration count - if 3rd attempt, Reviewer reviews approach
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

**Read review tracking from spec file before outputting:**

For each fixed issue in batch:
1. Read `docs/technical-specs/QUO-##.md`
2. Find "Review Tracking" section
3. Count total rounds for this issue

| Issue | Description | Commit | Review Rounds |
|-------|-------------|--------|---------------|
| QUO-## | [description] | [hash] | [N] rounds, approved |
| QUO-## | [description] | [hash] | [N] rounds, approved |

**Review Summary:**
- Issues fixed this batch: [X]
- Review rounds this batch: [sum]
- All issues reviewed: ✅ / ⚠️ [if any skipped review]

### Still Open
- [ ] [description]

### Deployment
- Staging: [URL]

### What You Should Do Next

1. **Test the fixes on staging:**

   Test each fixed issue:
   - QUO-##: [Specific test instructions for this fix]
   - QUO-##: [Specific test instructions for this fix]

2. **Optional: Run Codex Peer Review**

   This batch has been reviewed by the Reviewer agent ([X] review rounds this batch).

   **Optional AI peer review before continuing:**

   **Options:**
   - **A - Automated Codex:** Tell me "Run Codex review" (~$0.01-0.50, 30 seconds)
   - **B - Manual Review:** I'll generate diff, you review with VS Code Copilot (free, 10-20 min)
   - **C - Skip:** Continue without peer review (fine for low-risk changes)

   **Recommended for:**
   - Infrastructure changes (database, auth, payments)
   - Complex fixes touching multiple systems
   - First-time patterns or approaches
   - Security-sensitive code

   **Skip for:**
   - Simple bug fixes
   - UI-only changes
   - Low-risk iterations

3. **Report findings:**
   - If you find bugs: Tell me "Found issue with [X]"
   - If you have questions: Ask me
   - If fixes need adjustment: Describe what to change

4. **Continue iterating:**
   - Tell me: "More issues to report" (I'll add to next batch)
   - Or: "All good, continue" (I'll mark batch complete)
   - Or: "Ready for production" (I'll prepare for sprint closure)

### Next
[What's left / waiting for more feedback]
```

---

**Start by reading the current sprint file from `docs/sprints/`.**

**Note:** `/iterate` requires an existing active sprint file. If none exists, use `/sprint` to start one.
