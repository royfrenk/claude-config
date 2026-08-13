# Podcast Transcript Extraction — Using Recap Rabbit's Pipeline

**SOURCE OF TRUTH** for the relay endpoints, request shapes, and known limitations used by the global `deep-research` workflow (`~/.claude/workflows/deep-research.js`'s `PODCAST_FETCH_PROMPT`) and command (`~/.claude/commands/deep-research.md`). If any endpoint, token, or limitation changes, update this file, that script, and `Companies/Andela/Podcast-Transcript-Extraction-Guide.md` (a project-history pointer copy) together.

**Purpose:** Roy's own project, **Recap Rabbit** (`/Users/royfrenkiel/Documents/repos/recap-rabbit` — a podcast knowledge-graph/summarization app), already runs several always-on transcript-extraction services. This guide documents how to call them directly for **ad-hoc research** (e.g., pulling a source's public podcast appearance for background research) without touching the app's database or UI at all — usable from any project, not just the one this was first built for.

**First written:** Aug 12, 2026, during interview-prep research for Andela — the originating case (SD Times "What the Dev?" episode 360, Barun Singh of Andela) is preserved as a worked example throughout. Formalized as a global guide + workflow the same day.

---

## 0. Decision tree — which service to use

| Source | Use |
|---|---|
| YouTube video | **§1 yt_relay** — fast, pulls existing captions, no transcription needed |
| Podcast with a direct audio/MP3 URL | **§2 whisper_relay** — downloads + transcribes locally (whisper large-v3) |
| Podcast you're subscribed to in Apple Podcasts on the Mac mini | **§3 Apple transcript scripts** — free, pulls Apple's own pre-made transcript, but "opportunistic-only" |
| Want it permanently searchable/summarized in the app | **§4 full ingestion pipeline** — overkill for a one-off, use for anything you'll want to query again |

All of §1–§3 run on Roy's Mac mini, reachable via Tailscale at `100.65.52.72` (user `joshuabot195`), independent of the recap-rabbit app/database. They can be called from any machine on the Tailnet (or, for yt_relay, from anywhere — it's tunneled publicly).

---

## 1. YouTube — `yt_relay`

- **Public endpoint:** `https://yt-relay.recaprabbit.com/transcript?video_id=<ID>&languages=en`
- **Auth:** header `Authorization: Bearer recaprabbit_yt_2026` (configurable via `YT_API_TOKEN` env var on the relay)
- **Returns:** `{"segments": [{"start": ..., "end": ..., "text": ..., "speaker": null}], "language": "en", "is_generated": true}`
- **Source:** `scripts/yt_relay.py` — wraps `youtube_transcript_api`, pulls YouTube's existing caption track (auto-generated or human). Does **not** transcribe from audio — fast (seconds), free.
- **Why it runs from a home Mac mini instead of being called directly:** YouTube blocks caption fetches from many datacenter/cloud IPs; routing through a residential IP avoids that.
- **Example:**
  ```bash
  curl -H "Authorization: Bearer recaprabbit_yt_2026" \
    "https://yt-relay.recaprabbit.com/transcript?video_id=VIDEO_ID&languages=en"
  ```
- Confirmed reachable Aug 12, 2026 (`GET /health` → `{"status":"ok"}`).

---

## 2. Arbitrary podcast/audio URL — `whisper_relay` (the general-purpose tool)

- **Internal endpoint (Tailscale only, not public):** `http://100.65.52.72:8789/transcribe`
- **POST body:** `{"audio_url": "<direct mp3/audio URL>", "language": "en"}` (`language` optional — omit for auto-detect)
- **What it does server-side:** downloads the audio (httpx, follows redirects) → converts to 16kHz mono WAV via ffmpeg → runs local `whisper-cli` with the `large-v3` model already loaded on the Mac mini → returns timestamped segments + audio duration + transcription time. Downloaded audio is cached by URL hash (up to 50GB, oldest evicted first), so re-requesting the same URL is instant on a second call.
- **Source:** `scripts/whisper_relay.py`.
- **Health check first, always:** `curl http://100.65.52.72:8789/health` → `{"status":"ok","model_loaded":"large-v3"}`. If this doesn't respond, the Mac mini is off or the Tailscale path is down — don't assume the relay is reachable.
- **Example:**
  ```bash
  curl -X POST "http://100.65.52.72:8789/transcribe" \
    -H "Content-Type: application/json" \
    -d '{"audio_url": "https://example.com/episode.mp3", "language": "en"}'
  ```

### Known gotcha: Cloudflare bot-fight blocks non-browser requests on some hosts

Discovered live Aug 12, 2026 against the direct MP3 URL for SD Times' "What the Dev?" episode 360 (hosted on Buzzsprout). The relay returned:
```json
{"error": "transcription_failed", "detail": "Client error '403 Forbidden' for url 'https://www.buzzsprout.com/.../....mp3'"}
```
Root-caused independently with curl, not guessed:
- The Buzzsprout URL 302-redirects to a signed `audio.buzzsprout.com` (S3-backed, Cloudflare-fronted) URL.
- That final host returns **403** to any request with no `User-Agent` header (confirmed via raw curl, no UA → 403; same exact URL with `-A "Mozilla/5.0 ..."` → 200).
- `whisper_relay.py`'s `_download_audio()` used a bare `httpx.AsyncClient` with no custom headers — so it got blocked at this specific Cloudflare edge. This is **not** a YouTube-style IP-reputation block (Buzzsprout doesn't care where the request comes from) and **not** a redirect-handling bug (`follow_redirects=True` works correctly) — it was purely the missing `User-Agent`.
- Host-specific — hosts without aggressive Cloudflare bot-fight mode should work as-is. Don't assume every podcast host will hit this.

**Status: fixed in source, not yet deployed.** A browser-like `User-Agent` header was added to `_download_audio()`'s httpx client in `recap-rabbit/scripts/whisper_relay.py` on Aug 12, 2026 (verified by grepping the file for the header string immediately after the edit — not just assumed). **The production relay still 403s on Cloudflare-fronted hosts until the file is synced to the Mac mini and `com.recaprabbit.whisper-relay` is restarted** (see recap-rabbit's root `CLAUDE.md` for the restart procedure). **Verify with a live `curl` test before assuming this is fixed in production** — don't trust this note's date alone.

If you hit a 403 from this relay and the above hasn't been re-verified recently: treat it as the same known gotcha, not as "no transcript exists." For a one-off in the meantime, the practical fallback is fetching the audio yourself with a browser UA, saving it locally, and transcribing with any locally available whisper tool instead of through the relay.

---

## 3. Apple Podcasts native transcripts — `ap_relay` / `ingest-apple-transcripts.py` / `apple-podcasts-transcript-sync.py`

- **Only works for:** shows already subscribed to in the **Apple Podcasts app on the Mac mini**, where Apple has already generated its own transcript (Apple auto-transcribes many shows now).
- `scripts/ap_relay.py` exposes `GET /transcript` on `:8788` (internal, and per recap-rabbit's own docs, **"opportunistic-only"** — no guarantee of availability), reading directly from the local `MTLibrary.sqlite` + cached TTML files on disk.
- `scripts/apple-podcasts-transcript-sync.py` / `scripts/ingest-apple-transcripts.py` are batch/daemon scripts built to push Apple's TTML transcripts into Recap Rabbit's own backend as part of its ingestion pipeline — not really shaped for one-off ad-hoc lookups, but the TTML-parsing logic (`parse_ttml`) is reusable if you're scripting something custom.
- **Fastest/cheapest path when it applies** (free, no whisper compute needed) — but has the hardest precondition: you have to already be subscribed on that specific Mac, and Apple has to have generated a transcript for that specific show.

---

## 4. Full app pipeline (only if you want it saved/searchable permanently)

- Backend: FastAPI app on Railway (staging + prod — see recap-rabbit's root `CLAUDE.md` for current URLs), backed by Supabase Postgres.
- Adding an episode kicks off `backend/worker.py`, which runs a waterfall: Apple transcript (if available) → AssemblyAI → local whisper (via §2's relay) as fallback — then stores `cleaned_transcript`, and generates a summary + scored highlight segments.
- **An MCP server already exists** for querying anything already ingested: `backend/mcp_server.py` + `backend/mcp_tools.py`, exposing:
  - `search_episodes(query, show_filter?, limit?)` — title/description/show search
  - `get_episode_transcript(episode_id)` — full cleaned transcript
  - `get_episode_summary(episode_id)` — AI summary/takeaways/topics
  - `get_episode_highlights(episode_id)` — timestamped, scored quote segments with speaker + topics
  - `search_transcripts(query, show_filter?, limit?)` — **semantic/embedding search** across every transcript chunk ever ingested (OpenAI `text-embedding-3-small`)
  - `list_shows(limit?)`, `get_show_episodes(podcast_name, limit?)`
  - If this MCP server is registered in a given Claude Code session (check `claude mcp list`), these are the highest-leverage tools for research that reuses previously-ingested content — no need to touch scripts directly, and semantic search in particular beats re-fetching/re-transcribing something already in the DB.
- Overkill for a single one-off "get me this episode's transcript" — use §1–§3 for that instead.

---

## 5. Recommended flow for a one-off research transcript (the common case)

1. **Get the direct audio/video URL.**
   - YouTube: the video ID alone is enough (§1).
   - Podcast: find the RSS feed's `<enclosure url="...">` for that specific episode. Most hosts publish a predictable feed URL (Buzzsprout: `https://feeds.buzzsprout.com/<show_id>.rss` — the show ID is the first path segment of any episode URL on that host). For other hosts, search "`<show name>` RSS feed" or check the episode page's subscribe links.
2. **YouTube → call yt_relay** (§1). Likely to just work.
3. **Podcast MP3 → check `GET http://100.65.52.72:8789/health` first**, then `POST /transcribe` (§2). A 403 back almost certainly means the Cloudflare-UA gotcha above — don't retry blindly, note it and use the fallback, and re-check whether the fix (§2's status note) has actually been deployed yet.
4. **Parse the returned `segments` array** into a clean transcript (join `text` fields; keep timestamps if the research benefits from them) and write it into whichever research doc needs it.
5. If this is content you expect to reference again (not a one-off), consider actually ingesting it via §4 instead, so it's searchable later via `search_transcripts`.

---

## 6. Used by `/deep-research`

The global `deep-research` workflow (`~/.claude/workflows/deep-research.js`) calls §1 and §2 automatically: its Scope step adds a "podcast/interview appearances" search angle when the research subject is a specific named public figure plausibly giving interviews, and its Fetch step routes any search result that looks like a podcast episode or video (by host or title pattern) through a dedicated extraction prompt using the mechanism documented above, instead of scraping the page as text. Extraction failures are surfaced explicitly in the final report's caveats rather than silently dropped. See `~/.claude/commands/deep-research.md` for the command itself.

---

## Notes for future me (Claude)

- These are Roy's personal home-lab services, not disposable infra — code changes to recap-rabbit are out of scope for other projects' sessions unless the user explicitly directs otherwise. Default to that repo's own sprint workflow (EM → Explorer → Plan-Writer → Developer → Reviewer; see recap-rabbit's root `CLAUDE.md`) or filing a ticket, not patching inline on your own initiative.
- Always `curl .../health` before assuming a relay is reachable — the Mac mini has to be powered on and the Tailscale path up.
- If a podcast host 403s the whisper relay, check whether it's the Cloudflare/UA issue (§2) before concluding the content is unextractable — it usually isn't, and by the time you're reading this it may already be fixed and deployed. Verify, don't assume either way.
- No local whisper-cli/mlx_whisper/tailscale CLI was found in PATH on the machine running Claude Code (as of Aug 12, 2026) — the Mac-mini relay (§2) is the more reliably reachable path from a fresh session than assuming local tooling exists.
