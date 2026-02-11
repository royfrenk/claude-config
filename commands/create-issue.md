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

Execute in ONE response:
```
<function_calls>
<invoke name="mcp__linear__create_issue">
  <!-- Include team parameter from CLAUDE.md -->
  <parameter name="team">[Team ID from CLAUDE.md]</parameter>
  <parameter name="title">...</parameter>
  <parameter name="description">...</parameter>
  <parameter name="labels">["agent", "technical"]</parameter>
  ...
</invoke>
<invoke name="mcp__linear__update_issue">
  <!-- Set status to Todo -->
  <parameter name="id">[issue ID from create response]</parameter>
  <parameter name="state">[Todo UUID from CLAUDE.md]</parameter>
</invoke>
<invoke name="Edit">...</invoke> <!-- Update sync status -->
<invoke name="Edit">...</invoke> <!-- Add to backlog/sprint -->
</function_calls>
```

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

## Notes
[Any risks, dependencies, or considerations - omit if none]
```

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
