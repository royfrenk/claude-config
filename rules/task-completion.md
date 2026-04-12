# Task Completion Output

Standard output formats for commits and task completion. Follow these formats in all contexts (sprint, ad-hoc work, iterations).

## After Every Commit

When pushing during a sprint, output with the sprint branch name:

```
✓ Commit: [short-hash] → sprint/sprint-XXX-topic
  Preview: [Vercel preview URL from push output]
  Changes: [1-line summary of what changed]
```

When pushing to `develop` (sprint end merge or non-sprint work), output:

```
✓ Commit: [short-hash] → develop
  Staging: [URL from project's CLAUDE.md Deployment section]
  Changes: [1-line summary of what changed]
```

Example (during sprint):
```
✓ Commit: 363f31d → sprint/sprint-019-admin-tabs
  Preview: https://recap-rabbit-git-sprint-sprint-019-admin-tabs-roy-frenkiels-projects.vercel.app
  Changes: Added Favorites and Searches links to header nav
```

## After Completing a Full Issue/Task

**Before outputting this format, verify ALL acceptance criteria from the Linear issue are met.** If any criterion is not met, flag it and get User approval before marking the issue complete. See `~/.claude/rules/testing.md` for verification standards and E2E test strategy.

When all subtasks are done and pushed to staging, output the full format:

```
## Task Complete: [Issue ID] - [Title]

Commit: [short-hash]
Staging: [URL]
Linear: [status updated to In Review]

### Automated Verification

**Overall Status:** ✅ PASSED

| Check | Status | Details |
|-------|--------|---------|
| API Health | ✅ | All endpoints responding (avg 1.2s) |
| Response Structure | ✅ | Valid data returned, all fields present |
| Logs | ✅ | No errors in last 5 minutes |
| E2E Tests | ✅ | 8/8 tests passed |

### Acceptance Criteria

| Criteria | Status | Verification |
|----------|--------|--------------|
| [Criterion 1] | ✅ | [How verified - file, test, or manual check] |
| [Criterion 2] | ⚠️ | [Partial - what's missing] |
| [Criterion 3] | ❌ | [Not met - reason] |

**Manual Verification Needed:**
- [What automation can't check - e.g., visual design, UX feel]
- [Performance under load]
- [Edge cases not covered by E2E tests]

**Gaps:** (if any ⚠️ or ❌)
- [What's not fully met]
- [Recommendation: fix now / track separately / needs manual testing]

## What You Should Do Next

**Always include this section after the acceptance criteria report.**

1. **Test on staging:** [staging URL from CLAUDE.md]

   Please test the following:
   - [List specific acceptance criteria that need manual verification]
   - [Edge cases to check]
   - [Any workflows or UI changes]

2. **Peer review (optional):** Review the code changes

   I've pushed to staging. You can review the diffs using:

   **Option A - Codex Review (Automated):**
   - Tell me "run codex review" or "peer review"
   - I'll generate diff and run OpenAI analysis
   - Reviews: security, bugs, code quality
   - Cost: ~$0.01-0.50 (depends on size)

   **Option B - Manual Review:**
   - View changes in GitHub or Linear
   - Use VS Code Copilot: Attach diff file and ask for review

   **Option C - Skip:**
   - Proceed to testing without code review

   See `~/.claude/guides/codex-peer-review.md` for details.

3. **Report findings:**
   - If you find issues: Tell me what's broken or unexpected
   - If you have questions: Ask me for clarification
   - If all looks good: Tell me "ready for production" or "close the sprint"

**I'll use `/iterate` to fix any issues you find.**

---

This explicit request for testing ensures issues are caught before production deployment.
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
