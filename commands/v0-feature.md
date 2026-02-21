---
description: Create a v0.dev chat for a new feature in an existing v0 project.
---

# v0 Feature

Add a new feature chat to an existing v0 project. v0 sees the project's files and context.

**Input:** $ARGUMENTS (feature description — what to build)

## Prerequisites

- `V0_API_KEY` must be set in shell environment
- `v0-sdk` must be available (globally or in current project's node_modules)
- An existing v0 project (with a known project ID)

## Process

### Step 1: Gather Context

1. **Get the v0 project ID:**
   Read `CLAUDE.md` for a `v0 Project ID` field. If not found, list projects:
   ```bash
   V0_API_KEY=$V0_API_KEY node -e "
     import { v0 } from 'v0-sdk';
     const projects = await v0.projects.find();
     projects.data.forEach(p => console.log(p.id + ' - ' + p.name));
   "
   ```
   Ask user to pick one, or suggest `/v0-new-project` first.

2. **Determine the feature description:**
   If `$ARGUMENTS` is provided, use it. Otherwise ask: "What feature would you like v0 to build?"

3. **Check for system prompt in CLAUDE.md:**
   Look for a `v0 System Prompt` field. If found, pass as `--system`.

### Step 2: Run the Script

```bash
V0_API_KEY=$V0_API_KEY node ~/.claude/scripts/v0-feature-chat.mjs \
  --project-id "PROJECT_ID" \
  "FEATURE_DESCRIPTION"
```

Add `--system "..."` if a custom system prompt was found.

### Step 3: Present Result

```
v0.dev feature chat created:
[URL]

Connected to your v0 project. Open in your browser to iterate visually.
When you're happy with the result, tell me "v0 is ready".
```

**STOP and wait** for "v0 is ready".

### Step 4: After User Returns

Same as `/v0-new-project` Step 4.

## Error Handling

- No v0 project ID and no projects exist -> suggest `/v0-new-project` first
- `V0_API_KEY` not set -> tell user to add it to `~/.zshrc`
- `v0-sdk` not found -> tell user to run `npm install v0-sdk`
- Invalid project ID -> show error, list valid projects

## Rules

- **Never generate UI code yourself.** This command exists for the User to iterate visually on v0.dev.
- **Always wait** for "v0 is ready" before proceeding.
- **Uses `chats.create()` with `projectId`** — project association gives v0 file awareness.
