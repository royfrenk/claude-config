---
description: Continue iterating on current sprint. Use after /sprint when user reports bugs or issues.
---

# Sprint Iteration

Continue working on the current sprint after user testing reveals bugs or issues.

> **Purpose:** Maintain protocol and context during the bug-fix iteration loop.

## Workflow

1. **Load sprint context:**
   - Read current sprint file from `docs/sprints/` (most recent or user-specified)
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
- [ ] **Verify deployment succeeded** (poll status or ask user)
- [ ] Update sprint file: mark bug as [x] fixed with commit hash
- [ ] Post comment to Linear issue: "Fixed [description] in [commit]"

### After Each Batch
- [ ] Update sprint file with batch summary
- [ ] Show user: what's fixed, what's still open
- [ ] Ask: "More issues, or ready to wrap up?"

### When All Batches Accepted
- [ ] Update sprint file: all bugs marked [x], status → 🟨 Ready for Production
- [ ] Output the **Sprint Wrap-Up** format from `/sprint` Output section:
  - Acceptance criteria report (all issues)
  - Linear status → "In Review" (if not already)
  - Update `docs/roadmap.md`
  - Update `docs/PROJECT_STATE.md`
- [ ] Ask User: "Ready to deploy to production? (Only you can push to main)"

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

If no sprint file exists: `/sprint` should have created one. Ask user which issues are in this sprint, then create using the template from `/sprint`.
