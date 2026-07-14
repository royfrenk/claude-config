# Review PRD

Review a Product Requirements Document thoroughly, extract stories, and create Linear issues after approval.

---

## Overview

This command guides you through a comprehensive PRD review process:

```
A. User uploads PRD
    ↓
B. Multi-perspective review (Technical, Design, Legal)
   → Ask questions, find holes, offer recommendations
    ↓
C. User answers questions
    ↓
D. Continue Q&A until user says "looks good"
    ↓
E. Extract stories (tmp-1, tmp-2, etc.)
   → Present for approval
    ↓
F. User approves (all or some)
    ↓
G. Create Linear issues + update roadmap.md
```

---

## Phase A: Receive PRD

User provides a PRD file or pastes content. Read it completely before proceeding.

**Say:**
> "I've read the PRD. I'll now review it from three perspectives: Technical, Design, and Legal. This will help identify gaps before we extract stories."

---

## Phase B: Multi-Perspective Review

Review the PRD using all three lenses. Reference the guides for detailed checklists.

### 1. Technical Review

Draw from EM, Explorer, and Reviewer agent traits:

**Scope & Clarity:**
- Are requirements specific enough to implement?
- What's explicitly in scope vs out of scope?
- Are there ambiguous terms that need definition?
- Are acceptance criteria measurable?

**Architecture & Integration:**
- What existing systems does this touch?
- Are there dependencies not mentioned?
- What happens when external services fail?
- Are there data migration considerations?

**Edge Cases & Error Handling:**
- What happens when [X] fails?
- What are the boundary conditions?
- How do we handle rate limits, timeouts, partial failures?
- What's the rollback plan?

**Testing & Quality:**
- How will we validate this works?
- What's the testing strategy (unit, integration, E2E)?
- Are there quality metrics defined?

**Cost & Performance:**
- Are there token/API cost implications?
- Are there performance requirements?
- What are the scaling considerations?

### 2. Design Review

Reference: Use `/design` command or `~/.claude/skills/design-*.md` based on context (marketing/applications/dashboards).

**User Experience:**
- Who is the primary user? Secondary users?
- What's their current workflow/workaround?
- Does the 3-second rule apply? (Where am I? What can I do? Why should I care?)

**States & Interactions:**
- Are all states defined? (Empty, Loading, Partial, Ideal, Error, Edge)
- What's the feedback for each user action?
- Are error messages helpful and actionable?

**Platform Considerations:**
- Web vs mobile differences addressed?
- Responsive breakpoints considered?
- Touch targets sized appropriately?
- Accessibility requirements defined?

**Design System:**
- Does this fit existing patterns?
- Are new components justified?
- Is there visual consistency?

**Delight & Polish:**
- Are there opportunities for delight?
- Does it feel fast and responsive?
- Would you enjoy using this?

### 3. Legal Review

Reference: `~/.claude/guides/legal.md`

**Privacy & Data:**
- What personal data is collected?
- Is each data point necessary?
- Is collection disclosed in privacy policy?
- What are the retention and deletion policies?
- Can user rights (access, delete, opt-out) be honored?

**Consumer Protection:**
- Are there subscription/billing features? (Check for dark patterns)
- Is cancellation as easy as signup?
- Are all claims truthful and substantiated?
- Are material terms conspicuous?

**Risk Flags:**
- Could this service attract children under 13?
- Is sensitive data involved (health, financial, biometric)?
- Are there competition/antitrust concerns?
- IP considerations (patents, trademarks, copyright)?

---

## Phase B Output

Present findings organized by perspective:

```markdown
## PRD Review: [PRD Name]

### Technical Questions
1. [Question about scope/clarity]
2. [Question about integration]
3. [Question about edge cases]

### Design Questions
1. [Question about UX]
2. [Question about states]
3. [Question about accessibility]

### Legal Considerations
1. [Risk or question about data]
2. [Risk or question about compliance]

### Recommendations
- [Suggestion 1]
- [Suggestion 2]

---

Please answer these questions. I may have follow-ups based on your answers.
```

---

## Phase C & D: Q&A Dialogue

Continue asking questions until the User says "looks good" or equivalent.

**Rules:**
- Review each answer — does it raise new questions?
- Be thorough but not pedantic
- Group related follow-ups together
- Acknowledge good answers, don't repeat
- If User poses questions, answer them using best practices from guides

**Transition phrase:**
> "Based on your answers, I have [N] follow-up questions..."

Or if satisfied:
> "Thanks — I think we've covered the key gaps. Ready to extract stories?"

---

## Phase D.5: Stitch Mockup Generation (Opt-In)

**When:** User says "looks good" and PRD contains UI features.

**Before extracting stories**, identify any UI screens described in the PRD. Ask the user once:

> "I see [N] UI screens in this PRD: [list feature names]. Should I generate Stitch mockups for these before extracting stories? (You can skip this and generate them during the sprint instead.)"

If the user declines or there are no UI screens → skip to Phase E.

**If the user says yes**, for each UI feature:

1. Call `mcp__stitch__generate_screen_from_text` with a description derived from the PRD's relevant section. **Generate only — do not run a self-review edit pass in this phase.**

2. On success, call `mcp__stitch__get_screen(screenId)` to get a fresh screenshot URL.

3. Ensure `docs/!project/DESIGN.md` exists. If not, create it from this template:
   ```markdown
   <!-- same template as new-project.md item 14 — update both if changed -->
   ## Design System
   **Stitch Design System ID:** (add when known — optional)

   ## Component Library

   ## Screen Inventory
   **Stitch Project ID:** (add project ID)

   | Feature | Screen Name | Screen ID | Status |
   |---------|-------------|-----------|--------|
   ```

4. Append a row to `## Screen Inventory` in DESIGN.md:
   `| {Feature} | {Screen Name} | {screenId} | ✅ Current |`
   (If `get_screen` fails for a screen, omit that row rather than writing a placeholder.)

5. In the PRD draft, annotate the story or stories corresponding to this UI feature with: `Visual reference: see DESIGN.md — {Feature}`

After all screens are processed, say: "Mockups generated and added to `docs/!project/DESIGN.md`. Proceeding to story extraction."

---

## Phase E: Extract Stories

Once Q&A is complete, extract actionable stories from the PRD.

**Story format:**

```markdown
## Extracted Stories

| ID | Title | Type | Description | Acceptance Criteria |
|----|-------|------|-------------|---------------------|
| tmp-1 | [Short title] | Backend | [What to build] | [How to know it's done] |
| tmp-2 | [Short title] | iOS | [What to build] | [How to know it's done] |
| tmp-3 | [Short title] | Web | [What to build] | [How to know it's done] |

### Story Details

#### tmp-1: [Title]
**Type:** Backend
**Description:** [Detailed description]
**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

#### tmp-2: [Title]
...
```

**Guidelines for story extraction:**
- Each story should be independently deliverable
- Stories should be sized for 1-3 day implementation
- Include clear acceptance criteria (measurable)
- Type should match where the work lives (Backend, iOS, Web, Full-stack)
- Don't create stories for "nice to haves" unless PRD explicitly includes them

**Present to User:**
> "I've extracted [N] stories from the PRD. Please review and tell me which to create in Linear."
> 
> "You can approve all, approve specific ones (e.g., 'approve tmp-1, tmp-3, tmp-5'), or request changes to any story."

---

## Phase F: User Approval

Wait for User to approve stories.

**Possible responses:**
- "Approve all" → Proceed to Phase G with all stories
- "Approve tmp-1, tmp-2, tmp-5" → Proceed with only those
- "Change tmp-3 to..." → Update story, re-present
- "Split tmp-2 into..." → Split and re-present
- "Remove tmp-4" → Remove from list

---

## Phase G: Create Issues

After approval, persist each approved story. First check whether Linear is enabled, then follow the matching branch.

### Step 1: Read Project Config

Read the project's `CLAUDE.md`:
- `linear_enabled` (**default: false if the field is missing** — identical to `/create-issue`)
- Issue prefix (e.g., `RAB`, `QUO`)
- Team ID + Status UUIDs (only needed when Linear is enabled)

**Branch:**
- `linear_enabled: false` (or missing) → **Branch A (no Linear)** below.
- `linear_enabled: true` → Steps 2–5 (Linear + roadmap), unchanged.

---

### Branch A: No Linear — Local IDs + Product Requirements specs

When Linear is disabled, each approved story becomes a local ticket whose full depth lives in a spec file (there's no Linear issue to hold it).

**1. Resolve the prefix** (same rule as `/create-issue`, inlined here because this command doesn't load create-issue.md at runtime):
- CLAUDE.md `Issue Prefix` → else roadmap `**Issue prefix:**` header, taking the **first whitespace-delimited token** after the label → else ask the user once and persist an `**Issue prefix:** <PREFIX>` line to the roadmap header.

**2. Allocate IDs as a sequential batch** (avoids the collision of reading the same `N` for every story):
- Read the roadmap `**Highest ticket:** PREFIX-N` field. If missing, scan the roadmap for `PREFIX-\d+`, take the **numeric** max (`0` if none), and plan to write the field right after the `**Issue prefix:**` line.
- For the **k approved stories in presentation order**, assign `PREFIX-(N+1) … PREFIX-(N+k)`.
- The `**Highest ticket:**` field is set **once** to `PREFIX-(N+k)` (the highest just-allocated ID).

**3. Write everything ATOMICALLY in ONE response** (the scan fallback keys off roadmap rows, not spec files — a partial write would let a re-run re-allocate the same IDs and overwrite specs):
- `Write` k spec files `docs/technical-specs/{ISSUE_ID}.md`, each using the `/create-issue` spec template: header with `**Status:** Requirements Captured` and `**Source:** /review-prd (no Linear) on [date]`, a `## Product Requirements` section (story description, acceptance criteria, `Source PRD:` link), then the exact `## Exploration` placeholder (`_To be added by Explorer during sprint work_`) and `## Implementation Plan` placeholder (`_To be added by Plan-Writer_`).
- `Edit` the roadmap: append k rows to the **first** heading matching `## Backlog` (case-insensitive prefix match; create a `## Backlog` before `## Recently Completed` if none exists), matching that roadmap's existing column shape and including a **Spec** cell linking each `technical-specs/{ISSUE_ID}.md`.
- `Edit` the roadmap header: set `**Highest ticket:** PREFIX-(N+k)`.

**4. Record the mapping** (Step 3 format) using the local IDs, then present the Step 5 summary. Skip Steps 2 and 4's Linear-specific calls entirely.

---

### Step 2: Create Issues (Linear enabled)

For each approved story:

```
mcp_linear_create_issue(
  teamId: "<from CLAUDE.md>",
  title: "[Story title]",
  description: "[Story description]\n\n**Acceptance Criteria:**\n- [ ] [Criterion 1]\n- [ ] [Criterion 2]\n\n**Source:** PRD review on [date]",
  labels: ["agent"]  // Always add "agent" label
)
```

### Step 3: Record Mapping

Track the mapping from tmp IDs to real issue IDs (Linear IDs when enabled, local `PREFIX-N` IDs in Branch A):

```markdown
## Issues Created

| Temp ID | Issue ID | Title |
|---------|----------|-------|
| tmp-1 | RAB-15 | [Title] |
| tmp-2 | RAB-16 | [Title] |
| tmp-3 | RAB-17 | [Title] |
```

### Step 4: Update Roadmap

Add new issues to the `docs/roadmap.md` Backlog. **Match the roadmap's actual backlog table columns** (they vary per project — e.g. `| ID | Title | Priority | Est | Context | Spec |`) rather than imposing a fixed shape, and include a **Spec** cell when the project keeps specs (Branch A always does). Append to the first `## Backlog*` heading; note the source PRD in the Context/Notes cell.

_(Branch A already writes these rows atomically in its own Step 3 — this step covers the Linear-enabled path.)_

### Step 5: Summary

Present final summary:

```markdown
## PRD Review Complete

**PRD:** [Name]
**Stories extracted:** [N]
**Issues created:** [N]

| Linear ID | Title | Type |
|-----------|-------|------|
| RAB-15 | [Title] | Backend |
| RAB-16 | [Title] | iOS |

**Next steps:**
- Issues are in Backlog
- Use `/sprint` or assign manually to start work
- Each issue will go through Explorer → Plan-Writer → Developer flow
```

---

## What This Command Does NOT Do

- **Does not modify the PRD** — PRD is a point-in-time artifact
- **Does not create spec files (Linear-enabled runs)** — That happens when Explorer runs on individual issues. _Exception:_ in **Branch A (no Linear)**, Phase G writes a `Requirements Captured` spec per story so the story depth isn't lost; Explorer later appends its exploration to that same file.
- **Does not start implementation** — Issues go to Backlog, normal workflow takes over

---

## Quick Reference

| Phase | What Happens | User Action |
|-------|--------------|-------------|
| A | Upload PRD | Provide file/content |
| B | Multi-lens review | Read questions |
| C | Answer questions | Respond to questions |
| D | Follow-ups | Continue until "looks good" |
| E | Story extraction | Review stories |
| F | Approval | Approve all/some/changes |
| G | Linear creation | Confirm completion |
