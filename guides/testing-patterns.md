# Testing Patterns Guide

Detailed testing strategies and examples. Reference this for implementation guidance.

## E2E Testing with Playwright

### Locators (in order of preference)

```typescript
page.getByTestId('submit-btn')     // Best - stable
page.getByRole('button', { name: 'Submit' })  // Great - accessible
page.getByText('Submit')           // Good - user-visible
page.locator('.btn-primary')       // Fragile - avoid
```

### Test Outcomes, Not Implementation

```typescript
// BAD: Testing implementation details
await expect(page.locator('.loading-spinner')).toBeHidden()

// GOOD: Testing what user sees
await expect(page.getByText('Welcome back')).toBeVisible()
```

### Launch-Only vs Regression E2E Tests

Every new feature gets E2E verification at launch. But not every test needs to run in CI forever.

| Feature Type | At Launch | Ongoing CI |
|--------------|-----------|------------|
| Critical (auth, payments, core flows) | E2E test | Runs every time |
| Non-critical (enhancements, small features) | E2E test | Skip (tagged `@launch`) |

**Implementation:**

```typescript
// Critical - runs in CI always (no tag)
test('user can complete checkout', async ({ page }) => {
  // ...
})

// Non-critical - runs once at launch, skipped in CI
test('user can sort favorites', { tag: '@launch' }, async ({ page }) => {
  // ...
})
```

```bash
# At launch - run verification for new feature
npx playwright test --grep @launch

# Normal CI - critical tests only
npx playwright test --grep-invert @launch
```

## Mocking Strategies (From Expensinator)

**87% coverage achieved using:**
- Mock external APIs at integration layer (not unit level)
- Use test fixtures for database state
- Mock time-dependent functions (Date.now, setTimeout)

### Example: Mocking API Responses

```typescript
// Mock at integration layer
test.beforeEach(async ({ context }) => {
  await context.route('**/api/property/*', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ properties: mockData })
    })
  })
})
```

### Example: Mocking Time-Dependent Functions

```typescript
// Mock Date.now for consistent test results
const mockNow = new Date('2024-01-15T10:00:00Z').getTime()
jest.spyOn(Date, 'now').mockReturnValue(mockNow)

// Test code that depends on current time
const result = calculateExpiry() // Uses Date.now internally
expect(result).toBe(expectedExpiry)
```

## Unit Test Coverage Strategy

**Target: >70% from Day 1 (not retroactive)**

**Priority:**
1. Business logic (calculations, algorithms) — 100% coverage
2. API routes — 80% coverage
3. Utilities — 80% coverage
4. UI components — Manual verification preferred

### From Expensinator: Write Tests DURING Implementation

**Don't wait until after:**
- Write tests as you implement features
- Test files mirror source files
- Use descriptive test names (behavior, not implementation)

### Example: Test Structure

```typescript
describe('MortgageCalculator', () => {
  describe('calculateMonthlyPayment', () => {
    it('calculates correctly for standard 30-year mortgage', () => {
      // Arrange
      const principal = 500000
      const interestRate = 0.07
      const years = 30

      // Act
      const result = calculateMonthlyPayment(principal, interestRate, years)

      // Assert
      expect(result).toBeCloseTo(3326.51, 2)
    })

    it('handles zero interest rate', () => {
      const result = calculateMonthlyPayment(500000, 0, 30)
      expect(result).toBeCloseTo(1388.89, 2)
    })

    it('throws error for negative principal', () => {
      expect(() => calculateMonthlyPayment(-500000, 0.07, 30))
        .toThrow('Principal must be positive')
    })
  })
})
```

## Verification Methods by Criterion Type

Not everything needs E2E. Match verification to the criterion:

| Criterion Type | Verification Method | Rationale |
|----------------|---------------------|-----------|
| Critical user flow | E2E test | Worth the investment |
| Auth/payment works | E2E test | Too risky to skip |
| New page renders | E2E test OR manual | Depends on importance |
| Button triggers action | Unit test + manual | E2E overkill for simple actions |
| Error message shows | Unit test + manual | Test logic, verify display manually |
| Code exists | Code review | Sufficient |
| Styling correct | Manual | E2E can't judge aesthetics |

**Rule of thumb:** If it's a critical path or previously broke in production, write an E2E test. Otherwise, unit test the logic and manually verify the UI.

## Test Coverage Goals by Project Phase

**Launch (MVP):**
- Unit tests: 70%+
- E2E tests: Critical paths only
- Manual: Everything else

**Iteration (post-launch):**
- Unit tests: Maintain 70%+ (add tests for new code)
- E2E tests: Existing tests catch regressions
- Manual: UI tweaks, design changes

**Production-ready:**
- Unit tests: 80%+
- E2E tests: All critical paths covered
- Manual: Edge cases, visual design

## Capacitor WKWebView Testing Limitations

**Playwright WebKit is NOT a proxy for Capacitor WKWebView.** They share the WebKit engine but differ in critical ways:

| Behavior | Playwright WebKit | Capacitor WKWebView |
|----------|:-:|:-:|
| `env(safe-area-inset-*)` | Returns `0px` | Returns real values (e.g., 34px) |
| `viewport-fit: cover` | Ignored | Content extends under status bar/home indicator |
| `position: fixed` | Works normally | Broken — elements don't pin |
| Flex layout min-height | Behaves per spec | May cause child elements to scroll unexpectedly |

### What to test where

| Test Target | Tool | Why |
|-------------|------|-----|
| Web content (cards, forms, search) | Playwright WebKit | Safe — rendering is identical |
| Logic (formatting, data transforms) | Unit tests (Vitest) | No DOM needed |
| Native shell (TabBar, MiniPlayer, safe areas) | Physical device only | Playwright gives false positives |
| Bottom bar pinning (does it scroll?) | Physical device only | `position: fixed` works in Playwright but breaks in WKWebView; height thresholds differ |
| Scroll behavior in flex layouts | Physical device only | Height constraints differ in WKWebView |

### Practical testing workflow for native shell changes

1. Make CSS/layout change
2. `npm run build && npx cap sync ios`
3. Xcode: Cmd+B → Run on device
4. Evaluate visually (~5 min per cycle)
5. **Budget 3-5 iterations** for layout changes to native shell components

**Do not** create Playwright diagnostics for native shell layout issues — you'll waste iterations fixing a test that can't replicate the real environment.

**Additional WKWebView CSS limitation:** Third-party components (Sonner, Radix) that accept CSS string values for positioning render them as inline `--custom-property` values. `calc()` + `env()` silently fail in WKWebView inline styles. Use JS-computed numeric px instead. See `~/.claude/rules/stability.md` Section 14.

**Post-mortem references:**
- `docs/post-mortem/2026-02-18-wkwebview-layout-testing-RAB-58.md` (layout, 12 iterations)
- `docs/post-mortem/2026-02-27-sprint-016-toast-saga-iteration-count.md` (CSS positioning, 8 batches)

---

## Component Parity Testing

**Problem (Sprint 010):** Agent implements a feature in one variant or one screen but not all. Example: context menu added to show-page variant but missing from collection variant. hasSummary wired in HomeScreen but not SearchScreen or PodcastScreen.

**Rule:** When you change a shared component, you must verify ALL consumers.

### Step 1: Find all consumers

```bash
# Find every file that imports the component
grep -r "import.*EpisodeRow" src/ --include="*.tsx" -l
```

### Step 2: Verify prop passing

For every new or changed prop, confirm each consumer passes it:

```typescript
// Test: every screen that renders EpisodeRow passes hasSummary
describe('EpisodeRow consumers', () => {
  it('HomeScreen passes hasSummary', () => {
    // Render HomeScreen with mock data including hasSummary=true episodes
    // Assert EpisodeRow receives hasSummary prop
  })

  it('SearchScreen passes hasSummary', () => { /* same pattern */ })
  it('PodcastScreen passes hasSummary', () => { /* same pattern */ })
})
```

### Step 3: Verify all variants

```typescript
describe('EpisodeRow variants', () => {
  it('collection variant (showArtwork=true) has context menu', () => {
    render(<EpisodeRow showArtwork={true} episodeId="123" {...props} />)
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument()
  })

  it('show-page variant (showArtwork=false) has context menu', () => {
    render(<EpisodeRow showArtwork={false} episodeId="123" {...props} />)
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument()
  })
})
```

**Post-mortem reference:** `docs/post-mortem/2026-02-19-iteration-waste-sprint-010.md`

---

## Playwright Navigation Tests

**Problem (Sprint 010):** Click handlers triggered wrong actions (playback instead of navigation). Podcast name links weren't wired. "Go to Show" was broken due to missing podcast ID.

**Pattern:** Every clickable element that triggers navigation should have an E2E test.

### Basic navigation test

```typescript
test('clicking episode row navigates to episode detail', async ({ page }) => {
  await page.goto('/home')
  await page.getByText('Episode Title').click()
  await expect(page).toHaveURL(/\/episode\//)
})

test('clicking podcast name navigates to show page', async ({ page }) => {
  await page.goto('/home')
  await page.getByRole('button', { name: 'Podcast Name' }).click()
  await expect(page).toHaveURL(/\/podcast\//)
})
```

### Context menu navigation

```typescript
test('context menu "Go to Show" navigates correctly', async ({ page }) => {
  await page.goto('/episode/123')
  await page.getByRole('button', { name: /more/i }).click()
  await page.getByText('Go to Show').click()
  await expect(page).toHaveURL(/\/podcast\//)
})
```

### Edge state test

```typescript
test('unprocessed episode shows metadata, not error', async ({ page }) => {
  await page.goto('/episode/unprocessed-123')
  await expect(page.getByText('Failed to load')).not.toBeVisible()
  await expect(page.getByText('Summarize Episode')).toBeVisible()
})
```

**Coverage rule:** Every `onClick` that calls `navigate()` should have a corresponding E2E test asserting the correct URL.

---

## Screenshot Regression Testing

**Problem (Sprint 010):** Visual inconsistencies (row height differences between 1-line and 2-line titles, extra spacing from min-h) required multiple iteration cycles to discover and fix.

### Setup (Playwright)

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'visual-regression',
      use: {
        ...devices['iPhone 13 Pro'],
        screenshot: 'only-on-failure',
      },
    },
  ],
  // Store baselines
  snapshotDir: './test-results/screenshots',
})
```

### Capture key screens

```typescript
test('HomeScreen visual regression', async ({ page }) => {
  await page.goto('/home')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('home-screen.png', {
    maxDiffPixelRatio: 0.01, // 1% threshold
  })
})

test('EpisodeRow variants visual regression', async ({ page }) => {
  await page.goto('/test-harness/episode-row-variants')
  await expect(page).toHaveScreenshot('episode-row-variants.png', {
    maxDiffPixelRatio: 0.01,
  })
})
```

### When to update baselines

```bash
# After intentional visual changes
npx playwright test --update-snapshots
```

### What to capture

| Screen | Why |
|--------|-----|
| HomeScreen (with episodes) | Row height consistency, artwork alignment, sparkles badge |
| SearchScreen (results) | Collection variant layout, context menu presence |
| PodcastScreen (show page) | Show-page variant, date/duration formatting |
| EpisodeDetailScreen | Metadata display, action buttons, edge states |

**Note:** Screenshot regression catches visual issues that are hard to describe in assertions (spacing, alignment, height consistency) but misses interaction bugs. Combine with navigation tests for full coverage.

**Post-mortem reference:** `docs/post-mortem/2026-02-19-iteration-waste-sprint-010.md`

---

## Common Testing Pitfalls

### 1. Writing E2E Tests for Everything

**Problem:** Slow test suite, high maintenance, flaky tests

**Solution:** E2E only for critical paths. Unit tests + manual for everything else.

### 2. Retroactive Testing

**Problem:** Adding tests after implementation is slow and often skipped

**Solution:** Write tests DURING implementation. Make it part of the workflow.

### 3. Testing Implementation Details

**Problem:** Tests break when refactoring (even when behavior unchanged)

**Solution:** Test behavior, not implementation. Use public APIs, not internal state.

### 4. Ignoring Test Failures

**Problem:** "Tests are flaky" becomes excuse to ignore failures

**Solution:** Fix flaky tests immediately. Zero tolerance for ignored failures.

## Interaction Self-Verification

**Run AFTER acceptance criteria pass but BEFORE submitting to Reviewer.** Catches bugs where "code exists" but "user interactions are broken."

### Checklist A: UI Component Verification

For every UI component you changed or created:

- [ ] **List all screens** that render this component (grep for imports)
- [ ] **Verify prop parity:** Every screen passes all required props (especially new ones)
- [ ] **Verify all variants:** If component has variants (e.g., `showArtwork` vs `!showArtwork`), verify EACH variant has the feature
- [ ] **Verify click handlers:** Navigation elements navigate (not trigger playback), action buttons trigger correct action, stop propagation where needed
- [ ] **Verify edge states:** Missing data, unprocessed episodes, empty API responses
- [ ] **Compare against design spec:** Verify each screen matches mockup
- [ ] **Test with real staging data:** Curl the staging API, use actual response data
- [ ] **Edit forms:** Verify fields are user-editable (not auto-populated by backend)
- [ ] **Conditional action icons:** Use invisible spacers or fixed-width containers to prevent layout shifts (`stability.md` Section 21)

### Checklist B: Data Format Impact Check

When you change how data is produced, stored, or returned:

- [ ] **Grep for ALL consumers** of the changed field across the entire frontend codebase
- [ ] **Verify each consumer handles the new format:** detail views AND list views AND search results
- [ ] **Check for assumptions:** `.substring()`, `.length`, raw text rendering that breaks with HTML/markdown

### Self-Verification Output

```markdown
## Self-Verification Report

### UI Components Checked
| Component | Screens | Variants | Edge States | Design Match |
|-----------|---------|----------|-------------|--------------|
| [name]    | [count] | [count]  | [tested]    | [yes/no]     |

### Data Format Impact
| Field Changed | Consumers Found | All Updated |
|---------------|-----------------|-------------|
| [field]       | [count files]   | [yes/no]    |
```

---

## Integration Test Examples

### Database Migrations

**Always test migrations with real database instances, not mocks.**

```typescript
describe('Database Migrations', () => {
  it('should add receipt_number column', () => {
    const db = new Database(':memory:')
    runMigrations(db)
    const columns = db.exec('PRAGMA table_info(receipts)')
      .map(row => row[1])
    expect(columns).toContain('receipt_number')
  })

  it('should handle idempotent migrations', () => {
    const db = new Database(':memory:')
    runMigrations(db)
    runMigrations(db)  // Should not throw
  })
})
```

### External API Integration

**Test with real APIs, not mocks, to catch API misuse:**

```typescript
describe('OAuth Integration', () => {
  it('should handle missing email in profile', async () => {
    const strategy = new GoogleStrategy(config, (token, refresh, profile, done) => {
      handleProfile(profile, done)
    })
    const profileWithoutEmail = { id: '123', displayName: 'Test' }
    await expect(
      strategy.userProfile(accessToken)
    ).rejects.toThrow('OAuth profile missing email')
  })
})
```

### Race Conditions

**Test concurrent operations explicitly:**

```typescript
describe('User Registration', () => {
  it('should handle concurrent registrations', async () => {
    const emails = ['alice@test.com', 'bob@test.com', 'charlie@test.com']
    const userIds = await Promise.all(
      emails.map(email => createUser(email))
    )
    const uniqueIds = new Set(userIds)
    expect(uniqueIds.size).toBe(3)
  })

  it('should not have duplicate admin on concurrent first registrations', async () => {
    await db.run('DELETE FROM users')
    const [user1, user2] = await Promise.all([
      registerUser('alice@test.com'),
      registerUser('bob@test.com')
    ])
    const admins = await db.all('SELECT * FROM users WHERE is_admin = 1')
    expect(admins).toHaveLength(1)
  })
})
```

### Configuration Validation

**Test that server refuses to start with invalid config:**

```typescript
describe('Configuration Validation', () => {
  it('should fail fast on missing required env vars', () => {
    delete process.env.GOOGLE_CLIENT_ID
    expect(() => validateConfig())
      .toThrow('Missing required environment variables: GOOGLE_CLIENT_ID')
  })
})
```

---

## Error Handling Examples

### Silent Failures (Anti-Pattern)

```typescript
// WRONG - Silent failure
try { await riskyOperation() } catch (e) { /* ignore */ }

// WRONG - Assuming operation succeeded
try { db.run('ALTER TABLE users ADD COLUMN new_field TEXT') }
catch (e) { /* Assume column already exists */ }

// CORRECT - Explicit handling
try { await riskyOperation() }
catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}

// CORRECT - Check before assuming
const hasColumn = checkColumnExists(db, 'users', 'new_field')
if (!hasColumn) db.run('ALTER TABLE users ADD COLUMN new_field TEXT')
```

### Intentionally Ignored Errors

```typescript
try {
  await nonCriticalOperation()
} catch (error) {
  // Intentionally ignored: Non-critical cache warming
  console.debug('Cache warming failed:', error.message)
}
```

### Validation After Risky Operations

```typescript
await runMigration('add_column')
validateSchema(db, ['expected', 'columns', 'new_column'])  // Verify it worked

await writeFile(path, data)
const exists = await fileExists(path)
if (!exists) throw new Error('File write failed')
```

---

## See Also

- Project-specific E2E patterns: `docs/E2E_TESTING_PLAN.md` (if exists)
- Testing rules: `~/.claude/rules/testing.md`
