# Mobile Verification Guide

Full protocol for `mobile-verifier`. Mirrors `visual-verification.md`'s structure — same
concepts, Maestro instead of Playwright.

## Maestro YAML Flow Patterns

### Basic Launch and Navigation

```yaml
appId: com.recaprabbit.app
---
- launchApp:
    clearState: true   # environmental isolation — fresh app state every flow run
- tapOn: "Get Started"
- assertVisible: "Sign in"
```

### Tap by Accessibility Label (Preferred Over Coordinates)

```yaml
- tapOn:
    id: "drawer-handle"      # prefer accessibility id / testID over raw text or coordinates
- tapOn: "Continue with Google"   # text match, when no id is set
```

Prefer id/label matching over `point:` coordinate taps wherever the app exposes an
accessibility id — coordinate taps break the moment layout shifts a few px, and the spec's
Evaluation Steps are written to assert *state*, not a literal tap sequence.

### Swipe Gestures (Drawer/Sheet Dismiss, Thresholds)

```yaml
- swipe:
    from: "drawer-handle"
    direction: DOWN
    duration: 400   # ms — controls swipe speed, affects whether it reads as a flick or a drag
- assertNotVisible: "drawer-content"
```

To test a **threshold** (e.g. "swipe under 100px snaps back, over 100px dismisses"), use two
separate flow steps with different `swipe` distances — Maestro's `swipe` supports `start`/`end`
coordinate pairs for precise distance control when a named-element swipe isn't precise enough:

```yaml
- swipe:
    start: 50%, 60%
    end: 50%, 68%     # short swipe — should snap back, not dismiss
- assertVisible: "drawer-content"
```

### Animation / Timing Assertions

```yaml
- tapOn: "drawer-handle"
- extendedWaitUntil:
    visible: "drawer-content"
    timeout: 500   # ms — encodes the Quality Bar tolerance from the spec flow
```

Maestro doesn't expose raw animation-duration introspection the way Playwright's
`getAnimations()` does — timing assertions here are necessarily boundary-style
(`extendedWaitUntil` with a timeout matching the spec's Quality Bar), not exact-duration
measurement. This is expected: mobile timing criteria should tolerate the stated Quality Bar
range, not assert an exact millisecond value.

### Event-Driven Checks (Out of Scope for v1)

Maestro does not have a first-class equivalent to Playwright's network/console assertions.
Do not attempt to verify analytics/observability events fired via Maestro in this version —
this is exactly why the `Grader: Deterministic (event-check)` category was dropped from v1
scope (see `plan-writer.md`'s Functional Verification Flow Format). If a flow needs this,
mark it `Grader: Manual` for now.

## Simulator vs. Device Target Selection

| Target | Mechanism | When |
|--------|-----------|------|
| **Simulator (default)** | `mcp__maestro__run` against a booted simulator (`mcp__maestro__list_devices` to select) | Every flow tagged `Platform: Mobile`/`Both`, unless `Device Required: Yes` |
| **Device** | `npx maestro-runner --platform ios test <flow.yaml> --app-file <path>` | Only flows tagged `Device Required: Yes` — behavior that may differ from simulator: native gestures with real touch physics, camera, haptics, real network conditions |

Device mode requires: the physical iPhone trusted and connected (or paired over network per
`maestro-runner` docs), an Apple Development Team ID for WDA code signing (already configured
in this project's `ios/App/App.xcodeproj` — `DEVELOPMENT_TEAM`), and a built `.app` (the
`--app-file` flag installs a fresh build before running, so you're always testing the current
code, not a stale install).

## Environmental Isolation

**Required, not optional.** Reset app/simulator state before every flow run — a flow chained
onto a device that just failed a previous flow, without resetting, produces a **correlated
failure**, not a real signal about this flow. Use `launchApp: clearState: true` at minimum;
for flows sensitive to first-run state (onboarding, permission prompts), boot a fresh
simulator instance instead of reusing one across a whole verification pass.

This project has firsthand experience with simulator-state corruption cascading into
misleading results (see the CoreSimulator runtime-registration issues from this project's
initial Maestro setup) — treat "the simulator/device is in a known state" as a precondition
you actively establish, not an assumption.

## Screenshot-on-Failure Convention

Only capture on failure (not every step — this is functional/behavioral testing, not design
review). Name: `screenshots/mobile-{flow-slug}-step{N}-fail.png`. Capture via
`mcp__maestro__take_screenshot` (simulator) or the equivalent `maestro-runner` output artifact
(device mode).

## Error Handling

| Error | Action |
|-------|--------|
| Maestro MCP unavailable | Report, exit |
| `maestro-runner` not installed (device mode) | SKIPPED (reason: `device-mode-unavailable`), continue with simulator result |
| Simulator won't boot | Report, exit after one retry — do not force-restart CoreSimulatorService repeatedly, that corrupts runtime state |
| Element/screen not found | Screenshot current state, report `element-not-found` failure signature |
| Timeout waiting for state | Screenshot current state, report `timeout` failure signature |
| App/simulator crash mid-flow | Screenshot/log whatever is available, report `crash`, stop that flow's remaining steps |

## When to Use Each Mode

| Situation | Mode |
|-----------|------|
| Flow tagged `Platform: Mobile` or `Both`, no `Device Required` flag | Simulator |
| Flow tagged `Device Required: Yes` | Simulator run first, then device run via `maestro-runner` |
| Gesture/momentum/native-transition flow, even if shared with a web component | Simulator/device — mobile-verifier is authoritative here per the Routing rule in `plan-writer.md`, regardless of what web-verifier could technically execute |
