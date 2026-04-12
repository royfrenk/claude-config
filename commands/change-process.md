---
description: Update the agent/command process systematically. Reviews all files, asks clarifying questions, highlights gaps.
---

# Change Process

## Instructions

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

**HARD STOP RULE:** DO NOT spawn any subagents, relay agents, or messenger agents. DO NOT call any tools (no SendMessage, no Task, no file operations). Output ONLY the questions below, then end your turn. Wait for the user's next message.

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

Read and analyze every file that might be affected.

**Delegation rule:** If the file list exceeds 20 files, Phase 2 reads MAY be delegated to an Explore subagent. Constraints: Explore subagent ONLY, one level deep, returns summary text only, no further delegation, Read/Grep/Glob access only (no Edit/Write). The Explore agent returns its findings to the main conversation, which continues with Phase 3.

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

**HARD STOP RULE:** DO NOT spawn any subagents, relay agents, or messenger agents. DO NOT call any tools (no SendMessage, no Task, no file operations). Output ONLY the challenge questions below, then end your turn. Wait for the user's next message.

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

After outputting the proposed changes, transition automatically to Phase 5.5. Do NOT ask the user for approval yet — the audit runs first.

**Determine change type** before Phase 5.5: scan the proposed changes list and set `CHANGE_TYPE` flags:
- If any file in `~/.claude/agents/` is touched → `subagent`
- If any file in `~/.claude/managed-agents/` is touched → `managed-runtime`
- If any file in `~/.claude/commands/` is touched → `workflow`
- Multiple flags can be active simultaneously

## Phase 5.5: Independent Plan Audit

**This phase is mandatory for every /change-process run.** It exists because the agent proposing the plan and the agent auditing the plan cannot be the same — Sprint 032 proved that self-review misses orphaning, silent defaults, and cross-file contradictions. A fresh subagent with no investment in the plan catches what the author missed.

### Spawn the reviewer

Use the Agent tool with:
- `subagent_type: "general-purpose"`
- `description: "Independent plan audit"`
- `prompt`: Build the prompt from the template below, injecting the Phase 5 plan text and the active `CHANGE_TYPE` flags
- **Timeout:** If the subagent does not return within 5 minutes, retry once. If the retry also fails, fall back to presenting the plan directly to the user with a warning: "Phase 5.5 audit failed — manual review required before Phase 6."

### The reviewer prompt template

Build the reviewer prompt by concatenating these sections. Inject `{{PLAN_TEXT}}` and `{{CHANGE_TYPE}}` at the marked locations.

```
You are an independent skeptical reviewer auditing a proposed change to
the user's Claude Code configuration. Your job is to find architectural
dead ends, silent failure modes, and "this won't actually work at runtime"
issues BEFORE any files are written.

## Critical context: the dead-end class of bug

An earlier process change proposed putting canonical policy content into
~/.claude/rules/managed-agents-decision-rule.md, assuming rules are
auto-loaded into every agent. That was wrong — rule files auto-load into
the MAIN CONVERSATION only, NOT into spawned subagents. The content was
invisible to the agents that needed it. This was caught when a grep
showed zero references.

That is the class of bug to hunt: plans that assume a file will be read
or loaded when in practice it won't be.

## The proposed plan you are auditing

{{PLAN_TEXT}}

## Change type flags: {{CHANGE_TYPE}}

## Audit classes

Run ALL mandatory classes. Run configurable classes only if the matching
CHANGE_TYPE flag is active.

### Mandatory (always run):

1. **Orphaning and dead references** — does any new canonical source
   have zero readers? Does any reference point to a file/section that
   doesn't exist? Grep for new filenames across ~/.claude/.

2. **Cross-file consistency of literal values** — every literal value
   appearing in 2+ files (limits, flag names, section headers, return
   tokens) must match character-for-character. Run grep across cited
   files.

3. **Silent defaults and missing-field behavior** — when a new
   field/flag is added, what happens to files that existed before the
   change? Is there an explicit migration or fall-through? Is it
   documented?

4. **Loop ownership and control flow** — if the change introduces a
   loop/retry/batch pattern, which file/agent owns the loop state? Can
   that owner persist across iterations?

5. **Tool availability vs spec requirements** — does every agent/phase
   required to write files have Edit/Write? Does every agent required to
   read files have Read/Grep? Check agent frontmatter. Tool mismatches
   cause silent "the agent didn't do it" failures.

### Configurable (run only if matching CHANGE_TYPE is active):

6. **Inline duplication drift risk** (CHANGE_TYPE: subagent or
   managed-runtime) — if the change duplicates content inline for
   subagent self-containment, is each duplicate marked with a
   canonical-source pointer comment? Is there a grep-able marker?

7. **Subagent context assumptions** (CHANGE_TYPE: subagent) — does the
   change assume a subagent can read a file/guide that isn't auto-loaded
   into the subagent's context?

8. **Managed-runtime filesystem assumptions** (CHANGE_TYPE:
   managed-runtime) — does the change assume the managed-agent runtime
   can read local ~/.claude/ files?

9. **Template propagation** (CHANGE_TYPE: workflow) — if the change adds
   a new field that should appear in every new instance of a file type,
   is the template updated? Is there a fall-through for legacy
   instances?

10. **Stop-rule placement at all question points** (CHANGE_TYPE:
    workflow) — if the change strengthens a "stop and wait" rule at one
    phase, does it apply to EVERY phase where the command asks questions?

## How to do the audit

You have Read, Grep, Glob, and Bash. Do NOT Edit or Write anything.

1. Read each target file as it currently exists (the plan has NOT been
   executed yet — files show current state, not planned state).
2. Check agent frontmatter for tool access (Read, Write, Edit, Bash).
3. Grep for canonical elements (new filenames, flag names, literal
   values) across ~/.claude/ to find conflicts or orphans.
4. Compare current state + plan text to predict runtime behavior.

## Output format

Return a structured report with one section per audit class (skip
classes not run). End with:

- **Verdict:** SAFE TO EXECUTE / FIX BEFORE EXECUTE / REDESIGN REQUIRED
- **Priority fixes** (numbered list, only if not SAFE)

Report must be under 800 words. Be blunt — no diplomatic hedges.
```

### Handle the verdict

Parse the reviewer subagent's return for one of three verdict tokens:

**SAFE TO EXECUTE:**
- Present verdict summary to the user
- Ask: "The plan passed independent audit. Does this look right? Any adjustments before I make the changes?"
- On user approval → proceed to Phase 6

**FIX BEFORE EXECUTE:**
- Present the numbered gap list to the user
- Increment round counter (starts at 1)
- If round counter ≤ 3: revise the plan to address each gap, then re-run Phase 5.5 with the revised plan
- If round counter > 3: auto-promote to REDESIGN REQUIRED

**REDESIGN REQUIRED:**
- Present the reviewer's rationale to the user
- Ask: "The reviewer found fundamental structural issues. Options: (a) revise scope and restart from Phase 1, (b) override the reviewer and proceed anyway (not recommended), (c) abandon the change."
- Wait for user decision

### Audit log

The reviewer's full report is saved to `/tmp/change-process-audit-{timestamp}.md` (timestamp format: `YYYYMMDD-HHMMSS`). This persists the detailed findings so the user can inspect them after the subagent returns.

### Iteration state

Change-process runs that span multiple audit rounds should save state to `~/.claude/change-process/NNN-description.md` so context can be recovered if the conversation is lost. Each round's findings and plan revisions are appended to the iteration file.

## Phase 6: Execute

Only after Phase 5.5 returns SAFE TO EXECUTE and the User confirms the audited plan:
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
   cp -R ~/.claude/scripts ~/Documents/repos/claude-config/
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
- `scripts/` - Utility scripts (sync, review, etc.)
- `README.md` - Overview
- `settings.json` - Hooks and MCP config

**Never synced (stays in ~/.claude/ only):**
- `.credentials.json` - OAuth tokens
- `settings.local.json` - Local overrides
- `history.jsonl`, `todos/`, `projects/`, etc. - Session state

## Phase 7: Sync to Gemini and Codex

After Phase 6 completes (changes made to `~/.claude/` and synced to claude-config repo), propagate the changes to Gemini CLI and Codex CLI.

1. **Read the cross-tool sync guide:**
   Read `~/.claude/guides/cross-tool-sync.md` for platform differences and adaptation rules.

2. **Run the sync script:**
   ```bash
   ~/.claude/scripts/sync-ai-tools.sh
   ```

3. **Verify output:**
   - Check that `~/.gemini/GEMINI.md` has correct `@imports`
   - Check that `~/.codex/AGENTS.md` was regenerated
   - If new commands were added: verify TOML and SKILL.md were generated
   - If rules were modified: verify adaptations are correct (spot-check one file)

4. **Report sync status:**
   ```
   ## Cross-Tool Sync Complete

   | Target | Files Synced | Status |
   |--------|-------------|--------|
   | Gemini (~/.gemini/) | [N] rules, [M] guides, [K] commands | OK |
   | Codex (~/.codex/) | AGENTS.md regenerated, [K] skills | OK |

   Changes propagated to all three platforms.
   ```

**If sync script is not found:** Warn the user and skip. This is non-blocking -- the user can run the script manually later.

## Rules

- **Don't assume** - Ask if unclear
- **Don't add noise** - Every addition should solve a real problem
- **Challenge gently** - The User might have missed something, help them see it
- **Be thorough** - Read every file, don't skip
- **Be specific** - Vague changes lead to inconsistency
- **Inline execution** - Never spawn relay/messenger subagents after asking questions. End your turn and wait for the user's next message. The only permitted subagent spawn is the Explore agent in Phase 2 (if >20 files) and the reviewer agent in Phase 5.5.
- **Audit before execute** - Every /change-process run MUST complete Phase 5.5 (Independent Plan Audit) with verdict SAFE TO EXECUTE before proceeding to Phase 6. No exceptions — even for "trivial" changes. Trivial changes are where process failures hide.
- **Audit loop cap** - Maximum 3 audit rounds per /change-process invocation. If round 3 still returns FIX BEFORE EXECUTE, auto-promote to REDESIGN REQUIRED and escalate to the user.
- **Save iteration state** - For multi-round changes, save state to `~/.claude/change-process/NNN-description.md` so context survives compaction or session loss.

## Anti-patterns to Watch For

Flag these if you see them:
- Adding a file that duplicates existing content
- Creating a process that only the User will remember
- Adding steps without clear ownership
- Removing something without a replacement
- Making changes that only apply to one project but are in global files
- Skipping Phase 5.5 "because the change is small" — trivial changes are exactly where orphaning and silent-default bugs hide (Sprint 032 evidence)
- Spawning relay/messenger subagents to pass user answers between phases — causes death-loop failures (Sprint 032 evidence)

---

**Start by asking:** "What change do you want to make to the process?"
