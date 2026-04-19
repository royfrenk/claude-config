# Stability Rules

Prevent recurring breakages by following these stability patterns.

**Detailed patterns, checklists, and code examples:** `~/.claude/guides/stability-patterns.md`
Read the relevant section (by number) when a row below applies to your current task.

**Also see:**
- `coding-style.md` for error handling patterns
- `security.md` for input/config validation
- `testing.md` for integration test requirements

## Quick Reference

| Issue Type | First Check | Prevention |
|------------|-------------|------------|
| **API Misuse** (Section 1) | Read official docs | Integration tests with real API |
| **Documentation Drift** (Section 2) | Search for all references | Startup config validation |
| **Race Conditions** (Section 3) | Test concurrently | Use transactions |
| **Configuration** (Section 4) | Validate at startup | No silent fallbacks |
| **Over-Engineering** (Section 5) | Count conditions/nesting | Simplify when > 3 levels |
| **External Service Failures** (Section 7) | Check timeout settings | 30s timeout + fallback + tracking |
| **Polling Loops** (Section 7) | Does it have a timeout? | `max_seconds` on every `while True` that polls external services |
| **WKWebView Layout** (Section 8) | Test on physical device | Flex column layout, 49px tab bar, no position:fixed, no self.view constraints |
| **WKWebView 3rd-Party CSS** (Section 14) | Inline style or stylesheet? | Numeric px via JS, never `calc()`+`env()` as inline strings |
| **Backend Data Mismatch** (Section 9) | Curl staging API during exploration | Verify actual response data, not just code |
| **Data Source Waterfall** (Section 10) | Build source x consumer matrix during exploration | Single utility with complete fallback chain |
| **Missing Data in Iteration** (Section 10) | Verify data EXISTS before adding SQL fallbacks | Diagnostic query first; if data doesn't exist -> UI placeholder, not more SQL |
| **External Model Output** (Section 11) | Is it committed? | Commit immediately if 5+ files or 200+ lines |
| **Sprint Issue Neglect** (Section 12) | Check all issues at batch 5/10/15/20 | Flag unblocked items that haven't been started |
| **Native iOS Menus** (Section 12b) | Which trigger? (tap vs long-press) | `UIAlertController` for tap, `UIContextMenuInteraction` for long-press only |
| **DB Driver Migration** (Section 13) | Curl staging API after deploy | Test writes + datetime types specifically |
| **LLM Cache Contract Drift** (Section 15) | Is cached payload versioned and validated? | Add `*_prompt_version` + contract gate + stale-cache regeneration |
| **CSS Grid Table Alignment** (Section 16) | Do header and data rows have matching classes? | Diff full class list: `grid-cols`, `gap`, `items-center`, `px` |
| **CTE Column Mismatch** (Section 17) | Does the explicit SELECT after the CTE include the new column? | Verify ALL query paths, not just the `columns` variable |
| **Stale Persisted Data** (Section 18) | Is this object stored in client-side persistence? | Async fallback or migration for missing fields on old persisted objects |
| **SQL-Derived Status** (Section 19) | Which columns does the `CASE WHEN` evaluate? | Write to the status-driving columns, not just the user-facing field |
| **Cross-Layer Schema Sync** (Section 20) | SQL <-> Pydantic <-> TypeScript all in sync? | When modifying SQL query, update Pydantic model + TypeScript interface |
| **Conditional Icon Alignment** (Section 21) | Do all rows reserve same space for action icons? | Invisible spacers or fixed-width containers for missing icons |
| **In-Memory Background Tasks** (Section 22) | Is this operation >60 seconds? | Use persistent queue (DB table), not `BackgroundTasks`; add startup recovery for orphaned jobs |
| **LLM Single-Shot Overload** (Section 23) | Does the prompt have 4+ distinct objectives? | Decompose into focused steps; separate "what's important" from "where is it" |
| **Pipeline Blind Building** (Section 24) | Does this feature depend on a pipeline? Is it healthy? | Verify pipeline health before building; "all N failed" = root-cause, not UX fix |
| **Unfamiliar Domain Cascade** (Section 25) | Has the agent worked in this domain before? | Research all constraints BEFORE fixing; build checklist; don't serial-discover |
| **Generated File Verification** (Section 26) | Was actual file content inspected? | Download + inspect output (pdftotext, render image); HTTP 200 is not enough |
