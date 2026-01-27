# Claude Code Agent System

> A multi-agent workflow for managing software projects with Claude Code.

---

## What is This?

This is a **team of AI agents** that work together to build software — like having a small engineering team that never sleeps.

Instead of one AI doing everything, specialized agents handle different parts of the development process:

```
You: "Add user authentication"
    ↓
Engineering Manager — breaks it down, prioritizes
    ↓
Explorer — analyzes your codebase, finds integration points
    ↓
Plan-Writer — creates implementation plan
    ↓
You — approve the plan (or request changes)
    ↓
Developer — writes the code, deploys to staging
    ↓
Reviewer — checks for bugs, security issues
    ↓
You — test on staging, report issues
    ↓
Developer — fixes issues (iterate until ready)
    ↓
You — approve and deploy to production
```

**You stay in control.** Plans require your approval. Only you can push to production.

---

## Why This Approach?

### The Problem with "Just Ask Claude"

When you ask an AI to build something complex, you often get:
- Code that works but doesn't fit your architecture
- No visibility into what's being changed until it's done
- Inconsistent patterns across features
- Security issues or forgotten edge cases

### The Solution: Specialization + Checkpoints

Each agent has **one job** and does it well:

| Agent | Specialty | Why It Matters |
|-------|-----------|----------------|
| **Explorer** | Understands your codebase | Finds the right files, existing patterns, integration points |
| **Plan-Writer** | Plans before coding | You approve the approach before any code is written |
| **Developer** | Writes code | Follows the plan, runs tests, deploys to staging |
| **Reviewer** | Catches mistakes | Security, code quality, edge cases |

**Checkpoints** keep you informed:
- Plans require approval before implementation
- Code goes to staging before production
- Every change is tracked in spec files and Linear

---

## Core Concepts

### 1. Spec Files (External Memory)

Every task gets a **spec file** at `docs/technical-specs/{ISSUE_ID}.md`. This is the "single source of truth" for that task — what was explored, what's planned, what's done.

**Why it matters:** AI context is limited and gets compacted. Spec files survive restarts, can be shared, and keep everyone (human and AI) on the same page.

### 2. Linear Integration

Tasks live in [Linear](https://linear.app), not scattered markdown files. Agents post updates as comments, so you can track progress without watching the terminal.

**Fallback:** If Linear is down, `docs/roadmap.md` mirrors the state.

### 3. Git Workflow

```
feature/* → develop (staging) → main (production)
```

- **Developer** can push to `develop` (after Reviewer approval)
- **Only you** can push to `main`
- This is enforced by the agents — they'll refuse to push to production

### 4. Hooks & Rules

Automation that runs in the background:
- **Hooks:** Auto-format code, warn about console.log, detect secrets
- **Rules:** Security requirements, coding standards, testing requirements

All agents follow the same rules, enforcing consistency across your codebase.

### 5. Sprint & Iterate Workflow

Work happens in two phases:

**`/sprint`** — Initial implementation
1. Reads Linear for Priority 1 task
2. Creates or reads technical spec
3. Implements code, deploys to staging
4. Creates sprint file at `docs/sprints/sprint-###-[name].md`

**`/iterate`** — Bug fixes after you test
1. You test on staging, report issues
2. Developer fixes bugs, tracks in sprint file
3. Repeat until ready for production
4. You push to main (only you can deploy to production)

**The sprint file** (`docs/sprints/sprint-###-[name].md`) is external memory that tracks:
- Which issues are in the sprint
- Bugs found during testing
- Fixes applied

This survives context compaction — critical for longer iteration cycles.

---

## Who Is This For?

- **Solo developers** who want AI assistance with structure and quality control
- **Technical PMs** who want to ship features without writing every line
- **Small teams** who want to augment their capacity with AI agents

**Prerequisites:**
- Comfortable with git and command line
- Have a project with clear patterns (or willing to establish them)
- [Claude Code CLI](https://claude.ai/claude-code) installed

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

## The Sprint File

Each sprint gets a file at `docs/sprints/sprint-###-[name].md` that tracks iteration state:

- **Which issues** are in the sprint
- **Iteration log** — bugs reported and fixed
- **New ACs discovered** during testing

**Why it exists:** During iteration, context gets long and details get lost. The sprint file is external memory that survives context compaction.

**Lifecycle:**
1. Created at end of `/sprint` (after initial implementation)
2. Updated during `/iterate` (bugs added, fixed, checked off)
3. Archived when sprint ships to production

**What goes where:**

| Content | Sprint File | Spec File |
|---------|-------------|-----------|
| Bug found during testing | ✓ (iteration log) | |
| New acceptance criterion | | ✓ (with approval) |
| Implementation tasks | | ✓ |
| Fix history | ✓ (iteration log) | |

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
│   ├── iterate.md         # /iterate - bug fixes after user testing
│   ├── review-prd.md      # /review-prd - PRD review and story extraction
│   ├── create-issue.md    # /create-issue - quick issue capture
│   ├── new-project.md     # /new-project - setup guide
│   ├── checkpoint.md      # /checkpoint - save work state
│   └── learning-opportunity.md  # Teaching mode
├── guides/
│   ├── design.md          # Design review lens (UX, accessibility, states)
│   └── legal.md           # Legal review lens (privacy, consumer protection)
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
    ├── technical-specs/         # Spec files per issue
    │   └── {ISSUE_ID}.md
    └── sprints/                 # Sprint iteration tracking
        └── sprint-###-[name].md
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
| Issue created | EM updates roadmap.md immediately |
| Backlog/Todo changes in Linear | EM replicates to roadmap.md (user can change these) |
| In Progress/In Review/Done changes in Linear | EM flags discrepancy, asks before reverting (roadmap.md is source of truth) |
| Sprint starts | EM runs reconciliation check, flags discrepancies |
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
| `/iterate` | Continue sprint iteration after user finds bugs |
| `/review-prd` | PRD review, Q&A, story extraction, Linear issue creation |
| `/create-issue` | Quick issue capture while coding |
| `/new-project` | Setup guide and templates for new projects |
| `/learning-opportunity` | Pause for teaching mode |

---

## PRD Review Workflow

For major features or significant changes, use `/review-prd` before sprint work:

```
1. User uploads PRD
    ↓
2. Claude reviews from 3 perspectives:
   ├── Technical (scope, architecture, edge cases)
   ├── Design (UX, states, accessibility)
   └── Legal (privacy, data, compliance)
    ↓
3. Q&A dialogue until gaps are resolved
    ↓
4. Claude extracts stories (tmp-1, tmp-2, etc.)
    ↓
5. User approves (all or some)
    ↓
6. Claude creates Linear issues + updates roadmap.md
```

**Key principles:**
- PRD is a point-in-time artifact (never modified after review)
- Stories use temporary IDs (`tmp-1`) until Linear creation
- Linear issue prefix comes from project's CLAUDE.md
- Issues go to Backlog; normal sprint workflow takes over

**Review guides:**
- `~/.claude/guides/design.md` — UX, accessibility, state design
- `~/.claude/guides/legal.md` — Privacy, consumer protection, compliance

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
| Team ID | `uuid-here` |
| Technical Specs | `docs/technical-specs/XXX-##.md` |

### Status UUIDs (for mcp_linear_update_issue)

| Status | UUID |
|--------|------|
| Backlog | `uuid` |
| Todo | `uuid` |
| In Progress | `uuid` |
| In Review | `uuid` |
| Done | `uuid` |
| Canceled | `uuid` |
```

**Getting Status UUIDs:** Query Linear GraphQL API:
```bash
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: YOUR_API_KEY" \
  -d '{"query": "{ team(id: \"TEAM_ID\") { states { nodes { id name } } } }"}'
```

### What Agents Do in Linear

- **EM**: Creates issues (with labels), updates priority, updates roadmap.md
- **Explorer**: Posts exploration summary as comment
- **Plan-Writer**: Posts implementation plan summary as comment
- **Developer**: Updates status, posts progress comments
- **Reviewer**: Posts approval/changes requested

### Labels

| Label | When Applied | Purpose |
|-------|--------------|---------|
| **agent** | ALL issues created by Claude | Distinguishes AI-created from human-created issues |
| **technical** | Backend/infra/tech-debt issues | Issues Claude inferred or initiated (not explicit user requests) |

### Linear Status Transitions

```
Backlog → Todo → In Progress → In Review → Done
                 (agent working) (user reviewing) (DEPLOYED to production)
```

| Status | Who Sets It | Source of Truth | Notes |
|--------|-------------|-----------------|-------|
| Backlog | EM or User | Linear (User can change) | Issue created, not prioritized |
| Todo | EM or User | Linear (User can change) | Issue prioritized for sprint |
| In Progress | Developer | roadmap.md | Agent working on implementation |
| In Review | Developer | roadmap.md | Deployed to staging, awaiting User review |
| Done | EM | roadmap.md | **Must be deployed to production** |

**Important:** Done = Deployed. Never mark Done until code is live on main branch. At sprint start, any "Done" issues in Linear that aren't actually deployed will be flagged.

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

**Best practice:** All projects should use this branching structure with Vercel (or similar) auto-deploying each branch to its environment.

### CI/CD (Recommended for Production Apps)

For production apps, add GitHub Actions to gate merges on passing tests:

| Trigger | What Runs |
|---------|-----------|
| PR to `develop` | Build, lint, e2e tests against preview |
| Push to `develop` | E2e tests against staging |
| PR to `main` | E2e tests against staging (gate for prod) |
| Push to `main` | E2e tests against production |

**Skip CI for:** Prototypes, experiments, early-stage projects where speed matters more than safety.

**Reference:** See `quo` project (`.github/workflows/ci.yml`) for a complete implementation.

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

## Update Standards (Global)

### Required in Every Update
Include a **Next Steps** section with owner:
```
### Next Steps
- [Action] — Owner: Roy/Claude
```

### PROJECT_STATE.md Requirement
At sprint end, `docs/PROJECT_STATE.md` must be updated.
If no deployment occurred, explicitly note:
```
PROJECT_STATE.md: NOT UPDATED — [reason]
```

### End-of-Sprint Wrap-Up (Strict)
Use this exact format at sprint end:
```
## Sprint Wrap-Up — [date]

### Deployments
- Staging: [label](URL) — [what's live]
- Production: [label](URL) — [what's live / not deployed]

### Project State
- PROJECT_STATE.md: [updated YYYY-MM-DD / NOT UPDATED — reason]

### Completed This Sprint
- [Issue]: [one-line outcome]

### Acceptance Criteria Met
- [Issue]: [AC1; AC2; AC3]

### What's Next
- [Next sprint focus / priority]

### What You Should Do Next
- [Action] — Owner: Roy

### Next Issues In Line
- [Issue IDs / titles]

### Next Steps
- [Action] — Owner: Roy/Claude
```

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

## Deployment

| Environment | Branch | URL |
|-------------|--------|-----|
| Staging | `develop` | [staging-url] |
| Production | `main` | [prod-url] |

### Deployment Check Commands (optional)
\`\`\`bash
# Check deployment status (poll until complete)
# Example for Vercel: vercel list --scope=your-scope | head -5
# Example for Railway: railway status

# Fetch deployment logs on failure
# Example for Vercel: vercel logs <deployment-id>
# Example for Railway: railway logs
\`\`\`

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
