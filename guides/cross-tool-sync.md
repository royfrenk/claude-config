# Cross-Tool Sync Guide

How to maintain consistent engineering standards across Claude Code, Gemini CLI, and OpenAI Codex CLI.

---

## Architecture Overview

**Operational source of truth today:** `~/.claude/` (rules, guides, commands)

**Derived targets:**
- `~/.gemini/` (GEMINI.md with @imports, rules/, guides/, commands/)
- `~/.codex/` (AGENTS.md concatenated, guides/, skills/)

**Sync mechanism:** `~/.claude/scripts/sync-ai-tools.sh`

**Trigger:** Automatically via change-process Phase 7, or manually anytime.

### Canonical Model

The long-term maintainable model is:

```text
Project docs
    ↓
Shared workflow intent
    ↓
Platform-specific runtime adapters
```

- Project docs (`CLAUDE.md`, `PROJECT_STATE.md`, `roadmap.md`) define the project
- Shared workflow docs define the process, gates, and outputs
- Platform-specific runtime files implement that process

**Important:** Claude `agents/` files are runtime adapters for Claude, not the canonical source for cross-platform workflow behavior. Gemini and Codex do not share that runtime model.

### Phase A Parity Sources

Phase A now has two surfaces:

- Human-readable contract surface: `~/.claude/guides/cross-tool-sync.md`
- Machine-readable decision surface: `~/.claude/guides/cross-tool-parity-phase-a.json`

The guide explains the model. The JSON manifest drives sync-time validation and report generation.

**Exact status tokens:**

| Token | Meaning |
|------|---------|
| `PASS` | Expected output exists and passes required hard checks |
| `INTENTIONAL_DIFFERENCE` | Output exists but is intentionally different, such as a documented manual override |
| `UNSUPPORTED` | Platform does not support the declared execution model for that command |
| `DEFERRED` | Command is inventory-only in Phase A; report it, do not gate on it |
| `FAIL` | Missing output, malformed manifest, size overflow, or another hard validation failure |

**Stable report path:** `/tmp/sync-parity-report.json`

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

### How Guidance Shifts By Platform

| Layer | Claude Code | Gemini CLI | Codex CLI |
|------|-------------|------------|-----------|
| Project entrypoint | `CLAUDE.md` points to project docs and workflow commands | Same project docs | Same project docs |
| Workflow expression | Role-oriented, can use agents | Phase-oriented, single-agent adaptation | Phase-oriented, single-agent adaptation |
| Runtime detail location | `commands/` + `agents/` | `commands/*.toml` | `skills/*/SKILL.md` + `AGENTS.md` |
| Safe assumption | Agent roles can be operational | Agent roles are conceptual unless inlined | Agent roles are conceptual unless inlined |

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

### Rules (7 files -- all synced with adaptation)

| Rule | Adaptations |
|------|-------------|
| `coding-style.md` | Hook refs -> generic, agent refs -> generic |
| `performance.md` | Tool names -> generic, remove MCP/subagent sections |
| `security.md` | Hook refs -> generic |
| `stability.md` | Path refs, MCP tool names -> generic, agent refs -> generic |
| `task-completion.md` | Path refs, command refs -> generic |
| `testing.md` | Agent refs -> generic, path refs |
| `infrastructure.md` | Path refs, agent refs -> generic |

### Guides (17 of 24 synced)

**Verbatim:** autonomous-iteration, design, external-model-delegation, legal, project-state-update, rtl-i18n-checklist, testing-patterns, security-patterns

**Path substitution only:** api-integration-patterns, code-performance, database-patterns, frontend-patterns, google-auth, platform-access

**Structural adaptation:** deployment-protocol, review-submission, roadmap-management

**Skipped (Claude-only):** README, autonomous-sprint, codex-peer-review, parallel-review, retroactive-review, screenshot-orchestration, visual-verification

### Commands (12 of 17 synced)

**Synced:** checkpoint, context, create-bug, create-issue, design, iterate, learning-opportunity, new-project, post-mortem, review-prd, sprint, change-process

**Skipped:** audit, sync-linear, sync-roadmap, v0-feature, v0-new-project

### Phase A Parity Contracts

| Command | Phase A Scope | Claude | Gemini | Codex | Gate Expectation |
|---------|---------------|--------|--------|-------|------------------|
| `change-process` | Yes | Claude-owned live workflow | Unsupported adapter | Unsupported adapter | `UNSUPPORTED` allowed on Gemini/Codex; `PASS` required for Claude source |
| `checkpoint` | No | Standard command | Single-agent adaptation | Single-agent adaptation | `DEFERRED` allowed |
| `context` | Yes | Standard command | Single-agent adaptation | Single-agent adaptation | `PASS` required |
| `create-bug` | Yes | Standard command | Single-agent adaptation | Single-agent adaptation | `PASS` required |
| `create-issue` | Yes | Standard command | Single-agent adaptation | Single-agent adaptation with manual override | `PASS` or documented `INTENTIONAL_DIFFERENCE` |
| `design` | No | Standard command | Single-agent adaptation | Single-agent adaptation | `DEFERRED` allowed |
| `iterate` | Yes | Standard command | Single-agent adaptation | Single-agent adaptation | `PASS` required |
| `learning-opportunity` | Yes | Standard command | Single-agent adaptation | Single-agent adaptation | `PASS` required |
| `new-project` | Yes | Standard command | Single-agent adaptation | Single-agent adaptation | `PASS` required |
| `post-mortem` | No | Standard command | Single-agent adaptation | Single-agent adaptation | `DEFERRED` allowed |
| `review-prd` | No | Standard command | Single-agent adaptation | Single-agent adaptation | `DEFERRED` allowed |
| `sprint` | Yes | Multi-agent runtime | Single-agent adaptation | Single-agent adaptation | `PASS` required with platform-specific execution-model differences allowed |

### Phase A Contract Notes

- `change-process` remains Claude-owned in Phase A. Gemini and Codex get explicit unsupported adapters rather than broken partial translations.
- `sprint` and `iterate` are allowed to differ internally by platform, but they must preserve the user-visible gates and artifacts.
- Codex `create-issue` is the only documented manual override in Phase A. It remains allowed only while the override is explicitly tracked in the parity manifest and report.

### Phase A Validator Behavior

`sync-ai-tools.sh` is responsible for Phase A parity reporting. It reads `cross-tool-parity-phase-a.json` and writes `/tmp/sync-parity-report.json`.

**Hard failures in Phase A:**
- parity manifest missing
- parity manifest malformed
- required generated output missing
- Codex `AGENTS.md` exceeds `131072` bytes
- parity report missing after sync
- any Phase A command reported as `FAIL`

**Report-only findings in Phase A:**
- known drift patterns still present in generated Gemini/Codex outputs
- documented manual overrides
- commands outside Phase A scope

This means Phase A can start enforcing the sync layer without requiring every known drift to be fixed in the same change.

### Rollback And Completion

**Rollback path:**
- revert the `~/.claude/` source changes
- rerun `~/.claude/scripts/sync-ai-tools.sh`
- confirm `/tmp/sync-parity-report.json` returns to the prior non-failing state
- only then mirror back to `~/Documents/repos/claude-config/`

**Phase A complete means:**
- machine-readable parity manifest exists and is valid
- human-readable contract table matches the manifest decisions
- sync script writes `/tmp/sync-parity-report.json`
- Phase A commands (`change-process`, `context`, `create-bug`, `create-issue`, `iterate`, `learning-opportunity`, `new-project`, `sprint`) have no `FAIL`
- any `UNSUPPORTED` or `INTENTIONAL_DIFFERENCE` states are explicit and documented
- repo mirroring happens only after local sync + parity validation pass

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
