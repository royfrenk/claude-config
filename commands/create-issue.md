# Create Issue

User is mid-development and thought of a bug/feature/improvement. Capture it fast so they can keep working.

**Input:** $ARGUMENTS

## Your Goal

Create a complete Linear issue with:
- Clear title
- TL;DR of what this is about
- Current state vs expected outcome
- **Acceptance criteria** (for features/UI - user-testable actions and expected results)
- Relevant files that need touching (max 3)
- Risk/notes if applicable
- Proper type/priority/effort labels
- **Feature area label** (from the `Area > X` label group — scan existing, create new if needed)
- **Project + milestone** (current sprint's project + milestone, if active)
- **`blockedBy` relationships** (use Linear's native dependency field — never write "Depends on QUO-XX" in the description)
- **Screenshot** (auto-grabbed from the macOS clipboard via `pngpaste`; user never touches the file)

## How to Get There

**Ask questions** to fill gaps - be concise, respect the user's time. They're mid-flow and want to capture this quickly. Usually need:
- What's the issue/feature (if not clear from input)
- Current behavior vs desired behavior
- Type (bug/feature/improvement) and priority if not obvious

Keep questions brief. One message with 2-3 targeted questions beats multiple back-and-forths.

## Linear Configuration Check

Before creating the Linear issue, check project configuration:

1. **Read CLAUDE.md** to extract Linear settings:
   - Look for "Linear Integration" section
   - Extract `linear_enabled: true/false` (default: false if missing)
   - Extract `Team ID: <uuid>` (required if enabled)
   - Extract `Issue Prefix: <PREFIX>`

2. **Determine behavior:**
   - If `linear_enabled: false` → Skip Linear, only update roadmap.md
   - If `linear_enabled: true` and Team ID missing → Error: "Linear enabled but Team ID not found in CLAUDE.md"
   - If `linear_enabled: true` and Team ID present → Create Linear issue with team parameter

3. **Validate prefix match:**
   - Check current directory against issue prefix in CLAUDE.md
   - If mismatch detected: Warn user "Creating issue for wrong project? Current: [dir], Prefix: [PREFIX]"

### Feature Area Label (Area > X)

Every issue MUST be labeled with a feature area so issues can be grouped and filtered by feature in Linear.

**Before creating the issue:**

1. **List existing `Area > X` child labels** using `mcp__linear__list_issue_labels` with the team ID
   - Look for the `Area` parent group (isGroup: true)
   - Collect all children — these are the existing feature areas (e.g., `Access Control`, `Address Entry`, `Deal Analysis`)

2. **Match the issue to an existing area:**
   - If the feature fits an existing area → reuse that label
   - If no existing area matches → ask the user briefly: *"No existing Area label fits this. Create a new `Area > [Name]` label? Suggested: [name]"* — then create it via `mcp__linear__create_issue_label` with `parent: "<Area group ID>"` and `teamId: <team>`

3. **Apply the area label** when saving the issue (in the `labels` array).

**Never apply a generic "Feature" label** — always the specific `Area > X` child.

### Project + Milestone (Active Sprint)

Every issue should be attached to the current active sprint's Linear project + milestone, unless the user explicitly says otherwise.

**Before creating the issue:**

1. **Check for an active sprint** — look for `docs/sprints/*.active.md` or ask the user which sprint this belongs to
2. **Resolve the Linear project** — the active sprint file should reference a Linear project name/ID. If unclear, use `mcp__linear__list_projects` filtered by team and ask the user
3. **Resolve the milestone** — list project milestones via `mcp__linear__list_milestones` and match to the sprint (e.g., "Sprint 1 [ACCESS]"). If none match, ask the user
4. **Apply both** — pass `project: <id>` and `projectMilestone: <id>` to `save_issue`

**If no active sprint exists** (ad-hoc bug/idea capture) → skip project + milestone, and add to backlog in roadmap.md instead.

### Blocked By Relationships

When the user mentions a dependency ("this depends on QUO-79", "needs X to ship first", "blocked by the data model work"):

1. **Use Linear's native `blockedBy` field** — pass `blockedBy: ["QUO-79"]` to `save_issue`
2. **Never write "Depends on QUO-XX" or "Requires QUO-XX" in the description** — the dependency lives on the issue relationship, not in prose
3. **If the blocking issue doesn't exist yet**, create it first, then pass its ID when creating the dependent issue
4. **`blockedBy` is append-only** — to remove a dependency, the user must do it manually in Linear (no MCP clear)

### Screenshot Capture (Clipboard)

The user captures screenshots to the macOS clipboard (Cmd+Shift+Ctrl+4), not to disk. Grab the clipboard image once, at pre-flight, before asking clarifying questions. One grab per issue — do NOT ask the user for more screenshots.

**Pre-flight probe:**
```
pngpaste "$TMPDIR/claude-issue-probe.png" 2>/dev/null && file "$TMPDIR/claude-issue-probe.png" || echo "no image on clipboard"
```
- Exits non-zero if the clipboard holds no image — proceed without screenshots, omit the Screenshots section.
- If `pngpaste` is not installed, surface a one-time hint: "Install with `brew install pngpaste` to enable screenshot capture." — then proceed without screenshots.

**Folder:**
- Slug: `<YYYYMMDD>-<kebab-case-title>` truncated to ~60 chars.
- Target: `$GIT_ROOT/docs/screenshots/<slug>/` (or `$GIT_ROOT/screenshots/<slug>/` if no `docs/`).
- Collision: append `-2`, `-3`, etc. if the target exists and is non-empty.

**Fix order (preventing orphans):**
1. Build body in memory (with the final folder path).
2. Create the issue via `save_issue` (Workflow B) or update roadmap.md (Workflow A).
3. **ON SUCCESS ONLY**: `mkdir -p <folder>` and `mv "$TMPDIR/claude-issue-probe.png" "<folder>/screenshot.png"`.
4. If `mv` fails after the issue is live: surface explicitly — "Issue filed successfully, but screenshot move failed: <reason>. Source still at `$TMPDIR/claude-issue-probe.png` — retry manually with: `mv ... <folder>/`." Do not retry silently.

**Search for context** only when helpful:
- Web search for best practices if it's a complex feature
- Grep codebase to find relevant files
- Note any risks or dependencies you spot

**Skip what's obvious** - If it's a straightforward bug, don't search web. If type/priority is clear from description, don't ask.

**Keep it fast** - Total exchange under 2min. Be conversational but brief. Get what you need, create ticket, done.

## Behavior Rules

- Be conversational - ask what makes sense, not a checklist
- Default priority: 3 (Normal), default effort: medium (ask only if unclear)
- Max 3 files in context - most relevant only
- Bullet points over paragraphs

## Roadmap Update Format

When adding issue to roadmap.md:

**Required fields:**
- ID (issue number)
- Title
- Priority (High/Medium/Low with P1/P2/P3)
- Est (estimate in d=days or w=weeks)
- **Context** (1-2 line summary or TL;DR from spec)
- Spec (link to spec file)

**Example:**
```markdown
| EXP-048 | Add receipt tagging | High (P1) | 2d | Allow users to add custom tags to receipts for better organization | [spec](technical-specs/EXP-048.md) |
```

**Note:** Full details live in spec file. Roadmap only shows brief context for scanning.

## Critical Workflow (Execute All Steps in One Response)

**IMPORTANT:** After asking clarifying questions, execute ALL of the following steps in a SINGLE response with parallel tool calls. Do NOT pause between steps.

### Check Linear Configuration First

1. **Read `CLAUDE.md`** to check `linear_enabled` field
2. **Determine workflow:**
   - If `linear_enabled: false` → Execute workflow A (roadmap.md only)
   - If `linear_enabled: true` → Execute workflow B (Linear + roadmap.md)

### Workflow A: Roadmap.md Only (linear_enabled: false)

Execute in ONE response:
```
<function_calls>
<invoke name="Edit">...</invoke> <!-- Update sync status in roadmap.md -->
<invoke name="Edit">...</invoke> <!-- Add to backlog/sprint in roadmap.md -->
</function_calls>
```

### Workflow B: Linear + Roadmap.md (linear_enabled: true)

**Pre-flight checks** (execute in ONE parallel batch BEFORE creating the issue):

```
<function_calls>
<invoke name="mcp__linear__list_issue_labels">
  <parameter name="team">[Team ID]</parameter>
  <!-- Use this to find the Area group + existing children -->
</invoke>
<invoke name="mcp__linear__list_projects">
  <parameter name="team">[Team ID]</parameter>
  <!-- Find the active sprint's project -->
</invoke>
<invoke name="Glob">
  <parameter name="pattern">docs/sprints/*.active.md</parameter>
  <!-- Detect active sprint -->
</invoke>
<invoke name="Bash">
  <parameter name="command">pngpaste "$TMPDIR/claude-issue-probe.png" 2>/dev/null && file "$TMPDIR/claude-issue-probe.png" || echo "no image on clipboard"</parameter>
  <!-- Grab clipboard screenshot once. Non-zero exit = no image; proceed without screenshots. -->
</invoke>
<invoke name="Read">
  <parameter name="file_path">docs/!project/DESIGN.md</parameter>
  <!--
    If this file exists and ## Screen Inventory has rows with a Feature column:
    - Search Feature values case-insensitively as substring of the issue title.
    - Exactly 1 match → note screen ID and screen name for Visual Reference.
    - 2+ matches → take the first row whose Feature value equals the issue title exactly (case-insensitive); if none qualifies, skip silently.
    - 0 matches → skip silently.
    If the file is missing or ## Screen Inventory has no rows → proceed without.
    When a match is found: call mcp__stitch__get_screen(screenId) to get a fresh screenshot URL. Append ## Visual Reference to the issue body.
  -->
</invoke>
</function_calls>
```

Then, if a new Area label is needed, create it first:

```
<function_calls>
<invoke name="mcp__linear__create_issue_label">
  <parameter name="name">[Feature Area Name]</parameter>
  <parameter name="parent">[Area group ID]</parameter>
  <parameter name="teamId">[Team ID]</parameter>
</invoke>
</function_calls>
```

Then create the issue + set status + update roadmap in ONE response:

```
<function_calls>
<invoke name="mcp__linear__save_issue">
  <parameter name="team">[Team ID from CLAUDE.md]</parameter>
  <parameter name="title">...</parameter>
  <parameter name="description">...</parameter>
  <parameter name="labels">["Access Control"]</parameter>  <!-- Area > X child label -->
  <parameter name="project">[Active sprint project ID, if any]</parameter>
  <parameter name="projectMilestone">[Sprint milestone ID, if any]</parameter>
  <parameter name="blockedBy">["QUO-79"]</parameter>  <!-- If dependencies exist -->
  <parameter name="priority">...</parameter>
  <parameter name="state">[Todo UUID from CLAUDE.md]</parameter>
</invoke>
<invoke name="Edit">...</invoke> <!-- Update sync status -->
<invoke name="Edit">...</invoke> <!-- Add to backlog/sprint -->
</function_calls>
```

**ON SUCCESS** (only if a screenshot was captured), move it into the repo:

```
<function_calls>
<invoke name="Bash">
  <parameter name="command">mkdir -p "<GIT_ROOT>/docs/screenshots/<slug>" && mv "$TMPDIR/claude-issue-probe.png" "<GIT_ROOT>/docs/screenshots/<slug>/screenshot.png"</parameter>
</invoke>
</function_calls>
```

If `mv` fails: surface explicitly — "Issue filed, but screenshot move failed: <reason>. Source still at `$TMPDIR/claude-issue-probe.png` — retry manually." Do not retry silently.

**Note:** `save_issue` supports `state` directly — no separate update call needed.

**Do NOT:**
- Create the issue and wait for the response before continuing
- Update status in a separate message
- Update roadmap in a separate message
- Pause or hesitate between any steps

**The entire workflow must be atomic - all steps in ONE response.**

## Issue Body Format

```markdown
## TL;DR
[One sentence summary]

## Current State
[What happens now / what's missing]

## Expected Outcome
[What should happen / what we want]

## Acceptance Criteria

**Functional (pass/fail):**
- [ ] [Action] → [Expected result]
- [ ] [Action] → [Expected result]

**Quality (requires evals):**
- [ ] [Action] → [Quality outcome - will be expanded into detailed evals during planning]

## Relevant Files
- `path/to/file1.ts` - [why relevant]
- `path/to/file2.ts` - [why relevant]

<!-- Optional — only rendered if a screenshot was captured from the clipboard -->
## Screenshots
docs/screenshots/<slug>/

<!-- Optional — only rendered if a matching row was found in docs/!project/DESIGN.md ## Screen Inventory -->
## Visual Reference
- **Screen:** [Screen Name from DESIGN.md]
- **Stitch ID:** `[screenId]`
- **Snapshot:** [screenshot URL from mcp__stitch__get_screen]

## Notes
[Any risks, dependencies, or considerations - omit if none]
```

**Template rules:**
- `## Screenshots` is omitted if no screenshot was captured from the clipboard.
- `## Visual Reference` is omitted if no matching row was found in `docs/!project/DESIGN.md` `## Screen Inventory`.

## Acceptance Criteria Guidelines

**Include acceptance criteria for:**
- Features with user interaction
- UI changes
- Bug fixes (how to verify it's fixed)

**Skip for:**
- Pure refactoring (no user-facing change)
- Documentation updates
- Simple config changes

**Categorize criteria:**

**Functional (pass/fail)** - Binary tests:
- "Click Save Search button" → "Search is saved and confirmation shown"
- "Navigate to /saved-searches" → "Previously saved search appears in list"
- "Submit empty form" → "Error message displays"

**Quality (requires evals)** - Subjective/performance measures:
- "Search for 'Beverly Hills'" → "Results are relevant (Beverly Hills properties)"
- "Load search results" → "Page loads quickly (good UX)"
- "View recommendations" → "Suggestions are accurate and useful"

**Note:** Quality criteria will be expanded into detailed quality evals during planning phase (eval-writer will create measurable benchmarks).

**Be specific and testable.** Vague criteria like "works correctly" don't help verify completion.
