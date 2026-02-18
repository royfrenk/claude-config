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

**What:** Spec files for issues that are "Done" or "Canceled" in roadmap.md. Candidates for archival.

**How:**
1. Read `docs/roadmap.md`
2. Extract issue IDs from "Recently Completed" section
3. Check if `docs/technical-specs/{ISSUE_ID}.md` still exists for each

**Fix:** Move to `docs/technical-specs/archive/` (create directory if needed).

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
