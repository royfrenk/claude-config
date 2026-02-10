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

## See Also

- Project-specific E2E patterns: `docs/E2E_TESTING_PLAN.md` (if exists)
- Testing rules: `~/.claude/rules/testing.md`
