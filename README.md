# Claude Code Agent System

> A multi-agent workflow for managing software projects with Claude Code.

---

## Quick Start

### Installation

```bash
# Clone to your home directory
git clone https://github.com/royfrenkiel/claude-config.git ~/.claude

# Or if you already have ~/.claude, clone elsewhere and copy:
git clone https://github.com/royfrenkiel/claude-config.git /tmp/claude-config
cp -r /tmp/claude-config/agents ~/.claude/
cp -r /tmp/claude-config/commands ~/.claude/
cp /tmp/claude-config/README.md ~/.claude/
```

### Set Up Your First Project

1. Create project structure:
   ```bash
   cd ~/your-project
   mkdir -p docs/technical-specs
   ```

2. Create `CLAUDE.md` in project root (see [CLAUDE.md Template](#claudemd-template) below)

3. Create `docs/PROJECT_STATE.md` (document your codebase)

4. Create `docs/roadmap.md` (see [Roadmap Template](#roadmap-template) below)

5. (Optional) Set up Linear for task tracking

### Start Working

```bash
cd ~/your-project
# Claude Code will automatically read CLAUDE.md

# Or explicitly load context:
/context your-project

# Run autonomous sprint:
/sprint
```

---

## The Agent System

We use a team of specialized agents coordinated by an Engineering Manager:

```
USER (request/issue)
    ↓
ENG MANAGER — prioritizes, coordinates, approves plans
    ↓
EXPLORER — analyzes codebase → creates docs/technical-specs/{ISSUE_ID}.md
    ↓
PLAN-WRITER — creates plan → updates docs/technical-specs/{ISSUE_ID}.md
    ↓
USER (approves plan) ← CHECKPOINT
    ↓
DEVELOPER — implements → reads/updates spec file
    ↓
REVIEWER — validates code
```

### Agent Roles

| Agent | What It Does | Can Write Code? |
|-------|--------------|-----------------|
| **EM** | Coordinates work, manages roadmap, filters noise | No |
| **Explorer** | Analyzes codebase, creates spec file with findings | No |
| **Plan-Writer** | Adds implementation plan to spec file | No |
| **Developer** | Implements code, updates spec progress, deploys to staging | Yes |
| **Reviewer** | Reviews code, approves/blocks staging deploys | No |

### Key Rules

- Only **Developer** writes code
- Only **User** pushes to `main` (production)
- All agents post updates to Linear issues
- Plans require User's approval before implementation
- One spec file per issue: `docs/technical-specs/{ISSUE_ID}.md`
- `docs/roadmap.md` mirrors Linear as fallback

---

## The Spec File

Each issue gets a single spec file at `docs/technical-specs/{ISSUE_ID}.md` that evolves through the workflow:

```
┌─────────────────────────────────────────────────────────┐
│ docs/technical-specs/{ISSUE_ID}.md                      │
├─────────────────────────────────────────────────────────┤
│ # {ISSUE_ID}: [Title]                                   │
│                                                         │
│ **Status:** [Exploration Complete → Ready for Dev → Done]│
│                                                         │
│ ## Summary                                               │
│ [What and why]                                          │
│                                                         │
│ ## Exploration (by Explorer)                            │
│ - Files to modify                                       │
│ - Integration points                                    │
│ - Edge cases                                            │
│ - Testing requirements                                  │
│                                                         │
│ ## Implementation Plan (by Plan-Writer)                 │
│ **Progress:** 0%                                        │
│ - [ ] 🟥 Task 1                                         │
│ - [ ] 🟥 Task 2                                         │
│ - [ ] 🟥 Task 3                                         │
└─────────────────────────────────────────────────────────┘
```

**Who updates it:**
- Explorer creates it with exploration findings
- Plan-Writer adds the implementation plan
- Developer updates progress (🟥→🟨→🟩) as they work

---

## File Structure

### Global (applies to all projects)

```
~/.claude/
├── README.md              # This file - how we work
├── settings.json          # Hooks configuration (auto-format, warnings, etc.)
├── agents/
│   ├── em.md              # Engineering Manager agent
│   ├── explorer.md        # Codebase analysis agent
│   ├── plan-writer.md     # Implementation planning agent
│   ├── developer.md       # Code implementation agent
│   └── reviewer.md        # Code review agent
├── commands/
│   ├── context.md         # /context - load project context
│   ├── sprint.md          # /sprint - autonomous execution
│   ├── create-issue.md    # /create-issue - quick issue capture
│   ├── new-project.md     # /new-project - setup guide
│   ├── checkpoint.md      # /checkpoint - save work state
│   └── learning-opportunity.md  # Teaching mode
└── rules/
    ├── security.md        # Security requirements
    ├── coding-style.md    # Code organization, immutability
    ├── testing.md         # Testing requirements
    └── performance.md     # Context efficiency, selective reads
```

### Per-Project (in each repo)

```
project/
├── CLAUDE.md                    # How to operate (stable, rarely changes)
└── docs/
    ├── PROJECT_STATE.md         # Current codebase state (living document)
    ├── roadmap.md               # Task index - mirrors Linear (fallback)
    └── technical-specs/         # Spec files per issue
        └── {ISSUE_ID}.md
```

---

## Documentation Philosophy

### Three Files Per Project

| File | Purpose | Updates |
|------|---------|---------|
| `CLAUDE.md` | How to operate on this project | Rarely (workflow changes) |
| `docs/PROJECT_STATE.md` | Current codebase state | After every deployment |
| `docs/roadmap.md` | Task index, mirrors Linear | When task status changes |

### What Goes Where

| Content | CLAUDE.md | PROJECT_STATE.md | roadmap.md | Linear |
|---------|-----------|------------------|------------|--------|
| Run commands | ✓ | | | |
| Agent workflow | ✓ | | | |
| Linear config | ✓ | | | |
| File structure | | ✓ | | |
| Database schema | | ✓ | | |
| API endpoints | | ✓ | | |
| Tech decisions | | ✓ | | |
| Recent changes | | ✓ | | |
| Sprint tasks | | | ✓ (mirror) | ✓ |
| Backlog | | | ✓ (mirror) | ✓ |
| Known issues | | | | ✓ |

---

## The Roadmap File

`docs/roadmap.md` mirrors Linear and serves as a fallback when Linear is unavailable:

```markdown
## Active Sprint

| Priority | Issue | Title | Status | Spec |
|----------|-------|-------|--------|------|
| 1 | XXX-## | [Title] | 🟨 In Progress | [spec](technical-specs/XXX-##.md) |

## Backlog

| Issue | Title | Added | Notes |
|-------|-------|-------|-------|
| XXX-## | [Title] | YYYY-MM-DD | [context] |

## Completed (Last 10)

| Issue | Title | Completed | Spec |
|-------|-------|-----------|------|
| XXX-## | [Title] | YYYY-MM-DD | [spec](technical-specs/XXX-##.md) |
```

**Status:** 🟥 To Do | 🟨 In Progress | 🟩 Done | ⏸️ Blocked

### Sync Rules

| Scenario | Action |
|----------|--------|
| Linear status changes | EM updates roadmap.md to match |
| Sprint starts | EM marks active items as 🟨 In Progress |
| Sprint ends | EM moves completed items to Completed section |
| Linear unavailable | roadmap.md becomes temporary source of truth |
| Linear restored | EM proposes reconciliation plan to User |

**Reconciliation Process:**
When Linear is added or restored after roadmap.md has work items:
1. EM compares both sources and generates diff
2. EM shows **Added** (in roadmap.md, not Linear) and **Changed** (status differs)
3. User approves reconciliation plan
4. EM creates/updates Linear issues
5. EM syncs roadmap.md with Linear issue IDs

---

## Commands

| Command | Purpose |
|---------|---------|
| `/context <project>` | Load project context (CLAUDE.md + PROJECT_STATE.md) |
| `/sprint` | Autonomous execution of Priority 1 task from Linear |
| `/create-issue` | Quick issue capture while coding |
| `/new-project` | Setup guide and templates for new projects |
| `/learning-opportunity` | Pause for teaching mode |

---

## Linear Integration

All task tracking happens in Linear, not markdown files. `docs/roadmap.md` is a mirror/fallback.

### Per-Project Config (in CLAUDE.md)

```markdown
## Linear Integration

| Setting | Value |
|---------|-------|
| Issue Prefix | `XXX` |
| Team | YourTeam |
| Technical Specs | `docs/technical-specs/XXX-##.md` |
```

### What Agents Do in Linear

- **EM**: Creates issues, updates priority, tracks status, updates roadmap.md
- **Explorer**: Posts exploration summary as comment
- **Plan-Writer**: Posts implementation plan summary as comment
- **Developer**: Posts "Starting", "Submitted for Review", "Deployed" updates
- **Reviewer**: Posts approval/changes requested

---

## Workflows

### Starting Work on a Project

```bash
# Load context
/context projectname

# Or manually
cd ~/documents/repos/projectname
# Claude reads CLAUDE.md and PROJECT_STATE.md
```

### Autonomous Sprint

```bash
/sprint
# Reads Linear (or roadmap.md as fallback) for Priority 1 task
# Implements without confirmation
# Stops at blockers or when done
```

### New Feature/Bug (Full Flow)

```
1. User describes task or creates Linear issue
2. EM updates docs/roadmap.md with new task
3. EM invokes Explorer
4. Explorer analyzes → creates docs/technical-specs/{ISSUE_ID}.md
5. EM invokes Plan-Writer
6. Plan-Writer adds implementation plan → updates same file
7. EM presents plan to User ← CHECKPOINT
8. User approves
9. EM assigns to Developer (points to spec file)
10. Developer implements, updates spec progress (🟥→🟨→🟩)
11. Developer submits to Reviewer
12. Reviewer approves → Developer deploys to staging
13. Developer updates PROJECT_STATE.md
14. EM updates roadmap.md status to Done
15. User approves → merge to main (production)
```

### Quick Issue Capture

```bash
/create-issue the search bar doesn't handle empty queries
# Agent asks 2-3 questions
# Creates Linear issue
# Back to work
```

---

## Setting Up a New Project

Run `/new-project` to see full templates, or manually:

1. Create `CLAUDE.md` in project root
2. Create `docs/PROJECT_STATE.md`
3. Create `docs/roadmap.md`
4. Create `docs/technical-specs/` directory
5. Set up Linear team and issue prefix
6. Add project to `~/documents/repos/`

---

## Git Workflow

```
feature/* → develop (staging) → main (production)
```

| Branch | Who Can Push | Auto-deploys to |
|--------|--------------|-----------------|
| `feature/*` | Developer | — |
| `develop` | Developer (after Reviewer approval) | Staging |
| `main` | User only | Production |

---

## Key Principles

1. **Linear is source of truth** for tasks - roadmap.md is the fallback
2. **One spec file per issue** - Explorer creates, Plan-Writer updates, Developer reads
3. **Plans require approval** before implementation
4. **Developer only pushes to develop**, never main
5. **PROJECT_STATE.md updated after every deployment**
6. **roadmap.md updated when task status changes**
7. **Agents post all updates to Linear issues**
8. **Keep CLAUDE.md stable** - it's the "how to operate" guide

---

## Templates

### CLAUDE.md Template

```markdown
# Claude Code Project Guide

> Start here when working on this project.

---

## Quick Start

1. **Read the project state first:** `docs/PROJECT_STATE.md`
2. **Check roadmap:** `docs/roadmap.md`

---

## Running the Project

### Backend
\`\`\`bash
# Add your run commands here
\`\`\`

### Frontend
\`\`\`bash
# Add your run commands here
\`\`\`

### Tests
\`\`\`bash
# Add your test commands here
\`\`\`

---

## Working with Agents

Use the **EM agent** for task coordination and the `/sprint` command for autonomous execution.

---

## Linear Integration

| Setting | Value |
|---------|-------|
| Issue Prefix | `XXX` |
| Team | YourTeam |
| Technical Specs | `docs/technical-specs/XXX-##.md` |

---

## Before You Commit

- [ ] Tests pass
- [ ] No unintended file changes
- [ ] Commit message describes the "why"
```

### Roadmap Template

```markdown
# Roadmap

> **Purpose:** Index of all tasks and specs. Mirrors Linear.
> **Updated by:** EM Agent when tasks change status
> **Fallback:** Use this when Linear is unavailable

---

## Active Sprint

| Priority | Issue | Title | Status | Spec |
|----------|-------|-------|--------|------|
| 1 | XXX-## | [Title] | 🟥 To Do | [spec](technical-specs/XXX-##.md) |

**Status:** 🟥 To Do | 🟨 In Progress | 🟩 Done | ⏸️ Blocked

---

## Backlog

| Issue | Title | Added | Notes |
|-------|-------|-------|-------|
| — | — | — | — |

---

## Completed (Last 10)

| Issue | Title | Completed | Spec |
|-------|-------|-----------|------|
| — | — | — | — |

---

## Notes

- **Linear is source of truth** - this file mirrors it
- **Sync timing:** After Linear changes, at sprint start, at sprint end
- If Linear unavailable, this becomes temporary source of truth
- When Linear is added/restored, EM reconciles (shows diff, User approves)
```

---

## Hooks

Hooks run automatically after certain tool uses. Configured in `~/.claude/settings.json`.

### Active Hooks

| Trigger | What It Does |
|---------|--------------|
| Edit JS/TS file | Auto-format with Prettier |
| Edit JS/TS file | Warn if console.log found |
| Edit TS file | Check for TypeScript errors (if tsconfig.json exists) |
| Edit code file | Warn if hardcoded secrets detected |
| Every 15+ edits | Remind to run `/checkpoint` |

### Customizing Hooks

Edit `~/.claude/settings.json` to add/modify hooks. See [Claude Code docs](https://docs.anthropic.com/claude-code) for hook syntax.

---

## Rules

Shared rules that all agents follow. Located in `~/.claude/rules/`.

| Rule File | Enforces |
|-----------|----------|
| `security.md` | Input validation, auth, secrets, SSRF prevention |
| `coding-style.md` | File organization, immutability, naming conventions |
| `testing.md` | Test coverage, test structure, verification loop |
| `performance.md` | Context efficiency, selective file reads, checkpointing |

Agents reference these rules and enforce them during development and review.

---

## Verification Loop

Before submitting code for review, Developer runs full verification:

```bash
# 1. Build check
npm run build 2>&1 | tail -20

# 2. Type check (if TypeScript)
npx tsc --noEmit 2>&1 | head -20

# 3. Lint check
npm run lint 2>&1 | head -20

# 4. Tests
cd backend && pytest tests/ -v
cd frontend && npm test

# 5. Security scan
grep -rn "console\.log" --include="*.ts" src/ | head -10
grep -rn "sk-\|api_key\|password\s*=" . | head -5
```

**All checks must pass before submitting to Reviewer.**

---

## Checkpointing

Save work state to spec file before context compaction or breaks:

```bash
/checkpoint
```

This saves:
- What was completed
- Key file changes
- Current state
- Next steps

**When to checkpoint:**
- After completing each subtask
- Before taking a break
- When hook reminds you (after 15+ edits)
- Before switching to different work

---

## MCP Hygiene

MCPs consume context even when not used. Disable unused ones per project.

In project's `.claude/settings.json`:
```json
{
  "disabledMcpServers": ["slack", "notion", "jira"]
}
```

**Rule of thumb:**
- Have many MCPs configured globally (flexibility)
- Enable only needed MCPs per project (efficiency)
- Linear is usually needed; others vary by project

---

## Requirements

- [Claude Code CLI](https://claude.ai/claude-code) installed
- (Optional) [Linear](https://linear.app) for task tracking
- (Optional) GitHub CLI (`gh`) for PR automation
