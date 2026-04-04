---
description: Run a full-codebase security audit. Scans backend, frontend, and infrastructure for vulnerabilities.
---

# Security Audit

Run the Security Reviewer agent in **audit mode** — a thorough scan of the full codebase.

## Workflow

1. Read `CLAUDE.md` for project configuration (staging URL, Linear settings)
2. Spawn the Security Reviewer agent (`security-reviewer`) with:
   - Mode: audit
   - Staging API URL from CLAUDE.md
   - Project name
3. Security Reviewer executes the Audit Mode checklist from `~/.claude/guides/security-review-checklist.md`
4. Findings written to `docs/security-audit.md`
5. Present summary to User

## Invocation

### On-demand
```
/security-audit
```

### Auto-triggered by EM
When EM determines a sprint touches security-sensitive areas (see `~/.claude/guides/em-protocol.md` Security Audit Trigger section), it invokes this at sprint end.

## Output

```
## Security Audit Complete

**Date:** [date]
**Findings:** [N] CRITICAL, [N] HIGH, [N] MEDIUM, [N] LOW
**Report:** docs/security-audit.md

### Action Required
- [List CRITICAL and HIGH findings with one-line summaries]

### Recommendation
- [Fix immediately / Track in Linear / No action needed]
```

## Rules

- Thorough depth by default (~15 min)
- Always write findings to `docs/security-audit.md` (overwrites previous audit)
- If CRITICAL findings: flag to User immediately, don't wait for sprint end
- If no findings: still update the audit file with date and "all clear" status
