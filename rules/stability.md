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
| **aiosqlite vs asyncpg** | aiosqlite accepts ISO date strings; asyncpg requires `datetime` objects for TIMESTAMPTZ columns | After migration: curl staging API, verify response data types — see Sprint 015 post-mortem |
| **UIButton.sendActions vs UIMenu** | `sendActions(for: .menuActionTriggered)` does NOT programmatically present a UIMenu — requires real touch input through responder chain | Use `UIAlertController(.actionSheet)` for tap-triggered menus; `UIContextMenuInteraction` for long-press only — see Section 11 |
| **Sonner `offset` prop in WKWebView** | `calc(env(safe-area-inset-top) + Npx)` silently fails as inline `--offset` custom property | Compute numeric px via `getComputedStyle()`, or disable on native — see Section 14 |
| **`while True` polling loops** | No timeout = blocks worker thread indefinitely when external service stalls | Always add `max_poll_seconds` timeout — see Section 7 |
| **Prompt updates vs cached LLM output** | Prompt improved, but stale cached JSON is restored and bypasses new behavior | Version cached payloads (`prompt_version`) and reject stale contracts on restore — see Section 15 |

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

### Anti-Pattern: Polling Loops Without Timeout

**Every `while True` or `while not done` loop that polls an external service MUST have a `max_seconds` timeout.** A stuck external service (transcript processing, file conversion, webhook callback) will block the worker thread indefinitely, making the entire backend unresponsive.

```python
# WRONG - No timeout, blocks forever if service gets stuck
while True:
    status = await check_status(job_id)
    if status == "completed":
        break
    await asyncio.sleep(3)

# CORRECT - Timeout guard
max_poll_seconds = max(estimated_seconds * 3, 1800)  # 3x estimate or 30 min minimum
start_time = time.time()
while True:
    status = await check_status(job_id)
    if status == "completed":
        break
    elapsed = time.time() - start_time
    if elapsed > max_poll_seconds:
        raise RuntimeError(f"Job {job_id} timed out after {int(elapsed)}s")
    await asyncio.sleep(3)
```

**Post-mortem:** `docs/post-mortem/2026-02-27-sprint-016-toast-saga-iteration-count.md` (AssemblyAI polling blocked Railway backend 10+ min)

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
| `self.view` IS the WKWebView | Frame constraints on `self.view` are self-referential | Use `additionalSafeAreaInsets` to push web content, never constrain `self.view.frame` |
| Third-party CSS `offset`/`position` props use inline styles | `calc()` + `env()` don't resolve in WKWebView inline `--custom-property` values | Compute numeric px via JS (`getComputedStyle`), or disable feature on native — see Section 14 |

**Critical architecture fact:** In Capacitor's `MyViewController`, `self.view` is the WKWebView itself — not a container holding the WKWebView. Any Auto Layout constraint that references `self.view` as both source and target is self-referential and will silently fail or cause unpredictable layout. Use `additionalSafeAreaInsets` to reserve space for native shell components (TabBar, MiniPlayer) overlaid on top of the webview.

**Post-mortem:** `docs/post-mortem/2026-02-25-sprint-014-native-shell.md` (8 layout iterations, Sprint 014)

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
3. **Never constrain `self.view.frame`** — it IS the WKWebView. Use `additionalSafeAreaInsets` instead.
4. **Test on physical device EARLY** — before committing layout changes
5. **Budget for manual iteration** — each cycle is ~5 min (edit → build → cap sync → Xcode → device)
6. **Don't use Playwright diagnostics** for layout issues in native shell — they will mislead you
7. **When 3+ CSS attempts fail** — stop and measure on device before trying more
8. **One change at a time, verify on device** — never stack multiple unverified CSS/layout changes. Make ONE change → `cap sync` → Xcode rebuild → verify on device → then next change. Stacking unverified changes wastes batches (Sprint 014: 4 batches wasted on stacked CSS fixes).

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

## 11. External Model Output Management

### Problem

External model output (Codex, Gemini) can produce large code changes (10+ files, hundreds of lines) that sit uncommitted in the working tree. Subsequent iteration batches stack on top, making it impossible to bisect bugs or recover if the working tree is reset.

**Post-mortem:** `docs/post-mortem/2026-02-25-sprint-014-native-shell.md` (748 lines across 12 files uncommitted for 7 batches)

### Rules

1. **Commit external model output immediately** — If output touches 5+ files or 200+ lines, commit it as a discrete commit before continuing iteration. Use message format: `feat: [description] (Codex/Gemini-assisted)`
2. **Treat external output as a deliverable** — not work-in-progress. It's a discrete unit of change that should be reviewable independently.
3. **Don't iterate on top of uncommitted external output** — commit first, then iterate. This enables `git bisect` and safe rollback.

---

## 12. Sprint Issue Coverage Check

### Problem

In frontend-heavy sprints, backend issues get neglected. The agent focuses on the active iteration loop and never circles back to independent work items in the same sprint.

**Post-mortem:** `docs/post-mortem/2026-02-25-sprint-014-native-shell.md` (RAB-78 received 0 attention across 21 batches)

### Rules

1. **At every 5th iteration batch**, check ALL sprint issues. For each issue with status != Done: are there unblocked sub-items that haven't been started?
2. **If yes, flag to user:** "RAB-XX has unblocked work that hasn't been started. Should I address it now or continue with current iteration?"
3. **Never close a sprint** without at least investigating all in-scope issues, even if the fix is "won't fix" or "deferred."

---

## 12. Native iOS Menu Presentation

### Problem

iOS provides multiple menu presentation APIs with different trigger requirements. Using the wrong one causes silent failures — the menu never appears but no error is thrown.

**Post-mortem:** `docs/post-mortem/2026-02-26-sprint-015-iteration-churn.md` (5 implementations, Sprint 015)

### Key Constraints

| API | Trigger | Programmatic? | Use Case |
|-----|---------|:---:|-----------|
| `UIContextMenuInteraction` | Long-press gesture | No — requires real touch | Preview + menu on long-press |
| `UIButton.menu` + `showsMenuAsPrimaryAction` | Tap gesture | No — `sendActions(for:)` does NOT work | Button with built-in menu |
| `UIAlertController(.actionSheet)` | Any (programmatic OK) | Yes | Tap-triggered action list with SF Symbol icons |
| `UIEditMenuInteraction` (iOS 16+) | Programmatic | Yes | Cut/copy/paste style menus |

### Rules

1. **Never use `sendActions(for: .menuActionTriggered)`** to programmatically show a UIMenu — it silently fails
2. **For tap-triggered menus from web (Capacitor):** Use `UIAlertController(.actionSheet)` — it's the only reliable approach that works programmatically and supports SF Symbol icons via KVC
3. **For long-press menus:** Use `UIContextMenuInteraction` with a delegate
4. **Stop after 2 failed approaches** — research the platform constraints before trying a third implementation

### Pattern: Capacitor Context Menu Plugin

```swift
// Working approach: UIAlertController with SF Symbol icons
let alert = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)

let action = UIAlertAction(title: "Share", style: .default) { _ in
    call.resolve(["selectedActionId": "share"])
}
// Attach SF Symbol via KVC (stable private API)
if let image = UIImage(systemName: "square.and.arrow.up")?.withRenderingMode(.alwaysTemplate) {
    action.setValue(image, forKey: "image")
}
alert.addAction(action)

viewController.present(alert, animated: true)
```

---

## 13. Database Driver Migration Verification

### Problem

Migrating between database drivers (e.g., aiosqlite → asyncpg) can pass syntax checks (`py_compile`, build) but fail at runtime due to type strictness differences. aiosqlite accepts ISO date strings for datetime columns; asyncpg requires actual Python `datetime` objects.

**Post-mortem:** `docs/post-mortem/2026-02-26-sprint-015-iteration-churn.md` (Sprint 015)

### Rules

1. **After any database driver migration, curl the staging API** before marking the task complete
2. **Test write operations** (INSERT, UPDATE), not just reads — type mismatches often surface on writes
3. **Check datetime, JSON, and array columns specifically** — these are the most common type strictness differences
4. **`py_compile` is necessary but NOT sufficient** — it catches syntax errors, not runtime type mismatches

### Checklist

After deploying a database driver migration:

- [ ] `curl` the health endpoint — does the server start?
- [ ] `curl` a read endpoint — do queries return data?
- [ ] `curl` a write endpoint (or trigger a write via the app) — do inserts/updates succeed?
- [ ] Check datetime fields specifically — are they actual `datetime` objects or strings?
- [ ] Check the Railway/server logs for type errors

---

## 14. Third-Party Component CSS in WKWebView

### Problem

Third-party UI components (Sonner, Radix, etc.) often accept CSS string values for positioning (`offset`, `sideOffset`, `align`). These strings are rendered as **inline CSS custom properties** (e.g., `--offset: calc(env(...) + 8px)`). In WKWebView, `calc()` expressions containing `env()` don't resolve when set as inline style values — the property is silently ignored or treated as `0`.

**Post-mortem:** `docs/post-mortem/2026-02-27-sprint-016-toast-saga-iteration-count.md` (8 batches, Sprint 016)

### Known Failures

| Component | Prop | What Breaks | Workaround |
|-----------|------|-------------|------------|
| Sonner `<Toaster>` | `offset` | `calc(env(safe-area-inset-top) + Npx)` renders as inline `--offset` → WKWebView ignores it | Compute numeric px via `getComputedStyle()`, or disable on native |
| Any component using inline `calc()` + `env()` | Various | Same root cause — inline styles can't resolve `env()` in WKWebView | Always use JS-computed numeric values |

### Rules

1. **Never pass `calc()` + `env()` as string props** to third-party components on native — they will silently fail in WKWebView
2. **When a CSS positioning approach fails on device**, check: does the component render the value as an inline style or a stylesheet rule? Inline styles with `env()` are broken.
3. **Test third-party component positioning on device BEFORE iterating** — if the first approach fails, research how the component renders the CSS value internally
4. **Stop after 2 failed CSS approaches** — switch to a JS-computed numeric value, or disable the feature on native
5. **Design specs for WKWebView features** should note: "Verify CSS approach works on device before committing to this pattern"

### Pattern: JS-Computed Positioning (When CSS Fails)

```typescript
// Read CSS custom property value via JS, pass as numeric px
function readSafeTop(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--native-safe-top').trim()
  return parseInt(raw, 10) || 54  // fallback for missing value
}

// Pass numeric value to component, not CSS string
<ThirdPartyComponent offset={readSafeTop() + 80} />
```

### When to Disable on Native

If positioning a third-party component on native requires >2 iteration batches and the feature is non-critical (e.g., toast notifications), consider returning `null` on native rather than continuing to iterate. The cost of 3+ device testing batches (~15 min) often exceeds the value of the feature.

---

## 15. LLM Cache Contract Versioning

### Problem

Systems that cache LLM output (summaries, topics, classifications, generated metadata) can silently serve stale payloads after prompt/schema changes. The feature appears "unchanged" even though the prompt was updated, because cache restore bypasses regeneration.

**Post-mortem:** `docs/post-mortem/2026-02-28-sprint-017-summary-cache-drift-RAB-94.md` (Sprint 017)

### Rules

1. **Every persisted LLM payload must include a contract version** (e.g., `summary_prompt_version`).
2. **Cache restore must validate contract version and required fields** before trusting cached payloads.
3. **If cache is stale or invalid, skip restore and regenerate** from source transcript/data.
4. **Prompt/schema changes must bump the contract version** in code and tests.
5. **Add tests for stale cache rejection** (missing version, older version, missing required keys).

### Pattern: Contract Gate on Cache Restore

```python
CURRENT_PROMPT_VERSION = 2

def is_current_summary(payload: dict | None) -> bool:
    if not isinstance(payload, dict):
        return False
    version = payload.get("summary_prompt_version")
    if not isinstance(version, int) or version < CURRENT_PROMPT_VERSION:
        return False
    topics = payload.get("topics")
    return isinstance(topics, list) and len(topics) > 0

# Restore only if contract passes
if cached_payload and is_current_summary(cached_payload):
    restore_from_cache(cached_payload)
else:
    regenerate_summary()
```

### Checklist

- [ ] Does the cached payload include `*_prompt_version`?
- [ ] Is restore guarded by version + required field checks?
- [ ] Does stale cache trigger regeneration instead of restore?
- [ ] Were tests added for stale/missing/invalid cache payloads?
- [ ] Was the version bumped with the prompt/schema change?

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
| **Polling Loops** | Does it have a timeout? | `max_seconds` on every `while True` that polls external services |
| **WKWebView Layout** | Test on physical device | Flex column layout, 49px tab bar, no position:fixed, no self.view constraints |
| **WKWebView 3rd-Party CSS** | Inline style or stylesheet? | Numeric px via JS, never `calc()`+`env()` as inline strings |
| **Backend Data Mismatch** | Curl staging API during exploration | Verify actual response data, not just code |
| **Data Source Waterfall** | Build source × consumer matrix during exploration | Single utility with complete fallback chain |
| **External Model Output** | Is it committed? | Commit immediately if 5+ files or 200+ lines |
| **Sprint Issue Neglect** | Check all issues at batch 5/10/15/20 | Flag unblocked items that haven't been started |
| **Native iOS Menus** | Which trigger? (tap vs long-press) | `UIAlertController` for tap, `UIContextMenuInteraction` for long-press only |
| **DB Driver Migration** | Curl staging API after deploy | Test writes + datetime types specifically |
| **LLM Cache Contract Drift** | Is cached payload versioned and validated? | Add `*_prompt_version` + contract gate + stale-cache regeneration |
