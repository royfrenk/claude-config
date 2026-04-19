# Web Scraping Guide

Hard-won lessons from building scrapers for BiggerPockets, Reddit, YouTube, and similar sites.

---

## The Core Problem: Bot Detection

Modern sites use layered bot detection. In order of difficulty:

| Layer | What it checks | Bypass |
|-------|---------------|--------|
| IP reputation | Datacenter / VPN ranges | Residential IP |
| TLS fingerprint | httpx/curl vs Chrome TLS handshake | Real Chrome (CDP) |
| JS challenge | Cloudflare Turnstile | Real Chrome with real browsing history |
| Browser fingerprint | Playwright automation flags | Real Chrome via CDP (not Playwright-launched) |
| Behavioral | Request timing, session patterns | Human-like delays |
| Login / auth | Session cookies | Real browser login |

**Key insight:** You must solve ALL layers, not just one. Getting a residential IP while using httpx still fails because the TLS fingerprint is wrong.

---

## IP Types

| IP Type | Cloudflare | Reddit | Notes |
|---------|-----------|--------|-------|
| Residential (home ISP) | ✅ Usually passes | ✅ | Best option |
| Mobile (phone hotspot) | ✅ Best | ✅ | Fresh IP, never flagged |
| Datacenter (AWS, DigitalOcean) | ❌ Blocked | ⚠️ Throttled | Never use for scraping |
| ProtonVPN / datacenter VPN | ❌ Blocked by Cloudflare | ⚠️ | Pi's ProtonVPN failed on BP |
| Tinyproxy on Pi | ❌ Strips Set-Cookie | ✅ Works for Reddit | Proxy stripped cookies → BP login failed |
| Tailscale (pibot) | ❌ Datacenter range | ✅ | Pi IP `185.98.x.x` blocked by Cloudflare |

**Blocked IPs (confirmed):**
- Pi's ProtonVPN IP range `185.98.x.x` — blocked by Cloudflare on BiggerPockets
- Mac IP got flagged after repeated Playwright attempts — resolved by waiting

---

## Site-Specific Playbooks

### Reddit

**Approach:** old.reddit.com JSON API — no auth needed, no Cloudflare.

```python
url = f"https://old.reddit.com/r/{subreddit}/top.json?limit=100&t=all"
# Route through Pi proxy (Tinyproxy on port 8888)
proxy = "http://recaprabbit:ytproxy2026@pibot.tail6eaf43.ts.net:8888"
```

**What works:**
- Pi proxy (Tinyproxy) works fine — Reddit doesn't check TLS fingerprint
- Browser-like User-Agent required (bot UA gets 403)
- Pagination via `after` cursor
- Comment enrichment: `https://old.reddit.com{permalink}.json?limit=15&sort=top`

**Rate limits:**
- 3-9s between requests is safe
- 429 = back off 60s

**Gotchas:**
- Link posts with no `selftext` are useless — skip them (`is_self=False and not selftext`)
- `[deleted]` / `[removed]` comments — filter out
- old.reddit.com returns JSON; www.reddit.com returns HTML

---

### BiggerPockets

**Approach:** Real Chrome via CDP (connect Playwright to Chrome launched with `--remote-debugging-port=9222`).

**What DOESN'T work:**
- httpx direct — TLS fingerprint blocked by Cloudflare
- httpx via Pi proxy — proxy strips Set-Cookie, login fails + Pi IP blocked
- Playwright-launched Chrome (headless) — automation flags detected
- Playwright-launched Chrome (headed, with playwright-stealth) — still detected after IP flagged
- Injecting cookies into httpx — Cloudflare blocks before cookies are read
- Cookie-Editor export into httpx — same TLS fingerprint problem

**What WORKS:**
- Real Chrome launched from terminal with `--remote-debugging-port=9222 --user-data-dir=/tmp/chrome_scraper_profile`
- Playwright connects via CDP: `pw.chromium.connect_over_cdp("http://localhost:9222")`
- Navigate **existing tabs**, not new ones — new tabs opened by Playwright don't render forum content (BP detects CDP-opened pages)
- Login once → session persists in Chrome profile

**Chrome launch command:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome_scraper_profile \
  --no-first-run &
```

**Bigger-Pockets (BP)-specific gotchas:**
- Forum 96 (Deal Analysis) — removed/banned by BP, returns "no longer available"
- Forums are SPA-rendered — `wait_until="domcontentloaded"` is not enough; must wait for `.simplified-forums__topic-content` selector
- Thread listing pages: wait for `a[href*='/topics/']`
- Thread pages: wait for `.simplified-forums__topic-content`
- `navigate_and_get_html()` must use `is_thread=True` flag to use the right selector
- Post content selector: `.simplified-forums__topic-content__body`
- Login detection: check for `/dashboard` in page content + `Go Pro` nav item (not "sign out" — that text isn't always present)
- Login redirects to last-visited forum page, not dashboard

**Rate limits / safe pace:**
- 12-40s between thread requests (log-normal, mean ~22s)
- 40-120s between forum listing pages (log-normal, mean ~70s)
- Worker wrapped in `caffeinate -i` to prevent Mac sleep

**CDP reconnect — CRITICAL:**
The old worker had a cascade failure bug: if Chrome CDP dropped mid-run, every subsequent job got `navigation_failed` because exceptions propagated to `fail_job()` instead of triggering reconnect. The fixed pattern:
```python
# Before claiming a job, check browser is still alive:
if browser is None or not browser.is_connected() or page.is_closed():
    page = await get_ready_page()  # reconnects CDP, re-establishes session

# Inside fetch_html, catch PWError separately — don't let it reach fail_job()
try:
    await page.goto(url, wait_until="domcontentloaded", timeout=35_000)
except PWError as e:
    log.error("goto failed: %s", e)
    return None  # caller handles, doesn't automatically fail_job
```

**Circuit breaker for IP blocks:**
If 5+ consecutive `navigation_failed`, pause 10 minutes before continuing. Prevents burning through the entire queue when the IP is temporarily blocked.

**Human-like timing — use log-normal, not uniform:**
`random.uniform(15, 35)` produces a flat distribution that looks machine-generated. Log-normal produces the right skew (most waits short, occasional longer pauses):
```python
import math
def lognormal_delay(mean_s: float, sigma: float = 0.4) -> float:
    mu = math.log(mean_s) - (sigma**2) / 2
    return max(2.0, random.lognormvariate(mu, sigma))
```

**Working forum IDs (confirmed April 2026):**
- 48 — General Real Estate Investing ✅
- 311 — Buying & Selling Real Estate ✅
- 12 — Starting Out ✅
- 67 — Rehabbing & House Flipping ✅
- 52 — General Landlording ✅
- 432 — Multi-Family Investing ✅
- 61 — Innovative Strategies ✅
- 93 — Wholesaling ✅
- 32 — Commercial Real Estate ✅
- 853 — BRRRR ✅
- 921 — Market Trends & Data ✅
- 530 — Short-Term & Vacation Rental ✅
- 963 — Out of State Investing ✅
- 922 — House Hacking ✅
- 44 — Land & New Construction ✅
- 70 — Tax Liens & Mortgage Notes ✅
- 925 — Medium-Term Rentals ✅
- 899 — Managing Your Property ✅
- 96 — Deal Analysis ❌ BANNED/REMOVED

---

### YouTube (transcripts)

**Approach:** Pi relay server (Flask on port 8787) using `youtube-transcript-api`.

- Pi hosts a Cloudflare tunnel (`cloudflared`) — URL changes on restart
- Direct YouTube transcript requests from datacenter IPs get blocked
- Residential Pi IP works for transcripts

---

## Architecture Patterns

### Job Queue Pattern (Supabase)

Use a `scrape_jobs` table with atomic claiming via SQL function:

```sql
-- Atomic claim prevents two workers grabbing same job
SELECT * FROM scrape_jobs
WHERE status = 'pending' AND source = p_source
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

Workers: `claim_next_job` → scrape → `complete_job` or `fail_job`

### DB Client

Use **Supabase REST API** (PostgREST), not asyncpg directly:
- asyncpg pooler fails with "Tenant or user not found" on Supabase
- REST API works reliably from any IP
- Duplicate handling: `Prefer: resolution=ignore-duplicates,return=minimal`

### Proxy Setup

```python
# httpx 0.28+ uses `proxy=` (single string), not `proxies=` (dict)
client = httpx.AsyncClient(proxy="http://user:pass@host:port")
```

---

## Debugging Checklist

When a scraper stops working:

1. **Check IP** — `curl https://api.ipify.org` — is it residential or datacenter?
2. **Check Cloudflare** — does the response contain "just a moment"?
3. **Check TLS** — are you using httpx/curl? Won't work against Cloudflare-protected sites.
4. **Check selectors** — SPAs change their DOM. Inspect the live page for current class names.
5. **Check cookies** — session cookies expire. Re-login if getting redirected.
6. **Check the forum/page** — it may have been removed (like BP forum 96).
7. **Check Mac sleep** — use `caffeinate -i` to prevent sleep during long runs.
8. **Check for cascade failures** — if all jobs fail with `navigation_failed`, Chrome CDP likely dropped. Don't reset + retry; fix the reconnect logic first.
9. **"All N failed" → stop iterating, diagnose root cause** — check logs, check IP, check if Chrome is running. Don't keep resetting jobs while the root cause is still active.

---

## General Rules

- **Never use datacenter IPs** against Cloudflare-protected sites
- **httpx/curl won't bypass Cloudflare** — TLS fingerprint is wrong regardless of headers/cookies
- **Playwright-launched Chrome gets detected** — use CDP to connect to a real running Chrome
- **Use existing browser tabs** when connecting via CDP — new tabs may not render SPA content
- **Use log-normal delays, not uniform** — `random.uniform` produces a flat distribution that's machine-detectable; `lognormvariate` looks human
- **Slow is safe** — 12-40s per thread, 40-120s per listing page; this is sustainable indefinitely
- **SPA sites need selector waits** — never just take `domcontentloaded` HTML on React/Vue apps
- **Save sessions** — login once, reuse cookies; re-login only when session expires
- **Always implement CDP reconnect** — browsers crash; workers must reconnect without failing the job queue
- **Circuit breaker for IP blocks** — if N consecutive failures, pause 10min; don't burn the queue on a blocked IP
- **"All failed" = root cause problem, not a retry problem** — reset + retry without fixing root cause just wastes the queue
