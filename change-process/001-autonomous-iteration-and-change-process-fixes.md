---
title: Autonomous Iteration + Change-Process Self-Fix
started: 2026-04-11
status: Sprint A DONE (2026-04-11), Sprint B DONE (2026-04-11)
triggered_by: Sprint 032 Batch 9 — visual verification found 2 PDF regressions, assistant asked "Want me to proceed?" instead of auto-submitting to EM
---

# Change Process 001: Autonomous Iteration + Change-Process Self-Fix

## Original User Request (3 changes)

1. **EM Autonomy:** "next time just submit to EM to process. No need for human in the loop." Automated-check failures during iteration should auto-continue without human approval (subject to severity thresholds).

2. **Iterate Visual Verification Gap:** "/iterate should do visual verification for what the topics I asked. Maybe call plan-writer or someone else to write what to check for the iteration."

3. **Change-Process Self-Fix:** The `/change-process` command forced subagent isolation, causing a 5-turn relay-loop failure. Fix: run inline, not as subagent. Also: add a mandatory independent reviewer (Phase 5.5) before execution.

## User's Explicit Decisions

- Scope: ANY automated-check failure, not just visual verification
- Severity threshold escalation for: architectural/design changes, production data/migrations, cost-sensitive actions (paid APIs), security findings
- 5 consecutive failed batches on same issue → escalate
- Iteration loop only (keep sprint-end handoff manual)
- Update managed-agents-decision-rule.md to permit auto-execution on staging/dev
- Canonical source: create `~/.claude/guides/autonomous-iteration.md` as new canonical home; retire orphaned rule file to a stub (user chose "Option A")
- Every `/change-process` run must include an independent reviewer audit (Phase 5.5) — same prompt template used in this session

## Decision: Split into Sprint A + Sprint B

After 2 audit rounds, the reviewer issued REDESIGN REQUIRED. 5 blockers found — the core issue is that the autonomous iteration plan depends on an unresolved design question (how /iterate interacts with EM protocol). The change-process fixes are self-contained and ready.

**Sprint A (safe, small, execute now):** Just the `change-process.md` fixes:
- Fix the relay-loop bug (remove subagent directive, run inline)
- Strengthen stop rules at ALL question phases (Phase 1, Phase 4, Rules section)
- Add Explore escape hatch constraint (one level deep, Read/Grep/Glob only)
- Add Phase 5.5: Independent Plan Audit with embedded reviewer prompt template
- Phase numbering: Phase 5 → Phase 5.5 (audit) → Phase 6 (execute)

**Sprint B (deferred, needs design work):** Autonomous iteration:
- Resolve: does /iterate enter "EM mode" or own policy directly?
- Resolve: current sprint-034 file has no autonomy flag — what's the migration path?
- Resolve: plan-writer has no "mode" dispatch concept — how to add iteration-verification mode?
- Create `~/.claude/guides/autonomous-iteration.md` (canonical source)
- Update all 10+ files (em.md, iterate.md, sre.md, agent-config.yaml, deployment-protocol.md, sprint.md, visual-verifier.md, plan-writer.md, managed-agents-decision-rule.md, developer.md)

## Audit History

### Round 1 (v1 → v2)
- Auditor found 8 gaps. Key issues:
  1. em.md inline copy too narrow (only checklist, missing batch limit/circuit breakers/flag/audit format)
  2. Sprint file template gap (no autonomy flag in new sprints)
  3. Loop ownership ambiguous (who owns cross-batch iteration?)
  4. Section header string drift risk (em-dash vs en-dash)
  5. Mode 5 missing-section silent pass
  6. SRE yaml would accidentally strip `suggest_iterate` signal
  7. deployment-protocol.md contradicts new policy (stale line ~415)
  8. change-process stop rule only at Phase 1, not Phase 4 or Rules section

### Round 2 (v2+addendum re-audit)
- 5 BLOCKERS found. Verdict: REDESIGN REQUIRED
  1. **Loop ownership incoherent:** iterate.md has zero EM references. Plan says "EM invoked inline" but no mechanism exists. em.md inline block comment claims "EM runs as Task-tool subagent" which contradicts em.md frontmatter (`execution: inline, tools: none`).
  2. **Current sprint file has no flag:** sprint-034 would silently default to autonomous mode.
  3. **plan-writer has no mode dispatch:** single linear workflow, no concept of modes.
  4. **Phase 5.5 subagent has no failure handling:** no timeout, no retry, no fallback — same death mode as the relay-loop bug.
  5. **CHANGE_TYPE markers unspecified:** configurable audit classes have no dispatch mechanism.

### Non-blocker issues also found
- em.md inline block uses placeholders instead of verbatim content
- developer.md:294 has stale "EM will handle auto-iterate" language
- No drift-detection markers between em.md inline and guide
- autonomous-iteration.md doesn't list expected readers
- iterate.md step 0 needs explicit Read directive for the guide

## Proposed v2 Content (preserved for Sprint B)

### Severity Escalation Checklist (5 questions — canonical)
1. Migration check: Does this fix touch a database migration file?
2. Auth/payments/session check: Does this fix touch auth, payments, or session management?
3. Paid API re-run check: Does this fix trigger a re-transcription, re-summarization, or other paid API re-run?
4. Architecture check: Does this fix change an architectural boundary (new service, new data model, new API contract)?
5. Security check: Is this fix in response to a security-flagged finding?

Decision rule: ANY yes → ESCALATE. ALL no → AUTO-CONTINUE.

### Circuit Breakers (4 counters — canonical)
| Counter | Scope | Limit | On exceed |
|---------|-------|-------|-----------|
| Per-bug attempts | Same bug, same batch | 3 | Developer invokes Reviewer before 4th attempt |
| Reviewer rounds | Same fix, review cycle | 3 | EM escalates to user |
| SRE auto-iterate cycles | Same deploy, SRE checks | 3 | EM escalates to user |
| Per-issue batches | Same Linear issue, across batches | 5 | EM escalates with full attempt summary |

Reviewer rounds are NOT counted as per-issue batches.

### agent-config.yaml proposed new lines 110-113
```yaml
  ## Auto-Iterate Policy

  You are the managed SRE agent. You REPORT; you do NOT decide whether
  to auto-continue iteration. EM owns that decision on staging/dev;
  the user owns it on production.

  - staging/dev: On deployment verification failure, call `suggest_iterate`
    with the full failure context. EM consumes this signal, runs the
    Severity Escalation Checklist, checks the per-issue batch counter
    (max 5), and decides AUTO-CONTINUE or ESCALATE.
  - production: NEVER call `suggest_iterate`. Report and STOP.
```

### Canonical section header string
```
#### Batch [N] — Verification Plan
```
Em-dash U+2014, not en-dash or hyphen.

## Sprint A: Exact Edits for change-process.md

### Edit 1: Remove subagent spawn directive (lines 7-18)
Delete the "Note: This command always runs as a subagent" section and the "## Invocation" block that says to spawn a subagent. This runs inline now.

### Edit 2: Rename heading (line 22)
"## Instructions for Subagent" → "## Instructions"

### Edit 3: Strengthen stop rule at Phase 1 (already exists at line 90)
Add after the existing "STOP AND ASK QUESTIONS" directive:
"DO NOT spawn any subagents, relay agents, or messenger agents. DO NOT call any tools (no SendMessage, no Task, no file operations). End your turn."

### Edit 4: Add same stop rule at Phase 4 (after line 229)
Same text as Edit 3, placed after Phase 4's challenge questions.

### Edit 5: Add to Rules section (after line 336)
New bullet: "**Inline execution:** Never spawn relay/messenger subagents after asking questions. End your turn and wait for the user's next message."
New bullet: "**Audit before execute:** Every /change-process run MUST complete Phase 5.5 (Independent Plan Audit) before Phase 6. No exceptions."
New bullet: "**Audit loop cap:** Maximum 3 audit rounds per invocation. Round 3 FIX BEFORE EXECUTE → auto-promote to REDESIGN REQUIRED."

### Edit 6: Add to Anti-patterns section (after line 345)
New bullet: "Skipping Phase 5.5 because the change is small — trivial changes are where orphaning and silent-default bugs hide."
New bullet: "Spawning relay/messenger subagents to pass user answers — causes the exact death-loop from Sprint 032."

### Edit 7: Add Explore escape hatch constraint
In Phase 2 (Review All Files), add: "Phase 2 file reads MAY be delegated to an Explore subagent if the file list exceeds 20 files. Constraints: Explore subagent ONLY, one level deep, returns summary text only, no further delegation, Read/Grep/Glob only (no Edit/Write)."

### Edit 8: Insert Phase 5.5 between Phase 5 (line 260) and Phase 6 (line 262)
New section: "## Phase 5.5: Independent Plan Audit"
- Spawns general-purpose subagent with embedded reviewer prompt
- 10 audit classes (5 mandatory, 5 configurable)
- Verdict routing: SAFE → Phase 6, FIX → revise+re-audit (max 3 rounds), REDESIGN → escalate
- Audit log: `/tmp/change-process-audit-{timestamp}.md`
- Subagent failure handling: 5-min timeout, retry once on death, fallback to "manual review by user" if retry fails
- CHANGE_TYPE: set automatically in Phase 5 transition based on which file categories are touched (agents/ = subagent, managed-agents/ = managed-runtime, commands/ = workflow)

### Edit 9: Modify Phase 5 ending (line 260)
Replace "Ask: Does this look right?" with auto-transition to Phase 5.5. User approval moves to end of Phase 5.5 after audit passes.

### Edit 10: Modify Phase 6 opening (line 263)
"Only after Phase 5.5 returns SAFE TO EXECUTE and the User confirms the audited plan:"

## Reviewer Prompt Template (10 audit classes)

### Mandatory (always run):
1. **Orphaning and dead references** — new canonical sources with zero readers
2. **Cross-file consistency of literal values** — limits, flag names, headers, tokens match character-for-character
3. **Silent defaults and missing-field behavior** — new flags on existing files
4. **Loop ownership and control flow** — who owns loop state, can they persist?
5. **Tool availability vs spec requirements** — Edit/Write/Read access matches spec

### Configurable (based on CHANGE_TYPE):
6. **Inline duplication drift risk** — marked duplicates with canonical-source pointers (when touching agents/ or managed-agents/)
7. **Subagent context assumptions** — assumes subagent can read unloaded files (when touching agents/)
8. **Managed-runtime filesystem assumptions** — assumes managed agent reads local files (when touching managed-agents/)
9. **Template propagation** — new fields need template updates + legacy fallback (when change is template-affecting)
10. **Stop-rule placement at all question points** — strengthened rules at every question phase (when touching commands/)

## Next Steps

1. Execute Sprint A edits to change-process.md (this session)
2. Sync to claude-config repo + push
3. Run cross-tool sync (Gemini/Codex)
4. Open Sprint B as a separate /change-process invocation with this file as input context
