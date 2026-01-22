# Create Issue

User is mid-development and thought of a bug/feature/improvement. Capture it fast so they can keep working.

**Input:** $ARGUMENTS

## Your Goal

Create a complete Linear issue with:
- Clear title
- TL;DR of what this is about
- Current state vs expected outcome
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
- Create issue in Linear using mcp__linear__create_issue when ready

## Issue Body Format

```markdown
## TL;DR
[One sentence summary]

## Current State
[What happens now / what's missing]

## Expected Outcome
[What should happen / what we want]

## Relevant Files
- `path/to/file1.ts` - [why relevant]
- `path/to/file2.ts` - [why relevant]

## Notes
[Any risks, dependencies, or considerations - omit if none]
```
