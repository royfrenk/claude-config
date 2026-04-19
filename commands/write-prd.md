# Write PRD

Interactively author a Product Requirements Document through section-by-section Q&A. Produces a non-technical, user-focused PRD ready for `/review-prd`.

---

## Overview

This command guides you through a structured PRD authoring process:

```
A. Kickoff — name the feature, create draft file
    ↓
B. Section-by-section Q&A (non-technical, product-focused)
   → TL;DR → Problem → Background → Users → Goals →
     Stories → Versions → Metrics → Open Questions → Out of Scope
    ↓
C. Review full draft, offer edits
    ↓
D. Save to docs/prds/YYYY-MM-DD-[slug].draft.md
    ↓
E. Offer /review-prd as the next step
```

**Key principles:**
- **Non-technical** — focus on users, outcomes, and stories. No architecture, no implementation details.
- **Background-linked** — surface prior research, docs, and references explicitly.
- **Versioned** — stories are grouped into v1/v2/v3 with ship criteria.
- **Point-in-time artifact** — once reviewed, PRDs are frozen. A new version gets a new file.

---

## Phase A: Kickoff

**Say:**
> "Let's write a PRD. I'll ask you one section at a time — non-technical, product-focused. We'll cover: problem, users, stories, versions, and metrics.
>
> First: what's the feature called? (I'll use this to generate a slug for the filename.)"

Once the user provides a name:

1. Generate a kebab-case slug (e.g., "Buyer Onboarding Flow" → `buyer-onboarding`)
2. Get today's date in `YYYY-MM-DD` format
3. Target path: `docs/prds/YYYY-MM-DD-[slug].draft.md`
4. Verify `docs/prds/` exists; if not, create it
5. Confirm with user: "I'll save this to `docs/prds/2026-04-08-buyer-onboarding.draft.md`. Ready to start?"

---

## Phase B: Section-by-Section Q&A

Ask one section at a time. Keep questions open-ended but specific. After each answer, draft that section and show it back before moving on. If the answer is thin, ask follow-ups before drafting.

### Section 1: TL;DR

**Ask:**
> "In 2-3 sentences: what is this feature, who is it for, and why does it matter now?"

**Draft format:**
```markdown
## TL;DR

[2-3 sentence summary]
```

### Section 2: Problem

**Ask:**
> "What pain are users hitting today? What's their current workaround? Why is now the right time to solve it?"

**Follow-ups if needed:**
- "Do you have data showing this is a problem? (support tickets, user feedback, metrics)"
- "Who has complained about this?"

**Draft format:**
```markdown
## Problem

**Current state:** [what users do today]

**Pain:** [what hurts about it]

**Why now:** [trigger — new data, competitive pressure, strategic shift]
```

### Section 3: Background & References

**Ask:**
> "What background should someone read before reviewing this PRD? Paste any links:
> - Research docs, user interviews, analytics dashboards
> - Competitor examples or inspiration
> - Prior PRDs or related features
> - Figma files or design explorations
> - Slack threads or meeting notes
>
> Anything that informed your thinking."

**Draft format:**
```markdown
## Background & References

- [Link 1] — [what it is, why relevant]
- [Link 2] — [what it is, why relevant]
- [Link 3] — [what it is, why relevant]
```

If user has no links, note it explicitly: `_No prior research or references._`

### Section 4: Users

**Ask:**
> "Who is this for?
> - **Primary user:** who will use this most?
> - **Secondary users:** anyone else affected?
> - **Not for:** who is this explicitly NOT targeting?"

**Draft format:**
```markdown
## Users

**Primary:** [persona + brief description]

**Secondary:** [persona + brief description]

**Not for:** [who this excludes and why]
```

### Section 5: Goals & Non-Goals

**Ask:**
> "Goals should be **outcomes**, not features. Bad: 'add a search bar.' Good: 'users find a home in <5 clicks.'
>
> - What does success look like? (3-5 outcomes)
> - What's explicitly out of scope? (Non-goals prevent scope creep.)"

**Draft format:**
```markdown
## Goals

- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

## Non-Goals

- [Explicit cut 1]
- [Explicit cut 2]
```

### Section 6: Key Stories

**Ask:**
> "Let's write user stories. Format: 'As a [user], I want to [action] so that [outcome].'
>
> Don't think about engineering tasks — think about what the user is trying to accomplish.
>
> What are the key stories? We'll group them by theme afterward."

After user provides stories, suggest theme groupings (e.g., Discovery, Evaluation, Transaction) and confirm.

**Draft format:**
```markdown
## Key Stories

### Theme: [Theme name]

- **story-1:** As a [user], I want to [action] so that [outcome].
- **story-2:** As a [user], I want to [action] so that [outcome].

### Theme: [Theme name]

- **story-3:** As a [user], I want to [action] so that [outcome].
- **story-4:** As a [user], I want to [action] so that [outcome].
```

**Important:** These are user stories, NOT engineering tasks. `/review-prd` will extract engineering-sized stories later.

### Section 7: Versions / Milestones

**Ask:**
> "Let's sequence the stories into versions.
>
> - **v1 (MVP):** what's the smallest thing that proves the core value? Which stories ship?
> - **v2:** what comes next? Why not v1?
> - **v3+:** anything further out?
>
> Each version should have a clear 'ship criteria' — how do we know it's done?"

**Draft format:**
```markdown
## Versions

| Version | Theme | Stories | Ship Criteria |
|---------|-------|---------|---------------|
| v1 (MVP) | [theme] | story-1, story-3 | [measurable criterion] |
| v2 | [theme] | story-2, story-5 | [measurable criterion] |
| v3 | [theme] | story-4 | [measurable criterion] |

### v1 Rationale
[Why these stories and not others?]

### v2 Rationale
[What's the trigger to start v2?]
```

### Section 8: Success Metrics

**Ask:**
> "How do we measure this worked?
>
> - **Leading indicators:** what will we see in days/weeks? (engagement, funnel completion, task time)
> - **Lagging indicators:** what will we see in months? (retention, revenue, NPS)"

**Draft format:**
```markdown
## Success Metrics

**Leading indicators:**
- [Metric 1] — target: [X]
- [Metric 2] — target: [X]

**Lagging indicators:**
- [Metric 1] — target: [X]
- [Metric 2] — target: [X]
```

### Section 9: Open Questions

**Ask:**
> "What don't you know yet? Things to validate with users, data, or research before (or during) implementation."

**Draft format:**
```markdown
## Open Questions

- [ ] [Question 1]
- [ ] [Question 2]
- [ ] [Question 3]
```

### Section 10: Out of Scope

**Ask:**
> "What will people ask about that we are explicitly NOT doing? This is different from Non-Goals — these are the FAQ items, the 'but what about X?' questions."

**Draft format:**
```markdown
## Out of Scope

- **[Topic]:** [why not now]
- **[Topic]:** [why not now]
```

---

## Phase C: Review Full Draft

Assemble the complete PRD and show it to the user.

**Say:**
> "Here's the full PRD. Review it end-to-end. Tell me what to change, add, or remove — or say 'looks good' to save it."

**Possible user responses:**
- "Looks good" → Proceed to Phase D
- "Change [section] to..." → Update and re-show
- "Add a section on [X]" → Discuss, add, re-show
- "Remove [X]" → Remove and re-show

Continue until user approves.

---

## Phase D: Save Draft

Save the PRD to **two places**:

1. **Markdown file** (source of truth): `docs/prds/YYYY-MM-DD-[slug].draft.md`
2. **Native Google Doc** (stakeholder review — wide tables render properly, comments, Pageless mode): created in the project's Drive PRD folder via the `google-docs` MCP.

**Why a native Google Doc (not DOCX):**
- Wide tables render cleanly — no column-wrapping-one-char-per-line like pandoc DOCX
- Stakeholders can comment inline, no download/upload dance
- Pageless mode handles long horizontal tables gracefully
- Updates go to the same Doc instead of creating a new DOCX every time

**Step 1 — Save the markdown** (always authoritative):

Use the Write tool to save to `docs/prds/YYYY-MM-DD-[slug].draft.md`.

**Step 2 — Create the native Google Doc:**

The project's Drive PRD folder ID should be in the project's `CLAUDE.md` under a "Drive" or "PRD Folder" section. If it's not there, search for it:

```
mcp__google-docs__searchDriveFiles(query: "name contains 'PRD' and mimeType = 'application/vnd.google-apps.folder'")
```

Once you have the folder ID, create the doc in a **single call** (do not chunk unnecessarily — `createDocument` accepts the full markdown as `initialContent`, and `replaceDocumentWithMarkdown` accepts up to 500KB):

```
mcp__google-docs__createDocument(
  title: "[Feature Name] PRD — YYYY-MM-DD",
  parentFolderId: "<folder id>",
  contentFormat: "markdown",
  initialContent: "<full PRD markdown>"
)
```

Returns `{ id, name, url }`. Store the URL — you'll surface it in Phase E.

**If the `google-docs` MCP is not connected:**
1. Check `claude mcp list` — if `google-docs` shows as disconnected, prompt the user: *"The google-docs MCP isn't connected. I can still save the markdown draft — want me to do that and skip the Google Doc for now?"*
2. Save the markdown regardless. Never silently skip either step.
3. Flag the Google Doc failure explicitly in the Phase E summary.

**Never save only the Google Doc** — the markdown file is always authoritative and must be committed to the repo.

### Updating an existing PRD

If the user is editing an existing PRD (the `.md` file already exists and already has a corresponding Google Doc), do NOT create a new Doc. Instead:

1. Find the existing Doc ID (check the Revision History footer of the markdown, or search the Drive folder by filename)
2. Use `mcp__google-docs__replaceDocumentWithMarkdown(documentId, markdown: <full PRD>)` to overwrite the Doc in place — up to 500KB in one call
3. Preserves the Doc URL, comments, and sharing settings

This is the path for iterative edits. A brand new PRD version (v2 of the same feature) gets a new dated file AND a new Google Doc.

**Full PRD template:**

```markdown
# PRD: [Feature Name]

**Status:** Draft
**Author:** [from git config]
**Created:** YYYY-MM-DD
**Slug:** [slug]

---

## TL;DR

[From Section 1]

---

## Problem

[From Section 2]

---

## Background & References

[From Section 3]

---

## Users

[From Section 4]

---

## Goals & Non-Goals

[From Section 5]

---

## Key Stories

[From Section 6]

---

## Versions

[From Section 7]

---

## Success Metrics

[From Section 8]

---

## Open Questions

[From Section 9]

---

## Out of Scope

[From Section 10]

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial draft | [author] |
```

---

## Phase E: Handoff to `/review-prd`

After saving, present the summary and offer the next step.

**Say:**
> "PRD saved:
> - `docs/prds/YYYY-MM-DD-[slug].draft.md` (source of truth, in repo)
> - [Google Doc](<doc url>) (native Google Doc in the Quo Drive PRD folder, for stakeholder review and comments)
>
> **Next step:** Run `/review-prd docs/prds/YYYY-MM-DD-[slug].draft.md` to review it from Technical / Design / Legal perspectives, then extract stories into Linear.
>
> Want me to run `/review-prd` now, or save for later?"

---

## Filename Conventions

| Status | Suffix | When |
|--------|--------|------|
| Draft | `.draft.md` | Being authored by `/write-prd` |
| Reviewed | `.reviewed.md` | Passed `/review-prd`, stories in Linear |
| Archived | `.archived.md` | Superseded by a newer version |

**The `.md` file is always the source of truth** and lives in the repo. Each PRD also has a corresponding **native Google Doc** in the Quo Drive PRD folder for stakeholder review and comments. On every save, the Google Doc is overwritten in place via `mcp__google-docs__replaceDocumentWithMarkdown` (preserves the URL, comments, and sharing settings). A new PRD version (v2 of the same feature) gets a new dated markdown file AND a new Google Doc.

**Versioning:** PRDs are point-in-time artifacts. A v2 of the same feature becomes a NEW dated file (e.g., `2026-04-08-buyer-onboarding.md` → `2026-09-15-buyer-onboarding.md`). Don't overwrite old PRDs.

---

## What This Command Does NOT Do

- **Does not make technical decisions** — no architecture, no API design, no data models. That's for Explorer/Plan-Writer after `/review-prd` extracts stories.
- **Does not create Linear issues** — that happens in `/review-prd` Phase G.
- **Does not start implementation** — implementation happens after `/review-prd` → `/sprint`.
- **Does not modify existing PRDs** — creates new dated files only.

---

## Quick Reference

| Phase | What Happens | User Action |
|-------|--------------|-------------|
| A | Kickoff, name feature | Provide feature name |
| B | Section-by-section Q&A | Answer 10 sections |
| C | Review full draft | Approve or request edits |
| D | Save to `docs/prds/` | Confirm save |
| E | Handoff to `/review-prd` | Run review now or later |

---

## Tips for Interactive Mode

- **Ask one section at a time.** Don't dump all 10 questions at once.
- **Draft after each answer** and show it back. Let the user correct before moving on.
- **Probe thin answers.** If the user says "users want to search better," ask: "Which users? Search for what? Better than what today?"
- **Keep it non-technical.** If the user drifts into implementation ("we'll use Elasticsearch"), redirect: "Let's capture that for the tech spec later — for now, what's the user outcome?"
- **Link everything.** Background & References is the most under-valued section. Push the user to share context docs.
- **Versions are a forcing function.** If the user wants 15 stories in v1, that's a signal to cut scope. Ask: "What's the smallest thing that proves this works?"
