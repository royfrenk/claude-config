# PROJECT_STATE.md Update Protocol

How and when Developer updates PROJECT_STATE.md after deployments.

---

## When to Update

After automated staging verification passes (Phase 6, Step 5):

1. **Add new files** to the file structure section
2. **Remove fixed items** from known issues
3. **Add entry** to recent changes log
4. **Update deployment info** if URLs or config changed

## What to Update

### File Structure

Add any new directories or key files created during implementation:

```markdown
## File Structure
src/
  auth/           # Authentication (NEW)
    login.tsx
    callback.tsx
  episodes/
    ...
```

### Recent Changes

Add a brief entry:

```markdown
## Recent Changes

- [YYYY-MM-DD] [ISSUE-ID]: [1-line summary of what changed]
```

### Known Issues

Remove items that were fixed in this sprint. Add any new known issues discovered.

### Environment Variables

If new required env vars were added:

```markdown
## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEW_VAR | Yes | [what it does] |
```

## Rules

- Keep PROJECT_STATE.md concise (developers read it for quick orientation)
- Don't duplicate spec file content
- Update AFTER successful deployment, not before
- If deployment is reverted, revert PROJECT_STATE.md too
