# Security Review Checklist

Used by the Security Reviewer agent in both modes:
- **PR mode:** Check the diff for security issues introduced by this change
- **Audit mode:** Scan the full codebase for accumulated security debt

---

## PR Mode Checklist (Per-Change)

When reviewing a diff, check every item that applies to the changed files.

### Authentication & Authorization

- [ ] New endpoints require authentication (unless explicitly public)
- [ ] Admin endpoints use `require_admin` or equivalent RBAC dependency
- [ ] No hardcoded user emails, IDs, or roles in frontend (use backend role checks)
- [ ] Impersonation/elevated-access actions have audit logging (who, when, target, IP)
- [ ] Token expiry is reasonable (access: 1h, refresh: 7d, impersonation: 15m)

### Input Validation

- [ ] All user input validated at system boundaries (Pydantic models, Zod schemas)
- [ ] URL inputs validated beyond just `startsWith("https://")` — check domain allowlist for SSRF
- [ ] File uploads validate MIME type + magic bytes
- [ ] No raw user input in SQL (parameterized queries only)
- [ ] No raw user input in HTML (`dangerouslySetInnerHTML` uses DOMPurify with strict whitelist)

### Secrets & Configuration

- [ ] No hardcoded secrets, API keys, tokens, or passwords
- [ ] No hardcoded default values for secrets (e.g., `os.getenv("TOKEN", "default-value")`)
- [ ] Environment variables validated at startup, not first use
- [ ] JWT secret strength validated (>= 32 chars)
- [ ] Secrets not logged — check `logger.*` and `print()` calls near sensitive data

### CORS & Headers

- [ ] CORS `allow_methods` and `allow_headers` are explicit lists (not `["*"]`)
- [ ] CORS origin regex is as narrow as possible (not all preview branches)
- [ ] `allow_credentials=True` only with specific origins (never with `allow_origins=["*"]`)
- [ ] Content Security Policy headers configured (script-src, connect-src restricted)

### Error Handling & Information Leakage

- [ ] Error responses return generic messages to clients (no exception details, stack traces, SQL errors)
- [ ] Internal error details logged server-side only
- [ ] JWT tokens decoded with signature verification (no `verify_signature=False` unless non-security context documented)
- [ ] Auth tokens transmitted in headers, not request bodies (bodies get logged/cached)

### Token & Session Storage

- [ ] Auth tokens stored in platform-secure storage (Capacitor Preferences, not sessionStorage/localStorage)
- [ ] Impersonation tokens use same secure storage as regular tokens
- [ ] Tokens cleared on logout
- [ ] No tokens in URL parameters

### Rate Limiting

- [ ] Public auth endpoints (login, signup, password reset) have rate limiting
- [ ] Sensitive admin endpoints (impersonation, user management) have rate limiting
- [ ] Rate limit responses don't leak user existence information

### External API Integration

- [ ] External API responses validated with Pydantic models before field access
- [ ] API errors don't propagate raw to clients
- [ ] Polling loops have `max_seconds` timeout

### Dependency Security

- [ ] No known vulnerable packages (`npm audit`, `pip-audit`)
- [ ] Dependencies pinned to specific versions

---

## Audit Mode Checklist (Full Codebase)

Everything in PR mode, plus these active verification steps.

### Active Endpoint Testing

```bash
# CORS headers — verify not wildcard
curl -s -I -X OPTIONS \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: DELETE" \
  [STAGING_API_URL] | grep -i "access-control"

# Auth endpoint rate limiting — verify throttled
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST [STAGING_API_URL]/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}';
  echo;
done
# Should see 429 after threshold

# Error response leakage — verify generic messages
curl -s -X POST [STAGING_API_URL]/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid"}' | jq .detail
# Should NOT contain exception class names or stack traces

# Health endpoint — verify server starts
curl -s [STAGING_API_URL]/health
```

### Configuration Scan

- [ ] `vercel.json` / build commands don't expose admin/debug features in production
- [ ] `.gitignore` covers `.env`, `.env.local`, `.env.*.local`, credentials files
- [ ] No `.env` files committed to git: `git log --all --name-only | grep -i '\.env'`
- [ ] No secrets in git history: `git log --all -p | grep -iE "(sk-|api_key=|password=|secret=)" | head -20`
- [ ] All required env vars have startup validation (fail-fast, not runtime error)

### Frontend Scan

- [ ] No hardcoded emails, user IDs, or role checks in source (search: `=== '...@'`, `email ===`)
- [ ] All `dangerouslySetInnerHTML` uses DOMPurify with explicit tag whitelist
- [ ] No sensitive data in `localStorage` or `sessionStorage` (tokens, PII)
- [ ] Google/OAuth client IDs loaded from env vars (public, but not hardcoded)
- [ ] Console.log/warn/error wrapped in dev-only checks for production builds

### Backend Scan

- [ ] All SQL queries use parameterized placeholders ($1, $2) — no f-string interpolation of user input
- [ ] `print()` calls replaced with `logger.*` (print bypasses log controls)
- [ ] Tempfile operations use context managers (no orphaned temp files)
- [ ] Background tasks under 60 seconds (long operations use persistent queue)
- [ ] Password hashing uses bcrypt/argon2 with proper salt

### Infrastructure Scan

- [ ] All API URLs use HTTPS (no HTTP in config or code)
- [ ] Deployment configs don't enable debug mode in production
- [ ] Rate limiting middleware configured on auth and admin endpoints
- [ ] CORS origin regex only matches expected domains

---

## Severity Classification

| Severity | Definition | Action |
|----------|-----------|--------|
| CRITICAL | Exploitable now, affects all users (e.g., admin panel exposed) | Block deploy, fix immediately |
| HIGH | Exploitable with effort, significant impact (e.g., no rate limiting on auth) | Fix this sprint |
| MEDIUM | Defense-in-depth gap or information leakage (e.g., no CSP, error detail leakage) | Fix next sprint |
| LOW | Code hygiene, future-proofing (e.g., print vs logger, f-string SQL patterns) | Backlog |

---

## Report Format

### PR Mode

```markdown
## Security Review: [APPROVED / CHANGES REQUESTED]

**Scope:** [N files changed, areas: auth/CORS/config/etc.]

### Issues Found

1. **[file:line]** [SEVERITY] — [what's wrong]
   -> [what to do]

### Passed Checks
- [List key checks that passed, relevant to the changes]

<!-- SECURITY_REVIEW: {issue_id} | {commit_hash} | {timestamp} -->
```

### Audit Mode

```markdown
# Security Audit — [Project Name]

**Date:** [date]
**Scope:** Full-stack (backend, frontend, infrastructure)

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | N |
| HIGH | N |
| MEDIUM | N |
| LOW | N |

## Findings

### [SEVERITY]: [Title]
**Files:** [paths]
**Impact:** [what can go wrong]
**Fix:** [what to do]

## Passing Checks
[Table of areas that passed]

## Priority Fix Order
[Ordered remediation list]
```
