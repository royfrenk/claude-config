# Stability Rules

Prevent recurring breakages by following these stability patterns.

## Overview

This guide addresses common stability issues identified across multiple projects:
- API misuse (wrong methods, misunderstood behavior)
- Documentation drift (code vs docs mismatch)
- Database race conditions
- Configuration validation failures
- Over-engineering that causes brittleness

**Also see:**
- `coding-style.md` for error handling patterns
- `security.md` for input/config validation
- `testing.md` for integration test requirements

---

## 1. API Misuse Prevention

### Problem

Using framework/library APIs incorrectly due to:
- Misunderstanding async behavior
- Confusing similar libraries (e.g., better-sqlite3 vs SQL.js)
- Incorrect method signatures
- Undocumented breaking changes

### Rules

**Before using unfamiliar APIs:**

1. **Read the official documentation** - Don't rely on memory or similar libraries
2. **Check method signatures** - Verify exact parameters and return types
3. **Test with real data** - Don't just check that code runs, verify behavior
4. **Add integration tests** - Unit tests with mocks miss API misuse

**Common Pitfalls:**

| Library Pair | Easy to Confuse | How to Verify |
|--------------|-----------------|---------------|
| **SQL.js vs better-sqlite3** | `db.prepare()` vs `db.run()` | Check SQL.js docs - no `prepare()` method |
| **Prisma vs Sequelize** | `findUnique()` vs `findOne()` | Check official API reference |
| **passport vs passport-google-oauth20** | Config structure differs | Test with real OAuth flow |
| **Tesseract.js v2 vs v4** | API completely changed | Check migration guide |

### Pattern: API Validation Layer

For critical operations, add a validation layer:

```javascript
// BEFORE - Direct API usage (risky)
function insertUser(db, userData) {
  const result = db.prepare('INSERT INTO users...').run(userData)  // WRONG API
  return result.lastInsertRowid
}

// AFTER - Validated API usage
function insertUser(db, userData) {
  // Validate that the API method exists
  if (typeof db.run !== 'function') {
    throw new Error('Database API mismatch: db.run() not available')
  }

  const result = db.run('INSERT INTO users...', userData)

  // Validate the return value structure
  if (!result || typeof result.lastInsertRowid === 'undefined') {
    throw new Error('Database API returned unexpected structure')
  }

  return result.lastInsertRowid
}
```

### Integration Tests Required

Don't mock the API you're validating:

```javascript
// WRONG - Mocked test misses API misuse
test('insertUser works', () => {
  const mockDb = { prepare: jest.fn().mockReturnValue({ run: jest.fn() }) }
  insertUser(mockDb, { name: 'Alice' })  // Passes even with wrong API
})

// CORRECT - Real API test catches misuse
test('insertUser works', () => {
  const realDb = new Database(':memory:')  // Real SQL.js instance
  const userId = insertUser(realDb, { name: 'Alice' })
  expect(userId).toBeGreaterThan(0)
})
```

---

## 2. Documentation Drift Prevention

### Problem

Documentation becomes outdated when:
- Code changes but docs don't
- Copy-paste errors in documentation
- Environment-specific details hardcoded incorrectly

### Rules

**When modifying endpoints, routes, or environment variables:**

1. **Update ALL references** - Search entire codebase for old values
2. **Verify in all environments** - Dev, staging, production
3. **Check example code** - README examples, setup guides
4. **Update configuration templates** - `.env.example`, deployment configs

**Checklist:**

```bash
# Before committing route changes
grep -r "old-route-path" docs/
grep -r "old-route-path" README.md
grep -r "old-route-path" .env.example
grep -r "old-route-path" deployment/
```

### Pattern: Configuration Validation

Add startup validation to catch mismatches:

```javascript
// In server startup
function validateConfiguration() {
  const errors = []

  // Validate OAuth callback URL
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
  const expectedPath = '/expenses/auth/google/callback'

  if (!callbackUrl || !callbackUrl.includes(expectedPath)) {
    errors.push(`GOOGLE_CALLBACK_URL must end with ${expectedPath}. Got: ${callbackUrl}`)
  }

  // Validate docs match code
  const docsCallbackUrl = readDocsCallbackUrl()  // Parse from DEPLOYMENT.md
  if (docsCallbackUrl !== callbackUrl) {
    errors.push(`DEPLOYMENT.md has ${docsCallbackUrl} but .env has ${callbackUrl}`)
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:')
    errors.forEach(err => console.error(`  - ${err}`))
    process.exit(1)
  }
}
```

---

## 3. Database Race Condition Prevention

### Problem

Race conditions occur when:
- Multiple operations access the same data concurrently
- Timing-dependent logic (e.g., "get last inserted ID")
- Async operations complete out of order

### Rules

**Never rely on timing:**

1. **Avoid `lastInsertRowid` in concurrent scenarios** - Use `RETURNING` clause or unique constraints
2. **Use transactions** - Atomic operations prevent race conditions
3. **Add unique constraints** - Database enforces correctness
4. **Test with concurrent requests** - Single request tests miss race conditions

### Pattern: Transaction-Based Inserts

```javascript
// WRONG - Race condition
async function createUser(email) {
  await db.run('INSERT INTO users (email) VALUES (?)', email)
  await saveDatabase()  // Async operation
  const result = db.exec('SELECT last_insert_rowid()')  // WRONG - may get wrong ID
  return result[0].values[0][0]
}

// CORRECT - Transaction with RETURNING
async function createUser(email) {
  return db.transaction(() => {
    const result = db.run(
      'INSERT INTO users (email) VALUES (?) RETURNING id',
      email
    )
    return result.lastInsertRowid  // Safe within transaction
  })
}
```

### Integration Tests Required

Test concurrent operations:

```javascript
test('concurrent user creation', async () => {
  const emails = ['alice@example.com', 'bob@example.com', 'charlie@example.com']

  // Create users concurrently
  const userIds = await Promise.all(
    emails.map(email => createUser(email))
  )

  // Verify all got unique IDs
  expect(new Set(userIds).size).toBe(3)

  // Verify all users exist
  const users = await db.all('SELECT * FROM users WHERE id IN (?, ?, ?)', userIds)
  expect(users).toHaveLength(3)
})
```

---

## 4. Configuration Validation

### Problem

Missing or invalid environment variables cause:
- Silent failures (fallback to wrong defaults)
- Runtime errors in production
- Security vulnerabilities

### Rules

**For all environment variables:**

1. **No silent fallbacks** - Fail fast if required vars missing
2. **Validate format** - URLs must be URLs, numbers must be numbers
3. **Validate correctness** - Callback URLs must match expected paths
4. **Document requirements** - What breaks if missing

**See `security.md` for full configuration validation requirements.**

---

## 5. Over-Engineering Prevention

### Problem

Over-engineered solutions cause:
- Unexpected edge case failures
- Complexity that obscures bugs
- Harder to debug and maintain

### Rules

**Signs of over-engineering:**

- Authorization logic with 3+ conditions
- Nested if/else blocks > 3 levels deep
- Custom implementations of standard library functions
- "Clever" code that requires comments to explain

**Fix: Simplify**

```javascript
// OVER-ENGINEERED - Too many conditions
if (userCount === 0) {
  isAdmin = true
} else if (email === process.env.ADMIN_EMAIL) {
  isAdmin = true
} else if (existingUser && existingUser.is_admin) {
  isAdmin = true
} else {
  return done(null, false, { message: 'User not authorized' })
}

// SIMPLIFIED - Clear logic
const isFirstUser = userCount === 0
const isConfiguredAdmin = email === process.env.ADMIN_EMAIL
const isExistingAdmin = existingUser?.is_admin === true

if (isFirstUser || isConfiguredAdmin || isExistingAdmin) {
  isAdmin = true
} else {
  isAdmin = false
}
```

**When to simplify:**

- Feature doesn't work as expected
- Code has been modified 3+ times to fix edge cases
- New contributor can't understand the logic
- Bug reports mention "unexpected behavior"

---

## 6. Diagnostic Checklist

When investigating recurring breakages, check:

### API Misuse

- [ ] Are we using the correct API methods for this library version?
- [ ] Do we have integration tests with the real API (not mocks)?
- [ ] Have we verified return value structures match expectations?
- [ ] Did we check the official documentation (not Stack Overflow)?

### Documentation Drift

- [ ] Do environment variables match across code, docs, and deployment configs?
- [ ] Do route paths match between frontend, backend, and docs?
- [ ] Have we searched for all references to changed values?
- [ ] Does the example code in README still work?

### Race Conditions

- [ ] Are we relying on timing (lastInsertRowid, sequential IDs)?
- [ ] Have we tested with concurrent requests?
- [ ] Are we using transactions for atomic operations?
- [ ] Do we have unique constraints where needed?

### Configuration Issues

- [ ] Do we validate all required environment variables at startup?
- [ ] Do we fail fast if configuration is invalid?
- [ ] Have we tested with missing/invalid env vars?
- [ ] Is the configuration documented with what breaks if missing?

### Over-Engineering

- [ ] Can this logic be simplified?
- [ ] Are we handling too many edge cases?
- [ ] Would a simpler approach be more maintainable?
- [ ] Can we remove conditions without breaking functionality?

---

## Quick Reference

| Issue Type | First Check | Prevention |
|------------|-------------|------------|
| **API Misuse** | Read official docs | Integration tests with real API |
| **Documentation Drift** | Search for all references | Startup config validation |
| **Race Conditions** | Test concurrently | Use transactions |
| **Configuration** | Validate at startup | No silent fallbacks |
| **Over-Engineering** | Count conditions/nesting | Simplify when > 3 levels |
