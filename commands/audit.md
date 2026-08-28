---
description: On-demand codebase health check. Scans for stale docs, oversized files, drift, and orphaned specs. Interactive cleanup.
---

# Codebase Audit

On-demand health check inspired by the "garbage collection" pattern from harness engineering. Scans, reports, asks approval, then cleans up.

## Workflow

### 1. Scan All Categories

Run all 6 checks below. Collect findings silently -- do not output until all scans complete.

### 2. Present Findings

Output a single consolidated report:

```markdown
## Codebase Audit Report — [date]

| Category | Findings | Severity |
|----------|----------|----------|
| Stale Spec Files | [count] | [info/warn/action] |
| PROJECT_STATE.md Drift | [count] | [info/warn/action] |
| Oversized Files | [count] | [info/warn/action] |
| Dead Technical Specs | [count] | [info/warn/action] |
| Orphaned Design Specs | [count] | [info/warn/action] |
| Roadmap vs Linear Drift | [count] | [info/warn/action] |

### Details
[Per-category details below]
```

### 3. Ask for Approval

For each category with findings:
```
Fix [category]? (yes/no/skip)
```

### 4. Execute Approved Fixes

Make changes, summarize what was cleaned up.

---

## Scan Categories

### A. Stale Spec Files

**What:** Spec files with status "In Progress" or "Exploration Complete" that no active sprint references.

**How:**
1. Read all `docs/technical-specs/*.md` files
2. Check status field in each
3. Read all `docs/sprints/*.active.md` files
4. If a spec shows "In Progress" but no active sprint mentions its issue ID --> stale

**Fix:** Update spec status to "Stalled" and add note with date.

### B. PROJECT_STATE.md Drift

**What:** File structure section lists directories or key files that no longer exist, or misses new ones.

**How:**
1. Read `docs/PROJECT_STATE.md`
2. Extract listed directories and key files from the file structure section
3. Verify each path exists using Glob
4. Check for new top-level directories not listed

**Fix:** Update the file structure section to match reality.

### C. Oversized Files

**What:** Source files exceeding 400 lines (warn) or 800 lines (action required).

**How:**
1. Glob for `src/**/*.{ts,tsx,js,jsx,py,swift}`
2. Count lines in each
3. Flag files over 400 lines

**Fix:** Report only -- do not auto-refactor. Output:
```
[file] — [lines] lines (target <400, max 800)
Suggestion: [where to split based on file contents]
```

### D. Dead Technical Specs

**What:** Spec files for issues that are "Done" or "Canceled" in roadmap.md, per `~/.claude/guides/spec-file-lifecycle.md`.

**How:**
1. Read `docs/roadmap.md`
2. Extract issue IDs from "Recently Completed" section
3. Check `docs/technical-specs/{ISSUE_ID}*.md` for each — flag three failure modes: (a) no file at all matches (never had a local spec — see the "every Linear ticket gets a local spec" rule), (b) a file exists but is NOT suffixed `.CLOSED.md` (EM's sprint-closure rename was missed — a ticket should never be "Recently Completed" while its spec still says `.IN-PROCESS` or carries no suffix), or (c) roadmap.md's own `[spec](technical-specs/{ID}...)` link text doesn't match the actual resolved filename (a rename happened but the roadmap link pointing at it wasn't updated — a real dead link, not just a suffix mismatch; this exact bug happened once already in this project when 46 files were renamed and the links weren't caught until a follow-up audit).

**Fix:** For (a), create a stub spec per the template in `~/.claude/commands/sync-roadmap.md`. For (b), rename to `.CLOSED.md` — no content change, `mv` only. For (c), rewrite the roadmap.md link text to match the real filename — this must happen in the SAME pass as (b), never deferred, since a rename with no link update is worse than no rename (silent breakage vs. visible staleness). Deeper archival to `docs/technical-specs/archive/` is a separate, optional step for very old tickets, not required just because a ticket is `.CLOSED`.

**Also check (d) abandoned `.IN-PROCESS` files:** glob `docs/technical-specs/*.IN-PROCESS.md` and cross-check each ID against `docs/roadmap.md`'s "Active Sprint" section. Any `.IN-PROCESS` file for an issue NOT referenced by the current active sprint (or when there is no active sprint at all) is stale — flag it per `~/.claude/guides/spec-file-lifecycle.md`'s "Abandoned `.IN-PROCESS` tickets" section. Don't auto-rename; surface it for a human/EM decision (resume vs. drop back to backlog).

### E. Orphaned Design Specs

**What:** Design spec files with no matching technical spec or roadmap entry.

**How:**
1. Glob `docs/design-specs/*-design.md`
2. Extract issue IDs from filenames
3. Check if matching technical spec exists
4. Check if issue appears in roadmap.md

**Fix:** Report only. Ask User: "Archive or keep?"

### F. Roadmap vs Linear Drift

**What:** Status mismatches between roadmap.md and Linear (if enabled).

**How:**
1. Read `CLAUDE.md` for `linear_enabled`
2. If false: Skip this check entirely
3. If true: Read roadmap.md, query Linear for each active issue, compare statuses

**Fix:** Delegate to `/sync-roadmap` command. Output: "Run `/sync-roadmap` to reconcile."

---

## Output Format

After all approved fixes are executed:

```markdown
## Audit Complete — [date]

**Scanned:** [X] categories
**Findings:** [Y] total
**Fixed:** [Z] items
**Skipped:** [W] items (User chose to skip)

### Changes Made
- [Category]: [what was done]

### Remaining (User Skipped)
- [Category]: [what was skipped and why]

### Recommendations
- [Any recurring patterns observed]
```

## Rules

- **Interactive, not autonomous** -- always ask before changing anything
- **Non-destructive by default** -- archive, don't delete
- **Report oversized files but don't auto-refactor** -- splitting files needs human judgment
- **Skip Linear check if disabled** -- respect `linear_enabled` flag
- **Fast** -- scan all categories in parallel where possible
