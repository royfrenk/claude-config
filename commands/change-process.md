---
description: Update the agent/command process systematically. Reviews all files, asks clarifying questions, highlights gaps.
---

# Change Process

You are helping the User update the engineering process. Your goal is to ensure changes are consistent across all files and don't add noise.

## Phase 1: Understand the Change

Ask the User:
1. **What change do you want to make?** (Let him describe it freely)
2. **Why?** (What problem does this solve? What triggered this?)
3. **What's the scope?** (Does this affect all projects or just one?)

Then ask clarifying questions:
- If the change affects workflow: "Does this change the order of operations? Who does what?"
- If adding a new file/concept: "Who creates it? Who updates it? When?"
- If removing something: "What replaces it? How do we handle existing references?"

## Phase 2: Review All Files

Read and analyze every file that might be affected:

### Global Files (~/.claude/)

**Agents:**
- `~/.claude/agents/em.md` - Engineering Manager
- `~/.claude/agents/explorer.md` - Codebase analysis
- `~/.claude/agents/plan-writer.md` - Implementation planning
- `~/.claude/agents/developer.md` - Code implementation
- `~/.claude/agents/reviewer.md` - Code review

**Commands:**
- `~/.claude/commands/context.md` - Load project context
- `~/.claude/commands/sprint.md` - Autonomous execution
- `~/.claude/commands/create-issue.md` - Quick issue capture
- `~/.claude/commands/new-project.md` - Project setup guide
- `~/.claude/commands/learning-opportunity.md` - Teaching mode
- `~/.claude/commands/change-process.md` - This command

**Documentation:**
- `~/.claude/README.md` - How we work overview

### Current Project Files

Read the project's CLAUDE.md to find the docs location, then check:
- `CLAUDE.md` - Project entry point
- `docs/PROJECT_STATE.md` - Codebase state
- `docs/roadmap.md` - Task index
- `docs/technical-specs/` - Spec files

## Phase 3: Impact Analysis

For each file, determine:
1. **Needs update?** (Yes/No/Maybe)
2. **What changes?** (Specific sections or references)
3. **Risk level:** (Low = wording change, Medium = workflow change, High = structural change)

Present findings as a table:

```
| File | Needs Update | What Changes | Risk |
|------|--------------|--------------|------|
| em.md | Yes | Add new step to workflow | Medium |
| developer.md | No | — | — |
| README.md | Yes | Update diagram | Low |
```

## Phase 4: Challenge the Change

Before proceeding, ask the User:

**Gaps:**
- "I noticed [X] isn't covered. How should that work?"
- "What happens when [edge case]?"
- "Who is responsible for [new thing]?"

**Contradictions:**
- "This conflicts with [existing rule]. Which takes priority?"
- "[Agent A] currently does this, but your change suggests [Agent B] should. Clarify?"

**Noise check:**
- "Is this adding complexity that could be avoided?"
- "Could this be solved with existing tools/processes?"
- "Will this be easy to remember and follow?"

**Scope creep:**
- "You mentioned [X] - is that part of this change or a separate one?"
- "Should we do this incrementally or all at once?"

## Phase 5: Propose Changes

Once clarified, present the exact changes:

```
## Proposed Changes

### 1. ~/.claude/agents/em.md
**Section:** Workflow
**Change:** Add step 5: "Update roadmap.md"
**Reason:** [why]

### 2. ~/.claude/README.md
**Section:** The Agent System
**Change:** Update diagram to show new flow
**Reason:** [why]

[Continue for all affected files]
```

Ask: "Does this look right? Any adjustments before I make the changes?"

## Phase 6: Execute

Only after the User confirms:
1. Make all changes to `~/.claude/` (the live config)
2. Verify consistency across files
3. Summarize what was changed
4. **Sync to repo and push:**
   ```bash
   # Copy shareable files to repo
   cp -R ~/.claude/agents ~/Documents/repos/claude-config/
   cp -R ~/.claude/commands ~/Documents/repos/claude-config/
   cp -R ~/.claude/rules ~/Documents/repos/claude-config/
   cp -R ~/.claude/guides ~/Documents/repos/claude-config/
   cp ~/.claude/README.md ~/Documents/repos/claude-config/
   cp ~/.claude/settings.json ~/Documents/repos/claude-config/

   # Commit and push
   cd ~/Documents/repos/claude-config
   git add -A && git commit -m "process: [description]" && git push origin main
   ```

**What gets synced:**
- `agents/` - Agent definitions
- `commands/` - Slash commands
- `rules/` - Coding standards
- `guides/` - Reference guides
- `README.md` - Overview
- `settings.json` - Hooks and MCP config

**Never synced (stays in ~/.claude/ only):**
- `.credentials.json` - OAuth tokens
- `settings.local.json` - Local overrides
- `history.jsonl`, `todos/`, `projects/`, etc. - Session state

## Rules

- **Don't assume** - Ask if unclear
- **Don't add noise** - Every addition should solve a real problem
- **Challenge gently** - The User might have missed something, help them see it
- **Be thorough** - Read every file, don't skip
- **Be specific** - Vague changes lead to inconsistency

## Anti-patterns to Watch For

Flag these if you see them:
- Adding a file that duplicates existing content
- Creating a process that only the User will remember
- Adding steps without clear ownership
- Removing something without a replacement
- Making changes that only apply to one project but are in global files

---

**Start by asking:** "What change do you want to make to the process?"
