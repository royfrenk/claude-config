---
description: Deep, multi-source, fact-checked research on any question — web search fan-out across complementary angles, adversarial 3-vote claim verification, synthesized and cited report. Automatically searches and transcribes podcast/interview appearances (via Recap Rabbit's relays) when the subject is a named public figure plausibly interviewed on podcasts. Use when the user wants deep research, a fact-checked report, "research this", "deep dive on X", "what's the truth about X", "find out everything about X".
---

## What this does

Runs the `deep-research` global Workflow: decomposes the question into 4-6 search angles (conditionally including a dedicated podcast/interview angle) → parallel web search per angle → fetch + extract falsifiable claims per source (podcast/video sources are transcribed via Recap Rabbit's relays instead of scraped as text) → 3-vote adversarial verification per claim → synthesized, cited report with confidence ratings, caveats, and open questions.

## Before running

If the question is underspecified for a good answer (e.g. missing budget/region/timeframe for something that needs it — "what car should I buy" with no use-case/budget), ask 2-3 clarifying questions first, then pass the refined question as `args`, weaving the answers in. Don't ask when the question is already specific enough to research directly.

## Running it

Call:
```
Workflow({ scriptPath: "/Users/royfrenkiel/.claude/workflows/deep-research.js", args: "<refined research question>" })
```

`scriptPath` is used deliberately (not `name`) — it's documented to take precedence and doesn't depend on any directory-resolution behavior for named workflows.

## Podcast/interview handling

The workflow's Scope step adds a dedicated "podcast/interview appearances" angle only when the subject is a **specific named individual** who is a public figure plausibly giving interviews (executive, founder, author, public speaker) — not for companies, products, or abstract topics, and not just because a subject is theoretically interviewable. When a search result looks like a podcast episode or video (YouTube, Buzzsprout, Apple Podcasts, Spotify episode/show, Overcast, Pocket Casts, Listen Notes, Podchaser, Anchor, Simplecast, Libsyn, Megaphone, Podbean, or a title containing "podcast"/"episode #N"), the Fetch step transcribes it via Recap Rabbit's relays (real Bash/curl access, not WebFetch) instead of scraping the show-notes page.

If transcript extraction fails for any source (relay unreachable, blocked by a host's bot-protection, episode not found), that's surfaced explicitly in the final report's caveats rather than silently dropped — don't read a thin report as "no podcast content exists" without checking whether extraction was attempted and failed.

See `~/.claude/guides/podcast-transcript-extraction.md` for the underlying mechanism, current known limitations, and manual fallback if you need to extract a transcript outside of this workflow.
