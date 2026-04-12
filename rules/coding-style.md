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

| Guideline | Target | Enforcement |
|-----------|--------|-------------|
| Lines per file | 200-400 typical | Hook: warns at 400+ |
| Maximum | 800 (refactor if exceeds) | Hook: blocks at 800+ |
| Functions | < 50 lines each | Manual review |
| Nesting depth | < 4 levels | Manual review |

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

| Type | Convention | Example | Enforcement |
|------|------------|---------|-------------|
| Files | kebab-case | `episode-selector.tsx` | Hook: warns on PascalCase/camelCase |
| Components | PascalCase | `EpisodeSelector` | Manual review |
| Functions (Python) | snake_case | `get_episode_by_id` | Manual review |
| Functions (TypeScript) | camelCase | `getEpisodeById` | Manual review |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` | Manual review |

## Error Handling

Always handle errors explicitly. Never use empty catch blocks.

- **No silent failures:** Empty catch blocks hide failures. Always log and re-throw or handle explicitly.
- **No assuming success:** Don't catch errors and assume the operation worked. Check before assuming (e.g., `checkColumnExists` before `ALTER TABLE`).
- **When ignoring errors:** If genuinely non-critical (rare), document WHY in a comment.
- **Validate after risky operations:** After migrations or file writes, verify the result.

**For code examples, see:** `~/.claude/guides/testing-patterns.md` (Error Handling Examples section)

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable without comments explaining "what"
- [ ] Functions are small and focused (< 50 lines)
- [ ] Files are focused (< 800 lines)
- [ ] No deep nesting (< 4 levels)
- [ ] Proper error handling throughout (no empty catch blocks)
- [ ] No console.log statements
- [ ] No hardcoded magic numbers (use constants)
- [ ] No mutation (immutable patterns used)
- [ ] Names are descriptive (no `x`, `tmp`, `data`)
- [ ] No silent failures (validate after risky operations)
- [ ] API usage verified against documentation
- [ ] CSS Grid tables: header and data rows have matching classes (`grid-cols`, `gap`, `items-center`, `px`)

## Automated Checks

Hooks automatically:
- Format code with Prettier (JS/TS)
- Warn about console.log statements
- Run TypeScript checks (if tsconfig exists)
- **File size guard:** Warns at 400+ lines, blocks at 800+ lines (PostToolUse hook on Edit/Write)
- **Naming convention guard:** Warns when new source files use PascalCase/camelCase instead of kebab-case (PostToolUse hook on Write)

Fix warnings before committing.
