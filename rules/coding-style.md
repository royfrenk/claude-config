# Coding Style

All agents must follow these coding standards.

## Immutability (Critical)

Never mutate objects or arrays. Always create new ones:

```javascript
// WRONG - Mutation
function updateUser(user, name) {
  user.name = name  // Mutation!
  return user
}

// CORRECT - Immutability
function updateUser(user, name) {
  return { ...user, name }
}

// WRONG - Array mutation
items.push(newItem)

// CORRECT - New array
const updated = [...items, newItem]
```

## File Organization

| Guideline | Target |
|-----------|--------|
| Lines per file | 200-400 typical |
| Maximum | 800 (refactor if exceeds) |
| Functions | < 50 lines each |
| Nesting depth | < 4 levels |

**Principle:** Many small files > few large files

**Structure:** Organize by feature/domain, not by type:
```
// GOOD - By feature
src/auth/
src/subscriptions/
src/episodes/

// AVOID - By type
src/components/
src/hooks/
src/utils/
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `episode-selector.tsx` |
| Components | PascalCase | `EpisodeSelector` |
| Functions (Python) | snake_case | `get_episode_by_id` |
| Functions (TypeScript) | camelCase | `getEpisodeById` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |

## Error Handling

Always handle errors explicitly:

```typescript
// WRONG - Silent failure
try {
  await riskyOperation()
} catch (e) {
  // ignore
}

// CORRECT - Explicit handling
try {
  await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}
```

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable without comments explaining "what"
- [ ] Functions are small and focused (< 50 lines)
- [ ] Files are focused (< 800 lines)
- [ ] No deep nesting (< 4 levels)
- [ ] Proper error handling throughout
- [ ] No console.log statements
- [ ] No hardcoded magic numbers (use constants)
- [ ] No mutation (immutable patterns used)
- [ ] Names are descriptive (no `x`, `tmp`, `data`)

## Automated Checks

Hooks automatically:
- Format code with Prettier (JS/TS)
- Warn about console.log statements
- Run TypeScript checks (if tsconfig exists)

Fix warnings before committing.
