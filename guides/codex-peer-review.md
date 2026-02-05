# OpenAI Codex Peer Review Guide

## Purpose

A **second-opinion** review of sprint changes before production deployment. This is an **advisory** review that provides an external perspective on code quality, security, and architecture.

**Key principles:**
- **Advisory, not blocking** - Reviewer evaluates recommendations and decides what to implement
- **Once per sprint** - Run when Roy signals sprint closure ("close the sprint", "deploy to production")
- **Second opinion** - Complements Claude Reviewer (primary gate), doesn't replace it
- **Safety first** - Includes automatic secrets detection and validation

---

## When to Trigger

**Timing:** After all Developer-Reviewer cycles complete, before production deployment.

**Trigger signals from Roy:**
- "close the sprint"
- "finish sprint"
- "deploy to production"
- "ready for main"
- Similar production deployment language

**Do NOT run:**
- Mid-sprint (creates unnecessary churn)
- During iteration phase (wait until production-ready)
- More than once per sprint (circuit breaker)

---

## Who Runs It

**Owner:** Reviewer agent

**When:** At step 10a of `/sprint` workflow, after:
1. All Developer-Reviewer loops complete
2. All changes approved and deployed to staging
3. User signals readiness for production deployment

---

## Prerequisites

### Required Inputs

| Parameter | Description | Example |
|-----------|-------------|---------|
| `staging-url` | Deploy preview URL for context | `https://quo-2-git-develop-...vercel.app` |
| `git-commit-range` | Sprint diff to review | `main..develop` |
| `spec-file` | Technical spec for context | `docs/technical-specs/QUO-42.md` |

### Required Configuration

**OpenAI API Key:**
- Must be set as environment variable: `OPENAI_API_KEY`
- **Recommended storage:** `~/.zshrc` or `~/.bashrc`
  ```bash
  export OPENAI_API_KEY="sk-proj-..."
  ```
- **Alternative:** `~/.claude/credentials` (gitignored, sourced by shell)
  ```bash
  # Create ~/.claude/credentials
  export OPENAI_API_KEY="sk-..."

  # Add to ~/.zshrc
  [ -f ~/.claude/credentials ] && source ~/.claude/credentials
  ```

**Model selection:**
- Default: `gpt-4` (reliable, high quality)
- Override: `MODEL=gpt-4o ./scripts/codex-review.sh ...`
- Future: Switch to `gpt-4o` when stable (faster, cheaper)

---

## How to Run

### Command

```bash
~/.claude/scripts/codex-review.sh <staging-url> <commit-range> <spec-file>
```

### Example

```bash
~/.claude/scripts/codex-review.sh \
  "https://quo-2-git-develop-roy-frenkiels-projects.vercel.app" \
  "main..develop" \
  "docs/technical-specs/QUO-57.md"
```

### With Custom Model

```bash
MODEL=gpt-4o ~/.claude/scripts/codex-review.sh <staging-url> <commit-range> <spec-file>
```

---

## Safety Checks

The script performs these **automatic validations** before calling OpenAI:

### 1. API Key Validation
- Checks if `OPENAI_API_KEY` is set
- Fails fast with clear error message if missing

### 2. Secrets Detection (BLOCKING)
- Scans diff for common secret patterns:
  - API keys (`sk-...`, `api_key=`)
  - Passwords (`password=`)
  - Tokens (`token=`)
  - Other credentials
- **If secrets detected:** Script exits immediately with error
- **Manual override:** Not allowed - secrets must be removed first

### 3. Commit Range Validation
- Verifies `develop` is ahead of `main`
- Checks that diff is non-empty
- Warns if range appears inverted or invalid

### 4. Large Diff Warning
- Estimates token count and API cost
- Warns if diff exceeds safe limits (~25k tokens for gpt-4)
- Prompts for confirmation before proceeding

### 5. Circuit Breaker Check
- Verifies Codex review hasn't already been run for this sprint
- Checks sprint file for "Codex review: ✅" marker
- Allows manual override if needed

---

## Script Output

### Success Case

```
🤖 Requesting OpenAI peer review...
Model: gpt-4
Commit range: main..develop
Spec file: docs/technical-specs/QUO-57.md

🔍 Scanning for secrets...
✅ No secrets detected

✅ OpenAI peer review complete

[Recommendations follow in format:]
- [file:line] [issue] → [suggested fix]
```

### Error Cases

**Missing API Key:**
```
Error: OPENAI_API_KEY environment variable not set
Set it in your shell profile: export OPENAI_API_KEY='sk-...'
```

**Secrets Detected:**
```
❌ BLOCKING: Potential secrets detected in diff

Detected patterns:
+ export API_KEY="sk-proj-xxxxx"

DO NOT PROCEED. Remove secrets before running Codex review.
```

**Invalid Commit Range:**
```
⚠️ WARNING: No commits in range main..develop
develop appears to be even with or behind main.

This shouldn't happen in normal workflow.
Please verify branches and try again.
```

---

## Reviewer's Workflow

### Step 1: Run Codex Review

When Roy signals sprint closure, Reviewer runs the script:

```bash
~/.claude/scripts/codex-review.sh <staging-url> <commit-range> <spec-file>
```

### Step 2: Evaluate Recommendations

Review each Codex recommendation and categorize:

**ACCEPT if:**
- Identifies real security issue
- Catches bug or edge case missed by Claude Reviewer
- Improves code clarity significantly
- Aligns with project coding standards
- Low effort to implement

**REJECT if:**
- Stylistic preference with no material benefit
- Over-engineering ("might be useful later")
- Contradicts project conventions
- High effort for marginal gain
- Out of scope for this sprint

### Step 3: Post to Linear

**Format:**

```markdown
## 🤖 OpenAI Codex Peer Review Complete

**Reviewed:** [commit range]
**Model:** [model used]
**Recommendations:** [N] total

### Accepted ([X])
1. **[file:line]** — [Codex recommendation]
   → [What Developer should do]

2. **[file:line]** — [Codex recommendation]
   → [What Developer should do]

### Rejected ([Y])
- [Recommendation]: [Why rejected - stylistic/out of scope/contradicts conventions]
- [Recommendation]: [Why rejected]

---
[Next steps based on outcome - see below]
```

### Step 4: Next Steps Based on Outcome

**If accepted recommendations exist:**

Invoke Developer with:
```
Issue: {PREFIX}-##
Status: CODEX RECOMMENDATIONS (Final polish before production)

Recommendations from OpenAI Codex peer review:
1. [file:line] [what to change] → [why]
2. [file:line] [what to change] → [why]

These are final improvements before production deployment.
Implement, verify, and resubmit for final approval.
```

Developer treats this as a standard "CHANGES REQUESTED" round:
- Implements accepted recommendations
- Runs full verification
- Resubmits to Reviewer
- Reviewer approves if changes are correct

**If NO accepted recommendations:**

Post to Linear:
```markdown
## ✅ OpenAI Codex Peer Review Complete

**Reviewed:** [commit range]
**Recommendations:** [N] total, none accepted

All Codex suggestions were either:
- Already addressed in codebase
- Stylistic preferences not aligned with project
- Out of scope for this sprint

No changes needed. Ready for production deployment.
```

Notify Eng Manager: "Codex peer review complete. No blocking issues. Ready for production."

### Step 5: Update Sprint File

Add checkpoint to sprint file:

```markdown
## Codex Review Complete — [YYYY-MM-DD HH:MM]

**Status:** ✅ Complete
**Model:** gpt-4
**Recommendations:** [N] total, [X] accepted, [Y] rejected
**Outcome:** [Ready for production / Final fixes in progress]
```

This serves as the circuit breaker marker for "once per sprint" enforcement.

---

## Model Recommendations

| Model | Use Case | Cost | Speed | Quality | Notes |
|-------|----------|------|-------|---------|-------|
| `gpt-4` | **Default (current)** | $$$ | Medium | High | Most reliable, proven for code review |
| `gpt-4o` | **Default (future)** | $$ | Fast | High | Switch when stable in production |
| `o1-preview` | Complex architectural reviews | $$$$ | Slow | Highest | Deep reasoning, expensive |
| `o1-mini` | Budget/experimental | $ | Fast | Good | Lighter reasoning model |

**Recommendation:** Start with `gpt-4`, migrate to `gpt-4o` when available.

---

## Error Handling

### If Script Fails

**Common failure scenarios:**

1. **API Error (network, rate limit, etc.):**
   - Script exits with error message
   - Reviewer logs the error
   - **Does NOT block production** - tooling failures shouldn't prevent shipping

2. **Missing API Key:**
   - Script fails with setup instructions
   - Reviewer asks User to configure API key
   - Can skip Codex review and proceed to production

3. **Secrets Detected:**
   - Script blocks with error
   - **MUST be resolved before proceeding**
   - Escalate to Developer to remove secrets
   - Re-run Codex review after fix

### Reviewer's Error Protocol

**If Codex review fails (API error, network issue):**

1. Log the error to sprint file
2. Post warning to Linear:
   ```markdown
   ## ⚠️ Codex Peer Review Failed

   **Error:** [error message]

   Codex review could not be completed due to tooling issue.
   Proceeding without peer review - manual code review was thorough.

   Ready for production deployment.
   ```
3. Notify Eng Manager
4. **Proceed to production** - don't block on tooling

**If secrets detected:**

1. **BLOCK immediately**
2. Post to Linear:
   ```markdown
   ## 🚫 BLOCKED: Secrets Detected

   Codex review detected potential secrets in diff.
   Cannot proceed to production until resolved.

   Developer: Remove secrets and resubmit.
   ```
3. Invoke Developer to fix
4. Re-run Codex review after fix

---

## Circuit Breaker

**Max 1 Codex review per sprint.**

**Enforcement:**
- Script checks sprint file for "Codex review: ✅" marker
- Warns if already completed
- Allows manual override (Roy can explicitly request re-run)

**Rationale:**
- Prevents infinite loops
- Reduces API costs
- Codex recommendations should be stable (not change between runs)

**Override scenario:**
- Roy explicitly says "run Codex again" after significant changes
- Reviewer can override circuit breaker with manual confirmation

---

## Integration with Sprint Workflow

### Sprint Flow with Codex Review

```
1. Developer implements → submits to Reviewer
2. Reviewer reviews → approves → deployed to staging
3. [All tasks complete]
4. Roy says "close the sprint" / "deploy to production"
5. Reviewer triggers Codex review ← THIS STEP
6. Codex returns recommendations
7. Reviewer evaluates → accepts some, rejects others
8. If accepted: Developer implements → Reviewer approves
9. If none accepted: Proceed to production
10. Roy deploys to main
```

### Where It Fits

**Codex review happens:**
- ✅ AFTER all Developer-Reviewer cycles complete
- ✅ AFTER staging deployment
- ✅ BEFORE production deployment
- ✅ WHEN Roy signals production readiness

**Codex review does NOT happen:**
- ❌ During initial implementation
- ❌ During iteration/bug-fix phase
- ❌ Mid-sprint
- ❌ For every commit

---

## Cost Estimation

**Typical sprint review:**
- **Diff size:** 5-15k tokens
- **Model:** gpt-4
- **Cost:** $0.15 - $0.45 per review

**Large sprint review:**
- **Diff size:** 20-50k tokens
- **Model:** gpt-4
- **Cost:** $0.60 - $1.50 per review

**Cost control:**
- Script warns if diff exceeds 25k tokens
- Prompts for confirmation before expensive reviews
- Recommends smaller commit ranges if too large

---

## Troubleshooting

### "OPENAI_API_KEY not set"

**Solution:** Add to shell profile:
```bash
# In ~/.zshrc or ~/.bashrc
export OPENAI_API_KEY="sk-proj-..."

# Reload shell
source ~/.zshrc
```

### "No changes found in range"

**Likely cause:** Branches are even or reversed

**Solution:**
```bash
# Check branch status
git log --oneline main..develop

# If empty, verify you're on correct branch
git branch
git status
```

### "Secrets detected"

**Solution:** Remove secrets from diff, use environment variables instead

**Check what was detected:**
```bash
git diff main..develop | grep -E "(sk-|api_key|password|secret|token)"
```

### "Diff too large"

**Solution:** Review smaller commit ranges
```bash
# Instead of entire sprint
./scripts/codex-review.sh <url> "abc123..xyz789" <spec>

# Or split into multiple reviews
./scripts/codex-review.sh <url> "main..commit1" <spec>
./scripts/codex-review.sh <url> "commit1..commit2" <spec>
```

---

## Best Practices

### For Reviewer

1. **Read recommendations critically** - Codex doesn't know project context
2. **Prioritize security and correctness** - Reject style-only suggestions
3. **Respect circuit breaker** - Don't re-run without good reason
4. **Log failures gracefully** - Tooling issues shouldn't block production
5. **Update sprint file** - Document Codex review completion

### For Eng Manager

1. **Monitor cost** - Track API usage over time
2. **Evaluate value** - Does Codex catch issues Claude Reviewer missed?
3. **Adjust model** - Migrate to gpt-4o when stable
4. **Update guide** - Document patterns of useful vs. rejected recommendations

---

## Related Documentation

- `~/.claude/agents/reviewer.md` - Reviewer agent instructions (includes Codex workflow)
- `~/.claude/commands/sprint.md` - Sprint command (step 10a triggers Codex)
- `~/.claude/rules/security.md` - Security requirements (secrets handling)
- `~/.claude/rules/task-completion.md` - Output formats for completion
