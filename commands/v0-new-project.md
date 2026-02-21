---
description: Initialize a v0.dev chat from the current project's GitHub repo so v0 sees all existing files.
---

# v0 New Project

Create a v0.dev chat initialized from this project's GitHub repo. v0 will see all existing files.

**Input:** $ARGUMENTS (design prompt — what to build/design)

## Prerequisites

- `V0_API_KEY` must be set in shell environment
- `v0-sdk` must be available (globally or in current project's node_modules)
- Current directory must be a git repo with a GitHub remote

## Process

### Step 1: Gather Context

1. **Get the GitHub repo URL:**
   ```bash
   git remote get-url origin
   ```
   Convert SSH URLs (`git@github.com:user/repo.git`) to HTTPS (`https://github.com/user/repo`). If no git remote found, ask the user for the repo URL.

2. **Get the current branch:**
   ```bash
   git branch --show-current
   ```
   If not on `main`/`master`, pass `--branch` to the script.

3. **Check for existing v0 project ID:**
   Read `CLAUDE.md` for a `v0 Project ID` field. If found, pass `--project-id` to the script.

4. **Determine the design prompt:**
   If `$ARGUMENTS` is provided, use it. Otherwise ask: "What would you like v0 to design?"

### Step 2: Run the Script

```bash
V0_API_KEY=$V0_API_KEY node ~/.claude/scripts/v0-init-repo.mjs \
  --repo "GITHUB_URL" \
  --branch "BRANCH" \
  --project-id "PROJECT_ID" \
  "DESIGN_PROMPT"
```

Omit `--branch` if on `main`. Omit `--project-id` if not found in CLAUDE.md.

### Step 3: Present Result

The script prints the v0.dev URL to stdout. Present it:

```
v0.dev chat created (repo-aware):
[URL]

v0 can see all files in the repo. Open in your browser to iterate visually.
When you're happy with the result, tell me "v0 is ready".
```

**STOP and wait** for "v0 is ready".

### Step 4: After User Returns

When user says "v0 is ready":
1. If a design spec exists, update its v0 Reference section with the chat URL
2. Otherwise, confirm and proceed

## Error Handling

- `V0_API_KEY` not set -> tell user to add `export V0_API_KEY="..."` to `~/.zshrc`
- `v0-sdk` not found -> tell user to run `npm install v0-sdk`
- No git remote -> ask for the GitHub repo URL manually
- Script fails -> show error, suggest checking V0_API_KEY

## Rules

- **Never generate UI code yourself.** This command exists for the User to iterate visually on v0.dev.
- **Always wait** for "v0 is ready" before proceeding.
- **Use `chats.init({ type: 'repo' })` not `chats.create()`** — the whole point is v0 sees the repo files.
