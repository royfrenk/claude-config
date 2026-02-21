---
description: Create a v0.dev chat for a new feature in an existing v0 project.
---

# v0 Feature

Add a new feature chat to an existing v0 project. v0 sees the project's files and context.

**Input:** $ARGUMENTS (feature description -- what to build)

## Prerequisites

- `V0_API_KEY` must be set in shell environment
- Node 18+ (for built-in `fetch`)
- An existing v0 project (with a known project ID)

## Process

### Step 1: Gather Context

1. **Get the v0 project ID:**
   Read `CLAUDE.md` for a `v0 Project ID` field (look for patterns like `v0 Project ID`, `v0 project`, `prj_`). If NOT found, ask the user:

   ```
   No v0 Project ID found in CLAUDE.md.
   What is the v0 project ID? (Find it at v0.dev in your project settings.)
   ```

   If the user doesn't know their project ID, suggest `/v0-new-project` to create a new project-linked chat instead.

   If the user provides a project ID, suggest adding it to CLAUDE.md for future use:
   ```
   Tip: Add this to CLAUDE.md so future v0 commands find it automatically:
   | v0 Project ID | prj_xxx |
   ```

2. **Determine the feature description:**
   If `$ARGUMENTS` is provided, use it as the starting point. Otherwise ask: "What feature would you like v0 to build?"

3. **Check for system prompt in CLAUDE.md:**
   Look for a `v0 System Prompt` field. If found, pass as `--system`.

4. **Ensure V0_API_KEY is available:**
   ```bash
   echo "${V0_API_KEY:0:5}"
   ```
   If empty, try sourcing the shell profile:
   ```bash
   source ~/.zshrc && echo "${V0_API_KEY:0:5}"
   ```
   If still empty, tell the user to add `export V0_API_KEY="v0_..."` to `~/.zshrc`.

### Step 2: Gather Real Feature Content

**CRITICAL: v0 produces generic placeholder content unless you give it real data.**

Before building the prompt, read relevant source files to understand the feature context:

1. **Read existing code for the feature area:**
   - Find existing components, pages, or modules related to the feature
   - Note real field names, prop types, data structures
   - Note existing UI patterns (what components are already used)

2. **Extract real content for the feature:**
   Examples:
   - A settings page: read existing settings keys, user profile fields, actual option values
   - A dashboard widget: read actual metric names, data format, existing chart types
   - A new form: read the data model to know real field names, validation rules, option lists
   - A navigation change: read existing nav items, route names, page titles

3. **Build the prompt with real content embedded:**
   Take the user's feature description and enrich it with real data from the codebase. For example:

   Instead of: "Add a settings page"

   Send: "Add a settings page for Recap Rabbit. The user model has fields: displayName, email, preferredPlaybackSpeed (0.5x-3x), autoBookmark (boolean), theme (light/dark/system). Existing pages use shadcn/ui Card components with the app's teal accent color. Match the layout pattern from the existing Profile page at src/pages/profile.tsx."

   **Rules for the prompt:**
   - Include real field names, component names, data structures
   - Reference existing code patterns the feature should match
   - Include actual content values, not placeholders
   - Keep the total prompt under 4000 characters

### Step 3: Run the Script

```bash
V0_API_KEY=$V0_API_KEY node ~/.claude/scripts/v0-feature-chat.mjs \
  --project-id "PROJECT_ID" \
  "ENRICHED_FEATURE_DESCRIPTION"
```

Add `--system "..."` if a custom system prompt was found.

### Step 4: Present Result

```
v0.dev feature chat created:
[URL]

Connected to your v0 project. Open in your browser to iterate visually.
When you're happy with the result, tell me "v0 is ready".
```

**STOP and wait** for "v0 is ready".

### Step 5: After User Returns

Same as `/v0-new-project` Step 5.

## Error Handling

- No v0 project ID and user doesn't have one -> suggest `/v0-new-project` first
- `V0_API_KEY` not set -> tell user to add it to `~/.zshrc`
- Script fails with 401 -> tell user to check V0_API_KEY is valid
- Invalid project ID -> show error, ask user to verify the ID at v0.dev

## Rules

- **Never generate UI code yourself.** This command exists for the User to iterate visually on v0.dev.
- **Always wait** for "v0 is ready" before proceeding.
- **Always include real project content** in the prompt -- never send generic descriptions.
- **Uses `chats.create()` with `projectId`** -- project association gives v0 file awareness.
