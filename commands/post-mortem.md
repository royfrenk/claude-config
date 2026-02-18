---
description: Capture agent mistakes and feed learnings back into the harness. Creates structured post-mortem and proposes harness changes.
---

# Post-Mortem

Capture what went wrong, why the agent failed, and what harness change would have prevented it. Every post-mortem results in at least one file update.

**Usage:** `/post-mortem [issue-id]` or `/post-mortem` (will ask for context)

## Workflow

### 1. Gather Context

If issue ID provided:
1. Read the spec file: `docs/technical-specs/{ISSUE_ID}.md`
2. Read the sprint file (find active or most recent `.done.md` referencing this issue)
3. Read Linear comments (if `linear_enabled: true` in CLAUDE.md)
4. Read any existing post-mortem files in `docs/post-mortem/`

If no issue ID:
- Ask: "What went wrong? Describe the agent failure."
- Ask: "Which issue or sprint was this related to?"

### 2. Classify the Failure

Determine the failure category:

| Category | Description | Example |
|----------|-------------|---------|
| **Agent Mistake** | Agent used wrong API, wrong pattern, or made incorrect assumption | Used SQL.js API instead of better-sqlite3 |
| **Process Gap** | Workflow didn't catch the problem | Reviewer didn't check iOS-specific requirements |
| **Missing Knowledge** | Information wasn't in any doc the agent could read | iOS OAuth requires SPM bridge, not documented |
| **API Misuse** | Used library/framework incorrectly | Wrong passport strategy configuration |
| **Stale Documentation** | Docs said one thing, reality was different | Callback URL in docs didn't match code |

Ask User to confirm or correct the classification.

### 3. Identify Root Cause

Ask:
- "What was missing from the harness that would have prevented this?"
- "Is this a one-off or could it happen again in similar situations?"

### 4. Create Post-Mortem File

Create `docs/post-mortem/YYYY-MM-DD-[slug]-[ISSUE-ID].md`:

```markdown
# Post-Mortem: [Issue ID] - [Short Title]

**Date:** YYYY-MM-DD
**Severity:** [Low / Medium / High]
**Category:** [Agent Mistake / Process Gap / Missing Knowledge / API Misuse / Stale Documentation]
**Issue:** [Linear URL or issue ID]

## What Happened

[Description of the failure -- what the agent did wrong and what the impact was]

## Root Cause

[Why the agent failed -- what was missing from the harness]

## Timeline

1. [Step where things went right]
2. [Step where things went wrong] <-- failure point
3. [How it was discovered]
4. [How it was fixed]

## Harness Changes Made

| File | Change | Why |
|------|--------|-----|
| [file path] | [what was added/changed] | [how it prevents recurrence] |

## Prevention

[How this type of failure is now prevented -- reference the specific file changes above]

## Lessons Learned

- [Key takeaway 1]
- [Key takeaway 2]
```

### 5. Propose Harness Changes

Based on the root cause, propose specific file updates:

**For Missing Knowledge:**
- Add a checklist or section to the relevant guide file
- Example: Add "iOS OAuth Checklist" to `~/.claude/guides/google-auth.md`

**For Process Gaps:**
- Add a check to the relevant agent or command
- Example: Add "Verify platform-specific requirements" to reviewer.md

**For API Misuse:**
- Add the correct pattern to `~/.claude/rules/stability.md` API Misuse table
- Add integration test requirement to `~/.claude/rules/testing.md`

**For Stale Documentation:**
- Update the stale document
- Add a cross-reference check to `~/.claude/commands/audit.md`

**For Agent Mistakes:**
- Encode the correct behavior into a guide or rule
- Consider if a hook could mechanically enforce it

Present changes to User:
```markdown
## Proposed Harness Changes

### 1. [file path]
**Section:** [which section]
**Change:** [what to add/modify]
**Prevents:** [recurrence of this specific failure]

### 2. [file path]
...

Apply these changes? (yes/no/modify)
```

### 6. Execute Approved Changes

1. Make all approved file updates
2. Update the post-mortem file "Harness Changes Made" table
3. Commit changes

## Rules

- **Every post-mortem must result in at least one file change** -- if there is nothing to change, the post-mortem is incomplete (push harder on root cause)
- **Don't just document -- fix** -- the goal is harness improvement, not documentation
- **Be specific** -- "improve testing" is not a harness change; "add iOS platform check to reviewer.md Step 3A" is
- **Check for existing post-mortems** -- avoid duplicate lessons; reference and extend existing ones
- **Severity guide:**
  - **Low:** Agent wasted time but self-corrected; minor harness gap
  - **Medium:** Required human intervention to fix; caused incorrect deployment
  - **High:** Caused production issue, data loss, or security vulnerability

## Integration

- Post-mortems feed into `/audit` (stale docs check)
- Post-mortems feed into `/change-process` (systematic updates)
- Post-mortem patterns feed into `~/.claude/rules/stability.md`
- Recurring patterns (3+ similar post-mortems) should become mechanical enforcement (hooks)
