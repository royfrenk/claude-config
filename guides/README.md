# Claude Code Guides

Domain-specific implementation guides. These are **NOT auto-loaded** — agents must explicitly read them when working on relevant tasks.

## When to Use Guides

Guides provide detailed patterns and examples for specific domains. Use them:
- When implementing features in that domain
- When reviewing code in that domain
- When debugging issues related to that domain

**Guides are MANDATORY reading** before implementing in these domains. See `developer.md` Phase 2 Step 1 for enforcement.

---

## Domain Guides

### Database Patterns
**File:** `database-patterns.md`

**When to read:**
- Migrations, queries, caching, indexing
- Schema design
- Performance optimization

**Key topics:**
- Indexing strategy (from Quo: <500ms cached searches)
- SQL.js anti-pattern (use PostgreSQL from start)
- Two-tier caching (DB + client SWR)
- 7-day cache expiration strategy
- Scaling to 100K+ records

**Critical lesson:** Always index frequently queried fields. Performance: 2-3s → <500ms.

---

### Frontend Patterns
**File:** `frontend-patterns.md`

**When to read:**
- Responsive design
- UI components, styling
- Figma implementation

**Key topics:**
- Test at EXACT breakpoints (1270px, 1000px, 900px, 630px)
- Figma side-by-side implementation
- CSS variables vs Tailwind
- Component organization (by feature, not type)
- Touch interactions (44px minimum)

**Critical lesson:** Don't assume "works on mobile/desktop." Test intermediate sizes. Budget 5-7 iterations.

---

### API Integration Patterns
**File:** `api-integration-patterns.md`

**When to read:**
- External APIs
- Environment variables
- Error handling, fallbacks

**Key topics:**
- ALWAYS `.trim()` env vars (from Quo whitespace bug)
- Request-time reading (not module-load)
- Primary + simple fallback (avoid cross-API matching)
- Email service test mode limitations
- Vercel env vars: Set in ALL environments (Production + Preview)

**Critical lesson:** Whitespace in env vars causes "Invalid header" errors. ALWAYS trim.

---

### Testing Patterns
**File:** `testing-patterns.md`

**When to read:**
- E2E tests, unit tests
- Mocking strategies
- Test coverage decisions

**Key topics:**
- >70% coverage from day 1 (not retroactive)
- E2E only for critical paths (auth, payments, core journeys)
- Launch vs iteration (new feature = E2E, iteration = manual)
- Playwright best practices
- 87% coverage achieved (Expensinator)

**Critical lesson:** Write tests DURING implementation, not after. Manual verification for UI-heavy features.

---

### Code Performance
**File:** `code-performance.md`

**When to read:**
- Database optimization
- Frontend rendering
- Caching strategies

**Key topics:**
- N+1 query prevention
- Memoization patterns
- Two-tier caching (PostgreSQL + SWR)
- PostgreSQL vs Redis decision
- Scaling to 100K+ properties

**Critical lesson:** PostgreSQL over Redis for simplicity (one database, persistent, queryable).

---

### Google Auth
**File:** `google-auth.md`

**When to read:**
- Google OAuth setup (web or iOS)
- Token verification, audience configuration
- Capacitor native plugin bridge

**Key topics:**
- Token audience matching (iOS Client ID vs Web Client ID)
- Capacitor local plugin registration (not auto-discovered)
- Callback URL triple-check (Console, code, env var)
- CapacitorHttp for CORS bypass on iOS
- Passport.js profile validation at boundary

**Critical lesson:** The token `aud` field must match backend `GOOGLE_CLIENT_ID` exactly. When supporting both web and iOS, set `serverClientID` so both platforms produce the same audience.

---

## Existing Guides (Non-Domain)

### Agent Teams
**File:** `agent-teams.md`

**Purpose:** How to work with parallel agent teams

**When to read:** When spawned as part of a team

---

### Codex Peer Review
**File:** `codex-peer-review.md`

**Purpose:** OpenAI Codex peer review process

**When to read:** At sprint end (optional peer review)

---

### Design
**File:** `design.md`

**Purpose:** Design principles and patterns

**When to read:** When designing new features or systems

---

### Legal
**File:** `legal.md`

**Purpose:** Legal and compliance guidelines

**When to read:** When handling user data, contracts, or legal documents

---

## Guide Usage in Agent Workflows

### Developer Agent

**Phase 2 Step 1 (MANDATORY):**

Before writing any code, identify task type and read relevant guide(s):

- Database work → `database-patterns.md`
- Frontend work → `frontend-patterns.md`
- Google Auth / OAuth → `google-auth.md`
- API integration → `api-integration-patterns.md`
- Testing → `testing-patterns.md`
- Code performance → `code-performance.md`

**Use the Read tool to read the guide before implementing.**

### Reviewer Agent

**Step 3A (MANDATORY):**

Before reviewing code, identify task type and verify compliance with relevant guide:

- Database work → Verify indexing, caching, no SQL.js
- Frontend work → Verify breakpoint testing, Figma match
- Google Auth / OAuth → Verify token audience, plugin registration, callback URL consistency
- API integration → Verify `.trim()`, request-time reading, fallback strategy
- Testing → Verify >70% coverage, E2E for critical paths only

**Use the Read tool to read the guide before reviewing.**

---

## Guide Maintenance

**When to update guides:**
- New learnings from projects (add to relevant guide)
- Common mistakes discovered (add to anti-patterns section)
- New patterns validated (add as recommended approach)

**How to update:**
1. Edit guide file directly
2. Add to relevant section with project reference
3. Update this README if adding new guide
4. Sync to claude-config repo

**Version control:**
- Guides live in `~/.claude/guides/`
- Synced to `~/Documents/repos/claude-config/guides/`
- Git tracked for history

---

## See Also

- Rules (auto-loaded): `~/.claude/rules/`
- Agent prompts: `~/.claude/agents/`
- Commands: `~/.claude/commands/`
