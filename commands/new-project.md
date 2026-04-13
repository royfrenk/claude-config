---
description: Set up Claude Code documentation structure for a new project
---

# New Project Setup

This command sets up the documentation structure for a new project to work with the shared workflow across Claude, Gemini, and Codex.

## Documentation Structure

Every project needs these files:

```
project/
├── CLAUDE.md                    # How to work on this project (stable)
└── docs/
    ├── PROJECT_STATE.md         # Current codebase state (living document)
    ├── roadmap.md               # Task index - mirrors Linear (fallback)
    ├── technical-specs/         # Spec files per issue
    │   └── {ISSUE_ID}.md
    └── sprints/                 # Sprint iteration tracking
        └── sprint-###-[name].md
```

### CLAUDE.md (Root)

**Purpose:** Project entry point. How to operate on this project.
**Updates:** Rarely. Only when workflows or tooling change.

**Contains:**
- Quick start (points to PROJECT_STATE.md)
- Running commands (dev server, tests)
- Workflow entrypoints (/sprint workflow)
- Linear integration (team, issue prefix)
- Before you commit checklist

**Does NOT contain:**
- File structure (goes in PROJECT_STATE.md)
- Database schema (goes in PROJECT_STATE.md)
- API endpoints (goes in PROJECT_STATE.md)
- Key technical decisions (goes in PROJECT_STATE.md)
- Known issues (goes in Linear)
- Claude-specific runtime implementation details (global `agents/` files)

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

## Working with the Workflow

Use `/sprint` for autonomous execution. It handles orchestration directly in the main conversation.

`CLAUDE.md` is a project entrypoint, not the canonical home of global workflow logic. It should point to project docs and the workflow commands people actually run. On Claude, those commands may use agents internally. On Gemini and Codex, the same workflow is adapted into single-agent phases.

### Workflow
\`\`\`
USER (request/issue)
    ↓
/sprint — runs the workflow entrypoint inline
    ↓
EXPLORATION — analyzes → creates docs/technical-specs/{ISSUE_ID}.md
    ↓
PLANNING — plans → updates docs/technical-specs/{ISSUE_ID}.md
    ↓
USER (approves plan) ← CHECKPOINT
    ↓
IMPLEMENTATION — reads spec file and makes changes
    ↓
REVIEW — validates before deploy
\`\`\`

### Key Commands
- **`/sprint`**: Autonomous execution — runs the workflow entrypoint
- **`/iterate`**: Continue fixing bugs after testing on staging

---

## Linear Integration

**Note:** Set `linear_enabled: false` if this project doesn't use Linear. All task tracking will use roadmap.md only.

linear_enabled: true

| Setting | Value |
|---------|-------|
| Issue Prefix | `XXX` |
| Team | TeamName |
| Team ID | `<team-uuid>` |
| Technical Specs | `docs/technical-specs/XXX-##.md` |

### Status UUIDs (for `mcp_linear_update_issue`)

| Status | UUID |
|--------|------|
| Backlog | `<uuid>` |
| Todo | `<uuid>` |
| In Progress | `<uuid>` |
| In Review | `<uuid>` |
| Done | `<uuid>` |
| Canceled | `<uuid>` |

> **To get UUIDs:** Run `curl -X POST https://api.linear.app/graphql -H "Authorization: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"query": "{ team(id: \"TEAM_ID\") { states { nodes { id name } } } }"}'`

### Labels

| Label | Purpose |
|-------|---------|
| agent | Applied to ALL issues created by Claude (not human-created) |
| technical | Applied to backend/infra/tech-debt issues Claude inferred or initiated |

> **Note:** Create these labels in Linear if they don't exist. Agent will apply them automatically.

All task tracking happens in Linear. The workflow posts updates as comments on issues.
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

## Deployment

| Environment | Branch | URL |
|-------------|--------|-----|
| Staging | `develop` | [your-staging-url] |
| Production | `main` | [your-production-url] |

**Git workflow:** `feature/*` → `develop` (staging) → `main` (production)

**Who can push:**
- `develop`: Developer (after Reviewer approval)
- `main`: User only

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

| Environment | Branch | URL |
|-------------|--------|-----|
| Staging | `develop` | [staging-url] |
| Production | `main` | [production-url] |

Platform: [Vercel/Railway/etc]

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

## Sync Status

| Status | Last Synced | Notes |
|--------|-------------|-------|
| ✅ In sync | [date] | — |

> Update this when Linear is unavailable. Clear pending items after syncing.

### Pending Updates (when Linear unavailable)
<!-- Add items here when Linear MCP fails, remove after syncing -->

---

## Active Sprint

| Priority | Issue | Title | Status | Spec |
|----------|-------|-------|--------|------|
| 1 | XXX-## | [Title] | 🟨 In Progress | [spec](technical-specs/XXX-##.md) |
| 2 | XXX-## | [Title] | 🟥 To Do | [spec](technical-specs/XXX-##.md) |

**Status:** 🟥 To Do | 🟨 In Progress | 🟩 Done | ⏸️ Blocked

---

## P0 - Core Features

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| [Only active/pending work - no completed items] |

---

## P1 - Important

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| [Only active/pending work - no completed items] |

---

## Backlog

Sort by priority (High → Medium → Low), then by issue number.

| Priority | Issue | Title | Added | Notes |
|----------|-------|-------|-------|-------|
| High | XXX-## | [Title] | YYYY-MM-DD | [brief context] |
| Medium | XXX-## | [Title] | YYYY-MM-DD | [brief context] |
| Low | XXX-## | [Title] | YYYY-MM-DD | [brief context] |

---

## Recently Completed

| Issue | Title | Completed | Sprint | Outcome | Spec |
|-------|-------|-----------|--------|---------|------|
| XXX-## | [Title] | YYYY-MM-DD | [Sprint ###](sprints/sprint-###-name.done.md) | [Brief outcome] | [spec](technical-specs/XXX-##.md) |
| [Most recent items at top, older items below] |

---

## Notes

- **Linear is source of truth** - this file mirrors it
- **Sync timing:** After Linear changes, at sprint start, at sprint end
- If Linear unavailable, this becomes temporary source of truth
- When Linear is added/restored, EM reconciles (shows diff, User approves)
- Specs live in `technical-specs/{ISSUE_ID}.md`
- **Recently Completed** section at bottom shows ALL completed items in single table
- Most recent items at TOP of Recently Completed table
- Priority sections (P0/P1/P2) only show active work - completed items move to Recently Completed
```

---

## CI/CD (Optional - Recommended for Production Apps)

For production applications, add GitHub Actions to run tests before merging.

**When to add CI/CD:**
- Production apps with real users → Yes
- Prototypes/experiments → No (slows you down)
- Side projects → Maybe (depends on complexity)

**Suggested workflow file** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ github.event_name == 'push' && github.ref == 'refs/heads/develop' && 'YOUR_STAGING_URL' || github.event_name == 'push' && github.ref == 'refs/heads/main' && 'YOUR_PROD_URL' || '' }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

**Reference:** See `quo` project for a full CI/CD implementation with Vercel.

---

## Setup Checklist

When setting up a new project:

1. [ ] Create `CLAUDE.md` in project root using template above
2. [ ] Create `docs/` directory
3. [ ] Create `docs/PROJECT_STATE.md` using template above
4. [ ] Create `docs/roadmap.md` using template above
5. [ ] Create `docs/technical-specs/` directory
6. [ ] Create `docs/sprints/` directory (for sprint iteration tracking)
7. [ ] **Decide if project uses Linear:**
   - Set `linear_enabled: true` in CLAUDE.md (requires steps 8-11)
   - OR set `linear_enabled: false` (skip steps 8-11, use roadmap.md only)
8. [ ] Set up Linear team and issue prefix (if enabled)
9. [ ] Add project to Linear with correct team assignment (if enabled)
10. [ ] Update CLAUDE.md with actual Linear team and prefix (if enabled)
11. [ ] **Get Linear status UUIDs** and add to CLAUDE.md (if enabled - see below)
12. [ ] **Set up Git branches:** Create `develop` branch, configure auto-deploy to staging
13. [ ] **Add deployment URLs** to CLAUDE.md (staging + production)
13. [ ] **(Production apps)** Add GitHub Actions CI/CD (see template above)

### Getting Linear Status UUIDs

Run this GraphQL query (replace `YOUR_API_KEY` and `TEAM_ID`):

```bash
curl -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_KEY" \
  -d '{"query": "{ team(id: \"TEAM_ID\") { states { nodes { id name } } } }"}'
```

Copy the UUIDs into your project's CLAUDE.md under "Status UUIDs".

---

## Claude Runtime Files (Global)

In Claude, these runtime files are configured globally in `~/.claude/agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| Explorer | `explorer.md` | Codebase analysis → creates spec file |
| Plan-Writer | `plan-writer.md` | Implementation plans → updates spec file |
| Developer | `developer.md` | Code implementation → reads/updates spec file |
| Reviewer | `reviewer.md` | Code review |

> **Note:** These files are Claude-specific runtime adapters, not the canonical project workflow. `CLAUDE.md` should not point projects directly at them as a required dependency.

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
| Workflow entrypoints | ✓ | | | |
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
