---
description: Initialize a v0.dev chat from the current project's GitHub repo so v0 sees all existing files.
---

# v0 New Project

Create a v0.dev chat initialized from this project's GitHub repo. v0 will see all existing files.

**Input:** $ARGUMENTS (design prompt -- what to build/design)

## Prerequisites

- `V0_API_KEY` must be set in shell environment
- Node 18+ (for built-in `fetch`)
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
   Read `CLAUDE.md` for a `v0 Project ID` field (look for patterns like `v0 Project ID`, `v0 project`, `prj_`). If found, pass `--project-id` to the script. If NOT found, ask the user:

   ```
   No v0 Project ID found in CLAUDE.md.
   What is the v0 project ID? (Find it at v0.dev in your project settings.)
   Or say "none" to create a chat without a project.
   ```

   If the user provides a project ID, suggest adding it to CLAUDE.md for future use:
   ```
   Tip: Add this to CLAUDE.md so future v0 commands find it automatically:
   | v0 Project ID | prj_xxx |
   ```

4. **Determine the design prompt:**
   If `$ARGUMENTS` is provided, use it as the starting point. Otherwise ask: "What would you like v0 to design?"

5. **Ensure V0_API_KEY is available:**
   ```bash
   echo "${V0_API_KEY:0:5}"
   ```
   If empty, try sourcing the shell profile:
   ```bash
   source ~/.zshrc && echo "${V0_API_KEY:0:5}"
   ```
   If still empty, tell the user to add `export V0_API_KEY="v0_..."` to `~/.zshrc`.

### Step 2: Gather Real Project Content

**CRITICAL: v0 produces generic placeholder content ("Chapter 1", "Lorem ipsum") unless you give it real data.**

Before building the prompt, read the project's content sources and extract real data:

1. **Read key project files:**
   - `CLAUDE.md` -- project overview, tech stack, structure
   - `README.md` -- project description, features list
   - `docs/PROJECT_STATE.md` -- current state, endpoints, schema
   - `package.json` -- project name, description, dependencies

2. **Identify domain content:**
   Look for the project's actual content (not code structure). Examples:
   - A podcast app: episode titles, show descriptions, chapter names
   - A SaaS app: feature names, pricing tiers, user roles
   - A landing page: product name, tagline, value propositions, section headings
   - A dashboard: metric names, data categories, navigation items

   Read the relevant source files (data files, seed data, content configs, database schema for entity names).

3. **Build the prompt with real content embedded:**
   Take the user's design prompt and enrich it with the real data you found. For example:

   Instead of: "Create a landing page for a podcast app"

   Send: "Create a landing page for Recap Rabbit, a podcast chapter navigation app. Use these real chapter titles: 'The AI Revolution', 'Building in Public', 'Startup Metrics'. The app has features: Chapter-level bookmarks, AI summaries, Cross-podcast search. Tagline: 'Jump to what matters.'"

   **Rules for the prompt:**
   - Include real names, titles, descriptions -- never placeholders
   - Include real feature lists, navigation items, section headings
   - Include the project's actual color scheme or brand if known
   - If you found 20+ items, pick the 5-8 most representative ones
   - Keep the total prompt under 4000 characters

### Step 3: Run the Script

```bash
V0_API_KEY=$V0_API_KEY node ~/.claude/scripts/v0-init-repo.mjs \
  --repo "GITHUB_URL" \
  --branch "BRANCH" \
  --project-id "PROJECT_ID" \
  "ENRICHED_DESIGN_PROMPT"
```

Omit `--branch` if on `main`. Omit `--project-id` if user said "none" or not available.

### Step 4: Present Result

The script prints the v0.dev URL to stdout. Present it:

```
v0.dev chat created (repo-aware):
[URL]

v0 can see all files in the repo. Open in your browser to iterate visually.
When you're happy with the result, tell me "v0 is ready".
```

**STOP and wait** for "v0 is ready".

### Step 5: After User Returns

When user says "v0 is ready":
1. If a design spec exists, update its v0 Reference section with the chat URL
2. Otherwise, confirm and proceed

## Error Handling

- `V0_API_KEY` not set -> tell user to add `export V0_API_KEY="v0_..."` to `~/.zshrc`
- No git remote -> ask for the GitHub repo URL manually
- Script fails with 401 -> tell user to check V0_API_KEY is valid
- Script fails with other error -> show the error message from stderr

## Rules

- **Never generate UI code yourself.** This command exists for the User to iterate visually on v0.dev.
- **Always wait** for "v0 is ready" before proceeding.
- **Always include real project content** in the prompt -- never send generic descriptions.
- **Use `chats.init({ type: 'repo' })` not `chats.create()`** -- the whole point is v0 sees the repo files.
