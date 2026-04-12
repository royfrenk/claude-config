# Security Rules

All agents must follow these security requirements.

## Mandatory Checks (Before Any Commit)

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated at boundaries
- [ ] All external API responses validated (OAuth profiles, API results)
- [ ] File types validated (MIME type + magic bytes for uploads)
- [ ] Required environment variables validated at startup
- [ ] Configuration format validated (URLs are URLs, ports are numbers)
- [ ] SQL injection prevention (parameterized queries only)
- [ ] XSS prevention (sanitized/escaped output)
- [ ] Authentication required on new endpoints
- [ ] Authorization checked (user can only access their data)
- [ ] Error messages don't leak internal details
- [ ] External URLs validated (SSRF prevention)
- [ ] Rate limiting considered for public endpoints
- [ ] CSRF protection on state-changing operations

## Key Rules

- **Environment variables:** Validate ALL required env vars at server startup. Never silently fall back to defaults for critical config.
- **Config format:** Validate URLs are URLs, ports are numbers, callback paths are correct.
- **Secrets:** Never hardcode. Always use env vars with validation.
- **Input validation:** Validate external input at system boundaries using schemas (e.g., Zod). This includes OAuth profiles, API responses, and user input.
- **Non-security validation:** Also validate types, missing fields, format errors, and range errors at boundaries.
- **File uploads:** Validate MIME type AND magic bytes. Don't trust extensions.
- **Error handling:** Never expose stack traces or internal details to users.

**For code examples and detailed patterns, see:** `~/.claude/guides/security-patterns.md`

## If Security Issue Found

1. **STOP immediately** — Do not commit vulnerable code
2. **Do not expose** — Don't log secrets, even in error messages
3. **Fix before proceeding** — Security issues block all other work
4. **If secrets exposed** — Rotate immediately, then fix code
5. **Escalate if needed** — Architectural security issues go to User

## Automated Checks

Hooks automatically scan for:
- Hardcoded API keys (sk-*, api_key=)
- Hardcoded passwords
- Console.log statements (may leak data)

These are warnings. Fix before committing.
