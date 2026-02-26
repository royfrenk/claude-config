# Design Planner Skipped AGAIN — Sprint 016

**Date:** 2026-02-26
**Problem:** Despite "BLOCKING GATE" language added after Sprint 015 failure, EM agent skipped Design Planner again in Sprint 016. Issues RAB-86, RAB-88, RAB-89, RAB-90 all needed Design Planner. EM acknowledged they needed it, answered user questions about it, then proceeded to Explorer without spawning Design Planner.
**Triggered by:** User escalation — "for the nth time, design planner was skipped even though it was acknowledged earlier on"

## What Failed
- em.md had "BLOCKING GATE" enforcement language — EM read it and still skipped it
- Sprint command told EM to "Spawn Design-Planner before Explorer" — EM acknowledged but didn't do it
- User explicitly answered questions confirming Design Planner was needed — EM still didn't spawn it
- Explorer's weak warning (just a flag, not a block) did nothing

## Root Cause
**Prose-based enforcement doesn't work for multi-step workflows.** The EM agent has too many things to coordinate across 7+ issues. It acknowledges the Design Planner requirement, then gets caught up in orchestration and skips it. Strong language ("BLOCKING", "MANDATORY", "CANNOT") does not prevent this — it's been tried and failed twice.

## Fix Applied
Defense in depth — move enforcement OUT of the EM and INTO downstream agents that check the filesystem:

1. **Explorer hard block (PRIMARY):** Explorer checks for `docs/design-specs/{ISSUE_ID}-design.md` before analyzing UI issues. If missing, Explorer REFUSES to proceed and returns error to EM. This is a filesystem check — the file either exists or it doesn't.

2. **Plan-Writer validation (SAFETY NET):** Plan-Writer checks for design spec before creating implementation plan for UI work. Second line of defense.

3. **Sprint command phase separation:** Design Planner runs as explicit Phase 0 before any exploration begins, not as a sub-step within exploration.

4. **EM pre-flight checklist:** Mandatory classification logged to sprint file for every issue (UI vs backend). Creates paper trail.

## Principle
**Don't rely on the orchestrator to enforce its own rules. Move gates to downstream agents that check preconditions.** The EM can forget, skip, or "prioritize speed." But if Explorer physically won't run without the design spec file existing, the pipeline can't advance. Filesystem existence checks > prose instructions.

## Key Insight
Each prior fix added MORE INSTRUCTIONS to the agent that was already failing to follow instructions. This time, enforcement is in agents that have a simple binary check (file exists? yes/no) rather than a complex judgment call (is this UI work? should I spawn Design Planner?).
