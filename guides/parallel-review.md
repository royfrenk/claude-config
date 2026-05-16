# Parallel Review Guide

> **Scope:** This guide covers reviewing **multiple Developer submissions** simultaneously (parallel waves of work). For multi-angle review of a **single submission** by parallel narrow-focused agents (Rule Compliance, Wiring & Dead Code, Regressions, A11y & UI Behavior), see the Review Orchestration § of `~/.claude/agents/em.md`.
>
> **Known limitation:** This guide instructs Reviewer to "use the Task tool" but Reviewer's frontmatter (`tools: Read, Grep, Glob, Bash`) does not include Task. Multi-developer parallel review via sub-Reviewers spawned from within Reviewer is not currently functional. Tracked separately from the multi-angle change.

Protocol for reviewing multiple Developer submissions simultaneously during parallel execution waves.

---

## When This Applies

When multiple Developers submit work simultaneously (parallel wave), you may need to review multiple submissions.

---

## Strategy: Spawn Sub-Reviewers

Use the Task tool to spawn parallel Reviewer agents:

```markdown
# Review Wave 1 - 2 submissions

Spawning 2 Reviewer sub-agents in parallel:

Reviewer A:
  Review: Dev A's submission (Task 1 - Schema migration)
  Issue: {PREFIX}-##
  Developer: Dev A
  Files: src/db/*

Reviewer B:
  Review: Dev B's submission (Task 4 - Logging utility)
  Issue: {PREFIX}-##
  Developer: Dev B
  Files: src/utils/logger.ts
```

---

## Consolidation

After sub-Reviewers complete:

1. **Read all review outcomes:**
   - Reviewer A: APPROVED / CHANGES REQUESTED / BLOCKED
   - Reviewer B: APPROVED / CHANGES REQUESTED / BLOCKED

2. **Consolidate to Linear:**

**All Approved:**
```markdown
mcp__linear__create_comment(issueId, "## Wave 1 Review: All Approved\n\n**Dev A (Task 1):** Approved\n**Dev B (Task 4):** Approved\n\nReady for staging deployment.")
```

**Mixed Results:**
```markdown
mcp__linear__create_comment(issueId, "## Wave 1 Review: Partial Approval\n\n**Dev A (Task 1):** Approved - ready to deploy\n**Dev B (Task 4):** Changes requested (see sub-thread)\n\nDev A may proceed. Dev B: address feedback and resubmit.")
```

**All Blocked:**
```markdown
mcp__linear__create_comment(issueId, "## Wave 1 Review: Changes Needed\n\n**Dev A (Task 1):** Changes requested\n**Dev B (Task 4):** Changes requested\n\nSee individual review threads. Resubmit after fixes.")
```

3. **Report to Eng Manager:**

```markdown
## Wave 1 Review Complete

**Submissions:** 2
**Approved:** 1 (Dev A)
**Changes Requested:** 1 (Dev B)
**Blocked:** 0

**Next steps:**
- Dev A: Ready to deploy
- Dev B: Address feedback, resubmit for Round 2
```

---

## Independent Reviews

Each sub-Reviewer operates independently:
- Reviews their assigned Developer's work
- Posts feedback to Linear (separate comment threads if needed)
- Maintains their own round counter
- Applies standard review criteria

You (parent Reviewer) only consolidate and report to Eng Manager.

---

## Sequencing Considerations

If Developers are sequenced (Dev B after Dev A):
- Review Dev A first
- Only spawn Reviewer for Dev B after Dev A is approved and deployed
- This ensures Dev B is reviewing code that's based on Dev A's changes

Eng Manager will tell you if sequencing applies.
