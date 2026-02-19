# v0 Design Workflow for Claude Code

A guide for using Vercel's v0 as a visual design tool with Claude Code's agent workflow. Iterate on designs visually in v0.dev, then get pixel-perfect copies in your codebase.

---

## Why This Exists

When building UI features, you want to **see and interact with designs before committing to code**. v0.dev lets you iterate visually using natural language prompts. Claude Code then copies the approved design into your project verbatim.

**The problem it solves:** Without this, Claude generates UI from text descriptions — you don't see it until it's built. With v0, you preview and refine first.

---

## Prerequisites

1. **v0 Premium or Team plan** — API access requires a paid plan ([v0.app/chat/settings/billing](https://v0.app/chat/settings/billing))
2. **Claude Code** — with MCP support
3. **v0 MCP server** — connects Claude Code to v0's API
4. **A v0 design repo** — GitHub repo connected to v0.dev for version control

---

## Setup

### 1. Create a v0 Design Repo

Create a GitHub repo for v0 to commit designs to:

```bash
# Create repo on GitHub (private recommended)
gh repo create your-project-v0 --private

# Clone locally
git clone git@github.com:your-org/your-project-v0.git ~/Documents/repos/your-project-v0
```

Connect this repo to v0.dev in your v0 project settings. v0 will auto-commit to branches (one branch per chat).

### 2. Install the v0 MCP Server

```bash
# Clone the MCP server
git clone https://github.com/hellolucky/v0-mcp.git ~/v0-mcp
cd ~/v0-mcp
npm install
npm run build
```

### 3. Get Your v0 API Key

1. Go to [v0.dev](https://v0.dev) and sign in
2. Navigate to Settings > API
3. Generate an API key

### 4. Configure Claude Code

Add the MCP server to your Claude Code config. In `~/.claude.json` (or your project's `.claude.json`), add:

```json
{
  "mcpServers": {
    "v0-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/v0-mcp/dist/main.js"],
      "env": {
        "V0_API_KEY": "your-v0-api-key-here"
      }
    }
  }
}
```

### 5. Verify Setup

Restart Claude Code, then ask Claude to run `v0_setup_check`. You should see:

```
v0 API Setup Check Passed
Status: Connected
```

---

## How It Works

### The Workflow

```
Design-Planner creates design spec (goals, states, layout)
    |
    v
[Optional] You iterate on v0.dev
    |  - Prompt v0 with your design vision
    |  - Refine until it looks right
    |  - v0 auto-commits to your v0 repo
    |
    v
You say "v0 is done" + provide the component path
    |
    v
Explorer + Plan-Writer plan the technical implementation
    |
    v
Developer copies v0 visual code verbatim into your project
    |
    v
Reviewer verifies v0 fidelity (visual code matches source)
```

### The "Exact Copy" Rule

This is the core principle. When Developer implements a v0-approved design:

**Copied verbatim (never changed):**
- Tailwind classes
- Layout structure (flex, grid, positioning)
- Component hierarchy (nesting, order)
- Spacing values
- Colors

**Adapted to project conventions:**
- File names (e.g., `ProfilePage.tsx` -> `profile-page.tsx`)
- Component names (to match project patterns)
- Import paths (to match project structure)
- TypeScript types (v0 may skip these)
- Framework imports (e.g., `next/image` -> `<img>`, `next/link` -> your router's `<Link>`)

**Why?** v0 generates Next.js + React. Your project may use a different framework (Vite, Remix, etc.). The ~5% of framework-specific code must change, but the visual design — which is what you iterated on — transfers 1:1.

### When to Use v0

v0 iteration is **optional and user-driven**. Use it for:

- New screens or major layout changes
- Features where visual design matters and you want to preview first
- When you want to explore multiple design directions quickly

Skip it for:
- Small tweaks (adding a badge, changing a color)
- Backend-only work
- Bug fixes

**Trigger:** You explicitly tell Claude "let's go through v0 for this one." It's always your call.

---

## Two-Way Communication

| Direction | Method | When |
|-----------|--------|------|
| **Claude -> v0** | MCP tools (`v0_generate_ui`, `v0_chat_complete`) | Claude generates initial designs from descriptions |
| **v0 -> Claude** | Git repo (pull + read components) | You iterate on v0.dev, Claude reads the approved result |

**Typical flow:** You drive v0.dev manually. Claude reads the result and copies it.

**Alternative:** Ask Claude to generate a first pass via MCP, then refine on v0.dev yourself.

---

## Design Spec Integration

When v0 is used, the design spec gets a reference section:

```markdown
## v0 Reference (Optional)

**v0 Component Path:** your-project-v0/components/feature/my-component.tsx
**v0.dev URL (optional):** https://v0.dev/chat/...

**"Exact Copy" Rule:** The Developer MUST copy visual code verbatim from
the v0 component. Code conventions adapt to project standards.
```

This tells every downstream agent (Explorer, Plan-Writer, Developer, Reviewer) that v0 is the visual source of truth.

---

## Agent Responsibilities

| Agent | v0 Role |
|-------|---------|
| **Design-Planner** | Creates design spec, pauses for v0 if requested, records v0 reference |
| **Explorer** | Reads design spec (naturally picks up v0 reference) |
| **Plan-Writer** | Plans implementation (naturally reads v0 reference from spec) |
| **Developer** | Copies v0 visual code verbatim, adapts only code conventions |
| **Reviewer** | Verifies v0 fidelity — flags any visual code that was changed |
| **Design-Reviewer** | Uses v0 component as visual source of truth for screenshot comparison |

---

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `v0_generate_ui` | Generate components from text descriptions |
| `v0_generate_from_image` | Generate components from screenshots/images |
| `v0_chat_complete` | Iterative back-and-forth refinement |
| `v0_setup_check` | Verify API connectivity |

---

## Tips

- **Iterate in v0 until you're happy** — the whole point is to get the design right before building
- **Merge your v0 branch to main** before telling Claude "v0 is done" so the component path is stable
- **One component per v0 chat** keeps things clean — v0 creates one branch per chat
- **v0 uses shadcn/ui** — if your project also uses shadcn/ui, the Tailwind classes transfer perfectly
- **Save the v0.dev URL** in the design spec for future reference, even though the repo path is the source of truth

---

*Guide version: 2026-02-19*
