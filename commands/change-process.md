---
description: Update the agent/command process systematically. Reviews all files, asks clarifying questions, highlights gaps.
---

# Change Process

**Note:** This command always runs as a subagent to keep main context clean during process changes.

## Invocation

When this command is invoked, immediately spawn a subagent to handle the work:

Use the Task tool with:
- `subagent_type: "general-purpose"`
- `description: "Process change request"`
- `prompt`: Pass the user's request ($ARGUMENTS) and all instructions below

The subagent will follow the Change Process workflow below and handle all phases including syncing to repo.

---

## Instructions for Subagent

You are helping the User update the engineering process. Your goal is to ensure changes are consistent across all files and don't add noise.

## CRITICAL: Question Formatting Rules

**When asking questions in ANY phase, follow these rules strictly to ensure questions reach the User:**

1. **Output ONLY the questions - nothing else:**
   - DO NOT include explanations before the questions
   - DO NOT include file listings or analysis
   - DO NOT proceed to the next phase
   - Questions must be the ONLY content in your response

2. **Use maximum visual separation:**
   - Start with horizontal rule: `---`
   - Use `## Phase X: [Title]` header in large text
   - Number every question with **bold** text
   - End with horizontal rule: `---`
   - Add explicit "waiting" message after the horizontal rule

3. **Always stop after asking questions:**
   - State explicitly: "I'll wait for your answers before proceeding."
   - DO NOT continue to the next phase
   - DO NOT add any additional commentary
   - Wait for User's response before doing anything else

4. **Only ask applicable questions:**
   - Read what the User has already told you
   - Skip questions they've already answered
   - Only ask follow-up questions that are relevant

**Example of CORRECT question format:**

```
---

## Phase 1: Understanding Your Change

Please answer these questions:

**1. What change do you want to make?**
   (Describe the change in your own words)

**2. Why are you making this change?**
   - What problem does this solve?
   - What triggered this request?

**3. What's the scope?**
   - All projects (global ~/.claude/ files)?
   - Just one project?
   - Something else?

---

I'll wait for your answers before reviewing the affected files.
```

**Example of INCORRECT format (DO NOT DO THIS):**

```
Let me understand the change first. I'm going to ask some questions. What change do you want to make? Why? What's the scope? Now let me also review the files to see what's affected... [continues to Phase 2]
```

**The User must be able to see and respond to questions. If questions are buried or skipped, the entire process fails.**

## Phase 1: Understand the Change

**STOP AND ASK QUESTIONS - DO NOT PROCEED TO PHASE 2 UNTIL USER RESPONDS**

Output ONLY the following question block and nothing else:

---

## Phase 1: Understanding Your Change

Please answer these questions so I can review the right files:

**1. What change do you want to make?**
   (Describe the change in your own words)

**2. Why are you making this change?**
   - What problem does this solve?
   - What triggered this request?

**3. What's the scope of this change?**
   - Does this affect all projects (global ~/.claude/ files)?
   - Does this affect just one project?
   - Something else?

**Based on your description, I may also need to know:**

[Include ONLY the applicable questions below - skip sections that don't apply]

**If the change affects workflow:**
- Does this change the order of operations?
- Does this change who is responsible for what?

**If adding a new file or concept:**
- Who creates it?
- Who updates it?
- When does it get created/updated?

**If removing something:**
- What replaces it?
- How do we handle existing references to it?

---

I'll wait for your answers before reviewing the affected files.

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

**STOP AND ASK CHALLENGE QUESTIONS - DO NOT PROCEED TO PHASE 5 UNTIL USER RESPONDS**

After completing Phase 2 (file review) and Phase 3 (impact analysis), check if you found any gaps, contradictions, complexity issues, or scope concerns.

**If you found concerns:**

Output ONLY the following question block and nothing else:

---

## Phase 4: Challenge Questions

Based on my file review and impact analysis, I need clarification on these points:

[Include ONLY the sections below that have actual concerns - skip empty sections]

**Gaps I Found:**

[List each gap with a numbered question:]
1. I noticed [X] isn't covered. How should that work?
2. What happens when [edge case]?
3. Who is responsible for [new thing]?

**Contradictions I Found:**

[List each contradiction with a numbered question:]
1. This conflicts with [existing rule in file.md]. Which takes priority?
2. [Agent A] currently does this (file.md line X), but your change suggests [Agent B] should. Which is correct?

**Complexity/Noise Concerns:**

[Ask if the change seems to add unnecessary complexity:]
1. Is this adding complexity that could be avoided?
2. Could this be solved with existing tools/processes instead?
3. Will this be easy for all agents to remember and follow?

**Scope Concerns:**

[Ask if scope seems unclear or too broad:]
1. You mentioned [X] - is that part of this change or should it be separate?
2. Should we implement this incrementally (phases) or all at once?

---

Please address these concerns before I propose the specific file changes.

**If you found NO concerns:**

Skip the question block entirely. Instead, output:

```
I reviewed all affected files and found no gaps, contradictions, or scope issues. Proceeding to propose specific changes.
```

Then continue to Phase 5.

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
