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

**See:** Eval-Writer agent for creating evals

## When to Write Tests

**Always test:**
- Critical paths (auth, payments, data mutations)
- Complex business logic
- Edge cases and error handling
- Bug fixes (regression test)
- Database migrations (integration test — use real DB, not mocks)
- External API integrations (real API, not mocks)
- Concurrent operations (race condition prevention)
- Shared UI component changes (variant parity + consumer prop passing)
- New database queries (run against real DB — mocks hide type mismatches and missing indexes)

**Judgment call:**
- Simple CRUD operations
- UI-only changes (that don't affect shared components)
- Prototype/experimental code

**For code examples and detailed patterns, see:** `~/.claude/guides/testing-patterns.md`

## E2E Test Strategy

Follow the **test pyramid** — E2E should be ~10% of your tests.

| Phase | E2E Approach |
|-------|--------------|
| **Launch** (new feature) | Write E2E covering happy path + critical error states |
| **Iteration** (tweaks to existing) | Existing E2E catches regressions; new changes get unit tests + manual |

**Write new E2E for:** new feature launch, new critical flow (auth, payments), regression (broke in production).
**Skip E2E for:** iterations/tweaks, simple UI changes, error messages, styling.

## Verification Methods by Criterion Type

| Criterion Type | Verification Method | Rationale |
|----------------|---------------------|-----------|
| Critical user flow | E2E test | Worth the investment |
| Auth/payment works | E2E test | Too risky to skip |
| New page renders | E2E test OR manual | Depends on importance |
| Button triggers action | Unit test + manual | E2E overkill for simple actions |
| Error message shows | Unit test + manual | Test logic, verify display manually |
| Code exists | Code review | Sufficient |
| Styling correct | Manual | E2E can't judge aesthetics |

## Before Submitting Code

- [ ] All existing tests pass
- [ ] New code has tests for critical paths
- [ ] Edge cases covered (null, empty, error states)
- [ ] Error scenarios tested
- [ ] No skipped tests without explanation

## Before Handoff to User

**MANDATORY** — Before telling the user "ready to test":

1. Run full test suite (backend + frontend), not just changed code's tests
2. Check test coverage for the flow being tested
3. Verify locally before handoff (curl, browser, or automated)
4. Run automated deployment readiness checks (see developer.md Phase 5.5)
5. Run automated staging verification (see developer.md Phase 6)

**Never ask the user to test something you haven't verified yourself.**

## Verification Loop

Before submitting to Reviewer, run full verification:

```bash
cd backend && pytest tests/ -v    # Backend
cd frontend && npm test           # Frontend
cd e2e && npm run test:staging    # E2E (if applicable)
```

**All tests must pass. No exceptions.**
