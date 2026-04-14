# Create Bug

User hit a bug mid-development. Capture it fast, with bug-specific discipline: reproduction, environment, screenshots, and a reminder to fix the underlying cause (not just the symptom).

**Input:** $ARGUMENTS

## Your Goal

File a Linear bug ticket with:
- Title that names the symptom
- Reproduction steps
- Expected vs actual behavior
- Environment (device, OS, browser, build, env, account)
- Screenshots (auto-copied from `~/Desktop`; user never touches the file)
- Priority on the bug scale: P0 / P1 / P2 / P3
- Labels: `bug` + `Area > X`
- Status: Todo (unassigned)
- Default project/milestone: **none** (Backlog)
- Fix Checklist (reminder, NOT blocking close)

This command is **fast capture** by default. For P0/P1 it asks whether to start fixing now, but it does not auto-pivot.

## Priority Scale (Bugs)

| Priority | Label | Linear urgency | Meaning |
|----------|-------|----------------|---------|
| P0 | Showstopper | 1 (Urgent) | App broken, data loss, security — everything stops |
| P1 | Major | 2 (High) | Core feature broken for many users |
| P2 | Regular | 3 (Medium) | Limited impact or workaround exists |
| P3 | Minor | 4 (Low) | Cosmetic, small inconvenience |

> Bugs use **P0-P3 only**. Feature priority (P1-P4 in existing roadmaps) is a separate scale; this command does not modify features.

## Linear Configuration Check

Before doing anything, read the project's CLAUDE.md and resolve:
- `linear_enabled: true/false` (default: false if missing)
- `Team ID: <uuid>` (required if enabled)
- `Issue Prefix: <PREFIX>`
- Status UUIDs (Backlog, Todo, In Progress)

**Behavior:**
- `linear_enabled: false` → Workflow A (roadmap.md + local bug-reports folder only)
- `linear_enabled: true` and Team ID missing → Error: "Linear enabled but Team ID not found in CLAUDE.md"
- `linear_enabled: true` and Team ID present → Workflow B (Linear + roadmap.md + local bug-reports folder)

Validate the directory prefix matches CLAUDE.md. Warn on mismatch.

## How to Get There

Ask targeted questions, briefly. Typical needs:
- Summary (if unclear from input)
- Reproduction steps
- Expected vs actual behavior
- Priority (P0-P3)
- Environment (device/OS/browser/build)
- Initial theory about cause (optional — leave blank if none)

**Minimum viable ticket gate:** required = Summary + Priority + ANY ONE of {Reproduction, Screenshot, Log excerpt, Error message}. If any of the required are missing after questioning, ask once more. If still missing, abort: "Cannot file bug without minimum fields. Aborting."

## Pre-Flight (Run in Parallel)

Before creating the ticket, execute these in one parallel batch:

1. **Duplicate search** (Workflow B only): `mcp__linear__list_issues` with `{ team: <team>, state: { neq: "Done" } }` limit ~50, sorted by `updatedAt desc`.
2. **Area labels**: `mcp__linear__list_issue_labels` with team ID to find the `Area` parent group and existing children.
3. **`bug` label**: `mcp__linear__list_issue_labels` — check for a top-level (no parent) `bug` label.
4. **Active sprint**: `Glob docs/sprints/*.active.md`.
5. **Projects + milestones** (only needed if P0/P1 "yes" branch is taken later).
6. **Git root**: `git rev-parse --show-toplevel` → `$GIT_ROOT`.
7. **Desktop screenshots**: `ls -lt ~/Desktop/Screen\ Shot*.png ~/Desktop/Screenshot*.png 2>/dev/null | head -5 || true` — covers both macOS naming patterns, graceful on zero matches.

## Duplicate Detection

After pre-flight, compute case-insensitive token overlap between the proposed title and each candidate's title (stopwords removed: `the, a, an, and, or, of, on, in, to, for, when, with, is`).

- Keep top 3 candidates with overlap ≥ 2 tokens, ordered by overlap count desc, then by `updatedAt desc`.
- If any match: surface to user:
  ```
  Possible duplicate of existing open issue(s):
  1. RAB-148 — "In-app feedback: written + voice recording"
  2. RAB-130 — "Voice note fails silently on iOS 17"
  Is this the same bug? (1/2/3 to abort and comment on that one, n to continue)
  ```
- If user picks a number: add a comment to the existing ticket via `mcp__linear__save_comment` with the new repro details and end. Do NOT create a new ticket.
- If `n`: proceed.

## Screenshot Folder (Slug-Based)

The folder is named by a stable slug, determined BEFORE any Linear call:

1. Slug = `<YYYYMMDD>-<kebab-case-title>` truncated to ~60 chars.
   Example: `2026-04-14-feedback-silent-on-desktop`
2. Target directory:
   - If `$GIT_ROOT/docs/` exists → `$GIT_ROOT/docs/bug-reports/<slug>/`
   - Else → `$GIT_ROOT/bug-reports/<slug>/`
3. **Collision rule:** if target directory exists and is non-empty, append `-2`, `-3`, etc., until an unused name is found. Never overwrite.
4. The final directory is the value written into the ticket body's `Screenshots` path.

If no screenshots were chosen and no files will be copied, skip the folder entirely (omit the Screenshots section from the ticket body).

## Sensitive Content Gate

Before any `cp` into the repo, ask:
```
⚠️ About to save screenshots to <GIT_ROOT>/docs/bug-reports/<slug>/
These will be committed with the next commit. Review for:
 - Passwords, API keys, tokens
 - Personal info (phone, address, customer data)
 - Internal URLs or system details
Proceed? (y/N)
```
Default is No. If user declines, skip the screenshot copy and omit the Screenshots section from the body.

## Fix Order (Preventing Orphans)

1. Generate slug, resolve git root.
2. Run pre-flight (parallel).
3. Duplicate detection + user confirm.
4. Minimum viable gate check.
5. Build the full body in memory (with the final folder path).
6. **Create the ticket** via a SINGLE `save_issue` call (Workflow B) or update `roadmap.md` (Workflow A).
7. **ON SUCCESS ONLY**: `mkdir -p <folder>` and `cp <sources> <folder>/screenshot-N.png`.
8. **If cp fails** after ticket is live: surface explicitly — "Ticket RAB-150 filed successfully, but screenshot copy failed: <reason>. Retry manually: `cp ... <folder>/`." Do not retry silently.

Body references the folder path even though the folder is created after ticket creation. This is intentional — one agent owns both steps, failure is surfaced, and it eliminates webhook noise from a two-phase save.

## Workflow A: Roadmap Only (linear_enabled: false)

No Linear. Folder naming still uses the slug rule.

1. Execute pre-flight + duplicate scan via roadmap grep (look for similar titles in `docs/roadmap.md` Bugs section).
2. Ask sensitive-content question, then proceed with in-memory body.
3. Append to `docs/roadmap.md` under `## Bugs` subsection (create the section if missing):
   ```markdown
   | <PREFIX>-## | [Title] | Showstopper (P0) | — | [1-2 line summary] | [bug-reports](bug-reports/<slug>/) |
   ```
4. If no CLAUDE.md prefix: use `bug-YYYYMMDD-HHMM` as the ticket ID.
5. ON SUCCESS: mkdir + cp screenshots.

Skip P0/P1 "start now" prompt in Workflow A (no Linear state to transition).

## Workflow B: Linear + Roadmap (linear_enabled: true)

### bug label (top-level, no parent)

- If existing `bug` label found (top-level, no parent): use it.
- If missing: try `mcp__linear__create_issue_label` with `{ name: "bug", teamId: <team> }` (NO parent — this is a flat top-level label, sibling to the `Area` group).
- If creation fails: retry once.
- If still failing after 2 attempts: surface warning to user:
  ```
  ⚠️ Could not create or find `bug` label after 2 attempts. Proceeding with labels = ["Area > X"] only. Add the `bug` label manually in Linear when convenient.
  ```
  Create the ticket anyway with the Area label only. Losing the `bug` label is preferable to losing the whole ticket. Never fail silently.

### Area > X label

Match the bug to an existing `Area > X` child label under the `Area` parent group. If none fits, briefly ask the user: "No existing Area label fits. Create new `Area > [Name]`? Suggested: [name]." Create via `create_issue_label` with `parent: <Area group ID>` and `teamId`.

### Default project / milestone

Bugs default to **Backlog**: pass `project: null, projectMilestone: null`. This overrides the create-issue auto-attach behavior.

**Exception:** If user later answers `yes` to the P0/P1 "start now?" prompt AND an active sprint exists, attach then (see P0/P1 section).

### Body template

```markdown
## Summary
[One-line symptom statement]

## Reproduction
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What happens instead]

## Environment
- Device: [e.g., iPhone 15 Pro, MacBook M2]
- OS: [e.g., iOS 17.4, macOS 14.5]
- Browser: [if applicable]
- Build: [commit hash or version]
- Environment: [staging / production / local]
- Account: [user ID or email, if relevant]

## Screenshots
docs/bug-reports/<slug>/

## Notes
[Any logs, error messages, extra context]

<!-- Optional — only rendered if user supplied a theory -->
## Root Cause Hypothesis
[User's initial theory]

## Fix Checklist
- [ ] Symptom fixed
- [ ] Underlying cause identified
- [ ] Underlying cause fixed
- [ ] Regression test added

_Note: Fix Checklist is a reminder, not a blocker for closing the ticket._
```

**Template rules:**
- `## Root Cause Hypothesis` is **conditional**. Omit entirely if user has no theory. No dead-weight "unknown — TBD" placeholder.
- `## Screenshots` is omitted if no screenshots were attached.
- `## Notes` is used for error messages, log excerpts, and free-form context. This is where "error message in notes" lives when it's the evidence that satisfies the minimum-viable gate.

### save_issue call

```
mcp__linear__save_issue(
  team: <team-id>,
  title: "[Bug] <concise symptom>",
  description: <body-built-in-memory>,
  labels: ["bug", "Area > X"],           // or ["Area > X"] only on bug-label fallback
  project: null,                          // explicit — override create-issue inheritance
  projectMilestone: null,                 // explicit
  blockedBy: [],                          // bugs rarely have pre-declared dependencies
  priority: <1|2|3|4>,                    // P0=1, P1=2, P2=3, P3=4
  state: <Todo UUID from CLAUDE.md>       // Always Todo unless P0/P1 + yes branch
)
```

ON SUCCESS: proceed to screenshot copy (see Fix Order above).

## P0/P1 Prompt

If priority is P0 or P1, after ticket is created, ask once:

```
⚠️ This is P[0|1] — start fixing now? (yes / no / later)
```

Default is `later` (safest: persists deferral, doesn't silently begin investigation).

### Parser rules

Tokenize (case-insensitive) the user's answer:

- **Deferral tokens:** `tomorrow, later, soon, after, eventually, not now, idk, unsure, maybe, not sure`
- **Affirmative tokens:** `yes, y, yeah, yep, ok, sure, start, go, now`
- **Negative tokens:** `no, n, nope, skip, cancel`

**Precedence:** Deferral wins over affirmative. If any deferral token is present (e.g., "yes let's do it tomorrow"), treat as `later`.

- Pure affirmative (no deferral) → `yes`
- Pure negative → `no`
- No recognizable token → re-prompt ONCE: "That was ambiguous — please answer yes, no, or later." If still ambiguous → default to `later`.

### Branch: `yes`

Do NOT silently pivot into a fix session. Confirm:

```
Switching to fix mode. What should I do?
  y     = use current branch
  new   = create a new sprint branch
  cancel = just mark the ticket In Progress and end the command
```

- `y` → stay on current branch.
- `new` → prompt for a branch name, create it.
- `cancel` → transition ticket to In Progress (if `In Progress` UUID is configured; otherwise warn and skip the transition), end command. Do not begin investigation.

If the user proceeds (`y` or `new`), AND an active sprint exists, attach the ticket: `project: <active>, projectMilestone: <current>`. Then begin inline investigation: reproduce → hypothesize → fix → verify.

If `In Progress` UUID is not configured in CLAUDE.md: surface warning "In Progress UUID not configured. Starting work; set status manually if needed." Proceed anyway — work is not blocked by metadata.

### Branch: `no`

Ticket stays in Todo. End command.

### Branch: `later`

Ticket stays in Todo. Add a comment to the ticket so the deferral is persisted, not lost:

```
mcp__linear__save_comment(
  issue: <RAB-150>,
  body: "[<YYYY-MM-DD>] User flagged P[0|1] but deferred immediate action."
)
```

End command.

## Roadmap Update

Add the bug to the `## Bugs` subsection in `docs/roadmap.md` (create the section if missing, between `## Backlog` and `## Recently Completed`):

```markdown
## Bugs

| ID | Title | Priority | Est | Context | Spec |
|----|-------|----------|-----|---------|------|
| RAB-150 | [Title] | Showstopper (P0) | — | [1-2 line summary] | [bug-reports](bug-reports/<slug>/) |
```

Priority labels use the verbose format, matching existing roadmap convention:
- P0 → `Showstopper (P0)`
- P1 → `Major (P1)`
- P2 → `Regular (P2)`
- P3 → `Minor (P3)`

## Critical Workflow (One Response)

After asking clarifying questions, execute the following in a SINGLE response with parallel tool calls where possible. Do not pause mid-flow.

1. Pre-flight (parallel): list labels, list issues (duplicate scan), glob active sprint, check git root, list Desktop screenshots.
2. Duplicate confirm.
3. Build body in memory.
4. Sensitive content gate.
5. Create `bug` label if needed.
6. `save_issue` (Workflow B) or `Edit roadmap.md` (Workflow A).
7. ON SUCCESS: mkdir + cp screenshots.
8. Edit roadmap.md to add Bugs row (Workflow B).
9. P0/P1 prompt + branch behavior.

## Behavior Rules

- Be conversational, not a checklist. Ask what makes sense.
- Keep questions brief. One message with 2-3 targeted questions beats a series.
- Total exchange target: under 2 min for P2/P3, slightly longer for P0/P1 due to "start now" prompt.
- Never investigate root cause at filing time unless user answered `yes` to P0/P1 and chose to proceed. Root cause is `/debug`'s job (future command).
- Never touch the user's Desktop screenshots — `cp`, not `mv`.
- Never fail silently. Every failure (label creation, screenshot copy, ticket save) surfaces a specific message.

## Known v1 Limitations

- **Desktop-only screenshot source.** If screenshots are elsewhere (e.g., `/tmp`, Finder drag), pass a path as an argument or skip and attach manually.
- **No OCR / secret detection.** The sensitive content warning relies on user judgment.
- **No cross-repo dedup.** Duplicate scan only looks at the current Linear team.
- **Fix Checklist is reminder-only.** Does not block closing the ticket.
- **Screenshots live in the repo** and are committed. Cloud storage (Drive, Supabase) is deferred to v2.
