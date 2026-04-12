# Autonomous Iteration Guide

Canonical source for iteration autonomy policy. Defines when EM auto-continues vs escalates during `/iterate` and `/sprint` SRE failure handling.

**Expected readers:** `iterate.md` (inline Read), `sprint.md` (inline Read), `developer.md` (explicit Read directive), `deployment-protocol.md` (reference).

---

## Overview

During iteration (bug-fix batches after initial deployment), EM owns the loop:

```
User reports bugs → /iterate → EM (inline)
    → plan-writer (iteration-verification mode) → verification checklist
    → developer fix → reviewer gate → deploy → verify
    → severity check → AUTO-CONTINUE or ESCALATE
```

EM decides whether to auto-continue to the next batch or escalate to the User. This decision is gated by the Severity Escalation Checklist and bounded by Circuit Breakers.

**Scope:** Staging and dev environments only. Production always escalates immediately.

---

## Severity Escalation Checklist

Before auto-continuing after a failed verification, EM runs these 5 checks against the proposed fix:

| # | Check | Question |
|---|-------|----------|
| 1 | Migration | Does this fix touch a database migration file? |
| 2 | Auth/payments/session | Does this fix touch auth, payments, or session management? |
| 3 | Paid API re-run | Does this fix trigger a re-transcription, re-summarization, or other paid API re-run? |
| 4 | Architecture | Does this fix change an architectural boundary (new service, new data model, new API contract)? |
| 5 | Security | Is this fix in response to a security-flagged finding? |

**Decision rule:** ANY yes → ESCALATE to User. ALL no → AUTO-CONTINUE.

---

## Circuit Breakers

| Counter | Scope | Limit | On Exceed |
|---------|-------|-------|-----------|
| Per-bug attempts | Same bug, same batch | 3 | Developer invokes Reviewer before 4th attempt |
| Reviewer rounds | Same fix, review cycle | 3 | EM escalates to User |
| SRE auto-iterate cycles | Same deploy, SRE checks | 3 | EM escalates to User |
| Per-issue batches | Same Linear issue, across batches | 5 | EM escalates with full attempt summary |

**Reviewer rounds are NOT counted as per-issue batches.** These are separate counters.

---

## EM Iteration Protocol

When `/iterate` or `/sprint` SRE failure triggers autonomous iteration:

### Step 1: Log the failure

Add to sprint file under Iteration Log with batch number and timestamp.

### Step 2: Run Severity Escalation Checklist

Evaluate the 5 questions against the proposed fix. If ANY answer is yes → escalate to User immediately. If ALL no → continue.

### Step 3: Check Circuit Breakers

Check all 4 counters. If any counter exceeds its limit → escalate. Otherwise → continue.

### Step 4: Invoke Plan-Writer (iteration-verification mode)

Spawn plan-writer with iteration context:
```
Mode: iteration-verification
Spec: docs/technical-specs/{ISSUE_ID}.md
Batch: [N]
Fixed: [list of bugs fixed in this batch]
```

Plan-writer generates a lightweight verification checklist under `#### Batch [N] — Verification Plan` (em-dash U+2014) in the spec file.

### Step 5: Invoke Developer

Spawn developer with fix task + verification checklist reference.

### Step 6: Reviewer Gate

Developer submits to Reviewer. Standard review process applies.

### Step 7: Deploy and Verify

Developer deploys to staging. Runs automated verification (Phase 6) and functional verification (Phase 6.3, using the plan-writer-generated checklist via visual-verifier Mode 5).

### Step 8: Evaluate Results

- **All checks pass:** Log success. Report to User with staging URL.
- **Verification fails:** Loop back to Step 2 (severity check on the new fix). Circuit breaker counters increment.

---

## Visual-Verifier Mode 5: Iteration Verification

When EM needs to verify iteration fixes, it spawns visual-verifier with:

```
Mode: iteration
Spec: docs/technical-specs/{ISSUE_ID}.md
Batch: [N]
Target: [staging URL]
Output Directory: screenshots/
```

Visual-verifier reads `#### Batch [N] — Verification Plan` from the spec file and executes each checklist item. Returns pass/fail per item to EM.

---

## Environment Rules

| Environment | On Failure |
|-------------|------------|
| staging/dev | EM runs severity checklist → AUTO-CONTINUE if all 5 pass, ESCALATE if any fail |
| production | ESCALATE to User IMMEDIATELY — never auto-continue |

---

## What Triggers Autonomous Iteration

- SRE deployment verification failure (staging/dev)
- Automated staging verification failure (Phase 6)
- Functional verification failure (Phase 6.3)
- Visual verification failure (plan-writer-generated checklist)

**NOT triggered by:**
- User-reported bugs (these go through normal `/iterate` flow with User in the loop)
- Production failures (always escalate)
- Security findings (always escalate via severity checklist)
