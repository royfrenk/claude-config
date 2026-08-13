export const meta = {
  name: 'deep-research',
  description: 'Deep research harness — fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report. Automatically searches and transcribes podcast/interview appearances for named public figures. If args is itself a local file/audio URL/YouTube reference, transcribes it directly and folds it in as a primary source.',
  whenToUse: 'When the user wants a deep, multi-source, fact-checked research report on any topic. BEFORE invoking, check if the question is specific enough to research directly — if underspecified (e.g., "what car to buy" without budget/use-case/region), ask 2-3 clarifying questions to narrow scope. Then pass the refined question as args, weaving the answers in. If the subject is a specific named public figure, podcast/interview appearances are automatically searched and transcribed when found (via Recap Rabbit relays) — no extra action needed. If args is ENTIRELY a bare local file path, direct audio URL, or YouTube link/ID (no separate question text), it is transcribed directly via transcribe.js and folded in as a primary source — mixing a question with a separate reference in one call is not supported, call /transcribe separately first for that.',
  phases: [{"title":"Scope","detail":"Decompose question (from args) into 4-6 search angles (conditionally includes a podcast/interview angle for named public figures); transcribes args directly first if it's a bare file/URL reference"},{"title":"Search","detail":"Parallel WebSearch agents, one per angle"},{"title":"Fetch","detail":"URL-dedup, fetch top 15 sources, extract falsifiable claims (podcast/video sources are transcribed via Recap Rabbit relays instead of WebFetch)"},{"title":"Verify","detail":"3-vote adversarial verification per claim (need 2/3 refutes to kill)"},{"title":"Synthesize","detail":"Merge semantic dupes, rank by confidence, cite sources"}],
}

// deep-research: Scope → pipeline(Search → URL-dedup → Fetch+Extract) → 3-vote Verify → Synthesize
// Ported from bughunter architecture. WebSearch/WebFetch instead of git/grep.
// Podcast/video sources (detected via PODCAST_HOST_PATTERN/PODCAST_TITLE_PATTERN below) are
// transcribed via Recap Rabbit's relays (Bash/curl, agentType:'general-purpose') instead of
// WebFetch — see ~/.claude/guides/podcast-transcript-extraction.md, the SOURCE OF TRUTH for
// the relay endpoints/limitations used in PODCAST_FETCH_PROMPT below. Keep that guide, this
// script, transcribe.js, and Companies/Andela/Podcast-Transcript-Extraction-Guide.md in sync
// if any relay endpoint, token, or known limitation changes.
// If args is itself a bare file/URL reference (see REFERENCE_PATTERN below), it's transcribed
// directly via a nested call to transcribe.js before Scope runs — see change-process 008
// (~/.claude/change-process/008-transcribe-command.md) for the full design/audit trail.
// Invoke via: Workflow({ scriptPath: "/Users/royfrenkiel/.claude/workflows/deep-research.js", args: "<question>" })
// NOTE: scriptPath does NOT expand "~" — always use the absolute path (confirmed live Aug 12
// 2026; this broke the command until fixed the same day).

const VOTES_PER_CLAIM = 3
const REFUTATIONS_REQUIRED = 2
const MAX_FETCH = 15
const MAX_VERIFY_CLAIMS = 25
const MAX_PODCAST_ISSUES_SHOWN = 10

// ─── Podcast/video detection + Recap Rabbit relay endpoints ───
// SOURCE OF TRUTH: ~/.claude/guides/podcast-transcript-extraction.md
const PODCAST_HOST_PATTERN = /youtube\.com|youtu\.be|buzzsprout\.com|podcasts\.apple\.com|open\.spotify\.com\/(episode|show)|overcast\.fm|pca\.st|pocketcasts\.com|listennotes\.com|podchaser\.com|anchor\.fm|simplecast\.com|libsyn\.com|megaphone\.fm|podbean\.com/i
const PODCAST_TITLE_PATTERN = /\bpodcast\b|\bepisode\s*#?\d+/i
const isPodcastSource = source => PODCAST_HOST_PATTERN.test(source.url) || PODCAST_TITLE_PATTERN.test(source.title || "")
const YT_RELAY_URL = "https://yt-relay.recaprabbit.com/transcript"
const YT_RELAY_TOKEN = "recaprabbit_yt_2026"
const WHISPER_RELAY_HEALTH_URL = "http://100.65.52.72:8789/health"
const WHISPER_RELAY_TRANSCRIBE_URL = "http://100.65.52.72:8789/transcribe"

// ─── Schemas ───
const SCOPE_SCHEMA = {
  type: "object", required: ["question", "angles", "summary"],
  properties: {
    question: { type: "string" },
    summary: { type: "string" },
    angles: { type: "array", minItems: 3, maxItems: 6, items: {
      type: "object", required: ["label", "query"],
      properties: {
        label: { type: "string" },
        query: { type: "string" },
        rationale: { type: "string" },
      },
    }},
  },
}
const SEARCH_SCHEMA = {
  type: "object", required: ["results"],
  properties: {
    results: { type: "array", maxItems: 6, items: {
      type: "object", required: ["url", "title", "relevance"],
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        snippet: { type: "string" },
        relevance: { enum: ["high", "medium", "low"] },
      },
    }},
  },
}
const EXTRACT_SCHEMA = {
  type: "object", required: ["claims", "sourceQuality"],
  properties: {
    sourceQuality: { enum: ["primary", "secondary", "blog", "forum", "unreliable"] },
    publishDate: { type: "string" },
    claims: { type: "array", maxItems: 5, items: {
      type: "object", required: ["claim", "quote", "importance"],
      properties: {
        claim: { type: "string" },
        quote: { type: "string" },
        importance: { enum: ["central", "supporting", "tangential"] },
      },
    }},
  },
}
const VERDICT_SCHEMA = {
  type: "object", required: ["refuted", "evidence", "confidence"],
  properties: {
    refuted: { type: "boolean" },
    evidence: { type: "string" },
    confidence: { enum: ["high", "medium", "low"] },
    counterSource: { type: "string" },
  },
}
const REPORT_SCHEMA = {
  type: "object", required: ["summary", "findings", "caveats"],
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: {
      type: "object", required: ["claim", "confidence", "sources", "evidence"],
      properties: {
        claim: { type: "string" },
        confidence: { enum: ["high", "medium", "low"] },
        sources: { type: "array", items: { type: "string" } },
        evidence: { type: "string" },
        vote: { type: "string" },
      },
    }},
    caveats: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } },
  },
}

// ─── Phase 0: Scope — decompose question into search angles ───
phase("Scope")
const RAW_ARGS = (typeof args === "string" && args.trim()) || ""
if (!RAW_ARGS) {
  return { error: "No research question provided. Pass it as args: Workflow({scriptPath: \"/Users/royfrenkiel/.claude/workflows/deep-research.js\", args: '<question>'})." }
}

// ─── Direct file/URL reference detection ───
// Deliberately conservative: only triggers when the ENTIRE trimmed args string (not a
// substring within a longer question) is a bare local path, direct URL, or audio-extension
// reference, AND it contains no whitespace (a real research question will have spaces; a bare
// path/URL won't). Mixing a natural-language question with a separate reference in one call is
// explicitly out of scope — that falls through unchanged to normal research-question handling.
const REFERENCE_PATTERN = /^(https?:\/\/\S+|\/\S+|~\/\S+|\.\/\S+|\S+\.(mp3|m4a|wav|ogg|flac))$/i
const isDirectReference = !/\s/.test(RAW_ARGS) && REFERENCE_PATTERN.test(RAW_ARGS)

let QUESTION = RAW_ARGS
let preTranscribedSource = null
let preTranscribeFailureNote = null
if (isDirectReference) {
  log("Direct file/URL reference detected — transcribing via transcribe.js before research: " + RAW_ARGS.slice(0, 80))
  // args always arrives as a string regardless of what's passed (empirically verified Aug 12
  // 2026 — see change-process 008); the nested-mode flag is encoded via JSON.stringify, which
  // transcribe.js JSON.parses to detect nested vs. standalone mode.
  const nested = await workflow(
    { scriptPath: "/Users/royfrenkiel/.claude/workflows/transcribe.js" },
    JSON.stringify({ source: RAW_ARGS, mode: "nested" })
  )
  if (nested && nested.ok && nested.transcript) {
    const extraction = await agent(
      "## Claim Extractor (pre-transcribed direct reference)\n\n" +
      "This transcript was provided directly (not found via web search), from: " + RAW_ARGS + "\n\n" +
      "## Transcript\n" + nested.transcript.slice(0, 20000) + "\n\n" +
      "## Task\nExtract 2-5 FALSIFIABLE claims from this transcript. Each claim must be a concrete, " +
      "checkable statement, include a direct quote, and be rated central/supporting/tangential. Since " +
      "this is primary source material itself (a direct recording/video, not secondhand reporting), " +
      "rate sourceQuality as \"primary\" unless the transcript is clearly reporting on someone else's " +
      "claims (in which case rate accordingly). Also return a 1-sentence description of what this " +
      "recording/video is about, to use as a research question.\n\nStructured output only.",
      {
        label: "extract:pre-transcribed", phase: "Fetch",
        schema: {
          type: "object", required: ["claims", "sourceQuality", "topicSummary"],
          properties: {
            sourceQuality: { enum: ["primary", "secondary", "blog", "forum", "unreliable"] },
            topicSummary: { type: "string" },
            claims: { type: "array", maxItems: 5, items: {
              type: "object", required: ["claim", "quote", "importance"],
              properties: {
                claim: { type: "string" },
                quote: { type: "string" },
                importance: { enum: ["central", "supporting", "tangential"] },
              },
            }},
          },
        },
      }
    )
    if (extraction) {
      QUESTION = "Provide background research and context on: " + extraction.topicSummary
      preTranscribedSource = {
        url: RAW_ARGS, title: nested.title || RAW_ARGS, angle: "direct-reference",
        sourceQuality: extraction.sourceQuality, publishDate: null,
        claims: extraction.claims.map(c => ({ ...c, sourceUrl: RAW_ARGS, sourceQuality: extraction.sourceQuality })),
      }
    } else {
      QUESTION = "Provide background research and context on the content referenced by: " + RAW_ARGS
      preTranscribeFailureNote = "Direct reference " + RAW_ARGS + " was transcribed, but claim extraction returned no result. Proceeding with a generic research question."
    }
  } else {
    QUESTION = "Provide background research and context on the content referenced by: " + RAW_ARGS
    preTranscribeFailureNote = "Direct reference " + RAW_ARGS + " was provided but transcription failed: " +
      ((nested && nested.failureReason) || "no result returned") + ". Proceeding with a generic research question instead."
  }
}

const scope = await agent(
  "Decompose this research question into complementary search angles.\n\n" +
  "## Question\n" + QUESTION + "\n\n" +
  "## Task\n" +
  "Generate 5 distinct web search queries that together cover the question from different angles. Pick angles that suit the question's domain. Examples:\n" +
  "- broad/primary  · academic/technical  · recent news  · contrarian/skeptical  · practitioner/implementation\n" +
  "- For medical: anatomy · common causes · serious differentials · authoritative refs · red flags\n" +
  "- For tech: state-of-art · benchmarks · limitations · industry adoption · cost/tradeoffs\n\n" +
  "Make queries specific enough to surface high-signal results. Avoid redundancy.\n\n" +
  "## Podcast/interview angle (conditional — read carefully)\n" +
  "Additionally: if the question centers on a specific named individual (NOT a company, product, or abstract topic) " +
  "who is a public figure plausibly giving interviews (executive, founder, author, public speaker, etc.), add ONE " +
  "extra angle labeled exactly \"podcast/interview appearances\" with a query like \"<name> podcast interview\" — " +
  "for a total of up to 6 angles. Skip this angle entirely for company/product/topic-only questions, or for " +
  "individuals with no public-figure/media profile. If the criterion doesn't apply, generate exactly 5 angles as normal.\n\n" +
  "Return: the question (verbatim or lightly normalized), a 1-2 sentence decomposition strategy, and the angles.\n\nStructured output only.",
  { label: "scope", schema: SCOPE_SCHEMA }
)
if (!scope) {
  return { error: "Scope agent returned no result — cannot decompose the research question." }
}
log("Q: " + QUESTION.slice(0, 80) + (QUESTION.length > 80 ? "…" : ""))
log("Decomposed into " + scope.angles.length + " angles: " + scope.angles.map(a => a.label).join(", "))

// ─── Dedup state — accumulates across searchers as they complete ───
// The workflow sandbox is a bare ECMAScript realm — no URL global — so
// hostname/path come from a regex: captures (1) hostname (userinfo, www.,
// and port stripped) and (2) pathname. Neither userinfo nor host admits
// \: WHATWG URL treats \ as a path separator for http(s), so a laxer
// class would label evil.com\@trusted.com as trusted.com while WebFetch
// actually goes to evil.com. Userinfo DOES admit @ — WHATWG splits the
// authority at the LAST @ before the host, so greedy matching must too;
// stopping at the first @ would label x@trusted.com@evil.com as
// trusted.com while the fetch contacts evil.com. The host class still
// excludes @, so the userinfo group consumes every @ up to the last one.
const URL_HOST_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/?#\\]*@)?(?:www\.)?([^/:?#@\\]+)(?::\d+)?([^?#]*)/i
const normURL = u => {
  const m = String(u).match(URL_HOST_PATTERN)
  return m ? (m[1] + m[2].replace(/\/$/, "")).toLowerCase() : String(u).toLowerCase()
}
// Host and title both come from web content and reach the terminal via the
// progress label. Two hazards: forging a trusted hostname, and smuggling
// terminal control sequences or invisible reordering chars. LABEL_STRIP
// deletes what must never render — C0/C1 controls (incl. ESC/CSI, the ANSI
// introducers), Unicode bidi overrides/isolates and zero-width format chars
// (U+200B-200F, U+202A-202E, U+2066-2069, U+FEFF — they visually reorder or
// hide label text), and the WHOLE double-quote lookalike family (ASCII " plus
// U+201C-201F, U+2033, U+2036, U+275D, U+275E, U+301D, U+301E, U+FF02 — any of
// which would visually close the quoted fallback early and forge host-shaped
// text after it). STRICT_HOST is the strict registrable-hostname charset a
// bare label must match (dot-separated LDH labels). normURL keeps the raw
// capture: dedup keys are never rendered, and stripping there could collide
// distinct URLs.
const LABEL_CAP = 40
const LABEL_STRIP = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff\u0022\u201c-\u201f\u2033\u2036\u275d\u275e\u301d\u301e\uff02]/g
const STRICT_HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/
const stripLabelChars = s => String(s).replace(LABEL_STRIP, "")
// Render a web-controlled value as a clearly-untrusted quoted label: strip
// dangerous chars, cap at LABEL_CAP code points (Array.from so a surrogate
// pair never splits), and when the cap actually truncated the value, append …
// INSIDE the quotes so a shortened string can never pass for the whole thing.
const quotedLabel = s => {
  const cps = Array.from(stripLabelChars(s))
  return '"' + cps.slice(0, LABEL_CAP).join("").trim() + (cps.length > LABEL_CAP ? "…" : "") + '"'
}
const seen = new Map()
const dupes = []
const budgetDropped = []
const relRank = { high: 0, medium: 1, low: 2 }
let fetchSlots = MAX_FETCH
// Podcast-extraction-failure accumulator. Kept OUT of the ranked/truncated
// claims pool entirely (a synthetic claim tagged tangential/unreliable would
// sort last on both axes in rankedClaims and get sliced off before ever
// reaching Verify or Synthesize — found live during change-process 007's
// audit). Appended non-mutating (spread, not .push()) per global coding-style
// rule; safe under concurrent pipeline callbacks because each append happens
// synchronously within a single .then()/.catch() callback with no internal
// await between the length check and the reassignment.
let podcastExtractionIssues = []
let podcastExtractionIssueCount = 0
const recordPodcastIssue = text => {
  podcastExtractionIssueCount++
  if (podcastExtractionIssues.length < MAX_PODCAST_ISSUES_SHOWN) {
    podcastExtractionIssues = [...podcastExtractionIssues, text]
  }
}

// ─── Direct-reference pre-transcription follow-up (Part B) ───
// Split from the Scope-phase transcription call above because `seen`/`normURL`/
// `recordPodcastIssue` aren't declared until here — referencing them earlier would hit the
// temporal dead zone. If the pre-transcribed reference was a URL, seed the dedup map so the
// same URL resurfacing via web search is recognized as already-fetched and skipped rather than
// re-transcribed a second time (local files never appear in web search results, so this only
// applies to URL references). If transcription/extraction failed, surface it as a caveat via
// the same mechanism as podcast-source failures, rather than silently dropping it.
if (preTranscribedSource && /^https?:\/\//i.test(RAW_ARGS)) {
  seen.set(normURL(RAW_ARGS), { angle: "direct-reference", title: preTranscribedSource.title })
}
if (preTranscribeFailureNote) {
  recordPodcastIssue(preTranscribeFailureNote)
}

// ─── Prompts ───
const SEARCH_PROMPT = (angle) =>
  "## Web Searcher: " + angle.label + "\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "Your angle: **" + angle.label + "** — " + (angle.rationale || "") + "\n" +
  "Search query: `" + angle.query + "`\n\n" +
  "## Task\nUse WebSearch with the query above (or a refined version). Return the top 4-6 most relevant results.\n" +
  "Rank by relevance to the ORIGINAL question, not just the search query. Skip obvious SEO spam/content farms.\n" +
  "Include a short snippet capturing why each result is relevant.\n\nStructured output only."

const FETCH_PROMPT = (source, angle) =>
  "## Source Extractor\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "Fetch and extract key claims from this source:\n" +
  "**URL:** " + source.url + "\n**Title:** " + source.title + "\n**Found via:** " + angle + " search\n\n" +
  "## Task\n1. Use WebFetch to retrieve the page content.\n" +
  "2. Assess source quality: primary research/institution? secondary reporting? blog/opinion? forum? unreliable?\n" +
  "3. Extract 2-5 FALSIFIABLE claims that bear on the research question. Each claim must:\n" +
  "   - be a concrete, checkable statement (not vague generalities)\n" +
  "   - include a direct quote from the source as support\n" +
  "   - be rated central/supporting/tangential to the research question\n" +
  "4. Note publish date if available.\n\n" +
  "If the fetch fails or the page is irrelevant/paywalled, return claims: [] and sourceQuality: \"unreliable\".\n\nStructured output only."

// Podcast/video variant of FETCH_PROMPT. Reuses EXTRACT_SCHEMA — successful
// extractions merge into verification/synthesis exactly like any other
// source. Only ever dispatched (see the Fetch-stage pipeline branch below)
// when isPodcastSource(source) is true, and only with agentType:
// 'general-purpose' so Bash is actually available for the curl calls below.
// The base pipeline's other Fetch-stage agents are untouched: they keep
// using WebFetch exactly as before and never call these relays.
const PODCAST_FETCH_PROMPT = (source, angle) =>
  "## Podcast/Video Source Extractor\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "This source looks like a podcast episode or video, not a text page:\n" +
  "**URL:** " + source.url + "\n**Title:** " + source.title + "\n**Found via:** " + angle + " search\n\n" +
  "## Task\n" +
  "1. If this is a YouTube URL (youtube.com or youtu.be): extract the video ID, then use Bash to call:\n" +
  "   `curl -H \"Authorization: Bearer " + YT_RELAY_TOKEN + "\" \"" + YT_RELAY_URL + "?video_id=<ID>&languages=en\"`\n" +
  "   This returns JSON with a `segments` array of `{start, end, text}` objects — join the `text` fields into a transcript.\n\n" +
  "2. Otherwise (a podcast host — Buzzsprout, Apple Podcasts, Spotify, etc.): find the direct audio/MP3 URL. " +
  "Check the page for an RSS/subscribe link, or try common feed patterns (e.g. Buzzsprout: " +
  "`https://feeds.buzzsprout.com/<show_id>.rss`, where the show ID is the first path segment of the episode URL) " +
  "and find this specific episode's `<enclosure url=\"...\">`. Then:\n" +
  "   a. Health-check first: `curl -m 5 " + WHISPER_RELAY_HEALTH_URL + "` — if this does not return " +
  "`{\"status\":\"ok\"}` within a few seconds, the relay is unreachable. Stop and report that as the failure reason " +
  "rather than retrying indefinitely.\n" +
  "   b. If healthy, transcribe: `curl -X POST \"" + WHISPER_RELAY_TRANSCRIBE_URL + "\" -H \"Content-Type: application/json\" " +
  "-d '{\"audio_url\": \"<direct mp3 url>\", \"language\": \"en\"}'` — this can take a minute or more for a long episode " +
  "(it downloads and transcribes locally on the other end). Returns JSON with a `segments` array — join `text` fields " +
  "into a transcript.\n" +
  "   c. **Known limitation:** some podcast hosts sitting behind Cloudflare bot-protection may return a 403 error to " +
  "this request (confirmed on Buzzsprout; may affect others). If you get a 403, this is a known, documented issue — " +
  "report it plainly as \"extraction blocked by host (Cloudflare/User-Agent issue)\" in your reasoning. Do NOT " +
  "interpret a 403 as \"no podcast content exists here.\"\n\n" +
  "3. Once you have a transcript (from either path above), assess source quality (a podcast interview is typically " +
  "\"secondary\" reporting unless the research subject is speaking in their own words, in which case treat it as " +
  "\"primary\") and extract 2-5 FALSIFIABLE claims exactly as you would from a text source — concrete, checkable, " +
  "each with a direct quote, each rated central/supporting/tangential.\n\n" +
  "If you cannot obtain a transcript for ANY reason (relay unreachable, blocked, video/episode not found, no captions " +
  "available), return claims: [] and sourceQuality: \"unreliable\" — do not fabricate claims from the episode title " +
  "or description alone.\n\nStructured output only."

const VERIFY_PROMPT = (claim, v) =>
  "## Adversarial Claim Verifier (voter " + (v + 1) + "/" + VOTES_PER_CLAIM + ")\n\n" +
  "Be SKEPTICAL. Try to REFUTE this claim. ≥" + REFUTATIONS_REQUIRED + "/" + VOTES_PER_CLAIM + " refutations kill it.\n\n" +
  "## Research question\n" + QUESTION + "\n\n" +
  "## Claim under review\n\"" + claim.claim + "\"\n\n" +
  "**Source:** " + claim.sourceUrl + " (" + claim.sourceQuality + ")\n" +
  "**Supporting quote:** \"" + claim.quote + "\"\n\n" +
  "## Checklist\n" +
  "1. Is the claim actually supported by the quote, or is it an overreach/misread?\n" +
  "2. WebSearch for contradicting evidence — does any credible source dispute or heavily qualify this?\n" +
  "3. Is the source quality sufficient for the claim's strength? (extraordinary claims need primary sources)\n" +
  "4. Is the claim outdated? (check dates — old claims about fast-moving fields are suspect)\n" +
  "5. Is this a marketing claim / press release / cherry-picked benchmark / forum speculation?\n\n" +
  "**refuted=true** if: unsupported by quote / contradicted / low-quality source for strong claim / outdated / marketing fluff.\n" +
  "**refuted=false** ONLY if: claim is well-supported, current, and source quality matches claim strength.\n" +
  "Default to refuted=true if uncertain.\n\nStructured output only. Evidence MUST be specific."

// ─── Pipeline: search → dedup → fetch+extract (no barrier) ───
const searchResults = await pipeline(
  scope.angles,

  angle => agent(SEARCH_PROMPT(angle), {
    label: "search:" + angle.label, phase: "Search", schema: SEARCH_SCHEMA
  }).then(r => {
    if (!r) return null
    log(angle.label + ": " + r.results.length + " results")
    return { angle: angle.label, results: r.results }
  }),

  searchResult => {
    const sorted = [...searchResult.results].sort((a, b) => relRank[a.relevance] - relRank[b.relevance])
    const novel = sorted.filter(r => {
      const key = normURL(r.url)
      if (seen.has(key)) {
        dupes.push({ ...r, angle: searchResult.angle, dupOf: seen.get(key) })
        return false
      }
      if (fetchSlots <= 0 && relRank[r.relevance] >= 1) {
        budgetDropped.push({ ...r, angle: searchResult.angle })
        return false
      }
      seen.set(key, { angle: searchResult.angle, title: r.title })
      fetchSlots--
      return true
    })
    if (novel.length < searchResult.results.length) {
      log(searchResult.angle + ": " + novel.length + " novel (" + (searchResult.results.length - novel.length) + " filtered)")
    }
    return parallel(
      novel.map(source => () => {
        // A bare fetch:<host> label asserts the real fetch host, so emit it
        // ONLY when the captured host is a verbatim, complete, un-truncated,
        // strict-ASCII hostname that sanitization left untouched. Any
        // deviation routes through the same quoted+ellipsis helper as the
        // title fallback, so a lossy display value can never masquerade as the
        // true host: non-ASCII (an IDN homograph like Cyrillic "аmazon.com",
        // which WebFetch resolves via punycode unavailable in this realm),
        // invalid host chars, a host long enough to need truncation (a bare
        // prefix could show a trusted-looking domain while the real host
        // differs), or a host sanitize altered (deleting a control char would
        // turn exa<ctrl>mple.com into example.com, which is not the real host).
        const capturedHost = String(source.url).match(URL_HOST_PATTERN)?.[1] ?? ""
        const host = capturedHost.toLowerCase()
        const cleanHost = stripLabelChars(host)
        const isCleanBareHost = cleanHost === host && host !== "" && Array.from(host).length <= LABEL_CAP && STRICT_HOST.test(host)
        const hostLabel = cleanHost === "" ? "" : isCleanBareHost ? host : quotedLabel(host)
        const sourceLabel = hostLabel || (stripLabelChars(source.title).trim() && quotedLabel(source.title)) || "unknown"
        const podcastSource = isPodcastSource(source)
        return agent(
          podcastSource ? PODCAST_FETCH_PROMPT(source, searchResult.angle) : FETCH_PROMPT(source, searchResult.angle),
          {
            label: (podcastSource ? "podcast:" : "fetch:") + sourceLabel,
            phase: "Fetch",
            schema: EXTRACT_SCHEMA,
            // agentType override only for podcast sources: guarantees real Bash
            // access for the curl calls in PODCAST_FETCH_PROMPT. Documented in
            // the Workflow tool's own agent() parameter schema ("opts.agentType
            // uses a custom subagent type... resolved from the same registry as
            // the Agent tool"); 'general-purpose' is a registered type with full
            // tool access. Empirically verified live (Aug 12, 2026 smoke test,
            // logged in change-process/007): a scriptPath-invoked agent() call
            // with agentType:'general-purpose' ran a real Bash command and
            // returned its actual output — not just a claimed/assumed result.
            ...(podcastSource ? { agentType: 'general-purpose' } : {}),
          }
        ).then(ext => {
          // User-skip → null; drop it (filtered by searchResults.flat().filter(Boolean))
          // rather than throwing into .catch() and mislabeling it "unreliable".
          if (!ext) return null
          if (podcastSource && ext.claims.length === 0) {
            recordPodcastIssue(
              "Podcast/video source found (" + source.url + ", via " + searchResult.angle + " search) but " +
              "transcript extraction failed or returned no usable content — may be relay-down, Cloudflare-blocked, " +
              "or genuinely unavailable. See ~/.claude/guides/podcast-transcript-extraction.md for known limitations."
            )
          }
          return {
            url: source.url, title: source.title, angle: searchResult.angle,
            sourceQuality: ext.sourceQuality, publishDate: ext.publishDate,
            claims: ext.claims.map(c => ({ ...c, sourceUrl: source.url, sourceQuality: ext.sourceQuality })),
          }
        }).catch(e => {
          log("fetch failed: " + source.url + " — " + (e.message || e))
          if (podcastSource) {
            recordPodcastIssue(
              "Podcast/video source found (" + source.url + ") but the extraction agent errored: " + (e.message || String(e))
            )
          }
          return { url: source.url, title: source.title, angle: searchResult.angle, sourceQuality: "unreliable", claims: [] }
        })
      })
    )
  }
)

const allSources = [...(preTranscribedSource ? [preTranscribedSource] : []), ...searchResults.flat().filter(Boolean)]
const allClaims = allSources.flatMap(s => s.claims)
const impRank = { central: 0, supporting: 1, tangential: 2 }
const qualRank = { primary: 0, secondary: 1, blog: 2, forum: 3, unreliable: 4 }

const rankedClaims = [...allClaims]
  .sort((a, b) => (impRank[a.importance] - impRank[b.importance]) || (qualRank[a.sourceQuality] - qualRank[b.sourceQuality]))
  .slice(0, MAX_VERIFY_CLAIMS)

log("Fetched " + allSources.length + " sources → " + allClaims.length + " claims → verifying top " + rankedClaims.length)
if (podcastExtractionIssueCount > 0) {
  log(podcastExtractionIssueCount + " podcast/video source(s) found but not successfully transcribed")
}

if (rankedClaims.length === 0) {
  const podcastNote = podcastExtractionIssueCount > 0
    ? " " + podcastExtractionIssueCount + " podcast/video source(s) were found but transcript extraction failed — see podcastExtractionIssues for detail."
    : ""
  return {
    question: QUESTION,
    summary: "No claims extracted. " + allSources.length + " sources fetched, all empty/failed. " + dupes.length + " URL dupes, " + budgetDropped.length + " budget-dropped." + podcastNote,
    findings: [], refuted: [], unverified: [], sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality })),
    podcastExtractionIssues, podcastExtractionIssueCount,
    stats: { angles: scope.angles.length, sources: allSources.length, claims: 0, dupes: dupes.length },
  }
}

// ─── Verify: 3-vote adversarial ───
// Barrier here is intentional — claim pool must be fully assembled before ranking/verification.
phase("Verify")
const voted = (await parallel(
  rankedClaims.map(claim => () =>
    parallel(
      Array.from({ length: VOTES_PER_CLAIM }, (_, v) => () =>
        agent(VERIFY_PROMPT(claim, v), {
          label: "v" + v + ":" + claim.claim.slice(0, 40),
          phase: "Verify",
          schema: VERDICT_SCHEMA,
        })
      )
    ).then(verdicts => {
      // A vote can be null (user-skip or agent error) — treat as no vote cast.
      // Three outcomes (go/ccissue/69883 — infra failure must not read as "refuted"):
      //   survives  — quorum of valid votes AND fewer than REFUTATIONS_REQUIRED refuting
      //   isRefuted — ≥REFUTATIONS_REQUIRED refute votes (adjudicated against on merit)
      //   otherwise — unverified: too few valid votes to adjudicate (verifier agents errored)
      const valid = verdicts.filter(Boolean)
      const refuted = valid.filter(v => v.refuted).length
      const errored = VOTES_PER_CLAIM - valid.length
      const survives = valid.length >= REFUTATIONS_REQUIRED && refuted < REFUTATIONS_REQUIRED
      const isRefuted = refuted >= REFUTATIONS_REQUIRED
      const mark = survives ? "✓" : isRefuted ? "✗" : "?"
      log("\"" + claim.claim.slice(0, 50) + "…\": " + (valid.length - refuted) + "-" + refuted + (errored > 0 ? " (" + errored + " errored)" : "") + " " + mark)
      return { ...claim, verdicts: valid, refutedVotes: refuted, erroredVotes: errored, survives, isRefuted }
    })
  )
)).filter(Boolean)

const confirmed = voted.filter(c => c.survives)
const killed = voted.filter(c => c.isRefuted)
const unverified = voted.filter(c => !c.survives && !c.isRefuted)
log("Verify done: " + voted.length + " claims → " + confirmed.length + " confirmed, " + killed.length + " refuted, " + unverified.length + " unverified")

const toRefuted = c => ({ claim: c.claim, vote: (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes, source: c.sourceUrl })
const toUnverified = c => ({ claim: c.claim, erroredVotes: c.erroredVotes, validVotes: c.verdicts.length, source: c.sourceUrl })

if (confirmed.length === 0) {
  // Distinguish "refuted on merit" from "could not verify (infra error)". A run
  // where every verifier agent failed (rate-limit / API error) is an infra
  // failure, not a research finding — report it as such so the user knows to
  // retry rather than concluding the research found nothing.
  let summary
  if (killed.length === 0 && unverified.length > 0) {
    summary = "Could not verify any claims — all " + unverified.length + " verifier panels failed (likely rate-limiting or API errors). This is an infrastructure failure, not a research finding. Raw extracted claims returned below; retry or verify manually."
  } else if (unverified.length > 0) {
    summary = killed.length + " claims refuted by adversarial verification; " + unverified.length + " could not be verified (verifier agents failed). No claims survived. Research inconclusive."
  } else {
    summary = "All " + killed.length + " claims refuted by adversarial verification. Research inconclusive — sources may be low-quality or claims overstated."
  }
  if (podcastExtractionIssueCount > 0) {
    summary += " " + podcastExtractionIssueCount + " podcast/video source(s) were found but transcript extraction failed — see podcastExtractionIssues for detail."
  }
  return {
    question: QUESTION,
    summary,
    findings: [],
    refuted: killed.map(toRefuted),
    unverified: unverified.map(toUnverified),
    sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality, claimCount: s.claims.length })),
    podcastExtractionIssues, podcastExtractionIssueCount,
    stats: { angles: scope.angles.length, sources: allSources.length, claims: allClaims.length, verified: voted.length, confirmed: 0, killed: killed.length, unverified: unverified.length },
  }
}

// ─── Synthesize ───
phase("Synthesize")
const confRank = { high: 0, medium: 1, low: 2 }
const block = confirmed.map((c, i) => {
  const best = c.verdicts.filter(v => !v.refuted).sort((a, b) => confRank[a.confidence] - confRank[b.confidence])[0]
  return "### [" + i + "] " + c.claim + "\n" +
    "Vote: " + (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes + " · Source: " + c.sourceUrl + " (" + c.sourceQuality + ")\n" +
    "Quote: \"" + c.quote + "\"\nVerifier evidence (" + best.confidence + "): " + best.evidence + "\n"
}).join("\n")

const killedBlock = killed.length > 0
  ? "\n## Refuted claims (for transparency)\n" +
    killed.map(c => "- \"" + c.claim + "\" (" + c.sourceUrl + ", vote " + (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes + ")").join("\n")
  : ""

const unverifiedBlock = unverified.length > 0
  ? "\n## Unverified claims (" + unverified.length + " — verifier agents failed; neither confirmed nor refuted)\n" +
    unverified.map(c => "- \"" + c.claim + "\" (" + c.sourceUrl + ", " + c.erroredVotes + "/" + VOTES_PER_CLAIM + " votes errored)").join("\n") +
    "\n\nMention in caveats that " + unverified.length + " claim(s) could not be verified due to infrastructure errors."
  : ""

// Bypasses rankedClaims entirely (see the accumulator's own comment above) so
// it reaches Synthesize regardless of how many other claims got truncated.
const podcastBlock = podcastExtractionIssueCount > 0
  ? "\n## Podcast/video sources found but not transcribed (" + podcastExtractionIssueCount + " total" +
    (podcastExtractionIssueCount > podcastExtractionIssues.length ? ", showing first " + podcastExtractionIssues.length : "") + ")\n" +
    podcastExtractionIssues.map(i => "- " + i).join("\n") +
    "\n\nMention in caveats that podcast/interview sources were found but could not be transcribed (see reasons above) " +
    "— relevant spoken commentary from the subject may exist but isn't reflected in this report."
  : ""

const report = await agent(
  "## Synthesis: research report\n\n" +
  "**Question:** " + QUESTION + "\n\n" +
  confirmed.length + " claims survived " + VOTES_PER_CLAIM + "-vote adversarial verification. Merge semantic duplicates and synthesize.\n\n" +
  "## Confirmed claims\n" + block + "\n" + killedBlock + unverifiedBlock + podcastBlock + "\n\n" +
  "## Instructions\n" +
  "1. Identify claims that say the same thing — merge them, combine their sources.\n" +
  "2. Group related claims into coherent findings. Each finding should directly address the research question.\n" +
  "3. Assign confidence per finding: high (multiple primary sources, unanimous votes), medium (secondary sources or split votes), low (single source or blog-quality).\n" +
  "4. Write a 3-5 sentence executive summary answering the research question.\n" +
  "5. Note caveats: what's uncertain, what sources were weak, what time-sensitivity applies, and any podcast/video sources found but not transcribed (see that section above if present).\n" +
  "6. List 2-4 open questions that emerged but weren't answered.\n\nStructured output only.",
  { label: "synthesize", schema: REPORT_SCHEMA }
)

if (!report) {
  // Synthesis skipped/errored — salvage the verified claims raw rather
  // than throwing on report.findings and discarding the whole run.
  return {
    question: QUESTION,
    summary: "Synthesis step was skipped or failed — returning " + confirmed.length + " verified claims unmerged.",
    findings: [],
    confirmed: confirmed.map(c => ({ claim: c.claim, source: c.sourceUrl, quote: c.quote, vote: (c.verdicts.length - c.refutedVotes) + "-" + c.refutedVotes })),
    refuted: killed.map(toRefuted),
    unverified: unverified.map(toUnverified),
    sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality, claimCount: s.claims.length })),
    podcastExtractionIssues, podcastExtractionIssueCount,
    stats: { angles: scope.angles.length, sources: allSources.length, claims: allClaims.length, verified: voted.length, confirmed: confirmed.length, killed: killed.length, unverified: unverified.length, afterSynthesis: 0 },
  }
}

return {
  question: QUESTION,
  ...report,
  refuted: killed.map(toRefuted),
  unverified: unverified.map(toUnverified),
  sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality, angle: s.angle, claimCount: s.claims.length })),
  podcastExtractionIssues,
  podcastExtractionIssueCount,
  stats: {
    angles: scope.angles.length,
    sourcesFetched: allSources.length,
    claimsExtracted: allClaims.length,
    claimsVerified: voted.length,
    confirmed: confirmed.length,
    killed: killed.length,
    unverified: unverified.length,
    afterSynthesis: report.findings.length,
    urlDupes: dupes.length,
    budgetDropped: budgetDropped.length,
    podcastSourcesAttempted: podcastExtractionIssueCount + allSources.filter(s => s.claims.length > 0 && PODCAST_HOST_PATTERN.test(s.url)).length,
    podcastExtractionFailures: podcastExtractionIssueCount,
    agentCalls: 1 + scope.angles.length + allSources.length + (voted.length * VOTES_PER_CLAIM) + 1,
  },
}
