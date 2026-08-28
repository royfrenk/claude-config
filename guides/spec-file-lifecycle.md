# Technical Spec File Lifecycle Guide

Canonical source for how `docs/technical-specs/{ISSUE_ID}*.md` filenames track ticket
lifecycle state, and how any agent should resolve the actual filename before reading or
writing one. Read this before constructing a `docs/technical-specs/...` path from an issue
ID — the bare `{ISSUE_ID}.md` path is not always correct.

## The three states

| Suffix | Meaning | File example |
|--------|---------|---------------|
| *(none)* | Not yet started, or plan not yet approved | `RAB-175.md` |
| `.IN-PROCESS` | Actively being worked in the current sprint | `RAB-175.IN-PROCESS.md` |
| `.CLOSED` | Shipped and confirmed in `docs/roadmap.md`'s "Recently Completed" | `RAB-175.CLOSED.md` |

A ticket's content (exploration, plan, tasks, Functional Verification) never changes shape
because of this — only the filename suffix changes, via `mv`, never a copy. There is exactly
one file per issue ID at any time.

## Resolving a spec file path (read this before every `docs/technical-specs/{ID}...` access)

**Never assume the bare `{ISSUE_ID}.md` path exists.** Resolve it first:

```bash
ls docs/technical-specs/{ISSUE_ID}*.md
```

- **Exactly one match:** use it, whatever suffix it carries.
- **Zero matches:** the ticket has no local spec yet. If you are Explorer starting fresh
  work, create `{ISSUE_ID}.md` (no suffix) as normal. If you are any other agent expecting
  an existing spec, this is the "no spec exists" case each agent's own workflow already
  defines (e.g. Developer's "Check for spec file... if missing, STOP and ask EM").
- **More than one match:** this is a data-integrity bug (a rename left a stale duplicate
  behind, or two states exist at once) — do NOT silently pick one. Report it and stop; do
  not guess which file is current. This mirrors the sprint-file lifecycle bug this project
  hit once already (`sprint-044-....active.md` left behind alongside `.done.md` after
  closure) — the same failure mode, now guarded against here.

## Who renames, and when

**EM owns every rename** (single writer, avoids races with parallel Developer swarms):

1. **`{ID}.md` → `{ID}.IN-PROCESS.md`** — at sprint assignment (EM's "Step 4: Assign to
   Developer(s)"), immediately before dispatching Developer for that issue.
2. **`{ID}.IN-PROCESS.md` → `{ID}.CLOSED.md`** — at sprint closure, for every ticket EM
   moves into `docs/roadmap.md`'s "Recently Completed" section. Do this as part of the same
   step that updates the roadmap, not a separate pass — a ticket should never be `Recently
   Completed` in the roadmap while its spec file still says `.IN-PROCESS`.
3. **`{ID}.CLOSED.md` → `{ID}.IN-PROCESS.md`** (reopen) — if a closed ticket is reassigned
   (e.g. a regression reopens it), EM renames it back to `.IN-PROCESS` when assigning
   Developer, same as step 1. It never returns to the bare no-suffix state once it has
   shipped once.

**A ticket with no local spec file that gets picked up for the first time** goes through
Explorer as normal (creates the bare `{ID}.md`), then follows the states above from there.

## Abandoned `.IN-PROCESS` tickets

A ticket can be renamed `.IN-PROCESS` at sprint assignment and then never ship — the sprint
gets scrapped, reprioritized, or the ticket is dropped mid-work. Nothing in the happy-path
rename flow above returns it to a clean state, so it can sit `.IN-PROCESS` indefinitely with
no active sprint actually working it — invisible drift, the same failure class as a stale
roadmap link.

**Detection:** `~/.claude/commands/audit.md` should flag any `{ID}.IN-PROCESS.md` file where
`docs/roadmap.md`'s "Active Sprint" section does NOT currently reference that issue ID — that
combination means the file is stale, whether or not a sprint file exists to explain why.

**Resolution (EM decides, not an automatic rule):** rename back to bare `{ID}.md` if the
ticket is genuinely dropped and being returned to the backlog, or leave `.IN-PROCESS` and
reference it explicitly if a future sprint is expected to resume it soon. Either way, this
should never be silent — EM should log the decision (sprint file or roadmap.md note) so a
future reader isn't left guessing whether "still `.IN-PROCESS` after weeks" means "about to
resume" or "actually abandoned and no one updated the file."

**Interrupted sprint-closure renames:** if EM's sprint-closure step is interrupted partway
through a multi-issue batch (context compaction, session end), some tickets in that sprint
may end up `.CLOSED` while others are still `.IN-PROCESS` even though the sprint file itself
says the sprint closed. On resuming, EM should re-check every issue listed in the closed
sprint file against its actual current spec-file suffix before considering closure complete
— don't assume the rename step finished just because the sprint file says "done."

## Every Linear ticket gets a local spec

<!-- canonical: sync-roadmap.md --> As of this rule, every Linear issue should have a
matching `docs/technical-specs/{ID}*.md` file — even a minimal stub for backlog items no one
has explored yet. This is enforced in `~/.claude/commands/sync-roadmap.md` Step 2 ("Track
issues"): any Linear issue with no matching local file gets a stub spec created from the
issue's own title/description, not a full Explorer-quality spec. See that file for the exact
stub template.

**Why this exists:** a ticket can be filed in Linear, referenced in `docs/roadmap.md`'s
Backlog table, and sit there indefinitely with zero local trace until someone happens to run
`/sprint` on it. That gap is invisible until someone goes looking (as happened with RAB-178
in this project — filed, roadmap-listed, blocked on a dependency, but no local spec existed
at all, unlike its sibling tickets in the same initiative).
