# Agent Teams Guide

How to use Agent Teams effectively in this project.

## What Are Agent Teams?

Agent Teams is an experimental feature (requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) that enables multiple agents to work in parallel with:
- **Independent contexts:** Each teammate has own context window
- **Inter-agent messaging:** Teammates communicate directly
- **Shared task list:** Coordinated via TodoWrite
- **Parallel execution:** Work happens simultaneously

## When to Use Agent Teams

### ✅ Good Use Cases

| Scenario | Why Agent Teams | Alternative |
|----------|-----------------|-------------|
| Complex exploration (3+ areas) | 80% context savings | Task tool (bloats context) |
| Research with multiple perspectives | Adversarial analysis | Single agent (biased) |
| Parallel component work | True parallelism | Sequential waves (slower) |

### ❌ Poor Use Cases

| Scenario | Why NOT Agent Teams | Better Alternative |
|----------|---------------------|-------------------|
| Single file changes | Coordination overhead | Single Developer |
| Sequential dependencies | Coordination cost > benefit | Wave-based (current) |
| Simple tasks | Overkill | Task tool |

## How EM Uses Agent Teams

### Exploration Phase (Most Common)

**Scenario:** Task spans frontend + backend + database

**Without Agent Teams (old way):**
```
EM spawns Explorer A, B, C via Task tool
  ↓
Each explores and returns 5K tokens of findings
  ↓
EM's context: +15K tokens
  ↓
Context bloat for rest of sprint
```

**With Agent Teams (new way):**
```
EM creates exploration team (Lead + Teammates A, B, C)
  ↓
Each explores in own context
  ↓
They write directly to spec file
  ↓
EM's context: +2K tokens (status only)
```

**Result:** 80% context reduction, same quality output

### Research Phase (New Capability)

**Scenario:** "Evaluate authentication approach: OAuth vs JWT"

**With Agent Teams:**
```
Lead spawns:
- Researcher A: Investigate OAuth (reads docs, examples)
- Researcher B: Investigate JWT (reads docs, examples)
- Devil's Advocate: Challenge both approaches

They debate via team messages:
- Researcher A: "OAuth is more secure for third-party"
- Devil's Advocate: "But adds complexity for simple use case"
- Researcher B: "JWT simpler but requires careful key management"

Output: Comparison doc with recommendation
```

**Benefit:** Multiple perspectives, no context bloat

## Team Structure

### Lead (EM)

**Responsibilities:**
- Analyze task and identify areas
- Spawn teammates with clear areas of focus
- Monitor shared task list
- Consolidate final output (if needed)

**Does NOT:**
- Receive full teammate outputs (context efficiency)
- Micromanage teammate work
- Do exploration itself (delegates to team)

### Teammates (Explorers, Developers)

**Responsibilities:**
- Explore assigned area thoroughly
- Write findings directly to spec file
- Communicate with other teammates via messages
- Update shared task list

**Does NOT:**
- Report back to Lead with full details
- Wait for Lead approval on every step
- Work outside assigned area (stay in lane)

## Best Practices

### 1. Clear Area Assignment

**Good:**
```
- Explorer A: Frontend (src/components/, src/pages/)
- Explorer B: Backend (src/api/, src/services/)
- Explorer C: Database (src/db/, migrations/)
```

**Bad:**
```
- Explorer A: Look at everything related to auth
- Explorer B: Help Explorer A
- Explorer C: General exploration
```

### 2. Direct Spec Writing

**Good:**
```
Teammates write directly to spec file:
- Explorer A writes "## Frontend Architecture" section
- Explorer B writes "## Backend Architecture" section
- No consolidation needed
```

**Bad:**
```
Teammates report findings back to Lead
Lead consolidates into spec
(Bloats Lead's context - defeats purpose)
```

### 3. Use for Large Tasks Only

**Good:**
- Task spans 3+ areas
- Will explore 50+ files
- Context efficiency matters

**Bad:**
- Task is single component
- Quick exploration (10 files)
- Context not a concern

## Troubleshooting

### "Team took longer than Task tool would have"

**Cause:** Coordination overhead for small task
**Solution:** Reserve Agent Teams for complex tasks (3+ areas)

### "Team output was inconsistent"

**Cause:** Unclear area assignment or spec structure
**Solution:** Give each teammate specific sections to write

### "My context still bloated"

**Cause:** Teammates returning results to Lead instead of writing to spec
**Solution:** Explicit instruction: "Write directly to spec, do NOT report back to me"

## Experimental Status

Agent Teams is experimental. Report issues and learnings:
- What worked well
- What didn't work
- Context savings achieved
- Time cost vs benefit

This helps refine when to use Agent Teams vs Task tool.
