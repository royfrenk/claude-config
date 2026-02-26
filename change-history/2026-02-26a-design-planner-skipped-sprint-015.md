# Design Planner Skipped — Sprint 015

**Date:** 2026-02-26 (documenting Sprint 015 failure)
**Problem:** EM agent skipped Design Planner for UI issues RAB-80 and RAB-81. User had to explicitly call it out: "you didn't create design specs." Design specs were written retroactively after implementation was already deployed.
**Triggered by:** Post-mortem for Sprint 015 (docs/post-mortem/2026-02-26-sprint-015-iteration-churn.md)

## What Failed
- EM agent had instructions to invoke Design Planner for UI work
- EM "prioritized speed over protocol"
- Explorer had no enforcement — just proceeded without design spec
- Result: 16 iteration batches, massive waste

## Fix Applied
- Added "Design-Planner Gate Enforcement (MANDATORY)" section to em.md (lines 71-83)
- Used strong language: "BLOCKING GATE", "CANNOT", "MANDATORY"
- Added weak warning to explorer.md to flag missing design specs
- Added post-mortem reference to em.md

## Principle
**Prose instructions are not enforcement.** Telling an agent "you MUST do X" doesn't prevent it from skipping X. The fix added more words but no structural barrier.

## Outcome
**FAILED.** EM skipped Design Planner again in Sprint 016 (see 2026-02-26b). The "BLOCKING GATE" language was ignored just like the original instructions were.

## Lesson
Adding emphatic language (CAPS, BOLD, MANDATORY, BLOCKING) to agent instructions does NOT reliably change agent behavior. Agents can read and acknowledge rules but still skip them when "prioritizing" other concerns. Need structural/filesystem enforcement.
