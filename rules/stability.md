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
| **Playwright WebKit vs Capacitor WKWebView** | Same engine, different behavior | Test on physical device — see Section 8 |
| **DOMParser.textContent vs innerText** | `textContent` strips block elements (`<p>`, `<br>`, `<div>`) without adding `\n` — creates one giant string | Insert `\n` at block boundaries before extracting text — see Sprint 012 post-mortem |

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

## 7. External Service Failures (Linear, APIs)

### Problem

External services can:
- Timeout (slow network, service overload)
- Return errors (rate limits, authentication issues)
- Stall indefinitely (hanging connections)
- Block critical workflow when unavailable

### Rules

**For all external service calls:**

1. **Always set timeouts** - No indefinite waits (default: 30 seconds)
2. **Always have fallbacks** - System continues without external service
3. **Track failures** - Log what needs manual reconciliation
4. **Non-blocking by default** - Don't halt workflow for non-critical syncs

### Pattern: Timeout Wrapper

**Bash approach (preferred for MCP operations):**

```bash
# Wrapper for Linear MCP calls
function call_linear_with_timeout() {
  local operation=$1
  local timeout_seconds=${2:-30}

  # Run operation with timeout
  timeout ${timeout_seconds}s ${operation}

  # Check exit code
  local exit_code=$?
  if [ $exit_code -eq 124 ]; then
    echo "ERROR: Operation timed out after ${timeout_seconds}s"
    return 124
  elif [ $exit_code -ne 0 ]; then
    echo "ERROR: Operation failed with code $exit_code"
    return $exit_code
  fi

  return 0
}

# Usage
if call_linear_with_timeout "mcp__linear__get_issue QUO-42" 30; then
  echo "Success"
else
  echo "Failed or timed out - using fallback"
  # Use roadmap.md fallback
fi
```

**TypeScript/JavaScript approach:**

```typescript
async function callExternalService<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeout = 30000
): Promise<{ success: boolean; data?: T; reason?: string; error?: Error }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const result = await operation(controller.signal)
    clearTimeout(timeoutId)
    return { success: true, data: result }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.warn(`Operation timed out after ${timeout}ms`)
      return { success: false, reason: 'timeout' }
    }
    console.error('Operation failed:', error.message)
    return { success: false, reason: 'error', error }
  }
}

// Usage
const result = await callExternalService(
  async (signal) => {
    return await fetch('https://api.linear.app/graphql', { signal })
  },
  30000
)

if (!result.success) {
  // Use fallback (roadmap.md)
  console.log('Using fallback due to:', result.reason)
}
```

### Pattern: Graceful Failure with Tracking

**1. Try operation with timeout**
**2. If timeout/error: Use fallback and track**
**3. Report at sprint end for manual reconciliation**

```javascript
// Example: Linear status update
async function updateLinearStatus(issueId, status) {
  const result = await callExternalService(
    async (signal) => {
      return await linearClient.updateIssue(issueId, { status }, { signal })
    },
    30000  // 30 second timeout
  )

  if (!result.success) {
    // Log failure
    console.warn(`Linear sync failed for ${issueId}:`, result.reason)

    // Track in sprint file
    await appendToSprintFile(`
## Pending Manual Sync
- ${issueId}: Status update to "${status}" failed (${result.reason})
`)

    // Update roadmap.md (source of truth)
    await updateRoadmap(issueId, status)

    // Continue workflow - don't block
    return { synced: false, fallbackUsed: 'roadmap.md' }
  }

  return { synced: true }
}
```

### Pattern: Retry Logic (Soft Retry)

For transient errors, retry once with backoff:

```javascript
async function softRetry(operation, timeoutMs = 30000) {
  // Attempt 1
  let result = await callExternalService(operation, timeoutMs)

  if (result.success) {
    return result
  }

  // Wait 2 seconds before retry
  await sleep(2000)

  // Attempt 2
  result = await callExternalService(operation, timeoutMs)

  if (!result.success) {
    console.warn('Operation failed after 2 attempts:', result.reason)
  }

  return result
}
```

**When to use soft retry:**
- Network errors (transient)
- Rate limit errors (with backoff)
- Timeout errors (might succeed second time)

**When NOT to retry:**
- Authentication errors (won't fix itself)
- Permission errors (structural issue)
- After 2 failed attempts (give up, use fallback)

### Integration Tests Required

Test timeout behavior:

```typescript
test('Linear sync continues workflow on timeout', async () => {
  // Mock Linear API to stall
  mockLinearApi.delay(60000)  // 60 second delay

  const sprint = await startSprint('QUO-42')

  // Should not hang - should timeout and continue
  expect(sprint.linearStatus).toBe('unavailable')
  expect(sprint.usingFallback).toBe(true)
  expect(sprint.canContinue).toBe(true)
})

test('Linear sync tracks failed operations for reconciliation', async () => {
  // Mock Linear API to fail
  mockLinearApi.fail('timeout')

  await updateIssueStatus('QUO-42', 'In Review')

  // Should track failure in sprint file
  const sprintFile = await readSprintFile()
  expect(sprintFile).toContain('Pending Manual Sync')
  expect(sprintFile).toContain('QUO-42: Status update to "In Review" failed')

  // Should still update roadmap.md (fallback)
  const roadmap = await readRoadmap()
  expect(roadmap).toContain('QUO-42')
  expect(roadmap).toContain('In Review')
})
```

### Fallback Behavior

When external service unavailable:

**Immediate actions:**
1. Log warning (don't error)
2. Use local fallback (roadmap.md for Linear)
3. Track failed operation in sprint file
4. Continue workflow normally

**At sprint end:**
1. Present all failed operations
2. Offer manual reconciliation
3. User decides: retry now, skip, or manual fix

**Example sprint file tracking:**

```markdown
## Notes

**Linear Sync Status:**
- Sprint start: ✅ Success (3/3 issues synced)
- Status updates: ⚠️ 2 failures (QUO-38, QUO-39 timeout)
- Sprint end: Pending reconciliation

**Pending Manual Sync:**
- QUO-38: Push "In Review" status (timeout)
- QUO-39: Push "Done" status (timeout)

**Recommendation:**
Run `/sync-roadmap` to reconcile Linear with roadmap.md
```

### When to Escalate

**Escalate to User when:**
- Authentication fails (needs config fix)
- All operations timing out (service may be down)
- Rate limit exceeded repeatedly (need API key upgrade)

**Do NOT escalate for:**
- Single timeout (use fallback)
- Transient network errors (retry once)
- Sprint end reconciliation (present options, don't block)

---

## 8. Capacitor WKWebView Layout (iOS)

### Problem

Capacitor's WKWebView has unique layout behaviors that differ from desktop Safari and Playwright WebKit. CSS that works in browser testing can break on physical devices, and automated diagnostics give false positives.

**Post-mortem:** `docs/post-mortem/2026-02-18-wkwebview-layout-testing-RAB-58.md` (12 iterations, Sprint 009)

### Known Constraints

| Constraint | Impact | Workaround |
|-----------|--------|------------|
| `position: fixed` is broken | Bottom bars don't pin | Use flex column layout (`h-screen flex flex-col`) |
| Tab bar content must be exactly `h-[49px]` | `h-[56px]` causes bar to scroll with content | Use padding within 49px for optical adjustments |
| `env(safe-area-inset-bottom)` returns ~34px on notched iPhones | Safe area shares background with content → icons appear off-center | Use `pt-5` (20px) top padding for optical centering |
| `bg-card`/`bg-background` split creates grey line | Card white (#fff) vs background near-white (#fafafa) visible seam | Keep single background on parent `<nav>` element |
| Playwright WebKit ≠ WKWebView | Safe areas, viewport-fit:cover, flex behavior all differ | Don't trust Playwright for native shell components |

### Nav Scrolling: The #1 WKWebView Layout Bug

If a bottom bar (TabBar, MiniPlayer) starts scrolling with page content, check:

1. **Is it using `position: fixed`?** → Broken in WKWebView. Switch to flex column layout.
2. **Is the content row height > 49px?** → Revert to `h-[49px]`. Use padding instead of height for optical adjustments.
3. **Is `flex-shrink-0` on the bottom bar?** → Required to prevent flex from collapsing it.
4. **Is `min-h-0` on the scroll container?** → Required to override flex `min-height: auto`.

**Critical:** Both `position: fixed` breakage and height-threshold scrolling are WKWebView-only. They work fine in browser and Playwright — you will only catch them on a physical device.

### Rules

**For native shell components (TabBar, MiniPlayer, NowPlayingView):**

1. **Never use `position: fixed`** — use flex column with `flex-shrink-0`
2. **Never exceed `h-[49px]`** on tab bar content row — 56px causes scrolling in WKWebView
3. **Test on physical device EARLY** — before committing layout changes
4. **Budget for manual iteration** — each cycle is ~5 min (edit → build → cap sync → Xcode → device)
5. **Don't use Playwright diagnostics** for layout issues in native shell — they will mislead you
6. **When 3+ CSS attempts fail** — stop and measure on device before trying more

### Working Layout Pattern

```tsx
// AppLayout.tsx — the only proven layout for Capacitor WKWebView
<div className="h-screen flex flex-col bg-background">
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
    {/* Scrollable content */}
  </div>
  <MiniPlayer />  {/* flex-shrink-0 */}
  <TabBar />      {/* flex-shrink-0, 49px content + safe-bottom spacer */}
</div>
```

### What CAN Be Automated vs What CANNOT

| Component | Playwright WebKit | Physical Device |
|-----------|:-:|:-:|
| Web content (episode cards, search, forms) | Yes | Optional |
| Logic (formatRelativeTime, data transforms) | Yes (unit test) | N/A |
| Native shell layout (TabBar, MiniPlayer) | No — gives false positives | Required |
| Safe area behavior | No — env() returns 0px | Required |
| Scroll behavior in flex layout | Unreliable | Required |

---

## 9. Backend Data Verification

### Problem

Frontend features are built against assumptions about backend data that turn out to be wrong. The Explorer reads backend code but doesn't verify actual API responses. This causes iteration waste when the frontend ships but the data is truncated, missing fields, or in the wrong format.

**Post-mortem:** `docs/post-mortem/2026-02-19-sprint-011-iteration-and-deploy.md` (Sprint 011 — descriptions truncated at 500 chars)

### Rules

**During exploration (Explorer agent):**

1. **Curl the staging API** for every endpoint the feature depends on
2. **Check actual response data** — field lengths, formats, presence of expected fields
3. **Document data quality issues** in the tech spec as blockers
4. **Don't assume code = behavior** — backend may transform, truncate, or strip data

**During implementation (Developer agent):**

1. **When changing backend data format**, check ALL frontend consumers of that field
2. **HTML vs plain text** — if backend starts returning HTML, every renderer needs review
3. **Test with real data** from staging, not just hardcoded mock data

### Pattern: Explorer Data Verification

```bash
# During exploration, curl the actual staging API
curl -s "https://staging-api.example.com/episodes/123" | jq '.description | length'
# Returns: 500  <-- truncated! Flag this in tech spec

curl -s "https://staging-api.example.com/episodes/123" | jq '.description[:100]'
# Returns: plain text, no HTML tags  <-- note: backend strips HTML
```

**Add to tech spec:**
```markdown
## Data Quality Check
- `description` field: ⚠️ Truncated at 500 chars, HTML stripped — backend fix required
- `thumbnail` field: ✅ Present, valid URL
- `chapters` field: ❌ Missing — backend doesn't parse RSS chapters yet
```

### Checklist

- [ ] Have we curled the staging API for the endpoints this feature uses?
- [ ] Do response field lengths match what the frontend expects?
- [ ] Is the data format correct (HTML vs plain text, dates, nested objects)?
- [ ] Are all expected fields present (not null/undefined)?
- [ ] When changing backend data format, have we checked all frontend consumers?

---

## 10. Data Source Mapping (Shared Data Fields)

### Problem

When a data field (artwork, description, title) appears on multiple screens and comes from multiple sources, fixing it one screen at a time creates a "waterfall" of iteration batches — each batch discovers one more missing fallback.

**Post-mortem:** `docs/post-mortem/2026-02-20-artwork-waterfall-rtl-sprint-012.md` (6 batches for artwork alone)

### Rules

**During exploration, when a feature involves shared data:**

1. **List every data source** for the field (tables, APIs, caches, RSS)
2. **List every consumer** (screens, components) that displays the field
3. **Build a fallback chain** — ordered priority of sources per consumer
4. **Document in tech spec** as a data-source matrix

### Pattern: Data Source Matrix

```markdown
## Data Source Matrix: [field name]

| Consumer | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|----------|---------|------------|------------|------------|
| Screen A | table_a.field | table_b.field | API cache | default |
| Screen B | table_a.field | table_b.field | — | — |

Implementation: Single utility function with ordered COALESCE/fallback chain.
```

**The developer implements the COMPLETE chain in one pass, not incrementally.**

### When to Build This Matrix

- Data displayed on 3+ screens
- Data comes from 2+ tables/APIs
- Data has known gaps (some records have it, some don't)
- Previous sprints had "still missing" iteration patterns

### Checklist

- [ ] Have we identified ALL sources for this data field?
- [ ] Have we identified ALL screens that display it?
- [ ] Is there a single utility/query that implements the complete fallback chain?
- [ ] Are all consumers using that utility (not direct field access)?

---

## Quick Reference

| Issue Type | First Check | Prevention |
|------------|-------------|------------|
| **API Misuse** | Read official docs | Integration tests with real API |
| **Documentation Drift** | Search for all references | Startup config validation |
| **Race Conditions** | Test concurrently | Use transactions |
| **Configuration** | Validate at startup | No silent fallbacks |
| **Over-Engineering** | Count conditions/nesting | Simplify when > 3 levels |
| **External Service Failures** | Check timeout settings | 30s timeout + fallback + tracking |
| **WKWebView Layout** | Test on physical device | Flex column layout, 49px tab bar, no position:fixed |
| **Backend Data Mismatch** | Curl staging API during exploration | Verify actual response data, not just code |
| **Data Source Waterfall** | Build source × consumer matrix during exploration | Single utility with complete fallback chain |
