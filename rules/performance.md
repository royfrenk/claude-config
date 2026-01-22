# Performance Rules

Guidelines for context efficiency and code performance.

## Context Efficiency

Claude has a 200K token context window. Use it wisely.

### Selective File Reads

**Always:** Grep first, then read targeted lines.

```bash
# WRONG - Read entire file (2000 tokens)
Read src/services/auth.ts

# CORRECT - Find first, read specific lines (300 tokens)
Grep "validateToken" src/services/
Read src/services/auth.ts lines 45-80
```

### When to Use Each Tool

| Need | Tool | Why |
|------|------|-----|
| Find file by name | Glob | Fast, no content loaded |
| Find code pattern | Grep | Returns locations, not content |
| Read specific code | Read with line range | Minimal tokens |
| Understand full file | Read (no range) | Only when necessary |

### Agent Context Isolation

Subagents (Explorer, Plan-Writer) have **separate context**. They can:
- Read many files without bloating main context
- Return only summaries to main context

**Leverage this:** Let Explorer do heavy exploration.

## Checkpointing

After completing subtasks, checkpoint to spec file:

```markdown
## Checkpoint: [timestamp]
- Completed: [what you just finished]
- Key changes: [files modified]
- Next: [what's coming]
```

This survives context compaction.

**When to checkpoint:**
- After completing each subtask
- Before taking a break
- When hook reminds you (after 15+ edits)
- Before starting a different type of work

## MCP Hygiene

MCPs consume context even when not used.

**Per-project settings** — Disable unused MCPs:

```json
// In project's .claude/settings.json
{
  "disabledMcpServers": ["slack", "notion", "jira"]
}
```

**Rule of thumb:**
- Have many MCPs configured (flexibility)
- Enable only needed MCPs per project (efficiency)
- Linear is usually needed; others vary by project

## Code Performance

### Database Queries

```python
# WRONG - N+1 query
for user in users:
    orders = get_orders(user.id)  # Query per user

# CORRECT - Single query with join
users_with_orders = get_users_with_orders()
```

### Frontend Re-renders

```typescript
// WRONG - New object every render
<Component style={{ margin: 10 }} />

// CORRECT - Stable reference
const style = useMemo(() => ({ margin: 10 }), [])
<Component style={style} />
```

### Caching

Consider caching for:
- Expensive computations
- Repeated API calls
- Unchanged database queries

```typescript
const cached = useMemo(() => expensiveCalculation(data), [data])
```
