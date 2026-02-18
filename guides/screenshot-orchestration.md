# Screenshot Orchestration Guide

Protocol for EM to orchestrate screenshot capture when Developer completes UI work, before invoking Design-Reviewer.

---

## Step 1: Detect UI Work

Check if issue involves UI changes:
- Issue has "UI", "frontend", "design" in labels
- Spec file mentions UI components, screens, or layouts
- Changed files match UI patterns: `*.tsx`, `*.jsx`, `*Screen.tsx`, `*View.tsx`, `*Page.tsx`

## Step 2: Analyze Changed Files for Screenshot Targets

Read the list of changed files from Developer's submission:
- Map files to screens/components (e.g., `HomeScreen.tsx` -> "home screen")
- Identify entry points (screens, pages, modals)
- Exclude utilities, hooks, or pure logic files

**Example mapping:**
```
Changed files:
- src/screens/HomeScreen.tsx -> Capture: "home screen"
- src/components/UpNextCard.tsx -> Capture: "home screen" (card is part of home)
- src/screens/ProfileScreen.tsx -> Capture: "profile screen"
- src/utils/formatDate.ts -> Skip (no UI)
```

## Step 3: Spawn Visual-Verifier

```
visual-verifier, please capture screenshots:

Component: [screen/page name]
URL: [from CLAUDE.md or ask Developer]
Breakpoints: mobile, tablet, desktop
Output Directory: screenshots/
```

**Wait for visual-verifier to complete and return paths.**

## Step 4: Invoke Design-Reviewer with Screenshot Context

```
Design-Reviewer, please review [component/page names].

Context: [marketing / applications / dashboards]
Issue: {PREFIX}-##
Files: [list of changed files]
Screenshots: [paths from visual-verifier]
  - screenshots/home-mobile.png
  - screenshots/home-tablet.png
  - screenshots/home-desktop.png
Dev Server: Running at [URL]

Ready for design review.
```

## Step 5: Handle Re-Capture (if Design-Reviewer requests changes)

When Design-Reviewer requests changes:
1. Developer fixes issues
2. Design-Reviewer specifies which screens need re-capture: "Need NEW screenshots of: [specific components]"
3. You spawn visual-verifier again (targeted re-capture only)
4. You re-invoke Design-Reviewer with new screenshot paths

## Step 6: Cleanup After Approval

When Design-Reviewer approves:
```bash
# Clean up temporary screenshot files
rm -rf screenshots/
```

## Error Handling

**If visual-verifier fails:**
- Attempt once with 2-second delay
- If still fails: Ask Developer to verify dev server is running
- Provide fallback instructions for manual screenshot capture
- Proceed with Design-Reviewer using manual screenshots

## Rules

- Screenshots are temporary -- delete after design review completes
- Only capture affected screens (not entire app)
- Re-capture is targeted (only what changed, not everything)
- Screenshot orchestration is blocking -- don't invoke Design-Reviewer until screenshots ready
