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

## Screenshot Naming Conventions

| Mode | Pattern | Example |
|------|---------|---------|
| Static | `[component]-[breakpoint].png` | `login-page-mobile.png` |
| Interactive | `step-[NN]-[description].png` | `step-01-login-page.png` |
| Before/After | `[component]-[phase]-[breakpoint].png` | `login-page-before-mobile.png` |
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
