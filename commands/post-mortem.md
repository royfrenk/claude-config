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
3. Read the **Phase Timeline** table from the sprint file to identify where delays occurred
4. Read Linear comments (if `linear_enabled: true` in CLAUDE.md)
5. Read any existing post-mortem files in `docs/post-mortem/`

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

### 5. Propose Harness Changes — Multi-File Impact Scan

**MANDATORY:** Evaluate EVERY file type below. Do NOT stop after the first match. Most failures affect multiple files (a rule, an agent, and a guide).

For each row, answer: "Would updating this file have prevented or caught this failure earlier?"

| File Type | When to Update | Example Change |
|-----------|---------------|----------------|
| `~/.claude/rules/stability.md` | API misuse, platform constraint, race condition, external service issue, data verification gap | Add pattern to relevant section or Quick Reference table |
| `~/.claude/rules/testing.md` | Missing test type, testing gap, verification step that would have caught the bug | Add testing requirement or checklist item |
| `~/.claude/rules/coding-style.md` | Code pattern, file organization, naming, or structural issue | Add or update the relevant pattern |
| `~/.claude/rules/security.md` | Auth, input validation, secrets, config validation gap | Add security check or validation requirement |
| `~/.claude/agents/developer.md` | Developer should have known about this before implementing | Add guide reference to Phase 2 table or Critical Patterns |
| `~/.claude/agents/reviewer.md` | Reviewer should have caught this during code review | Add check to Step 4 Guide Compliance or common issues list |
| `~/.claude/agents/explorer.md` | Explorer should have flagged this during exploration | Add to exploration workflow or data verification steps |
| `~/.claude/agents/plan-writer.md` | Plan-Writer should have accounted for this in the plan | Add planning note or task dependency consideration |
| `~/.claude/agents/em.md` | Coordination gap, missing gate, or escalation failure | Add gate check or escalation rule |
| `~/.claude/guides/*.md` | Existing guide needs updating, or new guide section needed | Update the relevant guide with the pattern |
| `~/.claude/commands/*.md` | Command needs a new step or check | Update the command file |

**Output your scan as a table — one row per file type, with explicit Yes/No:**

```markdown
## Multi-File Impact Scan

| File | Affected? | What to Change |
|------|-----------|----------------|
| `rules/stability.md` | Yes / No | [specific change or "---"] |
| `rules/testing.md` | Yes / No | [specific change or "---"] |
| `rules/coding-style.md` | Yes / No | [specific change or "---"] |
| `rules/security.md` | Yes / No | [specific change or "---"] |
| `agents/developer.md` | Yes / No | [specific change or "---"] |
| `agents/reviewer.md` | Yes / No | [specific change or "---"] |
| `agents/explorer.md` | Yes / No | [specific change or "---"] |
| `agents/plan-writer.md` | Yes / No | [specific change or "---"] |
| `agents/em.md` | Yes / No | [specific change or "---"] |
| `guides/*.md` | Yes / No | [which guide, specific change or "---"] |
| `commands/*.md` | Yes / No | [which command, specific change or "---"] |
```

**Rules for this scan:**
- At least 1 file must be affected (if nothing, the root cause analysis is incomplete)
- If only `stability.md` is affected, you MUST explain why no agent, guide, or command file needs updating
- Think about the full chain: who writes the code (developer), who reviews it (reviewer), who plans it (plan-writer), who explores it (explorer), who coordinates it (em) -- could any of them have caught this?

**After completing the scan, present proposed changes to User:**

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
- **Never write learnings to MEMORY.md** -- MEMORY.md is for session-level context (user preferences, project patterns), not for technical knowledge discovered in post-mortems. Route all learnings to proper harness files:

  | Learning Type | Target File | Example |
  |---------------|-------------|---------|
  | Platform constraint | New or existing guide in `~/.claude/guides/` | WKWebView quirks -> `guides/capacitor-wkwebview.md` |
  | API gotcha | `~/.claude/rules/stability.md` (API Misuse table) | `position:fixed` broken in Capacitor |
  | Testing insight | `~/.claude/rules/testing.md` or `guides/testing-patterns.md` | "Playwright WebKit != WKWebView" |
  | Process improvement | Relevant agent or command `.md` file | Add review step to `reviewer.md` |
  | Project-specific config | Project's `CLAUDE.md` or `docs/PROJECT_STATE.md` | Architecture constraints |

## Integration

- Post-mortems feed into `/audit` (stale docs check)
- Post-mortems feed into `/change-process` (systematic updates)
- Post-mortem learnings are distributed across rules, agents, guides, and commands via the Multi-File Impact Scan (Step 5)
- Recurring patterns (3+ similar post-mortems) should become mechanical enforcement (hooks)
