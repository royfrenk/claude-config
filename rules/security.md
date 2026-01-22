# Security Rules

All agents must follow these security requirements.

## Mandatory Checks (Before Any Commit)

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries only)
- [ ] XSS prevention (sanitized/escaped output)
- [ ] Authentication required on new endpoints
- [ ] Authorization checked (user can only access their data)
- [ ] Error messages don't leak internal details
- [ ] External URLs validated (SSRF prevention)
- [ ] Rate limiting considered for public endpoints
- [ ] CSRF protection on state-changing operations

## Secret Management

```typescript
// NEVER - Hardcoded secrets
const apiKey = "sk-proj-xxxxx"
const password = "admin123"

// ALWAYS - Environment variables
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## Input Validation

Always validate external input at system boundaries:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  limit: z.number().int().min(1).max(100),
  url: z.string().url()
})

const validated = schema.parse(userInput)
```

## Error Handling

Don't leak internal details:

```typescript
// WRONG - Exposes internals
catch (error) {
  return { error: error.stack }
}

// CORRECT - User-friendly message
catch (error) {
  console.error('Internal error:', error)
  return { error: 'Something went wrong. Please try again.' }
}
```

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
