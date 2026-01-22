---
description: Set up Claude Code documentation structure for a new project
---

# New Project Setup

This command sets up the documentation structure for a new project to work with Claude Code agents.

## Documentation Structure

Every project needs these files:

```
project/
├── CLAUDE.md                    # How to work on this project (stable)
└── docs/
    ├── PROJECT_STATE.md         # Current codebase state (living document)
    ├── roadmap.md               # Task index - mirrors Linear (fallback)
    └── technical-specs/         # Spec files per issue
        └── {ISSUE_ID}.md
```

### CLAUDE.md (Root)

**Purpose:** Entry point for agents. How to operate on this project.
**Updates:** Rarely. Only when workflows or tooling change.

**Contains:**
- Quick start (points to PROJECT_STATE.md)
- Running commands (dev server, tests)
- Working with agents (EM + /sprint workflow)
- Linear integration (team, issue prefix)
- Before you commit checklist

**Does NOT contain:**
- File structure (goes in PROJECT_STATE.md)
- Database schema (goes in PROJECT_STATE.md)
- API endpoints (goes in PROJECT_STATE.md)
- Key technical decisions (goes in PROJECT_STATE.md)
- Known issues (goes in Linear)

### docs/PROJECT_STATE.md

**Purpose:** Current state of the codebase. Living reference for agents.
**Updates:** After every deployment by Developer agent.

**Contains:**
- File structure
- Database schema
- API endpoints
- Tech stack
- Key technical decisions
- Infrastructure/deployment config
- Recent changes (last 10)
- Supported features

### docs/roadmap.md

**Purpose:** Index of all technical specs. Mirrors Linear as a fallback.
**Updates:** When issues are created, completed, or status changes.

**Contains:**
- Active sprint tasks with status
- Backlog items
- Completed items (recent)
- Links to spec files

**Use as fallback** when Linear is unavailable.

### docs/technical-specs/{ISSUE_ID}.md

**Purpose:** Single spec file per issue containing exploration + implementation plan.
**Updates:** Explorer creates, Plan-Writer updates, Developer tracks progress.

---

## CLAUDE.md Template

```markdown
# Claude Code Project Guide

> Start here when working on this project.

---

## Quick Start

1. **Read the project state first:** `docs/PROJECT_STATE.md`
   - File structure, database schema, API endpoints
   - Tech stack, infrastructure, recent changes

2. **Check roadmap:** `docs/roadmap.md`
   - Current sprint tasks
   - Fallback when Linear unavailable

---

## Running the Project

### Backend
\`\`\`bash
cd /path/to/project/backend
# Add your run command
\`\`\`

### Frontend
\`\`\`bash
cd /path/to/project/frontend
# Add your run command
\`\`\`

### Tests
\`\`\`bash
# Backend tests
# Frontend tests
\`\`\`

---

## Working with Agents

Use the **EM agent** for task coordination and the `/sprint` command for autonomous execution.

### Workflow
\`\`\`
ROY (request/issue)
    ↓
ENG MANAGER — prioritizes, coordinates
    ↓
EXPLORER — analyzes → creates docs/technical-specs/{ISSUE_ID}.md
    ↓
PLAN-WRITER — plans → updates docs/technical-specs/{ISSUE_ID}.md
    ↓
ROY (approves plan) ← CHECKPOINT
    ↓
DEVELOPER — implements → reads spec file
    ↓
REVIEWER — validates
\`\`\`

### Key Commands
- **EM agent**: Task assignment, status updates, roadmap management
- **`/sprint`**: Autonomous execution of Priority 1 tasks from Linear

---

## Linear Integration

| Setting | Value |
|---------|-------|
| Issue Prefix | `XXX` |
| Team | TeamName |
| Technical Specs | `docs/technical-specs/XXX-##.md` |

All task tracking happens in Linear. Agents post updates as comments on issues.
Use `docs/roadmap.md` as fallback when Linear is unavailable.

---

## MCP Configuration

Disable unused MCPs to save context. Add to project's `.claude/settings.json`:

\`\`\`json
{
  "disabledMcpServers": ["slack", "notion", "jira"]
}
\`\`\`

Only Linear is typically needed. Disable others unless the project requires them.

---

## Before You Commit

Checklist:
- [ ] Tests pass
- [ ] No unintended file changes
- [ ] Commit message describes the "why"
```

---

## PROJECT_STATE.md Template

```markdown
# Project State

> **Purpose:** Current state of the [ProjectName] codebase
> **Updated by:** Developer Agent after each completed task
> **Last updated:** [date]

---

## File Structure

\`\`\`
project/
├── backend/
│   └── ...
├── frontend/
│   └── ...
└── docs/
    ├── PROJECT_STATE.md
    ├── roadmap.md
    └── technical-specs/
\`\`\`

---

## Database Schema

[Database type] at `path/to/database`

\`\`\`sql
-- Key tables
\`\`\`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/... | ... |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | ... |
| Frontend | ... |
| Database | ... |

---

## Key Technical Decisions

These are established patterns - don't change without discussion:

1. **[Decision]** - [rationale]

---

## Infrastructure

### Git Branch Structure

| Branch | Purpose | Auto-deploys to |
|--------|---------|-----------------|
| `main` | Production | Production |
| `develop` | Staging | Staging |

### Deployment

[Deployment platform and config]

### Environment Variables

- `VAR_NAME` - description

---

## Recent Changes

> Add new entries at the top. Keep last 10 entries.

| Date | Change | Commit |
|------|--------|--------|
| YYYY-MM-DD | Initial setup | abc123 |
```

---

## roadmap.md Template

```markdown
# Roadmap

> **Purpose:** Index of all tasks and specs. Mirrors Linear.
> **Updated by:** EM Agent when tasks change status
> **Fallback:** Use this when Linear is unavailable

---

## Active Sprint

| Priority | Issue | Title | Status | Spec |
|----------|-------|-------|--------|------|
| 1 | XXX-## | [Title] | 🟨 In Progress | [spec](technical-specs/XXX-##.md) |
| 2 | XXX-## | [Title] | 🟥 To Do | [spec](technical-specs/XXX-##.md) |

**Status:** 🟥 To Do | 🟨 In Progress | 🟩 Done | ⏸️ Blocked

---

## Backlog

| Issue | Title | Added | Notes |
|-------|-------|-------|-------|
| XXX-## | [Title] | YYYY-MM-DD | [brief context] |

---

## Completed (Last 10)

| Issue | Title | Completed | Spec |
|-------|-------|-----------|------|
| XXX-## | [Title] | YYYY-MM-DD | [spec](technical-specs/XXX-##.md) |

---

## Notes

- **Linear is source of truth** - this file mirrors it
- **Sync timing:** After Linear changes, at sprint start, at sprint end
- If Linear unavailable, this becomes temporary source of truth
- When Linear is added/restored, EM reconciles (shows diff, User approves)
- Specs live in `technical-specs/{ISSUE_ID}.md`
```

---

## Setup Checklist

When setting up a new project:

1. [ ] Create `CLAUDE.md` in project root using template above
2. [ ] Create `docs/` directory
3. [ ] Create `docs/PROJECT_STATE.md` using template above
4. [ ] Create `docs/roadmap.md` using template above
5. [ ] Create `docs/technical-specs/` directory
6. [ ] Set up Linear team and issue prefix
7. [ ] Add project to Linear with correct team assignment
8. [ ] Update CLAUDE.md with actual Linear team and prefix

---

## Agent Files (Global)

These agents are configured globally in `~/.claude/agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| EM | `em.md` | Task coordination, roadmap management |
| Explorer | `explorer.md` | Codebase analysis → creates spec file |
| Plan-Writer | `plan-writer.md` | Implementation plans → updates spec file |
| Developer | `developer.md` | Code implementation → reads/updates spec file |
| Reviewer | `reviewer.md` | Code review |

**Do not create project-specific agent files.** Use the global agents.

---

## The Spec File

Each issue gets a single spec file at `docs/technical-specs/{ISSUE_ID}.md`:

```
┌─────────────────────────────────────────────────────────┐
│ docs/technical-specs/{ISSUE_ID}.md                      │
├─────────────────────────────────────────────────────────┤
│ ## Summary                                              │
│ ## Exploration (by Explorer)                            │
│ ## Implementation Plan (by Plan-Writer)                 │
│   - [ ] 🟥 Task 1                                       │
│   - [ ] 🟥 Task 2                                       │
└─────────────────────────────────────────────────────────┘
```

**Flow:**
1. Explorer creates the file with exploration findings
2. Plan-Writer adds implementation plan to the same file
3. Developer updates progress (🟥→🟨→🟩) as they work
4. EM updates `docs/roadmap.md` to reflect status

---

## What Goes Where

| Content | CLAUDE.md | PROJECT_STATE.md | roadmap.md | Linear |
|---------|-----------|------------------|------------|--------|
| Run commands | ✓ | | | |
| Agent workflow | ✓ | | | |
| Linear config | ✓ | | | |
| File structure | | ✓ | | |
| Database schema | | ✓ | | |
| API endpoints | | ✓ | | |
| Tech stack | | ✓ | | |
| Key decisions | | ✓ | | |
| Infrastructure | | ✓ | | |
| Recent changes | | ✓ | | |
| Sprint tasks | | | ✓ (mirror) | ✓ |
| Backlog | | | ✓ (mirror) | ✓ |
| Known issues | | | | ✓ |
