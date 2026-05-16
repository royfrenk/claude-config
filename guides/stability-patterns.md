# Stability Patterns (Detailed Reference)

Reference companion to `~/.claude/rules/stability.md`. Read only the section flagged by the Quick Reference table — not the whole file.

**Also see:**
- `~/.claude/rules/testing-patterns.md` for error handling patterns
- `~/.claude/rules/security.md` for input/config validation
- `~/.claude/rules/testing.md` for integration test requirements

---

## 1. API Misuse Prevention

Read official docs. Don't rely on memory or similar libraries. Add integration tests with the real API — mocks hide misuse.

| Library Pair | Easy to Confuse | How to Verify |
|---|---|---|
| SQL.js vs better-sqlite3 | `db.prepare()` vs `db.run()` | Check SQL.js docs — no `prepare()` |
| aiosqlite vs asyncpg | ISO strings vs `datetime` objects for TIMESTAMPTZ | Curl staging after migration, test writes |
| `while True` polling | No timeout = blocks thread forever | Add `max_poll_seconds` — see Section 7 |
| UIButton.sendActions vs UIMenu | `sendActions` does NOT show UIMenu | UIAlertController for tap — see Section 12b |
| Sonner `offset` in WKWebView | `calc(env(...))` silently fails inline | JS-computed numeric px — see Section 14 |
| CTE `columns` vs explicit SELECT | Adding column to variable misses hardcoded SELECT | Verify ALL query paths — see Section 17 |
| Client-side persisted objects | New field missing on stale objects | Async fallback or migration — see Section 18 |

```javascript
// CORRECT — validate API method exists AND return structure
function insertUser(db, userData) {
  if (typeof db.run !== 'function') throw new Error('db.run() not available')
  const result = db.run('INSERT INTO users...', userData)
  if (!result || typeof result.lastInsertRowid === 'undefined')
    throw new Error('Unexpected return structure')
  return result.lastInsertRowid
}
```

---

## 2. Documentation Drift Prevention

When changing routes, env vars, or callback URLs — search the entire codebase for old values and update ALL references (docs, `.env.example`, deployment configs, README examples). Add startup validation to catch mismatches early.

```javascript
function validateConfiguration() {
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
  const expectedPath = '/auth/google/callback'
  if (!callbackUrl?.includes(expectedPath))
    throw new Error(`GOOGLE_CALLBACK_URL must include ${expectedPath}. Got: ${callbackUrl}`)
}
```

---

## 3. Database Race Condition Prevention

Use transactions for atomic operations. Avoid `lastInsertRowid` in concurrent scenarios — use `RETURNING` or unique constraints. Test with concurrent requests.

```javascript
// CORRECT — transaction with RETURNING
async function createUser(email) {
  return db.transaction(() => {
    const result = db.run('INSERT INTO users (email) VALUES (?) RETURNING id', email)
    return result.lastInsertRowid
  })
}
```

---

## 4. Configuration Validation

No silent fallbacks for required env vars. Fail fast at startup. Validate format (URLs, ports, paths).

```typescript
function validateConfig() {
  const missing = ['API_KEY', 'DATABASE_URL'].filter(k => !process.env[k])
  if (missing.length > 0) { console.error(`Missing: ${missing.join(', ')}`); process.exit(1) }
}
validateConfig()  // Call before app.listen()
```

See `security.md` for full configuration validation requirements.

---

## 5. Over-Engineering Prevention

Simplify when logic has 3+ conditions or 4+ nesting levels. Signs of over-engineering: custom implementations of standard functions, "clever" code needing comments to explain.

```javascript
// SIMPLIFIED — readable conditions
const isFirstUser = userCount === 0
const isConfiguredAdmin = email === process.env.ADMIN_EMAIL
const isExistingAdmin = existingUser?.is_admin === true
isAdmin = isFirstUser || isConfiguredAdmin || isExistingAdmin
```

---

## 6. Diagnostic Checklist

When investigating recurring breakages, check: correct API version + real integration tests, all env var references updated, transactions used for concurrent ops, startup validation in place, logic can be simplified.

---

## 7. External Service Failures and Polling

Always set 30s timeouts. Always have fallbacks. Track failures for manual reconciliation. Never halt workflow for non-critical syncs.

**Every `while True` polling loop MUST have a `max_seconds` timeout.** A stuck external service will block the worker thread indefinitely.

```python
# CORRECT — polling with timeout guard
max_poll_seconds = max(estimated_seconds * 3, 1800)
start_time = time.time()
while True:
    status = await check_status(job_id)
    if status == "completed": break
    if time.time() - start_time > max_poll_seconds:
        raise RuntimeError(f"Job {job_id} timed out after {int(time.time() - start_time)}s")
    await asyncio.sleep(3)
```

**Linear MCP:** A PostToolUse hook checks process count after each `mcp__linear__*` call and runs `~/.claude/scripts/cleanup-linear-mcp.sh` (kills when >5 accumulate). No manual action needed. Use `/reset-linear` if calls still hang.

---

## 8. Capacitor WKWebView Layout (iOS)

| Constraint | Impact | Workaround |
|---|---|---|
| `position: fixed` broken | Bottom bars scroll with content | `h-screen flex flex-col` + `flex-shrink-0` |
| Tab bar content > `h-[49px]` | Bar scrolls in WKWebView | Use padding within 49px for optical adjustment |
| `self.view` IS the WKWebView | Frame constraints self-referential | Use `additionalSafeAreaInsets`, never constrain `self.view.frame` |
| Playwright WebKit ≠ WKWebView | False positives for native shell | Test on physical device — Playwright misleads |

```tsx
// Only proven layout for Capacitor WKWebView
<div className="h-screen flex flex-col bg-background">
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
    {/* Scrollable content */}
  </div>
  <MiniPlayer />  {/* flex-shrink-0 */}
  <TabBar />      {/* flex-shrink-0, 49px content + safe-bottom spacer */}
</div>
```

**One change at a time.** Make ONE CSS change → `cap sync` → Xcode rebuild → verify on device → then next change. Never stack unverified changes.

---

## 9. Backend Data Verification

Curl the staging API during exploration. Check actual response data (field lengths, formats, presence). Don't assume code = behavior. When changing backend data format, grep ALL frontend consumers of that field.

```bash
curl -s "https://staging-api/episodes/123" | jq '.description | length'
# Returns: 500 <-- truncated! Flag in tech spec before implementing frontend
```

---

## 10. Data Source Mapping (Shared Data Fields)

When a field appears on 3+ screens from 2+ sources, build a data-source matrix during exploration. Implement the COMPLETE fallback chain in one pass, not incrementally.

**Data Existence Gate (applies to all workflows):** Before adding SQL COALESCE fallbacks, run a diagnostic query to verify the data EXISTS for affected records. If no data exists, use a UI placeholder — not more SQL.

```sql
-- Does data exist at all for these records?
SELECT DISTINCT entity_name FROM source_table WHERE field IS NOT NULL;
```

If data doesn't exist for a record, no SQL fallback will fix it.

---

## 11. External Model Output Management

Commit external model output (Codex, Gemini) immediately when it touches 5+ files or 200+ lines. Use message format: `feat: [description] (Codex/Gemini-assisted)`. Never iterate on top of uncommitted external output — commit first, then iterate.

---

## 12. Sprint Issue Coverage Check

At every 5th iteration batch, check ALL sprint issues. For each issue not Done: are there unblocked sub-items not started? If yes, flag to user. Never close a sprint without investigating all in-scope issues.

---

## 12b. Native iOS Menu Presentation

| API | Trigger | Programmatic? |
|---|---|---|
| `UIContextMenuInteraction` | Long-press only | No |
| `UIAlertController(.actionSheet)` | Any | Yes |
| `UIButton.menu` + `showsMenuAsPrimaryAction` | Tap | No (`sendActions` silent fails) |

Never use `sendActions(for: .menuActionTriggered)` — it silently fails. For tap-triggered menus from Capacitor, use `UIAlertController(.actionSheet)`.

```swift
let alert = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
let action = UIAlertAction(title: "Share", style: .default) { _ in call.resolve(["selectedActionId": "share"]) }
if let img = UIImage(systemName: "square.and.arrow.up")?.withRenderingMode(.alwaysTemplate) {
    action.setValue(img, forKey: "image")
}
alert.addAction(action)
viewController.present(alert, animated: true)
```

---

## 13. Database Driver Migration Verification

After any DB driver migration (e.g., aiosqlite → asyncpg), `py_compile` is NOT sufficient — curl the staging API and test write operations specifically. asyncpg requires actual `datetime` objects for TIMESTAMPTZ; ISO strings silently fail on writes.

Checklist: health endpoint starts, read endpoint returns data, write endpoint succeeds, datetime fields are objects not strings, no type errors in logs.

---

## 14. Third-Party Component CSS in WKWebView

`calc()` + `env()` expressions don't resolve when set as inline CSS custom properties in WKWebView. Components like Sonner that render `offset` as `--offset: calc(env(...))` silently ignore the value.

```typescript
// CORRECT — JS-computed numeric value instead of CSS string
function readSafeTop(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--native-safe-top').trim()
  return parseInt(raw, 10) || 54
}
<ThirdPartyComponent offset={readSafeTop() + 80} />
```

After 2 failed CSS approaches, switch to JS-computed numeric px or disable the feature on native.

---

## 15. LLM Cache Contract Versioning

Every persisted LLM payload must include a `*_prompt_version`. Cache restore must validate version AND required fields. Stale cache triggers regeneration, not restore. Bump version with every prompt/schema change.

```python
CURRENT_PROMPT_VERSION = 2

def is_current_summary(payload: dict | None) -> bool:
    if not isinstance(payload, dict): return False
    if payload.get("summary_prompt_version", 0) < CURRENT_PROMPT_VERSION: return False
    return isinstance(payload.get("topics"), list) and len(payload["topics"]) > 0

if cached_payload and is_current_summary(cached_payload):
    restore_from_cache(cached_payload)
else:
    regenerate_summary()
```

---

## 16. CSS Grid Table Consistency

When modifying a CSS Grid table column, diff the FULL class list of the header row against ALL data rows. Classes that must match: `grid-cols-[...]`, `gap-*`, `items-center`, `px-*`. Also update edit-mode `col-span-*` values and container `min-w-[...]`.

---

## 17. CTE and Multi-Path Query Column Consistency

SQL queries with CTEs have multiple execution paths. Adding a column to the shared `columns` variable updates direct paths (`SELECT {columns}`) automatically — but the CTE's explicit final SELECT (after `WHERE rn = 1`) has a hardcoded column list that must be updated separately.

```python
# WRONG — podcast_id in {columns} but omitted in CTE's final SELECT
rows = await conn.fetch(f"""
    WITH ranked AS (SELECT {columns}, ROW_NUMBER() OVER (...) AS rn FROM episodes e)
    SELECT id, title, ...  -- podcast_id MISSING HERE
    FROM ranked WHERE rn = 1
""")

# CORRECT — add podcast_id to the explicit SELECT after WHERE rn = 1
```

After adding a column, grep the function for all `SELECT` statements and verify each path includes it.

---

## 18. Stale Client-Side Persisted Data

When adding a field the UI conditionally depends on (`field ? handler : undefined`), check if the parent object is persisted in `localStorage`, `sessionStorage`, Capacitor `Preferences`, or IndexedDB. Old persisted objects lack the field — UI silently degrades.

Fix options: (a) async fallback — fetch field from backend on demand, (b) migration — re-fetch on stale version, (c) graceful UI — don't gate interactivity on the field.

---

## 19. SQL-Derived Status Fields

When a status is computed via `CASE WHEN` (not stored), write operations must set the columns the expression evaluates — not just the user-facing field.

```typescript
// WRONG — only writes playlist URL, CASE WHEN evaluates youtube_channel_url
await api.update(id, { youtube_playlist_url: url })

// CORRECT — also write the column that flips the status
await api.update(id, { youtube_playlist_url: url, youtube_channel_url: url })
```

Before implementing a save that should change a status, read the SQL `CASE WHEN` to identify which columns it evaluates.

---

## 20. Cross-Layer Schema Sync (SQL ↔ Pydantic ↔ TypeScript)

When modifying a SQL query, update the Pydantic model AND TypeScript interface. When backends use raw `dict(row)` instead of `response_model`, Pydantic mismatches silently drop fields.

Checklist: SQL SELECT columns match Pydantic fields, Pydantic fields match TypeScript interface, new/removed SQL columns also added/removed from both layers.

---

## 21. Conditional Rendering Alignment

When action icons are conditionally rendered in a list row, use invisible spacers or a fixed-width container so all rows reserve the same horizontal space regardless of icon count.

```tsx
// CORRECT — spacers maintain alignment
<div className="flex items-center gap-1">
  {hasMapping ? (
    <><button><Pencil className="h-3.5 w-3.5" /></button><button><Search className="h-3.5 w-3.5" /></button></>
  ) : (
    <><span className="inline-block w-3.5" /><span className="inline-block w-3.5" /></>
  )}
  <button><ExternalLink className="h-3.5 w-3.5" /></button>
</div>
```

---

## 22. In-Memory Background Tasks for Long-Running Operations

Never use `BackgroundTasks` (FastAPI) or in-process callbacks for operations >60 seconds. Use a persistent queue (DB table). Every job must be resumable — store checkpoint state (e.g., external service job IDs). Add startup recovery for orphaned jobs.

`BackgroundTasks` is only for fire-and-forget operations under 60 seconds (send email, update cache, log event).

---

## 23. LLM Single-Shot Prompt Overload

When a prompt has 4+ distinct objectives, output quality degrades. Separate "what's important" from "where is it" — decide content significance first, then locate it in the source.

```
# WRONG — single prompt doing everything
"Identify highlights, pick timestamps, rank importance, extract quotes"

# CORRECT — focused steps
Step 1: Extract insights from summary (what matters)
Step 2: Rank insights by novelty/interest (how much)
Step 3: Locate each insight in transcript with genre-aware boundaries (where)
Step 4: Trim filler from located section (clean up)
```

---

## 24. Instrument Before Building (Pipeline Health)

Before building features that depend on a pipeline (YouTube, transcription, processing), verify the pipeline is healthy — curl staging, check logs, or run a test operation.

"All N items failed" is a pipeline health problem, not a UX problem. Add diagnostic logging BEFORE iterating. Silent circuit breakers must log when they activate.

```bash
# Correct first batch: verify health, then fix
curl -s "https://staging-api/health" | jq .
railway logs --service recap-rabbit-be-staging | grep -i error | tail -20
```

---

## 25. Unfamiliar Domain Cascade

Before fixing an issue in an unfamiliar domain (iOS native, Capacitor plugins, new external API), research ALL constraints that apply first. Build a checklist of known constraints before writing any code. Serial discovery across iteration batches (fix one thing, discover next constraint) compounds the cost.

```
# WRONG — serial discovery
Batch 1: Fix X → discover constraint A
Batch 2: Fix A → discover constraint B
Batch 3: Fix B → discover constraint C

# CORRECT — research first
Batch 0: Read docs, grep codebase, list ALL known constraints
Batch 1: Fix X, A, B, C in one pass
```

---

## 26. Generated File Verification

When a feature generates a file (PDF, image, CSV), HTTP 200 is not sufficient verification. Download and inspect the actual file content.

```bash
# PDF
curl -o output.pdf "https://staging-api/export/123.pdf"
pdftotext output.pdf - | head -50  # verify text content is correct

# Image
curl -o output.png "https://staging-api/thumbnail/123.png"
file output.png  # verify it's actually an image, not an error HTML page
```

Never mark a file generation feature complete without inspecting the actual output.
