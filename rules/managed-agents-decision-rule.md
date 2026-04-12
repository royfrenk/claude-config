# Managed Agents vs Task-Tool Subagents

Decision rule for when to use Anthropic Managed Agents vs Claude Code Task-tool subagents.

## When to Use Task-Tool Subagents (Default)

Use Claude Code's built-in Agent tool for:
- **Sprint workflow agents:** Explorer, Plan-Writer, Developer, Reviewer, Design-Planner, Security-Reviewer
- **One-shot tasks:** Code search, file analysis, research questions
- **Anything that needs host filesystem access** (read/write project files, run tests, git operations)
- **Anything that needs conversation context** (follow-up questions, iterative refinement)

These agents share the host environment, die on return, and cost nothing beyond normal API usage.

## When to Use Managed Agents

Use Anthropic Managed Agents only for:
- **SRE monitoring** — deployment health checks that run independently of the conversation
- **Long-running autonomous tasks** that should survive context compaction
- **Tasks that need their own sandbox** (isolated environment, separate from host)

Currently sanctioned Managed Agent: **SRE** (site reliability engineer for deployment monitoring).

## Auto-Iterate Policy

<!-- canonical: autonomous-iteration.md -->

| Environment | On Failure |
|-------------|------------|
| staging/dev | EM runs severity checklist → AUTO-CONTINUE if all 5 checks pass, ESCALATE if any fail |
| production  | ESCALATE to User IMMEDIATELY — NEVER auto-continue |

See `~/.claude/guides/autonomous-iteration.md` for the severity escalation checklist (5 questions) and circuit breaker definitions (4 counters).

## Cost Awareness

Managed Agents incur per-session costs (Anthropic bills for compute + tokens). Every session MUST report its cost. Sprint wrap-up aggregates costs.

## EM Stays Inline

The EM protocol runs inline in the main conversation (not as a subagent, not as a Managed Agent). This is an architectural decision from Sprint 014 — EM needs full conversation visibility and user interaction. The `agents/em.md` file location is organizational, not behavioral.
