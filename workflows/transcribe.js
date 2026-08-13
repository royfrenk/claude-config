export const meta = {
  name: 'transcribe',
  description: 'Transcribe a local audio recording, direct audio URL, or YouTube video/URL into a transcript + TL;DR summary, using Recap Rabbit relays over Tailscale.',
  whenToUse: 'When the user wants a transcript and summary of a local recording (voice memo, meeting, conversation), a YouTube video, or a direct audio URL. Also invoked internally, in nested mode, by deep-research.js when its args is itself a file/URL reference rather than a research question.',
  phases: [{"title":"Detect","detail":"Determine source type: local file, YouTube, or direct audio URL"},{"title":"Transcribe","detail":"Call the appropriate Recap Rabbit relay"},{"title":"Summarize","detail":"TL;DR + Key Points (standalone mode only)"},{"title":"Save","detail":"Write to ./transcriptions/<slug>.md (standalone mode only)"}],
}

// transcribe: local audio note / direct audio URL / YouTube URL-or-ID -> transcript
// (+ TL;DR summary, standalone mode only).
// SOURCE OF TRUTH: ~/.claude/guides/podcast-transcript-extraction.md -- update this script,
// that guide, deep-research.js's PODCAST_FETCH_PROMPT/PODCAST_HOST_PATTERN, and
// Companies/Andela/Podcast-Transcript-Extraction-Guide.md together if any relay endpoint,
// token, or known limitation changes.
//
// Standalone: Workflow({scriptPath: "/Users/royfrenkiel/.claude/workflows/transcribe.js", args: "<path, URL, or YouTube link>"})
// Nested (from deep-research.js): workflow({scriptPath: "/Users/royfrenkiel/.claude/workflows/transcribe.js"}, JSON.stringify({source, mode: "nested"}))
//   -- args always arrives as a STRING regardless of what's passed at the call site (empirically
//   verified Aug 12 2026: an object literal passed as `args` does NOT survive as an object --
//   `typeof args` comes back "string"). Nested callers must JSON.stringify their payload; this
//   script attempts JSON.parse on its own `args` to detect nested mode, falling through to
//   standalone (bare source string) if parsing fails -- verified live with all three input shapes
//   (JSON-encoded nested call, bare local path, bare URL), logged in
//   ~/.claude/change-process/008-transcribe-command.md.
//
// IMPORTANT: `scriptPath` does NOT expand `~` -- it is treated as a literal path segment relative
// to the caller's cwd, not the home directory (empirically confirmed Aug 12 2026, and it broke the
// already-shipped /deep-research command until fixed the same day). Always use the absolute path.

const YT_RELAY_URL = "https://yt-relay.recaprabbit.com/transcript"
const YT_RELAY_TOKEN = "recaprabbit_yt_2026"
const WHISPER_RELAY_HEALTH_URL = "http://100.65.52.72:8789/health"
const WHISPER_RELAY_TRANSCRIBE_URL = "http://100.65.52.72:8789/transcribe"
const YOUTUBE_HOST_PATTERN = /youtube\.com|youtu\.be/i
const YOUTUBE_BARE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const LOCAL_TIMEOUT_MS = 540000 // 9 min -- see the "residual risk" note in the guide's local-file section
const TRANSCRIPT_PROMPT_CAP = 40000 // chars, avoids runaway prompt size on very long recordings

// ─── Input parsing ───
const RAW = (typeof args === "string" && args.trim()) || ""
let SOURCE = RAW
let MODE = "standalone"
if (RAW) {
  try {
    const parsed = JSON.parse(RAW)
    if (parsed && typeof parsed === "object" && typeof parsed.source === "string") {
      SOURCE = parsed.source
      MODE = parsed.mode === "nested" ? "nested" : "standalone"
    }
  } catch (e) {
    // Not JSON -- SOURCE stays RAW, MODE stays "standalone". This is the expected path
    // for any real file path or URL, which is never valid JSON.
  }
}
if (!SOURCE) {
  return { ok: false, failureReason: "No source provided. Pass a local file path, a direct audio URL, or a YouTube URL/video ID as args." }
}

// ─── Schemas ───
const DETECT_SCHEMA = {
  type: "object", required: ["sourceType"],
  properties: {
    sourceType: { enum: ["local_file", "youtube", "audio_url"] },
    youtubeId: { type: "string" },
    reason: { type: "string" },
  },
}
const TRANSCRIBE_SCHEMA = {
  type: "object", required: ["ok"],
  properties: {
    ok: { type: "boolean" },
    transcript: { type: "string" },
    durationSeconds: { type: "number" },
    failureReason: { type: "string" },
  },
}
const SUMMARY_SCHEMA = {
  type: "object", required: ["title", "tldr", "keyPoints"],
  properties: {
    title: { type: "string" },
    tldr: { type: "string" },
    keyPoints: { type: "array", items: {
      type: "object", required: ["point"],
      properties: { point: { type: "string" }, detail: { type: "string" } },
    }},
  },
}
const SAVE_SCHEMA = {
  type: "object", required: ["filePath"],
  properties: { filePath: { type: "string" } },
}

// ─── Phase: Detect ───
// Needs Bash (test -f) -- can't happen in top-level bare-realm JS, must be agent-dispatched.
phase("Detect")
const detectResult = await agent(
  "## Source Type Detection\n\n" +
  "Determine what kind of audio source this is: `" + SOURCE + "`\n\n" +
  "## Task\n" +
  "1. Run `test -f \"" + SOURCE.replace(/"/g, '\\"') + "\"` via Bash. If it exits 0, this is a LOCAL FILE " +
  "-- return sourceType: \"local_file\".\n" +
  "2. Otherwise, check if it's a YouTube reference: does it match a youtube.com/youtu.be URL, OR is it " +
  "a bare 11-character video ID (letters/digits/-/_ only, exactly 11 chars, e.g. \"dQw4w9WgXcQ\")? If " +
  "so, return sourceType: \"youtube\" and extract the video ID into `youtubeId` (from the URL's `v=` " +
  "param, the youtu.be path segment, or the bare ID itself).\n" +
  "3. Otherwise, treat it as a direct audio URL -- return sourceType: \"audio_url\".\n\n" +
  "Structured output only.",
  { label: "detect", phase: "Detect", schema: DETECT_SCHEMA, agentType: "general-purpose" }
)
if (!detectResult) {
  return { ok: false, failureReason: "Detection step returned no result." }
}
log("Detected: " + detectResult.sourceType + (detectResult.youtubeId ? " (" + detectResult.youtubeId + ")" : ""))

// ─── Prompts ───
const LOCAL_FILE_PROMPT = (filePath) =>
  "## Local Audio File -> Transcript (via Tailscale-local serving)\n\n" +
  "Transcribe this local audio file: `" + filePath + "`\n\n" +
  "## CRITICAL: run this ENTIRE flow as ONE single Bash tool call (one shell script, chained with " +
  "`;`/`&&`/heredoc) -- NOT as several separate Bash tool calls. Shell state (background PIDs, trap " +
  "handlers) does not persist across separate Bash tool invocations, only within one. Request an " +
  "extended timeout on this single Bash call (" + LOCAL_TIMEOUT_MS + "ms) since transcription of a " +
  "long recording can take several minutes.\n\n" +
  "The script must, in order, all within that one Bash invocation:\n" +
  "1. Determine this machine's own Tailscale IP: `ifconfig | grep -A1 utun | grep 'inet '` and pick the " +
  "100.x.x.x address. Do not hardcode an IP -- confirm it fresh.\n" +
  "2. Create an isolated scratch temp directory (`mktemp -d`) and copy ONLY the target file into it " +
  "(never serve the file's real parent directory -- that would leak sibling files).\n" +
  "3. Pick a free high port (e.g. a random port in 8900-9900) and start " +
  "`python3 -m http.server <port> --bind <tailscale-ip> --directory <scratch-dir>` in the background " +
  "(`&`), capturing its PID (`SERVER_PID=$!`).\n" +
  "4. Immediately set `trap 'kill $SERVER_PID 2>/dev/null; rm -rf <scratch-dir>' EXIT` so cleanup " +
  "happens even if a later step fails or errors -- this is a backstop; also do an explicit kill at the " +
  "end of the happy path, don't rely on trap alone.\n" +
  "5. Health-check: `curl -m 5 " + WHISPER_RELAY_HEALTH_URL + "`. If this doesn't return " +
  "`{\"status\":\"ok\"}`, stop here -- report the relay is unreachable as the failure reason (do not " +
  "proceed to step 6).\n" +
  "6. Construct the file's URL as `http://<tailscale-ip>:<port>/<filename>` and POST it: " +
  "`curl -X POST \"" + WHISPER_RELAY_TRANSCRIBE_URL + "\" -H \"Content-Type: application/json\" " +
  "-d '{\"audio_url\": \"<that URL>\", \"language\": \"en\"}'`. Capture the JSON response.\n" +
  "7. Kill the server explicitly and clean up the scratch dir (the trap will also do this -- " +
  "belt-and-suspenders, not redundant-and-safe-to-skip).\n\n" +
  "**Known residual risk, accepted, do not try to over-engineer around it:** if this Bash call is ever " +
  "terminated by the tool's own timeout enforcement via SIGKILL rather than SIGTERM, the trap will not " +
  "fire and the server could linger briefly on this machine's Tailscale interface. No external watchdog " +
  "process is in scope for this workflow.\n\n" +
  "The transcribe response has a `segments` array of `{start, end, text}` -- join the `text` fields " +
  "into a full transcript.\n\n" +
  "If ANY step fails (server won't start, health check fails, transcribe POST errors or 403s), do NOT " +
  "throw -- report ok:false with a clear failureReason explaining what happened.\n\nStructured output only."

const YOUTUBE_PROMPT = (youtubeId) =>
  "## YouTube -> Transcript\n\n" +
  "Video ID: `" + youtubeId + "`\n\n" +
  "## Task\n" +
  "1. First try existing captions: `curl -H \"Authorization: Bearer " + YT_RELAY_TOKEN + "\" " +
  "\"" + YT_RELAY_URL + "?video_id=" + youtubeId + "&languages=en\"`. If this returns a `segments` " +
  "array with content, join the `text` fields into a transcript and report ok:true -- you're done.\n" +
  "2. If no captions are available (empty segments, 404, or an error), check whether a YouTube download " +
  "tool exists: `which yt-dlp`.\n" +
  "   - If ABSENT (confirmed absent on this machine as of Aug 12 2026 -- but check fresh, it may have " +
  "been installed since): report ok:false, failureReason: \"captions unavailable and no local " +
  "YouTube-download tool (yt-dlp) present -- install yt-dlp or provide a direct audio URL instead.\"\n" +
  "   - If PRESENT: run the ENTIRE remaining flow as part of this SAME single Bash invocation (do not " +
  "split across separate Bash calls -- shell state doesn't persist across them): download the video's " +
  "audio with `yt-dlp -x --audio-format mp3 -o <scratch-dir>/audio.%(ext)s " +
  "\"https://youtube.com/watch?v=" + youtubeId + "\"`, then serve+transcribe+kill exactly as described " +
  "for local files -- determine this machine's Tailscale IP via ifconfig, isolated scratch dir, " +
  "background HTTP server bound to that IP, `trap ... EXIT`, health-check, POST /transcribe, explicit " +
  "kill. Request the same " + LOCAL_TIMEOUT_MS + "ms timeout.\n\n" +
  "If it fails for any reason, do NOT throw -- report ok:false with a clear failureReason." +
  "\n\nStructured output only."

const AUDIO_URL_PROMPT = (url) =>
  "## Direct Audio URL -> Transcript\n\n" +
  "URL: `" + url + "`\n\n" +
  "## Task\n" +
  "1. Health-check: `curl -m 5 " + WHISPER_RELAY_HEALTH_URL + "`. If unreachable, report ok:false with " +
  "that as the reason.\n" +
  "2. POST to transcribe: `curl -X POST \"" + WHISPER_RELAY_TRANSCRIBE_URL + "\" -H \"Content-Type: " +
  "application/json\" -d '{\"audio_url\": \"" + url + "\", \"language\": \"en\"}'`.\n" +
  "3. **Known limitation:** some hosts behind Cloudflare bot-protection may 403 this request (confirmed " +
  "on Buzzsprout). If you get a 403, report it plainly as a Cloudflare/User-Agent blocking issue, not " +
  "as \"no content exists.\" See ~/.claude/guides/podcast-transcript-extraction.md.\n\n" +
  "Join the returned `segments` array's `text` fields into a transcript.\n\n" +
  "If it fails for any reason, do NOT throw -- report ok:false with a clear failureReason." +
  "\n\nStructured output only."

// ─── Phase: Transcribe ───
phase("Transcribe")
let transcribeResult
if (detectResult.sourceType === "local_file") {
  transcribeResult = await agent(LOCAL_FILE_PROMPT(SOURCE), {
    label: "transcribe:local", phase: "Transcribe", schema: TRANSCRIBE_SCHEMA, agentType: "general-purpose",
  })
} else if (detectResult.sourceType === "youtube") {
  const ytId = detectResult.youtubeId || SOURCE
  transcribeResult = await agent(YOUTUBE_PROMPT(ytId), {
    label: "transcribe:youtube", phase: "Transcribe", schema: TRANSCRIBE_SCHEMA, agentType: "general-purpose",
  })
} else {
  transcribeResult = await agent(AUDIO_URL_PROMPT(SOURCE), {
    label: "transcribe:audio_url", phase: "Transcribe", schema: TRANSCRIBE_SCHEMA, agentType: "general-purpose",
  })
}

if (!transcribeResult || !transcribeResult.ok) {
  const reason = (transcribeResult && transcribeResult.failureReason) || "Transcription step returned no result."
  log("Transcription failed: " + reason)
  return { ok: false, sourceType: detectResult.sourceType, source: SOURCE, failureReason: reason }
}
log("Transcribed: " + transcribeResult.transcript.length + " chars" +
  (transcribeResult.durationSeconds ? " (" + Math.round(transcribeResult.durationSeconds) + "s audio)" : ""))

// ─── Nested mode: return transcript only, skip summary + file write ───
// deep-research.js calls this workflow to fold a transcript into its claims pool -- it doesn't
// need (and shouldn't pay for) a standalone summary or an uninvited file written into the
// research caller's cwd.
if (MODE === "nested") {
  return {
    ok: true,
    sourceType: detectResult.sourceType,
    source: SOURCE,
    transcript: transcribeResult.transcript,
    title: null, tldr: null, keyPoints: null, filePath: null, failureReason: null,
  }
}

// ─── Phase: Summarize (standalone mode only) ───
phase("Summarize")
const summary = await agent(
  "## Summarize this transcript\n\n" +
  "**Source:** " + SOURCE + "\n\n" +
  "## Transcript\n" + transcribeResult.transcript.slice(0, TRANSCRIPT_PROMPT_CAP) + "\n\n" +
  "## Task\n" +
  "1. Write a short, descriptive title (this becomes a filename slug -- keep it concise, plain words, " +
  "no special characters needed).\n" +
  "2. Write a 2-4 sentence TL;DR capturing the essential takeaway.\n" +
  "3. Write 5-12 numbered Key Points, each a substantive takeaway (not a transcript recap) -- match the " +
  "level of detail and style of `Companies/Andela/Interviews/Call with Udi Milo - Summary (English).md` " +
  "if you have access to it (dense, specific, one paragraph per point); otherwise use your best judgment " +
  "for the same style.\n\nStructured output only.",
  { label: "summarize", phase: "Summarize", schema: SUMMARY_SCHEMA }
)

// ─── Phase: Save (standalone mode only) ───
phase("Save")
const slugify = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
const baseSlug = slugify(summary ? summary.title : SOURCE) || "transcript"

const fileContent =
  "# " + (summary ? summary.title : "Transcript") + "\n\n" +
  "**Source:** " + SOURCE + "  \n**Type:** " + detectResult.sourceType + "  \n**Transcribed via:** /transcribe\n\n" +
  "---\n\n## TL;DR\n" + (summary ? summary.tldr : "(summary unavailable)") + "\n\n" +
  "## Key Points\n" +
  (summary
    ? summary.keyPoints.map((kp, i) => (i + 1) + ". **" + kp.point + "**" + (kp.detail ? " -- " + kp.detail : "")).join("\n")
    : "(summary unavailable)") +
  "\n\n---\n\n## Full Transcript\n\n" + transcribeResult.transcript + "\n"

const saveResult = await agent(
  "## Save transcript+summary file\n\n" +
  "1. Ensure the directory `./transcriptions/` exists relative to the current working directory " +
  "(create it if needed: `mkdir -p ./transcriptions`).\n" +
  "2. Determine the target filename: start with `./transcriptions/" + baseSlug + ".md`. If a file " +
  "already exists at that path, try `-2`, `-3`, etc. appended to the slug (before `.md`) until you find " +
  "one that doesn't exist. Do not overwrite an existing file.\n" +
  "3. Write the following content verbatim to that path:\n\n" +
  "-----BEGIN CONTENT-----\n" + fileContent + "\n-----END CONTENT-----\n\n" +
  "Report the exact final file path you wrote to.\n\nStructured output only.",
  { label: "save", phase: "Save", schema: SAVE_SCHEMA, agentType: "general-purpose" }
)
if (saveResult) {
  log("Saved to " + saveResult.filePath)
} else {
  log("Save step failed or was skipped -- transcript/summary still returned inline below.")
}

return {
  ok: true,
  sourceType: detectResult.sourceType,
  source: SOURCE,
  title: summary ? summary.title : null,
  slug: baseSlug,
  transcript: transcribeResult.transcript,
  tldr: summary ? summary.tldr : null,
  keyPoints: summary ? summary.keyPoints : null,
  filePath: saveResult ? saveResult.filePath : null,
  failureReason: null,
}
