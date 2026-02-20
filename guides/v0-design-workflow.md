# v0 Design Workflow

Integration between Claude Code agents and Vercel v0 for visual UI iteration.

---

## Overview

This workflow lets you design UI components visually in v0.dev with your project's design system as context, then pull the result back into your codebase.

**Key principle:** v0 is the visual design tool. Claude Code is the integration tool. You iterate in v0's UI, not in the terminal.

---

## Flow

```
DESIGN PLANNER                    YOU                     DEVELOPER
     |                             |                          |
     |  1. Generate v0 prompt      |                          |
     |     from design spec        |                          |
     |                             |                          |
     |  2. Call v0_start_design    |                          |
     |     (prompt + projectId)    |                          |
     |                             |                          |
     |  3. Return v0.dev link  --> |                          |
     |     in the design spec      |                          |
     |                             |                          |
     |                       4. Click link                    |
     |                          Iterate in v0 UI              |
     |                          "make text bigger"            |
     |                          "add RTL support"             |
     |                          Until happy                   |
     |                             |                          |
     |                       5. "pull from v0"                |
     |                             |                          |
     |                             |   6. v0_pull_files   --> |
     |                             |      Save to staging     |
     |                             |      Integrate into app  |
     |                             |      Deploy to staging   |
     |                             |                          |
     |                             |   7. "Here's staging" <--|
     |                             |      [staging URL]       |
     |                             |                          |
     |                       8. Verify on staging             |
```

---

## MCP Tools

### `v0_start_design`

Creates a v0 chat linked to the project. Returns a clickable v0.dev URL.

**Called by:** Design Planner (as final step of design spec creation)

**Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | — | The design prompt (generated from the design spec) |
| `projectId` | string | No | `prj_ACyvfB3acSo5hZxVyTRuOzPKH858` | v0 project ID |
| `name` | string | No | — | Chat name for identification |

**Returns:**
- `webUrl` — Link to v0.dev chat (the main deliverable)
- `chatId` — Chat identifier (needed for `v0_pull_files`)
- `apiUrl` — API endpoint for the chat

**Example output:**
```
v0 Design Session Created

Link: https://v0.dev/chat/b/abc123
Chat ID: abc123
Project: prj_ACyvfB3acSo5hZxVyTRuOzPKH858

Open the link to preview and iterate on the design.
When done, tell me "pull from v0" to integrate the result.
```

### `v0_pull_files`

Fetches the latest generated files from a v0 chat and saves them to the staging folder.

**Called by:** Developer (when user says "pull from v0")

**Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `chatId` | string | Yes | — | The chat ID from `v0_start_design` |
| `outputDir` | string | No | `src/components/v0/` | Where to save pulled files |

**Returns:**
- List of files saved with paths
- File contents summary

**Behavior:**
1. Calls `GET /v1/chats/:id/messages` to get the latest version
2. Extracts file contents from the response
3. Saves each file to `outputDir`
4. Returns the file list so Developer can integrate

### `v0_list_chats`

Lists recent v0 chats for the project. Useful when Developer needs to find which chat to pull from.

**Called by:** Any agent

**Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `projectId` | string | No | `prj_ACyvfB3acSo5hZxVyTRuOzPKH858` | v0 project ID |

**Returns:**
- List of chats with: name, chatId, webUrl, last updated

---

## Sprint Process Integration

### Design Planner — New Final Step

After creating the design spec, Design Planner:

1. Generates a v0 prompt from the spec (component description, colors, props interface, constraints)
2. Calls `v0_start_design` with the prompt
3. Adds the v0 link and chat ID to the design spec:

```markdown
## v0 Design Session

**Link:** https://v0.dev/chat/b/abc123
**Chat ID:** abc123

Iterate on the design in v0, then tell Claude "pull from v0" when ready.
```

### Developer — New Pre-Implementation Step

When the design spec contains a v0 link and the user says "pull from v0":

1. Read the chat ID from the design spec
2. Call `v0_pull_files` with the chat ID
3. Files are saved to `src/components/v0/`
4. Adapt the pulled component to project conventions (imports, naming, file location)
5. Integrate into the app
6. Deploy to staging

---

## Configuration

### v0 Project

| Setting | Value |
|---------|-------|
| Project ID | `prj_ACyvfB3acSo5hZxVyTRuOzPKH858` |
| Repo | `royfrenk/recap-rabbit` |

### MCP Server

| Setting | Value |
|---------|-------|
| Location | `~/.claude/v0-mcp/` |
| Entry | `node ~/.claude/v0-mcp/dist/main.js` |
| Env | `V0_API_KEY` (in ~/.zshrc) |

### API Endpoints (v0 Platform API)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/chats` | POST | Create chat (v0_start_design) |
| `/v1/chats/:id/messages` | POST | Send follow-up message |
| `/v1/chats/:id/messages` | GET | Get chat messages/files (v0_pull_files) |

**Base URL:** `https://api.v0.dev`

**Auth:** `Bearer {V0_API_KEY}` header

---

## Staging Folder Convention

Pulled v0 files go to: `src/components/v0/`

This folder is:
- A temporary staging area, not a permanent home
- Files here are waiting to be integrated by the Developer
- After integration, the original files in `v0/` can be deleted
- Not committed to git (add to .gitignore if desired)

---

## What This Replaces

| Before (broken) | After (this workflow) |
|---|---|
| MCP generates code as text, no preview | MCP creates v0 chat, you get a live preview link |
| No repo context, generic components | Chat linked to project, uses your design system |
| No iteration — take it or leave it | Full v0 UI for visual iteration |
| User copy-pastes between v0 and Claude | "pull from v0" automates the handoff |
