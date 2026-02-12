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

## Configuration Validation

### Required Environment Variables

**All required environment variables must be validated at server startup.**

Never silently fall back to defaults for critical configuration:

```typescript
// WRONG - Silent fallback
const apiKey = process.env.API_KEY || 'default-key'

// WRONG - Optional without fail-fast
const apiKey = process.env.API_KEY
// Code continues, crashes later when API key is needed

// CORRECT - Fail fast at startup
function validateConfig() {
  const required = ['API_KEY', 'DATABASE_URL', 'SESSION_SECRET']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
}

// Call before starting server
validateConfig()
app.listen(port)
```

### Configuration Format Validation

Validate that configuration values are correctly formatted:

```typescript
function validateConfig() {
  // URLs must be valid URLs
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
  if (!callbackUrl || !callbackUrl.startsWith('http')) {
    throw new Error('GOOGLE_CALLBACK_URL must be a valid HTTP(S) URL')
  }

  // Ports must be numbers
  const port = parseInt(process.env.PORT, 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)')
  }

  // Callback URLs must match expected paths
  if (!callbackUrl.includes('/auth/google/callback')) {
    throw new Error('GOOGLE_CALLBACK_URL must include /auth/google/callback path')
  }
}
```

### Secret Management

Never hardcode secrets:

```typescript
// NEVER - Hardcoded secrets
const apiKey = "sk-proj-xxxxx"
const password = "admin123"

// ALWAYS - Environment variables with validation
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## Input Validation

### Validate at System Boundaries

Always validate external input where it enters your system:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  limit: z.number().int().min(1).max(100),
  url: z.string().url()
})

const validated = schema.parse(userInput)
```

### Non-Security Validation

Input validation isn't just for security. Validate at boundaries to prevent:

- **Type errors**: Expecting string, got object
- **Missing required fields**: API returns null instead of expected value
- **Format errors**: Date string not parseable
- **Range errors**: Number outside acceptable bounds

```typescript
// Validate OAuth profile from Google
function validateOAuthProfile(profile) {
  if (!profile) {
    throw new Error('OAuth profile is null')
  }

  if (!profile.emails || !Array.isArray(profile.emails) || profile.emails.length === 0) {
    throw new Error('OAuth profile missing email')
  }

  const email = profile.emails[0].value
  if (!email || typeof email !== 'string') {
    throw new Error('OAuth email is invalid')
  }

  return email
}

// Use in OAuth callback
passport.use(new GoogleStrategy({
  // ...config
}, (accessToken, refreshToken, profile, done) => {
  try {
    const email = validateOAuthProfile(profile)  // Validate at boundary
    // ... rest of logic
  } catch (error) {
    return done(error)  // Fail fast on invalid input
  }
}))
```

### File Type Validation

When accepting file uploads, validate file types:

```typescript
// WRONG - Assume file type from extension
function handleUpload(file) {
  if (file.name.endsWith('.pdf')) {
    return renderPDF(file)
  } else {
    return renderImage(file)
  }
}

// CORRECT - Validate MIME type and magic bytes
function handleUpload(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} not allowed`)
  }

  // Additional validation: Check magic bytes match MIME type
  const isValidFile = validateFileSignature(file.buffer, file.mimetype)
  if (!isValidFile) {
    throw new Error('File content does not match declared type')
  }

  if (file.mimetype === 'application/pdf') {
    return renderPDF(file)
  } else {
    return renderImage(file)
  }
}
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
