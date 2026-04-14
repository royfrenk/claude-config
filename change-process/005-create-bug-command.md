---
name: 005-create-bug-command
date: 2026-04-14
status: approved-to-execute
infra_audit_rounds: 3
change_review_rounds: 3
---

## Proposed Plan

Add a new global command `/create-bug` that files Linear bug tickets with bug-specific discipline:
- P0-P3 priority scale (mapped to Linear urgency 1-4)
- Required reproduction steps + expected/actual behavior
- Environment capture (device, OS, browser, build, env, account)
- Screenshot handling: auto-copy from `~/Desktop/Screenshot*` to `docs/bug-reports/<TICKET_ID>/` (user never touches file)
- Root cause hypothesis slot
- Fix checklist (symptom fixed, underlying cause identified, underlying fixed, regression test) — reminder, NOT blocking
- `bug` label in addition to Area > X label
- Unassigned by default, Todo status
- P0/P1 prompt: "⚠️ This is P[0/1] — start fixing now? (yes / no / later)" — does NOT auto-start
- Roadmap update: separate "Bugs" subsection in roadmap.md

Scope: global (`~/.claude/commands/create-bug.md`).
Cross-tool sync: Phase A scope = true (Codex primary, Gemini side-effect).

### Files

1. **CREATE** `~/.claude/commands/create-bug.md` — new command file
2. **UPDATE** `~/.claude/README.md` — add `/create-bug` to Commands table + Global File Structure
3. **UPDATE** `~/.claude/guides/cross-tool-parity-phase-a.json` — add `create-bug` to `phase_a_scope` array + commands map
4. **CREATE** `~/.claude/change-process/005-create-bug-command.md` — this tracking file

### Out of scope (future)

- `/debug` command — bug-shaped sibling of `/iterate` with mandatory reproduce → hypothesize → fix-symptom → fix-underlying → regression-test gates. Deferred until `/create-bug` has been used in practice.
- Cloud storage for screenshots (Drive, Supabase) — deferred until local repo path becomes a pain point.
- Blocking close on fix checklist — reminder-only for v1.

## User Review

**Feedback:** Approved without changes. Specific confirmations:
- Separate "Bugs" subsection in roadmap.md (not interleaved with features)
- P0/P1 prompt wording is good
- Codex sync is primary; Gemini is fine as side-effect

**Changes made:** None.

## Infrastructure Audit Round 1

**Verdict:** FIX BEFORE EXECUTE
**Report:** `/tmp/change-process-audit-20260414-create-bug-layer1.md`

**Findings (9 blocking + non-blocking):**
1. Priority scale collision (P0-P3 vs existing P1-P4) — document explicit mapping
2. Two-phase save_issue may clobber metadata — use metadata re-pass pattern
3. Missing `linear_enabled: false` Workflow A branch
4. `bug` label creation unverified (no parent group) — add manual fallback
5. Empty `~/Desktop/Screenshot*` case errors — handle gracefully
6. P0/P1 prompt branches (yes/no/later) unspecified — must define side effects, especially `later` persistence
7. `cross-tool-sync.md` Phase A table + command count not updated — two-surface drift
8. README.md roadmap template + per-project `docs/` tree not updated — new projects won't have Bugs section or `bug-reports/` folder
9. `bug` label case convention not pinned

**Changes made in response (plan revision for round 2):**

### A. Priority scale — explicit mapping documented
- Bugs use P0-P3 (new): P0=Showstopper, P1=Major, P2=Regular, P3=Minor
- Features continue using P1-P3 (existing, per roadmap)
- P1/P2/P3 semantics overlap between bugs and features (same Linear urgency)
- Only P0 is bug-exclusive
- `create-bug.md` gets a dedicated "Priority Mapping" section showing Linear urgency integers (1-4) explicitly

### B. Screenshot flow — simplified, no temp folder
1. Pre-flight (parallel): list Desktop screenshots with `ls -lt ~/Desktop/Screenshot* 2>/dev/null || true`, list Linear labels, list projects, find active sprint, check `[ -d docs ]`
2. Ask user which screenshots belong to this bug (or proceed without if none)
3. **Create Linear ticket first** (title, labels, priority, state — NOT the body yet, or body with `Screenshots: [to be linked]` placeholder)
4. Get ticket ID (e.g., RAB-150)
5. Create target folder: `mkdir -p docs/bug-reports/RAB-150/` (or `bug-reports/RAB-150/` fallback)
6. Copy screenshots: `cp <source> docs/bug-reports/RAB-150/screenshot-N.png` (cp, not mv; user's original untouched)
7. **Update ticket body** via `save_issue(issueId=RAB-150, description=<final body>, labels=<same>, state=<same>, priority=<same>)` — re-pass all metadata to prevent clobbering

### C. Workflow A / Workflow B branches — inherit from create-issue
Explicit Workflow A section (roadmap only, linear_enabled: false) mirrors create-issue structure.

### D. `bug` label creation — manual fallback
```
1. list_issue_labels (no parent filter)
2. If 'bug' exists → use it
3. If missing: try create_issue_label(name: "bug", teamId: <team>)
   - If this fails (MCP error, permissions, unknown field): surface error to user,
     ask them to create lowercase 'bug' label manually in Linear UI, then continue
4. Never fall back silently — always surface the state
```

### E. Empty Desktop screenshot case
Use `2>/dev/null || true` on the `ls` command. Handle zero matches cleanly: skip screenshot flow and proceed without.

### F. P0/P1 prompt branches — explicit behaviors
- `yes` → transition ticket to In Progress (per CLAUDE.md status UUID), begin investigation inline in current conversation (reproduce → hypothesize → fix → verify)
- `no` → ticket stays in Todo, command ends
- `later` → ticket stays in Todo, **add a comment to the Linear ticket** via `mcp__linear__save_comment`: `"[DATE] — User flagged P[0/1] but deferred immediate action."` This persists the deferral so it's not lost.

### G. `cross-tool-sync.md` — add to update list
Update these sections:
- § "Commands (11 of 16 synced)" → "Commands (12 of 17 synced)", add `create-bug` to synced list
- § "Phase A Parity Contracts" table → add row for `create-bug` with `Yes / Standard command / Single-agent adaptation / Single-agent adaptation / PASS required`
- § "Phase A complete means" bullet → add `create-bug` to the command name list (between `context` and `create-issue`, alphabetical)

### H. README.md template updates
- § "Per-Project Files" tree → add `│   ├── bug-reports/              # Bug report assets (screenshots)` under `docs/`
- § "roadmap.md Template" → add a `## Bugs` section between `## Backlog` and `## Recently Completed`:
  ```markdown
  ## Bugs

  | ID | Title | Priority | Est | Context | Spec |
  |----|-------|----------|-----|---------|------|
  | PROJ-## | [Title] | P0 | — | [1-2 line summary] | [bug-reports](bug-reports/PROJ-##/) |
  ```

### I. `bug` label case — pinned lowercase, no parent
Documented explicitly in `create-bug.md`: lowercase `bug`, top-level (no Area group parent), sibling to the Area > X group.

### Summary of files after revision

1. **CREATE** `~/.claude/commands/create-bug.md` (revised per A-F, I)
2. **UPDATE** `~/.claude/README.md` (original changes + H)
3. **UPDATE** `~/.claude/guides/cross-tool-parity-phase-a.json` (unchanged from round 1)
4. **UPDATE** `~/.claude/guides/cross-tool-sync.md` (new: G)

Recap Rabbit `CLAUDE.md` update deferred as non-blocking.

## Infrastructure Audit Round 2

**Verdict:** FIX BEFORE EXECUTE
**Report:** `/tmp/change-process-audit-20260414-create-bug-layer1-r2.md`

**Blockers (4) + non-blockers (4):**
1. `save_comment` vs `create_comment` naming drift — confirmed `save_comment` is current MCP name; legacy files use `create_comment` (drift, not this change's problem)
2. P4 exists in the wild (RAB-149 uses `Low (P4)`) — plan claims features use P1-P3, contradicts data
3. Workflow A screenshot/ID scheme unspecified (no Linear ID when linear_enabled: false)
4. `In Progress` UUID assumption for template projects (README shows placeholder)
5. Metadata re-pass list incomplete (missing team, project, projectMilestone, blockedBy)
6. `bug` label manual fallback continue-logic not specified
7. Roadmap Bugs priority format (`P0`) doesn't match existing `High (P1)` format
8. "JSON unchanged from round 1" wording could be misread as "skip JSON"

**Changes made in response (round 3 plan):**

### A.2 Priority scale — remove features-P1-P3 claim
- Bugs use **P0-P3 only**. This is the authoritative bug scale.
- Features continue with whatever scheme roadmap uses (P1, P2, P3, P4 are all seen). `create-bug.md` does NOT make claims about features — it only defines bug scale and Linear urgency mapping.
- No contradiction with wild P4.

### B.2 Screenshot flow — Workflow A fallback
- **linear_enabled: true (Workflow B):** folder is `docs/bug-reports/<LINEAR_ID>/` (e.g., RAB-150)
- **linear_enabled: false (Workflow A):** folder is `docs/bug-reports/<LOCAL_ID>/` where LOCAL_ID = next available `<PREFIX>-###` from CLAUDE.md prefix + roadmap count. Fallback if no prefix: `bug-YYYYMMDD-HHMM` (e.g., `bug-20260414-1530`).
- Screenshot copy step runs in both workflows.

### C.2 Workflow A/B — explicit specs (not "mirrors create-issue")
Both branches are spelled out in create-bug.md, not left as "same as create-issue." Saves readers from hunting across files.

### D.2 `bug` label manual fallback — verify-then-continue
1. list_issue_labels → not found
2. Try create_issue_label → if MCP error, surface to user
3. User creates manually in Linear UI, confirms to command
4. Re-call list_issue_labels → verify `bug` exists
5. If still missing: ask user again (cap: 2 retries), then proceed with labels=[Area > X] only + surface warning
6. Never silent fallback

### E.2 Empty Desktop — unchanged, solid

### F.2 P0/P1 `yes` branch — In Progress UUID handling
- Read CLAUDE.md Status UUIDs section
- If `In Progress` UUID present: transition ticket via save_issue
- If missing: surface warning "In Progress UUID not configured. Starting work; set status manually if needed." Proceed with investigation anyway (work is not blocked by metadata).

### Metadata re-pass — full field list
On follow-up save_issue (body update after screenshot copy):
```
save_issue(
  issueId: <RAB-150>,
  description: <final body>,
  team: <SAME>,
  labels: <SAME>,
  project: <SAME, if any>,
  projectMilestone: <SAME, if any>,
  blockedBy: <SAME, if any>,
  priority: <SAME>,
  state: <SAME>
)
```
Re-passing all 8 fields (besides issueId + description) prevents clobbering.

### Comment API name
- Use `mcp__linear__save_comment` (confirmed current MCP name)
- Existing files referencing `create_comment` have unrelated drift; not addressed in this change

### Roadmap Bugs priority format — harmonize
Use verbose format matching existing roadmap: `Showstopper (P0)`, `Major (P1)`, `Regular (P2)`, `Minor (P3)`.

### P4 acknowledgment
Add a note to create-bug.md Priority section: "Bugs use P0-P3. Features may use P1-P4 per existing roadmap convention — bug scale does not displace feature scale."

### Tracking file wording
Clarify: "JSON changes from round 1 are retained" (not "unchanged" which could be misread).

### Files changed (round 3)

Same as round 2: 
1. **CREATE** `~/.claude/commands/create-bug.md` (implements A.2-F.2 + full re-pass)
2. **UPDATE** `~/.claude/README.md`
3. **UPDATE** `~/.claude/guides/cross-tool-parity-phase-a.json`
4. **UPDATE** `~/.claude/guides/cross-tool-sync.md`
5. **UPDATE** `~/.claude/change-process/005-create-bug-command.md` (this tracking file)

## Infrastructure Audit Round 3

**Verdict:** SAFE TO EXECUTE
**Report:** `/tmp/change-process-audit-20260414-create-bug-layer1-r3.md`
**Findings:** All 8 round-2 blockers resolved. No new issues. Minor non-blocking note: sync script must land `create-bug` in the Synced commands list (12/17), not Skipped — verify during execute.
**Changes made:** None — plan passed.

## Change Review Round 1

**Verdict:** FIX BEFORE EXECUTE
**Report:** `/tmp/change-process-audit-20260414-create-bug-layer2.md`

**12 issues found. Triage:**

**Must fix (real defects):**
- Sprint attachment override unspecified (inherits create-issue auto-attach)
- Webhook noise from two-save pattern
- `docs/bug-reports/` relative path (breaks in subdirectories)
- No duplicate-issue search (RAB-148 collision risk cited)
- No sensitive-content warning before committing screenshots
- Inherit-by-ref vs self-contained ambiguity
- Root Cause Hypothesis template contradicts "no investigation"
- P0/P1 off-script answers (silence, "maybe") not defined
- Minimum viable ticket gate missing (blank tickets pass)
- `docs/bug-reports/` folder has no documented reader

**Deferred to v2 (minor/edge):**
- P0-P3 vs P1-P4 coexistence in single roadmap — different contexts (section headers vs per-item); accept minor friction
- Verbose `Showstopper (P0)` roadmap labels — actually MATCHES existing `High (P2)` format per line 118 of roadmap; auditor misread
- Fix checklist overlap with /iterate — reminder-only; upgrade later if it rots
- .gitignore policy — commit for v1, escalate if bloat
- Two-run state collision — v1 is stateless

### Revised plan (round 2)

**B.3 Screenshot flow — slug-based folder, single save_issue**

No more two-phase create-then-update pattern. Instead:
1. Pre-flight: find Desktop screenshots (graceful empty case).
2. Generate folder slug: `<YYYYMMDD>-<kebab-title-slug>` (e.g., `2026-04-14-feedback-silent-on-desktop`).
3. Resolve git root: `GIT_ROOT=$(git rev-parse --show-toplevel)`.
4. Target: `$GIT_ROOT/docs/bug-reports/<slug>/` (or `$GIT_ROOT/bug-reports/<slug>/` if no docs/).
5. `mkdir -p` + `cp` screenshots with clean names.
6. **Before cp**: show user the destination path and warn: "⚠️ Screenshots will be saved to the repo and likely committed. Review for sensitive content (passwords, tokens, PII) before continuing. Proceed? (y/N)"
7. Build full body in memory WITH folder path reference: `**Screenshots:** docs/bug-reports/<slug>/`
8. ONE `save_issue` call with complete body. No update pass.

This eliminates the webhook noise window entirely. Folder is named by slug (not Linear ID), which stays stable.

**J. Git root anchoring**
All path operations (folder creation, cp target) anchor to `git rev-parse --show-toplevel`, not cwd. Prevents subdirectory breakage.

**K. Duplicate-issue search (pre-flight)**
Before creating: call `mcp__linear__list_issues` filtered by team + status != Done, search for title overlap. If top match has ≥60% title similarity or shares 2+ keywords, surface to user:
> Possible duplicate: RAB-148 "In-app feedback: written + voice recording..." Is this the same bug? (y = abort, n = continue)

If user aborts, add a comment to the existing ticket with the new repro info instead.

**L. Sprint-attachment override**
Bugs default to Backlog: `project: null, projectMilestone: null`. Explicitly overrides create-issue's auto-attach behavior.

**EXCEPTION:** If user answers `yes` to the P0/P1 "start now?" prompt, AND an active sprint exists, THEN attach: `project: <active>, projectMilestone: <current>`. Only in that case.

**M. Self-contained spec (decisive)**
create-bug.md fully spells out: Linear Configuration Check, Workflow A (linear_enabled=false), Workflow B (linear_enabled=true), Area > X label rules, bug label rules, blockedBy rules. NO cross-references to create-issue.md. Duplicates accepted.

**N. Root Cause Hypothesis — explicit default**
Body template shows:
```
## Root Cause Hypothesis
unknown — to be determined during fix
```
Plus guidance in the command: "Fill this in ONLY if the user has an initial theory. Default is 'unknown — to be determined during fix'. The hypothesis field is a slot for future /debug to populate; not investigated at filing time."

**O. P0/P1 off-script fallback**
If user answer to "start now?" doesn't match `yes` / `no` / `later` (case-insensitive), or user is silent/ambiguous ("not sure", "maybe", "later today", etc.), default to **later** behavior: keep ticket in Todo, add deferral comment, end command. Document this default.

**P. Minimum viable ticket gate**
Required fields: `Summary`, `Priority`, AND at least one of `Reproduction` OR `Screenshot`. If any missing after questioning, ask again ONCE. If still blank after re-ask, abort: "Cannot file bug without minimum fields. Aborting."

**Q. `docs/bug-reports/` reader documented**
Ticket body's "Screenshots" section links to the folder path — that IS the reader. Also document in create-bug.md that future `/debug` reads the folder, and when working the bug, anyone picks it up by reading the path from the ticket.

### Files changed (round 2)

Same 5 files:
1. CREATE `~/.claude/commands/create-bug.md` (incorporates B.3, J, K, L, M, N, O, P, Q + round 1-2 fixes)
2. UPDATE `~/.claude/README.md`
3. UPDATE `~/.claude/guides/cross-tool-parity-phase-a.json`
4. UPDATE `~/.claude/guides/cross-tool-sync.md`
5. UPDATE `~/.claude/change-process/005-create-bug-command.md`

## Change Review Round 2

**Verdict:** FIX BEFORE EXECUTE (spec-tightening, not redesign)
**Report:** `/tmp/change-process-audit-20260414-create-bug-layer2-r2.md`

**9/12 round-1 issues clean. 4 partial + new gotchas introduced by round-2 fixes + 3 remaining gotchas = 8 priority fixes.**

### Changes made in response (round 3 plan)

**R. Slug collision rule**
If `$GIT_ROOT/docs/bug-reports/<slug>/` exists and is non-empty, append a numeric suffix. First try `<slug>-2/`, then `-3/`, etc., until an unused name is found. Never overwrite. The suffix is stable — stored in the ticket body Screenshots path.

**S. Duplicate similarity — concrete metric**
Replace "60% title similarity or 2+ keywords" with:
1. Call `mcp__linear__list_issues` with filter `{ team: <team>, state: { neq: "Done" } }` limit ~50.
2. For each candidate, compute case-insensitive token overlap with the proposed title (stopwords `the/a/an/and/or/of/on/in/to/for/when/with/is` removed).
3. Sort by overlap count descending; keep top 3 with overlap ≥ 2 tokens.
4. If any match: surface top 3 to user verbatim with IDs and titles, ask "Is this bug already captured by one of these? (1/2/3 = abort and comment on that ticket, n = continue)".
5. If user picks a number, add new repro info as a comment on the existing ticket (`save_comment`), do NOT create new ticket.
6. If `n`, proceed.

Token overlap is unambiguous and trivially implementable without fuzzy-match heuristics.

**T. Off-script parser — explicit precedence**
Parse user answer to "start now?":
1. Lowercase and tokenize.
2. Deferral tokens: `tomorrow, later, soon, after, eventually, not now, idk, unsure, maybe, not sure`. Affirmative tokens: `yes, y, yeah, yep, ok, sure, start, go, now`. Negative tokens: `no, n, nope, skip, cancel`.
3. **Deferral wins over affirmative.** If any deferral token present → `later` (even if "yes" also present).
4. Pure affirmative with no deferral → `yes`.
5. Pure negative → `no`.
6. Nothing recognizable → re-prompt ONCE: "That was ambiguous — please answer yes, no, or later." If still ambiguous → default to `later` (safest: keeps ticket in Todo, persists deferral comment, no accidental fix session or silent drop).

**U. Minimum viable gate — OR across evidence types**
Required: `Summary`, `Priority`. Plus at least ONE of:
- Reproduction steps
- Screenshot
- Log excerpt (pasted or file path)
- Error message in notes

This allows intermittent bugs ("app crashed once, can't repro, no screenshot but error was XYZ") to be captured. Still rejects empty tickets.

**V. Root Cause — conditional, not default**
Template logic: only include the `## Root Cause Hypothesis` section if the user supplies a theory during filing. If user says "no idea" or command doesn't ask (fast path), **omit the section entirely.** No dead-weight "unknown — TBD" placeholder. The command prompt: "Any initial theory about the cause? (enter to skip)". If skipped, section is not rendered.

**W. `yes` branch — confirm before pivot**
Do not silently switch `/create-bug` into a fix session. After user answers `yes`:
1. Confirm: "Switching to fix mode. Use current branch? (y = current / new = create sprint branch / cancel = just mark In Progress and end command)"
2. If `y`: stay on current branch.
3. If `new`: prompt for branch name, create it.
4. If `cancel`: transition to In Progress (if UUID available), end command. Do not begin investigation.

This preserves the "fast capture" contract of `/create-bug`.

**X. bug label fallback — terminal behavior**
After 2 create-label retries fail:
1. Surface warning: "⚠️ Could not create or find `bug` label after 2 attempts. Proceeding with labels = [Area > X] only. Add `bug` label manually in Linear when convenient."
2. Create the ticket with whatever labels are available (Area label present).
3. Do NOT abort ticket creation. Losing the `bug` label is preferable to losing the whole ticket.
4. Never silent — always surface.

**Y. Desktop glob — match macOS naming**
Replace `ls -lt ~/Desktop/Screenshot*` with:
```
ls -lt ~/Desktop/Screen\ Shot*.png ~/Desktop/Screenshot*.png 2>/dev/null | head -5 || true
```
Covers both the classic macOS pattern ("Screen Shot YYYY-MM-DD at HH.MM.SS.png") and newer patterns ("Screenshot YYYY-MM-DD..."). Quote properly. Still graceful on zero matches.

**Z. cp ordering — after save_issue success**
Revised flow:
1. Generate slug + resolve git root + pre-flight duplicate search.
2. Build full body in memory (with placeholder `<SCREENSHOT_FOLDER>` that becomes `docs/bug-reports/<slug>/` before the save).
3. Show user the destination path + sensitive-content warning.
4. Call `save_issue` with full body.
5. **ON SUCCESS:** mkdir target folder + cp screenshots.
6. **ON FAILURE:** do NOT copy. Surface error. No orphaned folders.

Trade-off: body references a folder that is created moments later. Acceptable because one agent owns both steps and failure modes are now clean.

### Remaining gotchas accepted (not blockers)

- **G2 (screenshots not on Desktop):** v1 scans Desktop only. If user has screenshots elsewhere, they can pass a path as an argument or skip and attach manually. Document the limitation in create-bug.md, defer richer source detection to v2.
- Sensitive content warning remains a text prompt (no OCR). v1 limitation; documented.

### Files changed (round 3)

Same 5 files. Content tightened per R-Z above.
1. CREATE `~/.claude/commands/create-bug.md`
2. UPDATE `~/.claude/README.md`
3. UPDATE `~/.claude/guides/cross-tool-parity-phase-a.json`
4. UPDATE `~/.claude/guides/cross-tool-sync.md`
5. UPDATE `~/.claude/change-process/005-create-bug-command.md`

## Change Review Round 3

**Verdict:** SAFE TO EXECUTE
**Report:** `/tmp/change-process-audit-20260414-create-bug-layer2-r3.md`

**Coverage:** 5 tight / 3 partial / 0 broken out of 8 round-2 priority fixes.
- **Tight:** R (slug collision), S (duplicate metric), V (root cause conditional), X (bug label terminal), Y (Desktop glob)
- **Partial but acceptable:**
  - T (off-script parser) — "yes tomorrow" maps to `later` + deferral comment; conservative default preserves intent via comment trail
  - U (min-viable gate) — "Error message in notes" has no defined body-template slot; cosmetic divergence
  - Z (cp-after-save) — handles orphaned folders on save failure, but doesn't define recovery if cp fails AFTER save_issue succeeds. Low probability, surfaces as visible error.

**Implementation nits (resolve inline during execute):**
- Define `## Notes` or `## Error Message` section in body template for U
- Surface cp failures explicitly (even if save succeeded)
- Tie-break duplicate candidates by `updatedAt desc`

None meet the blocker bar. Plan ships.
