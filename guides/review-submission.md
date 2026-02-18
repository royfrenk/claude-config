# Review Submission Guide

Shared protocol for Developer (submitting) and Reviewer (receiving). Contains exact formats, re-review process, and circuit breaker rules.

---

## Initial Submission Format

```
Issue: {PREFIX}-##
Task: [title]
Changes:
- [file]: [what changed]

Why: [brief rationale]

Verification:
- Build: PASS
- Types: PASS
- Lint: PASS ([X] warnings)
- Tests: PASS ([X]/[Y])
- Security: PASS
- Console: PASS

Tests added: [list]

Ready for staging: yes
```

## Linear Comment on Submission

```
mcp__linear__create_comment(issueId, "**Submitted for Review**\n\n**Changes:**\n- [file]: [change]\n\n**Verification:** All checks passed\n**Tests:** [count] passing\n\nAwaiting [Design/Code] Reviewer approval.")
```

## Spec File Review Tracking

Update the spec file with review round:

```markdown
## Review Tracking

**Total Review Rounds:** [increment by 1]

| Round | Date | Status | Commits Reviewed | Reviewer Comment |
|-------|------|--------|------------------|------------------|
| [N] | [YYYY-MM-DD] | Pending | [commit hash] | Awaiting reviewer feedback |
```

---

## Re-Review Submission (Changes Addressed)

When Reviewer requests changes, fix all issues then resubmit:

### Format

```
Issue: {PREFIX}-##
Status: CHANGES ADDRESSED (Round [X])

Previous round issues:
1. [Issue 1 from Reviewer] --> Fixed: [what you did]
2. [Issue 2 from Reviewer] --> Fixed: [what you did]

New commits: [hash]

Verification:
- Build: PASS
- Types: PASS
- Lint: PASS
- Tests: PASS ([X]/[Y])
- Security: PASS

Ready for re-review: yes
```

### Linear Comment

```
mcp__linear__create_comment(issueId, "**Resubmitted for Review (Round [X])**\n\n**Fixed:**\n1. [Issue]: [summary]\n2. [Issue]: [summary]\n\n**Commits:** [hash]\n**Verification:** All checks passed\n\n@reviewer Please re-review.")
```

### Commit Message

```
fix({ISSUE_ID}): Address review round {X}
```

---

## Circuit Breaker

**Max 3 review rounds.** After 3 rounds without approval:

1. Stop fixing
2. Escalate to Eng Manager
3. Post to Linear: "3 review rounds without resolution - escalating"

Options for Eng Manager:
- Reassign task
- Redefine scope
- Pair developer with human

---

## UI/UX Work: Design-Reviewer First

If task involves UI/UX:

1. **Report completion to EM** (not Design-Reviewer directly):
   ```
   EM, implementation complete and ready for design review.

   Issue: {PREFIX}-##
   Component: [component/page name]
   URL: [full URL including route]
   Files: [list of modified files]
   Verification: [build/lint/tests all PASS]

   Dev Server: Running at [URL]

   Please orchestrate screenshot capture and Design-Reviewer.
   ```

2. EM handles screenshot capture and Design-Reviewer invocation
3. Wait for Design-Reviewer approval via EM
4. Then proceed to Code Review

---

## Blocking State Rules

While waiting for reviewer approval:
- Do NOT push to develop
- Do NOT skip even if "urgent"
- If user asks status: "Waiting for Reviewer approval"
- You can work on other tasks while waiting
- If no response after 10 minutes: Notify Eng Manager

## Approval Self-Check

Before proceeding to deployment:

```
APPROVAL_CHECKLIST:
- Did I invoke Design-Reviewer? (if UI work)
- Did Design-Reviewer approve? (if UI work)
- Did I invoke Code Reviewer?
- Did Code Reviewer approve?
- Are approvals in Linear with "Review: Approved"?
- Do approvals match my current commit?

If ANY item unchecked --> STOP. Cannot deploy.
```

## Fast-Track Review (Critical Issues)

When Linear issue has label "CRITICAL - Production Incident":
- Reviewer response target: 15 minutes (vs 30 normal)
- Focus: security, data integrity, breaking changes
- May defer: style nitpicks, minor optimizations
- You still MUST wait for approval -- fast-track is not skip-review

## Codex Recommendations (Sprint End)

At sprint end, Reviewer may pass OpenAI Codex recommendations:

```
Status: CODEX RECOMMENDATIONS (Final polish before production)
```

Treat like a standard review round:
1. Implement accepted recommendations
2. Run verification
3. Commit: `polish({ISSUE_ID}): Address Codex peer review`
4. Resubmit to Reviewer
