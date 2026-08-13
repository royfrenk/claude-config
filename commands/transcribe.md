---
description: Transcribe a local audio recording (voice memo, meeting, conversation), a direct audio URL, or a YouTube video into a full transcript plus a TL;DR + Key Points summary. Uses Recap Rabbit's relays (yt_relay, whisper_relay) over Tailscale. Use when the user wants to transcribe a recording, summarize a YouTube video, "transcribe this", "what does this recording say", "summarize this call/meeting/video".
---

## What this does

Runs the `transcribe` global Workflow: detects whether the input is a local file, a YouTube link/ID, or a direct audio URL; transcribes it via the appropriate Recap Rabbit relay (local files are briefly served over Tailscale to the Mac mini's whisper relay, then the server is torn down); writes a TL;DR + numbered Key Points summary plus the full transcript to `./transcriptions/<slug>.md` (created if needed, never overwrites an existing file — appends a numeric suffix instead); and returns the content inline.

## Running it

Call:
```
Workflow({ scriptPath: "/Users/royfrenkiel/.claude/workflows/transcribe.js", args: "<path, URL, or YouTube link/ID>" })
```

Use the absolute path — `scriptPath` does not expand `~`.

## What it accepts

- A local file path (e.g. `/Users/royfrenkiel/Downloads/voice-memo.m4a`)
- A direct audio URL (e.g. a podcast MP3 link)
- A YouTube URL (`youtube.com/watch?v=...`, `youtu.be/...`) or a bare 11-character video ID

## Known limitations

- Local-file transcription requires the Mac mini's whisper relay to be reachable over Tailscale — if it's off, transcription fails with a clear error rather than hanging.
- YouTube videos with no existing captions fall back to a local `yt-dlp` download, which is **not installed on this machine as of Aug 12, 2026** — that path will report a clear failure rather than attempting a download that would fail. Existing-caption YouTube videos work fine either way.
- Some podcast hosts behind Cloudflare bot-protection may block the direct-audio-URL path (see the guide below) — reported as a known blocking issue, not "no content exists."

See `~/.claude/guides/podcast-transcript-extraction.md` for the full underlying mechanism and current status of these limitations.
