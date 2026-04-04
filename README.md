# Claude Code Agent System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-config-purple.svg)](https://claude.ai/claude-code)

> A multi-agent workflow for Claude Code. Like having a small dev team that never sleeps.

---

## 30-Second Demo

```bash
# 1. Install (one-time)
git clone https://github.com/royfrenk/claude-config.git ~/.claude

# 2. Set up a project
cd ~/your-project
mkdir -p docs/technical-specs docs/sprints
# Create CLAUDE.md (see templates below)

# 3. Run
/sprint
# Claude reads your tasks, creates a spec, implements, pushes to develop
# (If you have staging configured, it deploys there too)
# You test, report bugs with /iterate, approve for production
```

That's it. The rest of this README explains how it works.

> **Minimum viable project:** `CLAUDE.md` + `docs/roadmap.md` with at least one task. See [Minimum Viable Project](#minimum-viable-project) for details.

---

## How It Works

Specialized agents handle different parts of development:

```
You: "Add user authentication"
    ↓
/sprint — orchestrates the full workflow inline (no subagent)
    ↓
Explorer(s) — analyzes codebase (may spawn multiple in parallel)
    ↓
Plan-Writer — creates implementation plan + dependency analysis
    ↓
/sprint — creates execution plan (parallelization strategy)
    ↓
You — approve the plan ← CHECKPOINT
    ↓
Developer(s) — implements in waves (parallel when possible)
    ↓  ↓  ↓
Wave 1: Dev A, Dev B, Dev C (parallel)
    ↓
[For UI work only]
Design-Reviewer(s) — reviews UI/UX against design standards FIRST
    ↓
[All work]
Reviewer(s) — reviews code quality, security, testing
    ↓
Wave 1 deploys to staging
    ↓
Wave 2: Dev D, Dev E (parallel, after Wave 1)
    ↓
Reviewer(s) — reviews Wave 2
    ↓
Wave 2 deploys to staging
    ↓
You — test on staging, report issues
    ↓
Developer(s) — fixes via /iterate
    ↓
[Sprint Complete - Ready for Production]
    ↓
OpenAI Codex Peer Review — second perspective on sprint changes
    ↓
Reviewer — evaluates Codex recommendations, passes accepted items to Developer
    ↓
Developer — implements accepted recommendations (if any)
    ↓
Reviewer — final approval
    ↓
You — deploy to production ← ONLY YOU
```

### Key Constraints

| Rule | Why |
|------|-----|
| Plans require your approval | No surprises — you see the approach before code is written |
| Developer pushes to `develop` only | Staging first, always |
| Only you push to `main` | Production deploys are manual and intentional |
| One spec file per issue | External memory that survives context compaction |

> **Note on enforcement:** Agents are instruction-bound — they'll refuse to push to `main`. But for real protection, enable GitHub branch protection on `main`:
> - ✓ Require pull request before merging
> - ✓ Require status checks to pass (if you have CI)
> - ✓ Restrict who can push (just you)

---

### Parallelization

The system automatically parallelizes work when tasks are independent:

**What gets parallelized:**
- **Exploration:** Multiple Explorers analyze different areas (frontend, backend, db)
- **Implementation:** Multiple Developers work on independent tasks simultaneously
- **Review:** Multiple Reviewers review parallel submissions

**How it works:**
1. Plan-Writer analyzes task dependencies
2. Engineering Manager groups tasks into waves:
   - Wave 1: Tasks with no dependencies (run in parallel)
   - Wave 2: Tasks depending on Wave 1 (run in parallel after Wave 1)
   - Wave 3: Tasks depending on Wave 2 (and so on)
3. Within each wave, EM checks for file conflicts
4. Spawn parallel Developers for independent tasks
5. Coordinate file overlaps via sequencing or zone assignment

**Example:**

Task breakdown:
- Task 1: Database schema (no dependencies)
- Task 2: Backend API (depends on Task 1)
- Task 3: Frontend UI (depends on Task 2)
- Task 4: Logging utility (no dependencies)
- Task 5: Update docs (no dependencies)

Execution:
- **Wave 1 (parallel):** Dev A (Task 1), Dev B (Task 4), Dev C (Task 5)
- **Wave 2 (after Wave 1):** Dev D (Task 2)
- **Wave 3 (after Wave 2):** Dev E (Task 3)

**Result:** 3 waves instead of 5 sequential tasks (40% faster).

**File Conflict Management:**
- EM assigns file zones: "Dev A owns src/db/, Dev B owns src/utils/"
- If unavoidable overlap: EM sequences ("Dev A first, Dev B rebases")
- Developers stay within their zones

**You maintain control:**
- You approve the parallelization strategy before execution starts
- You see the execution plan: which tasks run when, and why
- You can request changes: "Run these sequentially instead"

---

## Dependencies

| Dependency | Required? | Notes |
|------------|-----------|-------|
| [Claude Code CLI](https://claude.ai/claude-code) | Yes | The foundation |
| [Linear](https://linear.app) | Optional | Task tracking with agent integration |
| GitHub CLI (`gh`) | Optional | PR automation |

**If you don't use Linear:** The workflow still works. Use `docs/roadmap.md` as your task list, and name issues manually (e.g., `PROJ-01`, `PROJ-02`).

---

## Minimum Viable Project

To run `/sprint`, you need:

**Required files:**
- `CLAUDE.md` — at minimum, a Quick Start section pointing to your docs
- `docs/roadmap.md` — with at least one task in Active Sprint

**Required for the workflow:**
- `docs/technical-specs/` directory (agents create spec files here)
- `docs/sprints/` directory (for iteration tracking)

**Optional but recommended:**
- `docs/PROJECT_STATE.md` — helps agents understand your codebase
- Linear integration — for automatic status updates
- `develop` branch with auto-deploy to staging — for the full staging→prod flow

**If you don't have staging:**
The workflow still works. `/sprint` pushes to `develop`. You test locally or on whatever deployment you have, then push to `main` yourself.

---

## Files & Workflow

### Per-Project Files

Every project needs these:

```
project/
├── CLAUDE.md                    # How to operate (stable)
└── docs/
    ├── PROJECT_STATE.md         # Codebase state (updated after deploys)
    ├── roadmap.md               # Task index (mirrors Linear)
    ├── evals/                   # Quality evaluation criteria (evergreen)
    │   ├── README.md
    │   └── {feature}.eval.md
    ├── technical-specs/         # Spec files per issue
    │   └── {ISSUE_ID}.md
    └── sprints/                 # Sprint iteration tracking
        └── sprint-###-[name].md
```

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

### The Spec File

Each issue gets `docs/technical-specs/{ISSUE_ID}.md`:

```markdown
# PROJ-42: Add user authentication

**Status:** 🟨 In Progress

## Summary
[What and why]

## Exploration (by Explorer)
- Files to modify
- Integration points
- Edge cases

## Implementation Plan (by Plan-Writer)
**Progress:** 33%
- [x] 🟩 Task 1: Set up auth provider
- [ ] 🟨 Task 2: Add login flow
- [ ] 🟥 Task 3: Add logout flow
```

Explorer creates it → Plan-Writer adds the plan → Developer updates progress (🟥→🟨→🟩).

### The Sprint File

For iteration tracking: `docs/sprints/sprint-001-auth.md`

- Which issues are in the sprint
- Bugs found during testing
- Fixes applied

**Why it exists:** Context gets compacted during long iterations. The sprint file is external memory.

---

## Commands

| Command | Purpose |
|---------|---------|
| `/context <project>` | Load project context (project name required) |
| `/sprint` | Autonomous execution. Suggests Todo issues if no args provided |
| `/iterate` | Continue iteration after bug reports. Supports `--model` flag for external AI delegation |
| `/design` | Invoke design skills with auto context detection |
| `/review-prd` | PRD review and story extraction |
| `/create-issue` | Quick issue capture |
| `/new-project` | Setup guide and templates |
| `/checkpoint` | Save work state to spec file |
| `/v0-new-project` | Init v0.dev chat from current repo (v0 sees all files) |
| `/v0-feature` | Add feature chat to existing v0 project |

> **How commands work:** Command files live in `~/.claude/commands/`. Claude Code discovers them automatically. Each command is a markdown file with instructions.

### Sprint & Iterate Workflow

**`/sprint`** — Initial implementation
1. Selects issues:
   - If no args provided: suggests all Todo issues, waits for confirmation
   - If args provided (e.g., `/sprint QUO-57 QUO-58`): uses specified issues
   - Fallback: queries for Priority 1 task
2. Creates or reads technical spec(s)
3. Implements, pushes to `develop` (deploys to staging if configured)
4. Creates sprint file

**`/iterate`** — Bug fixes after testing
1. You test on staging, report issues
2. Developer fixes, tracks in sprint file
3. If stuck (3+ failed attempts): auto-suggests external model delegation
4. Manual override: `/iterate --model gemini` or `/iterate --model codex`
5. Repeat until ready
6. You push to main (production)

---

## Linear Integration (Optional)

If you use Linear, add this to your project's `CLAUDE.md`:

```markdown
## Linear Integration

| Setting | Value |
|---------|-------|
| Issue Prefix | `PROJ` |
| Team | YourTeam |
| Team ID | `uuid-here` |

### Status UUIDs

| Status | UUID |
|--------|------|
| Backlog | `uuid` |
| Todo | `uuid` |
| In Progress | `uuid` |
| In Review | `uuid` |
| Done | `uuid` |
```

**Getting UUIDs:**
```bash
# Use an env var to avoid leaking your API key in shell history
export LINEAR_API_KEY="lin_api_..."

curl -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ team(id: \"TEAM_ID\") { states { nodes { id name } } } }"}'
```

**What agents do in Linear:**
- EM creates issues, updates roadmap.md
- Explorer/Plan-Writer post summaries as comments
- Developer updates status, posts progress
- Reviewer posts approval/changes requested

---

## Git Workflow

```
feature/* → develop (staging) → main (production)
```

| Branch | Who Pushes | Deploys To |
|--------|------------|------------|
| `feature/*` | Developer | — |
| `develop` | Developer (after review) | Staging |
| `main` | User only | Production |

### CI/CD (Recommended)

For production apps, add GitHub Actions:

| Trigger | Runs |
|---------|------|
| PR to `develop` | Build, lint, e2e |
| Push to `develop` | E2e against staging |
| PR to `main` | E2e against staging |
| Push to `main` | E2e against production |

---

## Rules & Hooks

### Hooks (Auto-run)

| Trigger | Action |
|---------|--------|
| Edit JS/TS | Auto-format with Prettier |
| Edit JS/TS | Warn if console.log found |
| Edit TS | TypeScript error check |
| Edit any code | Warn if secrets detected |
| Every 15+ edits | Remind to checkpoint |

> **Note:** Hooks are configured in `~/.claude/settings.json`. They depend on your repo having the required tooling installed (e.g., Prettier for auto-format).

### Rules (All Agents Follow)

| File | Enforces |
|------|----------|
| `security.md` | Input validation, auth, secrets |
| `coding-style.md` | File organization, immutability |
| `testing.md` | Test coverage, verification loop |
| `performance.md` | Context efficiency, selective reads |

---

## Known Limitations

### Glob Tool Behavior

**Issue:** Glob searches from current working directory when `path` parameter is omitted or incorrectly specified.

**Impact:** Commands like `/context` may fail to detect active sprint files if:
- You're in a subdirectory (not project root)
- The `path` parameter is incorrectly set
- The docs/sprints/ directory doesn't exist

**Workaround:** Use Bash `find` instead of Glob for file existence checks:
```bash
# Instead of: Glob pattern="*.active.md" path="docs/sprints/"
# Use: find docs/sprints/ -name "*.active.md" -type f 2>/dev/null
```

**Status:** Fixed in `/context` command as of 2026-02-03 (now uses Bash find).

---

## FAQ

### What if I don't use Linear?

Use `docs/roadmap.md` as your task list. Name issues manually: `PROJ-01`, `PROJ-02`, etc. The workflow is the same — agents read from roadmap.md when Linear is unavailable.

### How do I name ISSUE_ID without Linear?

Pick a prefix for your project (e.g., `PROJ`, `AUTH`, `API`) and number sequentially. The spec file becomes `docs/technical-specs/PROJ-01.md`.

### What if the agent makes a wrong plan?

1. **Before approval:** Just say "no" and explain what's wrong. The agent will revise.
2. **After implementation started:** Stop the sprint, edit the spec file directly, then continue.
3. **After deployment:** Use `/iterate` to fix issues, or manually revert the commit.

### How do I handle monorepos?

Each sub-project can have its own `CLAUDE.md` and `docs/` folder. Use `/context` to switch between them, or work from the monorepo root with a unified `CLAUDE.md`.

### What happens during context compaction?

AI context is limited. When it gets long:
- **Spec files** survive (external memory)
- **Sprint files** survive (iteration tracking)
- **CLAUDE.md** is re-read automatically

That's why we write everything important to files.

### How do I roll back a bad deployment?

1. Revert the commit: `git revert HEAD`
2. Push to current branch: `git push origin $(git branch --show-current)`
3. Verify staging is fixed
4. (If already in prod) Cherry-pick the revert to main

---

## Installation

### Fresh Install

```bash
git clone https://github.com/royfrenk/claude-config.git ~/.claude
```

### If ~/.claude Already Exists

```bash
git clone https://github.com/royfrenk/claude-config.git /tmp/claude-config
cp -r /tmp/claude-config/agents ~/.claude/
cp -r /tmp/claude-config/commands ~/.claude/
cp -r /tmp/claude-config/rules ~/.claude/
cp /tmp/claude-config/README.md ~/.claude/
```

### Updating

```bash
cd ~/.claude
git pull origin main
```

### Uninstall

```bash
# Remove global config
rm -rf ~/.claude/agents ~/.claude/commands ~/.claude/rules ~/.claude/guides

# Per-project: remove CLAUDE.md and docs/ folder, or keep them for reference
```

---

## Versioning

This repo is meant to be **cloned into `~/.claude`** and updated occasionally with `git pull`. It's not a fork-and-customize situation — the agents and commands are designed to work together.

**If you want to customize:**
- Add project-specific rules in your project's `.claude/` folder
- Override hooks in project's `.claude/settings.json`
- Don't modify `~/.claude/agents/` unless you're changing the core workflow

---

## Global File Structure

```
~/.claude/
├── README.md              # This file
├── settings.json          # Hooks configuration
├── agents/
│   ├── design-planner.md  # Design specs & mockups (UX features)
│   ├── explorer.md        # Codebase analysis
│   ├── plan-writer.md     # Implementation planning
│   ├── developer.md       # Code implementation
│   ├── reviewer.md        # Code review
│   ├── design-reviewer.md # Design/UX review
│   └── external-model-delegate.md  # External AI model delegation (Gemini, Codex)
├── commands/
│   ├── context.md         # /context
│   ├── sprint.md          # /sprint
│   ├── iterate.md         # /iterate
│   ├── design.md          # /design
│   ├── review-prd.md      # /review-prd
│   ├── create-issue.md    # /create-issue
│   ├── new-project.md     # /new-project
│   ├── checkpoint.md      # /checkpoint
│   └── change-process.md  # /change-process
├── guides/
│   ├── README.md                  # Guide index and usage instructions
│   ├── em-protocol.md             # EM orchestration protocol (runs inline via /sprint)
│   ├── agent-teams.md             # Parallel agent team coordination
│   ├── api-integration-patterns.md # Env vars, fallbacks, error handling
│   ├── code-performance.md        # N+1 queries, caching, memoization
│   ├── codex-peer-review.md       # OpenAI Codex peer review process
│   ├── database-patterns.md       # Schema, migrations, indexing
│   ├── design.md                  # Design quick reference (points to skills)
│   ├── frontend-patterns.md       # Responsive design, breakpoints, Figma
│   ├── google-auth.md             # Google OAuth setup, tokens, Capacitor
│   ├── external-model-delegation.md  # External model delegation guide
│   ├── legal.md                   # Privacy, compliance
│   └── testing-patterns.md        # E2E, unit tests, coverage strategy
├── skills/
│   ├── deploy-pi.md              # Pi deployment
│   ├── design-core.md            # Core design tokens and contracts
│   ├── design-marketing.md       # Marketing/landing page design
│   ├── design-applications.md    # SaaS/app UI design
│   └── design-dashboards.md      # Dashboard/data viz design
├── scripts/
│   ├── codex-review.sh            # OpenAI Codex peer review
│   ├── external-model-call.sh     # External model API caller
│   ├── v0-init-repo.mjs             # v0 chat from GitHub repo (repo-aware)
│   └── v0-feature-chat.mjs          # v0 feature chat in existing project
└── rules/
    ├── security.md
    ├── coding-style.md
    ├── testing.md
    └── performance.md
```

---

## Templates

### CLAUDE.md Template

```markdown
# Claude Code Project Guide

> Start here when working on this project.

## Quick Start

1. **Read project state:** `docs/PROJECT_STATE.md`
2. **Check roadmap:** `docs/roadmap.md`

## Running the Project

\`\`\`bash
npm run dev      # Development
npm run build    # Build
npm run test     # Tests
\`\`\`

## Linear Integration

| Setting | Value |
|---------|-------|
| Issue Prefix | `PROJ` |
| Team | YourTeam |
| Technical Specs | `docs/technical-specs/PROJ-##.md` |

## Deployment

| Environment | Branch | URL |
|-------------|--------|-----|
| Staging | `develop` | [staging-url] |
| Production | `main` | [prod-url] |

## Before You Commit

- [ ] Tests pass
- [ ] No unintended changes
- [ ] Commit message describes "why"
```

### roadmap.md Template

```markdown
# Roadmap

> **Purpose:** Lightweight backlog index. Brief context shown; full details in spec files.
> **Last Updated:** YYYY-MM-DD

---

## Active Sprint

**None** - Run `/sprint` to start a new sprint

---

## Backlog

### High Priority

| ID | Title | Priority | Est | Context | Spec |
|----|-------|----------|-----|---------|------|
| PROJ-## | [Title] | High (P1) | 2d | [1-2 line summary] | [spec](technical-specs/PROJ-##.md) |

### Medium Priority

| ID | Title | Priority | Est | Context | Spec |
|----|-------|----------|-----|---------|------|
| PROJ-## | [Title] | Medium (P2) | 1w | [1-2 line summary] | [spec](technical-specs/PROJ-##.md) |

### Low Priority

| ID | Title | Priority | Est | Context | Spec |
|----|-------|----------|-----|---------|------|
| PROJ-## | [Title] | Low (P3) | 3d | [1-2 line summary] | [spec](technical-specs/PROJ-##.md) |

---

## Recently Completed

| ID | Title | Completed | Outcome | Sprint |
|----|-------|-----------|---------|--------|
| PROJ-## | [Title] | YYYY-MM-DD | [Brief outcome - what was achieved] | [sprint-###](sprints/sprint-###-[name].done.md) |

---

## Notes

- **Spec files are source of truth** - Click spec links for full context
- **Roadmap shows brief context only** - 1-2 line summary per issue
- **Roadmap is auto-updated** by `/sprint`, `/iterate`, `/create-issue` commands
- **Priority:** High → Medium → Low (work on High first)
- **Estimates:** d=days, w=weeks

---

## Quick Actions

```bash
/sprint                    # Start working on highest priority task
/create-issue "bug desc"   # Add new issue to Backlog
/context                   # Load project context
```
```

### PROJECT_STATE.md Template

```markdown
# Project State

> Updated after each deployment.
> Last updated: YYYY-MM-DD

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | [tech] |
| Frontend | [tech] |
| Database | [tech] |

## File Structure

\`\`\`
project/
├── src/
└── docs/
\`\`\`

## Database Schema

[Key tables]

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/... | ... |

## Deployment CLI

| Platform | CLI Linked | Project ID | Notes |
|----------|-----------|------------|-------|
| [platform] | [yes/no] | [id] | [branch mappings] |

## Recent Changes

| Date | Change | Commit |
|------|--------|--------|
| YYYY-MM-DD | Initial setup | abc123 |
```

---

## Agent Roles

| Agent / Protocol | What It Does | Can Write Code? | Can Spawn Sub-Agents? |
|-------|--------------|-----------------|------------------------|
| **EM Protocol** (inline) | Coordinates work, manages roadmap, orchestrates parallelization. Runs in the main conversation via `/sprint`, not as a subagent. | No | Yes (Explorer, Plan-Writer, Eval-Writer, Developer, Design-Reviewer, Reviewer) |
| **Explorer** | Analyzes codebase, creates spec file | No | No (but can run in parallel with other Explorers) |
| **Plan-Writer** | Adds implementation plan + dependency analysis | No | No |
| **Eval-Writer** | Writes quality benchmarks for subjective features | No | No |
| **Developer** | Implements code, deploys to staging | Yes | No (but can run in parallel with other Developers) |
| **Design-Reviewer** | Reviews UI implementations against design standards (runs BEFORE Code Reviewer for UI work) | No | No |
| **Reviewer** | Reviews code, approves/blocks deploys | No | Yes (sub-Reviewers for parallel review) |
| **External Model Delegate** | Consults external AI models (Gemini, Codex) for stuck bugs, implements their suggestions | Yes | No |

---

## Contributing

This is a personal workflow config, but PRs are welcome if you find bugs or have improvements that fit the philosophy:

1. **Spec-first development** — plan before code
2. **External memory** — everything important goes to files
3. **Human in the loop** — checkpoints at key decisions
4. **Clear ownership** — each agent has one job

---

## License

MIT
