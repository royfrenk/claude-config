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
- Create issue in Linear using mcp_linear_create_issue when ready
- **After creating:** Call mcp_linear_get_issue with the returned UUID to get the actual identifier (e.g., QUO-10) — never guess the number

## Status & Labels

**Status:** Set new issues to **"Todo"** status (not Backlog)

**Labels (add via mcp_linear_update_issue):**
- **"agent"** — Add to ALL issues you create (signifies AI-created, not human)
- **"technical"** — Add IN ADDITION if the issue is backend/infrastructure/tech-debt that you inferred or initiated (not a UI feature the user explicitly requested)

**roadmap.md:** Update immediately after creating the issue — add to Active Sprint or Backlog section

## Issue Body Format

```markdown
## TL;DR
[One sentence summary]

## Current State
[What happens now / what's missing]

## Expected Outcome
[What should happen / what we want]

## Acceptance Criteria
[User-facing, testable criteria - include for features/UI changes]
- [ ] [Action] → [Expected result]
- [ ] [Action] → [Expected result]

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

**Format:** Action → Expected result
- "Click Save Search button" → "Search is saved and confirmation shown"
- "Navigate to /saved-searches" → "Previously saved search appears in list"
- "Search for 'Beverly Hills'" → "Results show properties in Beverly Hills"

**Be specific and testable.** Vague criteria like "works correctly" don't help verify completion.
