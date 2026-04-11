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

   **During a sprint (push to sprint branch):**
   ```bash
   # Read sprint branch name from sprint file
   git push origin sprint/sprint-XXX-topic
   ```
   Vercel generates a preview URL from the sprint branch.

   **At sprint end (merge to develop):**
   ```bash
   git checkout develop
   git merge sprint/sprint-XXX-topic
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
       git diff --stat main...HEAD
       echo ""
       echo "Full Diff:"
       git diff main...HEAD
     } > "$DIFF_FILE"
     git add "$DIFF_FILE"
     git commit -m "chore: Update sprint ${SPRINT_NUM} diff file" --no-verify
     CURRENT_BRANCH=$(git branch --show-current)
     git push origin "$CURRENT_BRANCH"
   fi
   ```

---

## Phase 5.5: Verify Backend and Frontend Ready

After pushing to the sprint branch (or develop at sprint end), verify BOTH are operational before user testing.

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
5. **Proceed to Phase 6.5 (SRE) — do NOT notify User yet**

---

## Phase 6.5: SRE Deployment Verification

**Prerequisite:** Phase 6 passed. **This phase is MANDATORY for every deployment.**

SRE runs health checks, smoke tests, and log analysis against the live deployment. It gates user handoff — if SRE fails, the User never sees a broken deployment.

### Step 1: Load SRE Config

```bash
# Check if SRE is configured for this project
if [ -f ".sre/config.yaml" ]; then
  echo "SRE enabled"
else
  echo "SRE not configured — generate config from CLAUDE.md"
  # See sre.md "First-run provisioning"
fi
```

### Step 2: Determine Execution Mode

```bash
# Managed agent mode (target) vs Bootstrap mode (fallback)
if [ -n "$SRE_AGENT_ID" ]; then
  echo "Mode: Managed Agent"
else
  echo "Mode: Bootstrap (local subagent)"
fi
```

### Step 3: Run SRE Checks

**In bootstrap mode**, spawn a subagent (see `~/.claude/agents/sre.md` Bootstrap Mode) that:
1. Runs all `health_checks` from `.sre/config.yaml` via curl
2. Runs all `smoke_tests` from `.sre/config.yaml` via curl
3. Checks deployment logs (Railway logs, Vercel build output)
4. Reports pass/fail with full context

**In managed mode**, the bridge daemon handles this via Anthropic Sessions API.

### Step 4: SRE Report Format

Read service names, providers, and dashboard links from `.sre/config.yaml` `services` section. Output results in this human-readable format — **services first** so the User can see at a glance if everything is up:

```
## SRE Deploy Verification — [Environment]

### Services

| Service | Provider | Status | Details |
|---------|----------|--------|---------|
| [Backend API](dashboard_url) | Railway | ✅ Healthy | /health → 200 (117ms) |
| [Frontend](dashboard_url) | Vercel | ✅ Deployed | 200 OK (443ms), latest bundle verified |
| [Worker](dashboard_url) | Railway | ✅ Running | No errors in last 50 log lines |

### Checks

| Check | Result |
|-------|--------|
| Health endpoint responds | ✅ |
| Auth required on protected routes | ✅ (401 as expected) |
| Public endpoints accessible | ✅ |
| No errors in deployment logs | ✅ |
| Response times under threshold | ✅ (all < 1000ms) |

### Result: ✅ ALL PASSED

All services healthy. No errors detected. Safe to proceed.
```

**Key rules for the report:**
- Service names and dashboard links come from `.sre/config.yaml` `services` section
- Service name is a clickable markdown link to the provider dashboard
- Provider column shows Railway/Vercel/etc. so User knows where to look if something is wrong
- Services table is ALWAYS first — this answers "is everything up?" in 3 seconds
- Detailed checks table is below for debugging context

**On failure:**

```
## SRE Deploy Verification — [Environment]

### Services

| Service | Provider | Status | Details |
|---------|----------|--------|---------|
| [Backend API](dashboard_url) | Railway | ❌ Down | /health → 502 (timeout after 10s) |
| [Frontend](dashboard_url) | Vercel | ✅ Deployed | 200 OK |
| [Worker](dashboard_url) | Railway | ⚠️ Unknown | Could not verify (backend down) |

### Failed Checks

| Check | Error |
|-------|-------|
| Health endpoint | 502 Bad Gateway — backend not responding |

### Logs (Last 10 Lines)
\```
[2026-04-10 14:32:01] ERROR: ModuleNotFoundError: No module named 'app.services.new_module'
[2026-04-10 14:32:01] ERROR: Worker process exited with code 1
\```

### Result: ❌ FAILED — [Backend API](dashboard_url) is down

Import error in new module. Developer must fix before user handoff.
```

### Step 5: Handle Results

| Result | Action |
|--------|--------|
| **PASS** | Log in sprint file. Proceed to user handoff (notify User with staging URL). |
| **FAIL (staging/dev)** | Log failure in sprint file. Report to EM with full failure context. EM spawns Developer to auto-fix (see em.md SRE Failure Handling). Do NOT notify User. |
| **FAIL (production)** | Log failure. Escalate to User IMMEDIATELY. Do NOT auto-iterate on production. |

### Circuit Breaker

SRE itself doesn't retry — it reports once. The auto-iterate cycle (EM → Developer → redeploy → SRE again) has its own circuit breaker: max 3 cycles, then escalate to User.

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
CURRENT_BRANCH=$(git branch --show-current)
git revert HEAD && git push origin "$CURRENT_BRANCH"
```
