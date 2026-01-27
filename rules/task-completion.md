# Task Completion Output

Standard output formats for commits and task completion. Follow these formats in all contexts (sprint, ad-hoc work, iterations).

## After Every Commit

When pushing to `develop`, always output:

```
✓ Commit: [short-hash] → develop
  Staging: [URL from project's CLAUDE.md Deployment section]
  Changes: [1-line summary of what changed]
```

Example:
```
✓ Commit: 363f31d → develop
  Staging: https://quo-2-git-develop-roy-frenkiels-projects.vercel.app
  Changes: Added Favorites and Searches links to header nav
```

## After Completing a Full Issue/Task

**Before outputting this format, verify ALL acceptance criteria from the Linear issue are met.** If any criterion is not met, flag it and get User approval before marking the issue complete.

### Verification Standards

| Criterion Type | Required Verification | Status if Code-Only |
|----------------|----------------------|---------------------|
| Code exists (file created, function added) | Code review | ✅ |
| Logic works (retry happens, fallback triggers) | Unit test | ✅ with test, ⚠️ without |
| User sees X (message, button, UI change) | Manual verification | ✅ (E2E optional) |
| Critical user flow (auth, payment, core journey) | E2E test | ⚠️ if no E2E |
| Previously broken in production | E2E test (regression) | ⚠️ if no E2E |

**Rule:** E2E tests are for critical paths only. For non-critical UI changes, manual verification is sufficient — mark ✅ with "Manual verification" in the column.

### When E2E Tests Are Required

E2E tests are expensive (slow, flaky, high maintenance). Use the **launch vs iteration** model:

**Launch (new feature)** — Write E2E tests:
- New feature shipping for the first time
- New critical flow (auth, payments, core journeys)
- Regression test (something broke in production)

**Iteration (existing feature)** — Existing E2E covers regression:
- UI tweaks → Manual verification ✅
- Error messages → Unit test logic + manual verify display ✅
- New buttons/actions → Unit test handler + manual verify UI ✅
- Bug fixes → Unit test the fix ✅ (E2E only if it broke in prod)

**Key distinction:** "Is this a new flow, or a change to an existing flow?" New flows get E2E at launch. Changes to existing flows rely on existing E2E for regression coverage.

**Launch-only E2E tests:** For non-critical features, write E2E with `{ tag: '@launch' }`. Run once to verify, then it's excluded from CI. Critical paths (auth, payments) stay in CI without the tag.

When all subtasks are done and pushed to staging, output the full format:

```
## Task Complete: [Issue ID] - [Title]

Commit: [short-hash]
Staging: [URL]
Linear: [status updated to In Review]

### Acceptance Criteria

| Criteria | Status | Verification |
|----------|--------|--------------|
| [Criterion 1] | ✅ | [How verified - file, test, or manual check] |
| [Criterion 2] | ⚠️ | [Partial - what's missing] |
| [Criterion 3] | ❌ | [Not met - reason] |

**Gaps:** (if any ⚠️ or ❌)
- [What's not fully met]
- [Recommendation: fix now / track separately / needs manual testing]
```

## When to Use Each Format

| Situation | Format |
|-----------|--------|
| Pushed a commit mid-task | Commit format |
| Completed a defined issue (has Linear ticket) | Full task complete format |
| Finished ad-hoc work (no ticket) | Commit format + brief summary |

## Required Elements

**Always include:**
- Commit hash (short form, e.g., `363f31d`)
- Staging URL (from project's CLAUDE.md)

**For full task completion, also include:**
- Linear status update confirmation
- Acceptance criteria table with verification method
