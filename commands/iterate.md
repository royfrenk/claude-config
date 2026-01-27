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

## Sprint File Template

When creating a new sprint file, use this structure:

```markdown
# Sprint [###]: [Name]

**Status:** 🟨 Iterating
**Started:** [date]
**Issues:** [QUO-##, QUO-##]

## Issues in Sprint

| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| QUO-## | [Title] | [spec](../technical-specs/QUO-##.md) | 🟨 Iterating |

## Iteration Log

### Batch 1 — [date time]
Reported by User:
1. [ ] [description] → [QUO-## or "unclear"]
2. [x] [description] → fixed in [commit]

### Batch 2 — [date time]
...

## New Acceptance Criteria Discovered

| Issue | New AC | Added to Spec |
|-------|--------|---------------|
| QUO-## | [description] | ✓ |

## Notes
[Context, decisions, blockers]
```

## Rules

- **Same protocols apply:** Commit format, deployment verification, Linear updates
- **Track everything:** Every bug goes in the iteration log
- **New ACs go to spec file:** If user discovers a new requirement, add it to the spec file (with approval)
- **Don't lose context:** Sprint file is your external memory — read it when unsure

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

**Start by reading the current sprint file from `docs/sprints/`. If none exists, ask which issues are in this sprint and create one.**
