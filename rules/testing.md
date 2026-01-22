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

## E2E Test Requirements

Add E2E tests when:
- New pages or routes
- New user flows (subscribe, process, etc.)
- Authentication changes
- Changes to critical paths (search, login, subscriptions)

See `docs/E2E_TESTING_PLAN.md` for patterns.

## Before Submitting Code

- [ ] All existing tests pass
- [ ] New code has tests for critical paths
- [ ] Edge cases covered (null, empty, error states)
- [ ] Error scenarios tested
- [ ] No skipped tests without explanation

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
