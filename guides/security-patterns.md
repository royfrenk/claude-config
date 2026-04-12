# Security Patterns Guide

Detailed security code examples. Reference this for implementation guidance.

## Configuration Validation

### Required Environment Variables

**All required env vars must be validated at server startup.**

```typescript
// WRONG - Silent fallback
const apiKey = process.env.API_KEY || 'default-key'

// CORRECT - Fail fast at startup
function validateConfig() {
  const required = ['API_KEY', 'DATABASE_URL', 'SESSION_SECRET']
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
}
validateConfig()
app.listen(port)
```

### Configuration Format Validation

```typescript
function validateConfig() {
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
  if (!callbackUrl || !callbackUrl.startsWith('http')) {
    throw new Error('GOOGLE_CALLBACK_URL must be a valid HTTP(S) URL')
  }

  const port = parseInt(process.env.PORT, 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)')
  }
}
```

### Secret Management

```typescript
// NEVER - Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS - Environment variables with validation
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## Input Validation

### Schema Validation at Boundaries

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  limit: z.number().int().min(1).max(100),
  url: z.string().url()
})

const validated = schema.parse(userInput)
```

### OAuth Profile Validation

```typescript
function validateOAuthProfile(profile) {
  if (!profile) throw new Error('OAuth profile is null')

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
    const email = validateOAuthProfile(profile)
    // ... rest of logic
  } catch (error) {
    return done(error)
  }
}))
```

### File Type Validation

```typescript
// WRONG - Trust extension
if (file.name.endsWith('.pdf')) return renderPDF(file)

// CORRECT - Validate MIME type and magic bytes
function handleUpload(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} not allowed`)
  }

  const isValidFile = validateFileSignature(file.buffer, file.mimetype)
  if (!isValidFile) throw new Error('File content does not match declared type')

  return file.mimetype === 'application/pdf' ? renderPDF(file) : renderImage(file)
}
```

## Error Handling

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

## See Also

- Security rules: `~/.claude/rules/security.md`
- Security review checklist: `~/.claude/guides/security-review-checklist.md`
