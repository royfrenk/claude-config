# Autonomous Sprint Execution Guide

How EM runs autonomous sprint execution without stopping between phases.

---

## Flow Per Issue

Select issue -> Check UX -> Design-planner (if UX, STOP for approval) -> Explorer -> Plan-Writer -> STOP for plan approval -> Developer -> Reviewer -> Deploy staging -> Update roadmap.md -> **Continue to next issue**

## Multi-Issue Flow

Once User approves plans (e.g., "Option A: Approve all plans and proceed in sequence"), execute ALL issues continuously:
- Issue 1: Implement -> Review -> Deploy staging
- Issue 2: Implement -> Review -> Deploy staging
- Issue 3: Implement -> Review -> Deploy staging
- **Then STOP:** Present sprint wrap-up, ask User to test on staging

## When to Pause

**ONLY pause for:**
1. **Design approval** (if UI/UX work detected)
2. **Plan approval** (always required before implementation)
3. **Review failures** (changes requested -> wait for fixes -> retry)
4. **Blocking errors** (deployment failures, missing config, etc.)
5. **Sprint completion** (all issues deployed to staging -> await User testing)

**DO NOT pause for:**
- Starting implementation (just do it)
- Completing implementation (proceed to review)
- Passing review (deploy to staging immediately)
- Between issues in same sprint (continue to next issue)

## Reporting During Execution

- Post checkpoints to sprint file (not to User)
- Post status updates to Linear comments (not to User)
- Only message User when:
  - Awaiting design approval
  - Awaiting plan approval
  - Review failed (after 3 rounds)
  - All issues complete and on staging
  - Blocking error occurred

---

## Sprint Closure & Production Deployment

**"Close the sprint" = deploy to production approval.**

**Pre-deploy checks (MANDATORY):**
1. Acceptance criteria all passed (else ask User)
2. Staging checks passed (else BLOCK)
3. **Reviewer approval** (BLOCKING): Query Linear comments for "Review: Approved" per issue. If missing/stale -> STOP, invoke Reviewer retroactively, post to Linear. This should be redundant if staging gate worked.
4. Infrastructure changes (email/DB/auth/payment): Require BOTH Reviewer + User approval (else STOP, request User approval).
5. Codex peer review: Request, implement if Reviewer accepts, else proceed (don't block on tooling failures).
6. Multi-issue sprints: Check all complete (else ask User).

**If passed:** Developer deploys -> rename sprint `.done.md` -> update roadmap.md (Recently Completed) -> update Linear (Done).

## Sprint Completion Flow

Rename `.active.md` -> `.done.md` -> Move issues to "Recently Completed" (top of table, action-oriented Outcome) -> Remove from P0/P1/P2 -> Sort backlog by priority.

## Review Summary (Before Sprint Wrap-Up)

Read sprint file -> extract issue IDs -> read each spec's "Review Tracking" -> categorize (Approved/Pending/Not Reviewed) -> output table + summary.

**If NOT reviewed:** BLOCK closure, post to Linear, invoke Reviewer retroactively.

## Communication Formats

**Daily Update:** Completed / In Progress / Blocked / Decisions / Suggested / Next Steps (owner)

**Sprint Wrap-Up:** Deployments / Project State / Completed / Acceptance Criteria / What's Next / Next Steps
