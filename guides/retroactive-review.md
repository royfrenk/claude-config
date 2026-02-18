# Retroactive & Fast-Track Review Guide

Protocols for reviewing code outside the normal review cycle: retroactive (already deployed) and fast-track (production incidents).

---

## Proactive Review Gate Monitoring

**When invoked by EM with "REVIEW GATE BYPASSED":**

This means Developer deployed to staging WITHOUT invoking you for approval.

**Your role:**
1. Immediately conduct retroactive review (see protocol below)
2. Focus on: security vulnerabilities, data integrity, breaking changes
3. Recommend whether to keep or revert the staging deployment
4. Document process gap and recommend enforcement improvements

**Why this matters:**
- Protects code quality
- Identifies process weaknesses
- Ensures review gates are enforced, not optional

---

## Retroactive Review (Emergency Protocol)

**Purpose:** Review code that was deployed without reviewer approval (process bypass).

**When invoked:**
- EM discovers reviewer was skipped during staging deployment check
- Developer or EM discovers reviewer was skipped after the fact
- Code is already in staging or production
- Need to assess quality and identify issues

**Input format:**
```
Issue: {PREFIX}-##
Status: RETROACTIVE REVIEW REQUIRED
Commits: [list of commit hashes or git diff range]
Reason: [why reviewer was skipped - e.g., "Sprint 007 hotfix deployed without review"]
Current state: [staging / production]
```

**Your process:**

1. **Mark as retroactive in Linear:**
   ```markdown
   ## RETROACTIVE REVIEW - {Issue ID}

   **Context:** Reviewing code deployed without prior approval
   **Commits:** [list]
   **Reason:** [why skipped]
   **Current state:** [staging/production]

   This review is for learning and identifying issues, not blocking deployment (already deployed).
   ```

2. **Review all commits:**
   - Apply full review criteria (tests, security, quality, scope)
   - Focus on: security vulnerabilities, data integrity issues, breaking changes
   - Document what you find (good and bad)

3. **Post findings:**

   **If critical issues found:**
   ```markdown
   ## RETROACTIVE REVIEW: Critical Issues Found

   **Issues requiring immediate fix:**
   1. [file:line] - [SECURITY/DATA/BREAKING]: [description]
      -> [required action]

   **Non-critical issues (can defer):**
   1. [description] -> [recommendation]

   **Recommendation:**
   - Fix critical issues immediately (new hotfix)
   - Non-critical issues -> add to backlog

   **Process gap identified:**
   - Reviewer was bypassed due to: [reason]
   - Recommendation: [how to prevent recurrence]
   ```

   **If no critical issues:**
   ```markdown
   ## RETROACTIVE REVIEW: Approved (No Critical Issues)

   **Reviewed:** [commits]
   **Findings:** Code quality is acceptable. No security or data integrity issues.

   **Minor improvements noted:**
   1. [description] -> [recommendation for future]

   **Process gap identified:**
   - Reviewed retroactively - reviewer was bypassed
   - Reason: [why it happened]
   - Recommendation: [how to prevent - e.g., "Enforce reviewer gate in /iterate command"]

   **Approval granted retroactively.** Code is safe to remain in production.
   ```

4. **Update approval tracking:**
   - Even though retroactive, add approval metadata to comment
   - Allows future audits to see this was eventually reviewed

5. **Recommend process improvements:**
   - Always include section: "How to prevent this gap in future"
   - Be specific about which process file needs updating
   - Tag EM and User for visibility

**Retroactive review does NOT block current deployment** (already deployed). It serves to:
- Identify issues that need fixing
- Learn from process gaps
- Ensure code quality standards are maintained
- Prevent similar bypasses in future

---

## Fast-Track Review Protocol

**When to use:** Linear issue has label "CRITICAL - Production Incident"

**Modified process:**

1. **Time limit:** Respond within 15 minutes (vs 30 minutes normal)

2. **Prioritized focus:**
   - **MUST review:** Security vulnerabilities, data integrity, breaking changes
   - **SHOULD review:** Test coverage, error handling, input validation
   - **MAY DEFER:** Style issues, minor optimizations, code organization

3. **Review depth:**
   - Apply same review criteria as normal
   - BUT: Defer non-critical issues to retroactive review
   - Focus on "Is this safe to deploy?" not "Is this perfect?"

4. **Approval with notes:**
   ```markdown
   ## FAST-TRACK REVIEW: Approved

   **Reviewed for:** Security, data integrity, breaking changes
   **Status:** Safe to deploy

   **Critical checks:**
   - Security: No vulnerabilities found
   - Data integrity: No data loss risk
   - Breaking changes: Backward compatible

   **Deferred for deeper review:**
   - [Minor issue 1] -> Will review retroactively
   - [Minor issue 2] -> Add to backlog

   **Ready for production deployment.**

   Note: Full review will be conducted retroactively within 24 hours.
   ```

5. **Follow-up:**
   - Within 24 hours, conduct full retroactive review
   - Document any issues found
   - Add improvements to backlog

**Fast-track still requires approval** -- it's expedited, not skipped.

**Purpose:** Balance quality with urgency for production incidents.
