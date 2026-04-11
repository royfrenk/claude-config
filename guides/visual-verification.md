# Visual Verification Guide

Reference guide for the `visual-verifier` agent. Contains Playwright script patterns, naming conventions, and workflows.

---

## Static Capture Protocol

Standard screenshot capture at 3 breakpoints. Used for design review.

```bash
# Mobile (375x667px)
npx playwright screenshot [URL] \
  --viewport-size=375,667 \
  --output [OUTPUT_DIR]/[component]-mobile.png

# Tablet (640x800px)
npx playwright screenshot [URL] \
  --viewport-size=640,800 \
  --output [OUTPUT_DIR]/[component]-tablet.png

# Desktop (1280x720px)
npx playwright screenshot [URL] \
  --viewport-size=1280,720 \
  --output [OUTPUT_DIR]/[component]-desktop.png
```

**Naming:** `[component]-[breakpoint].png` (e.g., `login-page-mobile.png`)

---

## Interactive Verification Protocol

For verifying multi-step user flows. Write a Playwright script, run it, capture at each step.

### Script Template

Write a temporary script, execute it, then clean up:

```bash
cat > /tmp/playwright-verify.js << 'SCRIPT'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  const results = [];

  try {
    // Step 1: Navigate
    await page.goto('BASE_URL/route');
    await page.screenshot({ path: 'OUTPUT_DIR/step-01-description.png' });
    results.push({ step: 1, action: 'Navigate to /route', result: 'pass' });

    // Step 2: Click element
    await page.click('text=Button Text');
    await page.waitForTimeout(500); // Wait for transition
    await page.screenshot({ path: 'OUTPUT_DIR/step-02-description.png' });
    results.push({ step: 2, action: 'Click "Button Text"', result: 'pass' });

    // Step 3: Verify state
    const url = page.url();
    const passed = !url.includes('/login');
    results.push({
      step: 3,
      action: 'Verify URL changed',
      result: passed ? 'pass' : 'fail',
      detail: passed ? url : `Expected URL to change, still at ${url}`
    });

  } catch (error) {
    await page.screenshot({ path: 'OUTPUT_DIR/error-state.png' });
    results.push({ step: 'error', action: error.message, result: 'fail' });
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
SCRIPT

node /tmp/playwright-verify.js
rm /tmp/playwright-verify.js
```

### Interaction Patterns

**Click a button by text:**
```javascript
await page.click('text=Submit');
```

**Click a button by selector:**
```javascript
await page.click('button[data-testid="login-btn"]');
await page.click('.primary-button');
```

**Fill a form field:**
```javascript
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('#password', 'testpassword');
```

**Wait for navigation:**
```javascript
await page.waitForURL('**/dashboard');
```

**Wait for element to appear:**
```javascript
await page.waitForSelector('.success-message', { timeout: 5000 });
```

**Wait for element to disappear:**
```javascript
await page.waitForSelector('.loading-spinner', { state: 'hidden', timeout: 10000 });
```

**Check if element exists:**
```javascript
const exists = await page.locator('.error-message').count() > 0;
```

**Get text content:**
```javascript
const text = await page.textContent('.heading');
```

**Verify URL:**
```javascript
const url = page.url();
const isCorrect = url.includes('/expected-path');
```

### Error Handling in Scripts

Always wrap steps in try/catch and capture error state:

```javascript
try {
  await page.click('text=Missing Button');
} catch (error) {
  await page.screenshot({ path: 'OUTPUT_DIR/error-missing-element.png' });
  results.push({
    step: N,
    action: 'Click "Missing Button"',
    result: 'fail',
    detail: `Element not found: ${error.message}`
  });
}
```

---

## Before/After Comparison Workflow

Used to verify a fix by comparing UI state before and after a change.

### Phase 1: Capture "Before"

```
Mode: before-after
Phase: before
Component: login-page
URL: http://localhost:5173/login
Output Directory: screenshots/
```

Saves: `screenshots/login-page-before-mobile.png`, etc.

### Phase 2: Developer Makes Changes

Developer implements fix, rebuilds.

### Phase 3: Capture "After"

```
Mode: before-after
Phase: after
Component: login-page
URL: http://localhost:5173/login
Output Directory: screenshots/
```

Saves: `screenshots/login-page-after-mobile.png`, etc.

### Phase 4: Report Comparison

```markdown
## Before/After Comparison: login-page

| Breakpoint | Before | After | Visual Change |
|------------|--------|-------|---------------|
| Mobile | login-page-before-mobile.png | login-page-after-mobile.png | [describe what changed] |
| Tablet | login-page-before-tablet.png | login-page-after-tablet.png | [describe what changed] |
| Desktop | login-page-before-desktop.png | login-page-after-desktop.png | [describe what changed] |
```

The verifier reads both images and describes the visual differences.

---

## Functional Verification Protocol

For Mode 4: verifying features work on staging as a real user would experience them.

### Auth Setup

Generate a test JWT and inject it into the browser context before navigating:

```javascript
const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read JWT_SECRET from backend/.env
function getJwtSecret() {
  const envPath = path.join(process.cwd(), 'backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/JWT_SECRET=(.+)/);
  return match ? match[1].trim() : null;
}

// Generate test JWT for the test user
function generateTestToken(secret) {
  return jwt.sign(
    {
      sub: 'test-user-id',
      email: 'test@recaprabbit.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    },
    secret
  );
}

async function createAuthenticatedContext(browser, targetDomain) {
  const secret = getJwtSecret();
  const token = generateTestToken(secret);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  
  // Inject auth token into localStorage via page script
  const page = await context.newPage();
  await page.goto(`https://${targetDomain}`);
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
  }, token);
  
  return { context, page };
}
```

**For public/incognito flows**, create a separate context with no auth:

```javascript
async function createPublicContext(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  return { context, page };
}
```

### Download Verification

Verify that a file download triggers and the file is valid:

```javascript
// Listen for download event before triggering it
const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
await page.click('button:has-text("Export PDF")');

try {
  const download = await downloadPromise;
  const filePath = await download.path();
  const stats = fs.statSync(filePath);
  
  results.push({
    step: N,
    action: 'Verify: PDF downloads',
    result: stats.size > 0 ? 'pass' : 'fail',
    detail: `Downloaded ${stats.size} bytes, type: ${download.suggestedFilename()}`
  });
} catch (error) {
  await page.screenshot({ path: 'OUTPUT_DIR/func-flowN-stepN-fail.png' });
  results.push({
    step: N,
    action: 'Verify: PDF downloads',
    result: 'fail',
    detail: `No download event: ${error.message}`
  });
}
```

### Clipboard Verification

Verify that "Copy Link" puts the correct URL in the clipboard:

```javascript
// Grant clipboard permissions
const context = await browser.newContext({
  permissions: ['clipboard-read', 'clipboard-write'],
  viewport: { width: 1280, height: 720 }
});
const page = await context.newPage();

// Click copy button
await page.click('button:has-text("Copy Link")');
await page.waitForTimeout(500);

// Read clipboard
const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
const isValid = clipboardText.startsWith('https://recaprabbit.com/share/');

results.push({
  step: N,
  action: 'Verify: clipboard contains share URL',
  result: isValid ? 'pass' : 'fail',
  detail: isValid ? clipboardText : `Got: ${clipboardText}`
});
```

### Incognito / Public Page Verification

Open a URL in a fresh context (no cookies, no auth) to verify public pages:

```javascript
// After getting the share URL from clipboard or page
const publicContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const publicPage = await publicContext.newPage();

await publicPage.goto(shareUrl);
await publicPage.waitForLoadState('networkidle');

// Verify page loaded (not a login redirect or 404)
const title = await publicPage.textContent('h1');
const isLoaded = title && title.length > 0;

results.push({
  step: N,
  action: 'Verify: public share page loads',
  result: isLoaded ? 'pass' : 'fail',
  detail: isLoaded ? `Title: ${title}` : 'Page did not load or redirected'
});

// Capture screenshot for visual checks (RTL, layout)
await publicPage.screenshot({ path: 'OUTPUT_DIR/func-public-page.png' });
await publicContext.close();
```

### Assertion Patterns

Common assertions for `Verify:` steps:

```javascript
// URL contains
const urlOk = page.url().includes('/expected-path');

// Element visible
const visible = await page.locator('.success-message').isVisible();

// Text content matches
const text = await page.textContent('.heading');
const matches = text.includes('Expected Text');

// Attribute check (e.g., RTL)
const dir = await page.getAttribute('[data-testid="content"]', 'dir');
const isRtl = dir === 'rtl';

// Element count
const count = await page.locator('.episode-card').count();
const hasItems = count > 0;

// CSS property check
const textAlign = await page.locator('.hebrew-text').evaluate(
  el => getComputedStyle(el).direction
);
const isRtlCss = textAlign === 'rtl';
```

---

## Screenshot Naming Conventions

| Mode | Pattern | Example |
|------|---------|---------|
| Static | `[component]-[breakpoint].png` | `login-page-mobile.png` |
| Interactive | `step-[NN]-[description].png` | `step-01-login-page.png` |
| Before/After | `[component]-[phase]-[breakpoint].png` | `login-page-before-mobile.png` |
| Functional | `func-[flow]-[step]-fail.png` | `func-flow1-step4-fail.png` |
| Error | `error-[description].png` | `error-missing-element.png` |

---

## When to Use Each Mode

| Scenario | Mode |
|----------|------|
| New component styling | Static |
| Layout/responsive changes | Static |
| New user flow (login, checkout) | Interactive |
| Bug fix for interaction issue | Before/After + Interactive |
| Acceptance criteria verification | Interactive |
| Design review | Static |
| Feature works on staging (post-deploy) | Functional |
| PDF/file download works | Functional |
| Share link produces valid URL | Functional |
| Public page renders for unauthenticated users | Functional |
