---
description: Navigate through a target website, take screenshots of every screen, traverse the sign-up flow end-to-end, and generate a Mermaid user flowchart. Use for UX research and competitive analysis.
---

# UX Audit

Navigate a target website from scratch — crawl all pages, capture screenshots, complete the sign-up flow, and produce a flowchart.

**Usage:** `/ux-audit <url>` (e.g., `/ux-audit https://rocketlawyer.com`)

---

## What This Produces

```
docs/ux-audit/{domain}/
  screenshots/
    step-01-homepage.png
    step-02-pricing.png
    step-03-signup-entry.png
    ...
  flowchart.md       ← Mermaid diagram of the full user journey
  index.md           ← Summary table: page name, URL, screenshot path, notes
```

---

## Phase 1 — Setup

**1. Parse the target URL** from the command argument. Extract the domain for naming (e.g., `rocketlawyer.com`).

**2. Create output directories:**
```bash
mkdir -p docs/ux-audit/{domain}/screenshots
```

**3. Check if Playwright is available:**
```bash
npx playwright --version 2>/dev/null || npm install playwright
```

**4. Write the crawler script** to `/tmp/ux-audit-crawler.js` — see Phase 2 for the script template.

---

## Phase 2 — Crawl & Screenshot

Write and run a Playwright script that:

- Starts at the homepage
- Discovers all navigation links (nav, header, footer, hero CTAs)
- Visits each unique page up to **depth 3** from root, staying on the same domain
- Screenshots each page at 1280×720
- Records the page graph: `{ url, title, screenshot, linkedFrom, outboundLinks }`

### Script Template

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'TARGET_URL_HERE';
const OUTPUT_DIR = 'OUTPUT_DIR_HERE';
const MAX_DEPTH = 3;
const DELAY_MS = 1200; // human-like pause between pages

const visited = new Map(); // url → { title, screenshot, step }
const queue = [{ url: TARGET_URL, depth: 0, linkedFrom: null, linkText: 'start' }];
const graph = []; // edges: { from, to, linkText }
let stepCounter = 1;

function normalizeUrl(href, base) {
  try {
    const u = new URL(href, base);
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch { return null; }
}

function isSameDomain(url, base) {
  try {
    return new URL(url).hostname === new URL(base).hostname;
  } catch { return false; }
}

function screenshotName(step, title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `step-${String(step).padStart(2, '0')}-${slug}.png`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  while (queue.length > 0) {
    const { url, depth, linkedFrom, linkText } = queue.shift();
    if (visited.has(url) || depth > MAX_DEPTH) continue;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800); // let SPA render

      const title = await page.title();
      const filename = screenshotName(stepCounter, title);
      const screenshotPath = path.join(OUTPUT_DIR, 'screenshots', filename);

      await page.screenshot({ path: screenshotPath, fullPage: false });
      visited.set(url, { title, screenshot: filename, step: stepCounter, url });
      stepCounter++;

      if (linkedFrom) {
        graph.push({ from: linkedFrom, to: url, linkText });
      }

      if (depth < MAX_DEPTH) {
        const links = await page.$$eval('a[href]', els =>
          els.map(el => ({ href: el.href, text: el.innerText.trim().slice(0, 50) }))
        );
        for (const { href, text } of links) {
          const normalized = normalizeUrl(href, url);
          if (normalized && isSameDomain(normalized, TARGET_URL) && !visited.has(normalized)) {
            queue.push({ url: normalized, depth: depth + 1, linkedFrom: url, linkText: text });
          }
        }
      }

      await page.waitForTimeout(DELAY_MS);
    } catch (err) {
      console.error(`Failed: ${url} — ${err.message}`);
    }
  }

  await browser.close();

  // Save graph data for flowchart generation
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'sitemap.json'),
    JSON.stringify({ pages: [...visited.values()], edges: graph }, null, 2)
  );

  console.log(JSON.stringify({ pagesVisited: visited.size, edgesFound: graph.length }));
})();
```

**Run it:**
```bash
node /tmp/ux-audit-crawler.js
```

**If Cloudflare blocks the crawl** (page title is "Just a moment..." or status is 403/503):
- Switch to real Chrome via CDP — see `~/.claude/guides/web-scraping.md` → BiggerPockets section
- Launch Chrome with `--remote-debugging-port=9222`, connect Playwright via CDP
- Continue with the same script logic

---

## Phase 3 — Sign-Up Flow Traversal

After the crawl, identify the sign-up entry point from the graph. Common patterns: pages titled "Sign Up", "Create Account", "Get Started", or URLs containing `/signup`, `/register`, `/trial`.

Write a second Playwright script (`/tmp/ux-audit-signup.js`) that:

1. Starts at the homepage (unauthenticated)
2. Finds and clicks the primary CTA / "Sign Up" button
3. Screenshots each form step as it progresses
4. Fills forms with test data (see below)
5. Submits the final form
6. Screenshots the confirmation / dashboard landing

### Test Data to Use

```javascript
const TEST_USER = {
  firstName: 'Alex',
  lastName:  'Audit',
  email:     `ux-audit+${Date.now()}@example.com`, // unique per run
  password:  'Audit2025!',
  company:   'Audit Corp',
  phone:     '555-000-0001'
};
```

**Fill strategy:** Try `input[type="email"]`, `input[name="email"]`, `#email` in that order.
For password fields, detect `input[type="password"]`.
For name fields, try `firstName`/`first_name`/`first-name` and equivalents.

### Sign-Up Script Template

```javascript
(async () => {
  const browser = await chromium.launch({ headless: false }); // headed — easier to debug
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const steps = [];
  let stepNum = 50; // continue numbering after crawl screenshots

  async function snap(label) {
    const filename = `step-${String(stepNum).padStart(2, '0')}-${label}.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshots', filename) });
    steps.push({ step: stepNum, label, screenshot: filename, url: page.url() });
    stepNum++;
    return filename;
  }

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await snap('homepage-start');

  // Find sign-up CTA
  const signupSelector = 'a[href*="sign"], a[href*="register"], button:has-text("Sign Up"), button:has-text("Get Started"), a:has-text("Sign Up"), a:has-text("Get Started"), a:has-text("Free Trial")';
  await page.click(signupSelector);
  await page.waitForLoadState('domcontentloaded');
  await snap('signup-entry');

  // Fill form fields (try common selectors)
  const fillField = async (selectors, value) => {
    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.count() > 0) { await el.fill(value); return true; }
    }
    return false;
  };

  await fillField(['input[type="email"]', 'input[name="email"]', '#email'], TEST_USER.email);
  await fillField(['input[name="firstName"]', 'input[name="first_name"]', 'input[placeholder*="First"]'], TEST_USER.firstName);
  await fillField(['input[name="lastName"]', 'input[name="last_name"]', 'input[placeholder*="Last"]'], TEST_USER.lastName);
  await fillField(['input[type="password"]', 'input[name="password"]', '#password'], TEST_USER.password);
  await snap('signup-form-filled');

  // Submit
  await page.click('button[type="submit"], input[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up"), button:has-text("Continue")');
  await page.waitForTimeout(2000);
  await snap('signup-submitted');

  // Handle multi-step flows — keep snapping until we reach a dashboard or stop progressing
  let prevUrl = '';
  let stepsWithoutProgress = 0;
  while (stepsWithoutProgress < 3) {
    const currentUrl = page.url();
    if (currentUrl === prevUrl) { stepsWithoutProgress++; } else { stepsWithoutProgress = 0; }
    prevUrl = currentUrl;
    await snap(`signup-step-${stepNum}`);
    // Check if we've landed on a dashboard / post-onboarding page
    const isDashboard = currentUrl.includes('dashboard') || currentUrl.includes('home') || currentUrl.includes('onboard');
    if (isDashboard) break;
    await page.waitForTimeout(1500);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'signup-steps.json'), JSON.stringify(steps, null, 2));
  console.log(JSON.stringify({ signupSteps: steps.length }));
})();
```

---

## Phase 4 — Generate Flowchart

After both scripts complete, read `sitemap.json` and `signup-steps.json`, then generate a Mermaid flowchart.

**Output to `docs/ux-audit/{domain}/flowchart.md`:**

```markdown
# UX Flow: {domain}
_Audited: {date}_

## Full Site Map

\`\`\`mermaid
graph TD
  subgraph Public
    HOME["🏠 Homepage"]
    PRICING["💳 Pricing"]
    FEATURES["⭐ Features"]
  end

  subgraph Auth Flow
    SIGNUP_ENTRY["📝 Sign Up Entry"]
    SIGNUP_FORM["📋 Sign Up Form"]
    EMAIL_VERIFY["📧 Verify Email"]
    DASHBOARD["🎛️ Dashboard"]
  end

  HOME --> PRICING
  HOME --> FEATURES
  HOME --> SIGNUP_ENTRY
  PRICING --> SIGNUP_ENTRY
  SIGNUP_ENTRY --> SIGNUP_FORM
  SIGNUP_FORM --> EMAIL_VERIFY
  EMAIL_VERIFY --> DASHBOARD
\`\`\`

## Sign-Up Flow Detail

\`\`\`mermaid
graph LR
  S1["Homepage"] -->|"Click 'Get Started'"| S2["Sign Up Form"]
  S2 -->|"Fill email + password"| S3["Account Created"]
  S3 --> S4["Dashboard / Onboarding"]
\`\`\`
```

**Populate the diagram from actual data** — use the `edges` array from `sitemap.json` to generate real `A --> B` entries, not the template above. Group nodes by section (public pages, auth flow, post-login) based on URL patterns.

---

## Phase 5 — Write Index

Write `docs/ux-audit/{domain}/index.md`:

```markdown
# UX Audit: {domain}
_Date: {date}_

## Pages Discovered

| # | Page Title | URL | Screenshot | Notes |
|---|-----------|-----|-----------|-------|
| 1 | Homepage | / | step-01-homepage.png | Main landing |
| 2 | Pricing | /pricing | step-02-pricing.png | |
...

## Sign-Up Flow

| # | Step | URL | Screenshot |
|---|------|-----|-----------|
| 1 | Homepage start | / | step-50-homepage-start.png |
...

## Flowchart

See [flowchart.md](flowchart.md)
```

---

## Error Handling

| Problem | Fix |
|---------|-----|
| Cloudflare blocks crawl | Switch to CDP — read `web-scraping.md` BiggerPockets section |
| SPA doesn't render | Change `waitUntil: 'networkidle'` and add `waitForSelector` for main content |
| Sign-up form not found | Log the page HTML, inspect manually, add a site-specific selector |
| Multi-step flow stalls | Increase `stepsWithoutProgress` tolerance, check for email-verification gate |
| Screenshot dir missing | `mkdir -p` before writing |

---

## Rules

- **Keep screenshots** — don't delete, these are the audit deliverable
- **Unique test email per run** — use `Date.now()` suffix to avoid duplicate account errors
- **Stay on the same domain** — don't follow external links (ad networks, CDNs, social)
- **Depth ≤ 3** — marketing sites are typically 2-3 deep; going further adds noise
- **Headed mode for sign-up** — `headless: false` so you can debug form detection issues
- **Mermaid from real data** — populate the flowchart from `sitemap.json`, don't invent the graph
- **Clean up temp scripts** after the run: `rm /tmp/ux-audit-*.js`
