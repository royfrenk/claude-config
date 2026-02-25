# Cross-Tool Sync Guide

How to maintain consistent engineering standards across Claude Code, Gemini CLI, and OpenAI Codex CLI.

---

## Architecture Overview

**Source of truth:** `~/.claude/` (rules, guides, commands)

**Derived targets:**
- `~/.gemini/` (GEMINI.md with @imports, rules/, guides/, commands/)
- `~/.codex/` (AGENTS.md concatenated, guides/, skills/)

**Sync mechanism:** `~/.claude/scripts/sync-ai-tools.sh`

**Trigger:** Automatically via change-process Phase 7, or manually anytime.

---

## Platform Differences

| Feature | Claude Code | Gemini CLI | Codex CLI |
|---------|-------------|------------|-----------|
| Global instructions | `~/.claude/rules/*.md` (auto-loaded) | `~/.gemini/GEMINI.md` (`@imports`) | `~/.codex/AGENTS.md` (single file) |
| Instruction limit | ~200K context | No documented limit | 32KB default (set to 128KB) |
| Commands | `~/.claude/commands/*.md` (frontmatter) | `~/.gemini/commands/*.toml` | `~/.codex/skills/{name}/SKILL.md` |
| Sub-agents | Yes (Task tool, agent types) | No | No |
| MCP tools | Yes (Linear, v0, etc.) | Limited (via config) | Yes (via config.toml) |
| Hooks | PostToolUse hooks | No | No |
| Agent orchestration | EM, Explorer, Developer, Reviewer | Single-agent | Single-agent |

---

## Adaptation Rules

### Text Substitutions (Applied by sync script)

1. **Paths:** `~/.claude/` -> tool-appropriate path (`~/.gemini/` or `~/.codex/`)
2. **Tool names:** `Glob`, `Grep`, `Read`, `Edit`, `Write`, `Bash` (as Claude tools) -> generic descriptions
3. **Hook references:** "Hook: warns at" -> "Warning threshold:", "Hook: blocks at" -> "Hard limit:", "Hooks automatically" -> "Automated checks should"
4. **Agent names:** Explorer, Developer, EM, Reviewer, Plan-Writer, Eval-Writer -> generic phase descriptions
5. **Subagent spawning:** "Use the Task tool" / "spawn a subagent" -> "Execute these phases yourself"
6. **MCP tool calls:** `mcp__linear__*` -> "Use Linear integration" or remove
7. **Context window:** "Claude has a 200K token context window" -> "Use context efficiently"
8. **PostToolUse parentheticals:** "(PostToolUse hook on Edit/Write)" -> removed

### What Copies Verbatim

- Code examples (JS, TS, Python, SQL, CSS)
- Checklists and tables (content, not agent references)
- Architecture patterns
- Error handling patterns
- Security requirements
- Design principles

### What Gets Removed (Claude-Only)

- `agents/` directory (multi-agent orchestration)
- `settings.json` (MCP configs, hook definitions)
- `teams/`, `tasks/` (team orchestration)
- Commands: `audit`, `sync-linear`, `sync-roadmap`, `v0-feature`, `v0-new-project`

---

## Gemini-Specific Details

### GEMINI.md

Uses `@rules/filename.md` and `@guides/filename.md` imports to keep modular structure.

### Commands (TOML format)

```toml
description = "Short description here"

prompt = """
Command content here.
Arguments: {{args}}
"""
```

- Arguments use `{{args}}` placeholder (not `$ARGUMENTS`)
- No frontmatter -- description is a TOML key

### Directory Structure

```
~/.gemini/
  GEMINI.md
  rules/*.md
  guides/*.md
  commands/*.toml
```

---

## Codex-Specific Details

### AGENTS.md

Single concatenated file from all adapted rules. No import mechanism available.

Must set `project_doc_max_bytes = 131072` in `~/.codex/config.toml` to accommodate full content.

### Skills (Command Equivalent)

Each command becomes a directory with SKILL.md:

```
~/.codex/skills/{name}/SKILL.md
```

SKILL.md format:

```markdown
---
name: skill-name
description: Short description here
---

# Skill Title

[Content here]
```

### Guides

Stored at `~/.codex/guides/*.md` and referenced from AGENTS.md.

---

## What Gets Synced

### Rules (6 files -- all synced with adaptation)

| Rule | Adaptations |
|------|-------------|
| `coding-style.md` | Hook refs -> generic, agent refs -> generic |
| `performance.md` | Tool names -> generic, remove MCP/subagent sections |
| `security.md` | Hook refs -> generic |
| `stability.md` | Path refs, MCP tool names -> generic, agent refs -> generic |
| `task-completion.md` | Path refs, command refs -> generic |
| `testing.md` | Agent refs -> generic, path refs |

### Guides (13 of 23 synced)

**Verbatim:** design, legal, project-state-update, rtl-i18n-checklist, testing-patterns

**Path substitution only:** api-integration-patterns, code-performance, database-patterns, frontend-patterns, google-auth

**Structural adaptation:** deployment-protocol, review-submission, roadmap-management

**Skipped (Claude-only):** README, agent-teams, autonomous-sprint, codex-peer-review, external-model-delegation, parallel-review, retroactive-review, screenshot-orchestration, v0-design-workflow, visual-verification

### Commands (11 of 16 synced)

**Synced:** checkpoint, context, create-issue, design, iterate, learning-opportunity, new-project, post-mortem, review-prd, sprint, change-process

**Skipped:** audit, sync-linear, sync-roadmap, v0-feature, v0-new-project

---

## When to Sync

- After any `change-process` execution (Phase 7 auto-triggers)
- After manually editing rules, guides, or commands
- Run: `~/.claude/scripts/sync-ai-tools.sh`

## Adding a New Command

1. Create `~/.claude/commands/{name}.md` (Claude format)
2. Run sync script OR next change-process will pick it up
3. Script auto-generates:
   - `~/.gemini/commands/{name}.toml`
   - `~/.codex/skills/{name}/SKILL.md`

## Adding a New Rule

1. Create `~/.claude/rules/{name}.md`
2. Run sync script
3. Script auto-generates:
   - `~/.gemini/rules/{name}.md` (adapted copy)
   - Regenerates `~/.codex/AGENTS.md` (concatenated)
   - Updates `~/.gemini/GEMINI.md` (adds @import)

## Adding a New Guide

1. Create `~/.claude/guides/{name}.md`
2. Add the filename to the SYNCABLE_GUIDES list in the sync script
3. Run sync script
4. Script copies to `~/.gemini/guides/` and `~/.codex/guides/`
5. Updates `~/.gemini/GEMINI.md` with new @import

---

## Troubleshooting

### GEMINI.md imports not loading

- Check `@` syntax uses relative paths from `~/.gemini/` (e.g., `@rules/coding-style.md`)
- Verify files exist at the expected paths
- Use `/memory show` in Gemini CLI to inspect loaded context

### Codex AGENTS.md too large

- Check `project_doc_max_bytes` in `~/.codex/config.toml` (should be 131072)
- If still too large, consider trimming verbose guides

### New command not appearing

- Gemini: Check `~/.gemini/commands/{name}.toml` exists
- Codex: Check `~/.codex/skills/{name}/SKILL.md` exists
- Run sync script again if missing
