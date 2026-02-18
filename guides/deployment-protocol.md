# Deployment Protocol Guide

Full deployment protocol for Developer agent. Covers Phase 5 (deploy to staging), Phase 5.5 (readiness checks), and Phase 6 (automated staging verification).

---

## Phase 5: Deploy to Staging

### Pre-Deployment Approval Check (MANDATORY)

Before executing ANY deployment commands:

1. **Verify Phase 4 was completed:**
   - Did you invoke reviewers?
   - If NO or UNSURE --> STOP, return to Phase 4

2. **Query Linear for approvals:**

   **For UI/UX tasks:**
   - Design-Reviewer approval: "Design Review: Approved"
   - Code Reviewer approval: "Review: Approved"

   **For non-UI tasks:**
   - Code Reviewer approval: "Review: Approved"

   **Method (Linear MCP):**
   ```
   Use mcp__linear__list_comments(issueId) to get all comments
   Search for approval comments
   Extract commit hash from approval metadata
   ```

3. **Interpret approval status:**

   | Scenario | Result | Action |
   |----------|--------|--------|
   | Approval found AND current | PROCEED | Deploy |
   | No approval found | STOP | Return to Phase 4 |
   | Approval found but stale (commit mismatch) | STOP | Resubmit for re-review |
   | Most recent comment is "Changes Requested" | STOP | Fix and resubmit |

4. **Check for infrastructure changes:**
   - Email provider, database, auth, payment changes require BOTH Reviewer + User approval
   - If only Reviewer approved: STOP, request User approval

5. **Log verification and deploy:**
   ```bash
   git checkout develop
   git merge <feature-branch>
   git push origin develop
   ```

6. **Generate sprint diff file:**
   ```bash
   ACTIVE_SPRINT=$(find docs/sprints/ -name "*.active.md" 2>/dev/null | head -1)
   if [ -n "$ACTIVE_SPRINT" ]; then
     SPRINT_NUM=$(basename "$ACTIVE_SPRINT" | grep -oE 'sprint-[0-9]+' | grep -oE '[0-9]+')
     DIFF_FILE="docs/diffs/sprint-${SPRINT_NUM}-diff.txt"
     mkdir -p docs/diffs
     {
       echo "Sprint ${SPRINT_NUM} Diff - Generated: $(date)"
       echo "========================================"
       echo ""
       echo "Summary:"
       git diff --stat main...develop
       echo ""
       echo "Full Diff:"
       git diff main...develop
     } > "$DIFF_FILE"
     git add "$DIFF_FILE"
     git commit -m "chore: Update sprint ${SPRINT_NUM} diff file" --no-verify
     git push origin develop
   fi
   ```

---

## Phase 5.5: Verify Backend and Frontend Ready

After pushing to develop, verify BOTH are operational before user testing.

### Backend Checks

1. **Health endpoint:**
   ```bash
   curl -f [BACKEND_STAGING_URL]/health
   ```

2. **Database migrations:**
   ```bash
   curl [BACKEND_STAGING_URL]/api/db/version
   ```

3. **Environment variables:**
   ```bash
   curl [BACKEND_STAGING_URL]/api/config/validate
   ```

### Frontend Checks

1. **Build verification:**
   ```bash
   npm run build 2>&1 | tail -20
   ```

2. **Health check:**
   ```bash
   curl -f [FRONTEND_STAGING_URL]/
   ```

3. **Environment variables:** Check build output for env var errors.

### Circuit Breaker

Max 3 retry attempts per component. After 3 failures:

```
## Deployment Readiness FAILED (Attempt 3/3)

**Component:** [Backend | Frontend]
**Failed Check:** [what failed]
**Error:** [exact error]

**Attempts:**
1. [tried] --> [result]
2. [tried] --> [result]
3. [tried] --> [result]

**Blocker:** [why not resolving]
**Escalating to Eng Manager.**
```

---

## Phase 6: Automated Staging Verification

**Prerequisite:** Phase 5.5 passed.

### Step 1: Identify Checks from Spec File

- API Health Checks (if backend changes)
- Response Structure Validation (if API changes)
- Log Checking (always)
- Relevant E2E Tests (from spec file "Relevant E2E Tests" section)
- Platform-specific checks

### Step 2: Run Checks

**API Health:**
```bash
vercel curl "https://[staging-url]/api/endpoint"
# Check: HTTP 200, valid JSON, expected fields
```

**Response Validation:**
```bash
RESPONSE=$(vercel curl "https://[staging-url]/api/endpoint")
echo "$RESPONSE" | jq '.field | length'
```

**Log Analysis:**
```bash
vercel logs [staging-url] --since=5m | grep -i "error\|exception\|failed"
```

**E2E Tests:**
```bash
npx playwright test tests/relevant.spec.ts --grep-invert @launch
```

**Critical Checks (from project learnings):**
- Environment variables set in ALL environments
- Email service matches production behavior
- Responsive design at exact breakpoints
- API fallbacks working

### Step 3: Verification Report

```
## Automated Staging Verification

**Timestamp:** [date]
**Deployment:** [staging-url]

### API Health Checks
| Endpoint | Status | Response Time | Notes |
|----------|--------|---------------|-------|

### Response Structure Validation
| Check | Status | Details |
|-------|--------|---------|

### Log Analysis
| Check | Status | Details |
|-------|--------|---------|

### E2E Tests
| Test File | Status | Duration | Notes |
|-----------|--------|----------|-------|

### Overall Status: [PASSED / FAILED]
```

### Step 4: Handle Failures

- Attempt 1-3: Fix and retry
- After 3 failures: Escalate to Eng Manager with failure report

### Step 5: Post-Verification

1. Update PROJECT_STATE.md (new files, fixed issues, recent changes)
2. Sync Linear status to "In Review" (soft retry: 2 attempts)
3. Post verification results to Linear
4. Update sprint file with check-in
5. Notify User with staging URL and testing instructions

---

## Deployment Management (CLI Operations)

### Check CLI Availability

```bash
which vercel || which railway || which netlify
```

### Common Operations

| Task | Vercel | Railway | Netlify |
|------|--------|---------|---------|
| Status | `vercel inspect <URL>` | `railway status` | `netlify status` |
| Logs | `vercel logs <URL>` | `railway logs` | `netlify logs` |
| Env vars | `vercel env ls` | `railway variables` | `netlify env:list` |
| Add env var | `vercel env add <KEY>` | `railway variables set K=V` | `netlify env:set K V` |

### Rules

- Execute CLI operations yourself (don't ask user to do it)
- Only escalate for: CLI not installed, auth errors, destructive operations
- Ask permission before: deleting resources, modifying production, billing changes
- Execute without asking: adding env vars, checking logs, listing resources

### Deployment Failure Protocol

1. Check logs
2. Identify error type
3. Write minimal fix
4. Submit fix to Reviewer
5. Push after approval

**Circuit breaker:** Max 3 attempts, then revert:
```bash
git revert HEAD && git push origin develop
```
