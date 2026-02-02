# Testing Requirements

All agents must follow these testing standards.

## Testing Philosophy

Test **behavior**, not implementation. Tests should:
- Verify what the code does, not how it does it
- Survive refactoring without changes
- Be readable as documentation
- Run fast and independently

## Test Types

| Type | When Required | Scope |
|------|---------------|-------|
| Unit tests | New utilities, services, complex logic | Single function/class |
| Integration tests | New API endpoints, database operations | Multiple components |
| E2E tests | New user flows, critical path changes | Full user journey |
| Quality evals | Ranking, performance, subjective quality features | Feature-level benchmarks |

## Quality Evals

For features where correctness isn't binary (search, recommendations, performance), write **quality evals**.

**Evals live in:**
- `docs/evals/{feature}.eval.md` - Criteria, scenarios, baselines
- `tests/evals/{feature}.eval.ts` - Automated benchmarks (optional)

**When to write evals:**
- New feature with ranking/scoring/subjective quality
- Existing feature with quality requirements
- Performance requirements (speed, accuracy)

**Evals are:**
- ✓ Evergreen (persist across issues)
- ✓ Regression-aware (document what NOT to break)
- ✓ Human-verified (not a replacement for judgment)
- ✗ NOT per-issue (don't put in spec files)

**See:** Eval-Writer agent for creating evals

## When to Write Tests

**Always test:**
- Critical paths (auth, payments, data mutations)
- Complex business logic
- Edge cases and error handling
- Bug fixes (regression test)

**Judgment call:**
- Simple CRUD operations
- UI-only changes
- Prototype/experimental code

## Test Structure

```typescript
describe('EpisodeService', () => {
  describe('getById', () => {
    it('returns episode when found', async () => {
      // Arrange
      const episodeId = 'test-123'

      // Act
      const result = await service.getById(episodeId)

      // Assert
      expect(result.id).toBe(episodeId)
    })

    it('throws NotFoundError when episode missing', async () => {
      await expect(service.getById('nonexistent'))
        .rejects.toThrow(NotFoundError)
    })
  })
})
```

## E2E Test Strategy

E2E tests are expensive: slow to run, prone to flakiness, and high maintenance. Follow the **test pyramid** — E2E should be ~10% of your tests.

### Feature Lifecycle: Launch vs Iteration

| Phase | E2E Approach |
|-------|--------------|
| **Launch** (new feature) | Write E2E tests covering the happy path and critical error states |
| **Iteration** (tweaks to existing) | Existing E2E tests catch regressions; new changes get unit tests + manual |

**Launch phase** = First time a feature ships. Write E2E tests that verify:
- The core user flow works end-to-end
- Critical error states are handled (payment fails, auth expires, etc.)
- Key entry points render correctly

**Iteration phase** = Changes to an existing feature. The E2E tests you wrote at launch now serve as regression tests. New changes only need:
- Unit tests for new logic
- Manual verification for UI tweaks
- New E2E only if the *flow itself* changes significantly

### When to Write NEW E2E Tests

**Always:**
- New feature launch (first ship)
- New critical flow (auth, payments, core journeys)
- Regression test (something broke in production)

**Sometimes (judgment call):**
- Significant flow change to existing feature
- New page that's a key entry point

**Skip:**
- Iterations/tweaks to existing features (existing E2E covers it)
- Simple UI changes
- Error messages (unit test logic, manual verify display)
- Edge cases (unit tests)
- Styling changes

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

### Playwright Best Practices

**Locators (in order of preference):**
```typescript
page.getByTestId('submit-btn')     // Best - stable
page.getByRole('button', { name: 'Submit' })  // Great - accessible
page.getByText('Submit')           // Good - user-visible
page.locator('.btn-primary')       // Fragile - avoid
```

**Test outcomes, not implementation:**
```typescript
// BAD: Testing implementation details
await expect(page.locator('.loading-spinner')).toBeHidden()

// GOOD: Testing what user sees
await expect(page.getByText('Welcome back')).toBeVisible()
```

See `docs/E2E_TESTING_PLAN.md` for patterns.

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

## Before Submitting Code

- [ ] All existing tests pass
- [ ] New code has tests for critical paths
- [ ] Edge cases covered (null, empty, error states)
- [ ] Error scenarios tested
- [ ] No skipped tests without explanation

## Before Handoff to User

**MANDATORY** — Before telling the user "ready to test" or "test at [URL]":

1. **Run full test suite** — not just the changed code's tests
   ```bash
   # Backend
   cd backend && pytest tests/ -v

   # Frontend
   cd frontend && npm test
   ```

2. **Check test coverage for the flow being tested:**
   - Does the flow have tests? (e.g., if user will test auth, do auth tests exist?)
   - If no tests exist → create them or verify via API/curl yourself first

3. **Verify locally before handoff:**
   - Start backend + frontend
   - Test the flow yourself (curl, browser, or automated)
   - Only after YOU verify it works → ask user to test

4. **Run automated staging verification** (see `~/.claude/agents/developer.md` Phase 6):
   - API health checks with curl/vercel curl
   - Response structure validation
   - Log analysis for errors
   - Relevant E2E tests from spec file
   - Only proceed to user handoff after checks pass

**Never ask the user to test something you haven't verified yourself.**

## Verification Loop

Before submitting to Reviewer, run full verification:

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test

# E2E (if applicable)
cd e2e && npm run test:staging
```

**All tests must pass. No exceptions.**
