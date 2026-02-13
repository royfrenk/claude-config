# Design Reference Guide

> Quick reference for design decisions. For active design work, use the `/design` command.

---

## When to Use Design Skills

| You're Building | Use This Skill |
|-----------------|----------------|
| Landing page, marketing site, pricing page (new or redesign) | `/design` (will auto-select marketing) |
| Admin panel, SaaS dashboard, CRUD interface (new or redesign) | `/design` (will auto-select applications) |
| Analytics dashboard, data viz, KPIs (new or redesign) | `/design` (will auto-select dashboards) |
| iOS native app (SwiftUI, UIKit) | `/design` (will auto-select iOS) |
| Android native app (Jetpack Compose, XML Views) | `/design` (will auto-select Android) |
| Cross-platform mobile (React Native, Flutter, Expo) | `/design` (will auto-select cross-platform) |
| Editing existing UI (buttons, modals, layouts) | `/design` (will auto-select based on context) |
| Style/layout changes to existing pages | `/design` (will auto-select based on context) |
| Unsure / mixed context | `/design` (will ask you to choose) |

**Note:** Use `/design` for ANY UI work - whether creating new features or changing existing ones.

---

## Quick Decision Trees

### Design System Selection

| Your Situation | Use This |
|----------------|----------|
| iOS-only app | Human Interface Guidelines (HIG) + Antigravity shared tokens |
| Android-only app | Material Design 3 + Antigravity shared tokens |
| iOS + Android | Shared visual identity (colors, spacing, typography) + platform navigation patterns |
| Cross-platform (RN/Flutter) | Platform-appropriate components + shared tokens |
| Web app | Unstyled primitives (Radix/Headless UI) + custom layer |
| Need to ship fast | Complete system (Chakra, Ant Design, Material UI) |

### Component Selection

| Need | Web | iOS | Android |
|------|-----|-----|---------|
| 3-5 primary destinations | Tab bar (top) | Tab Bar (bottom) | Bottom Navigation |
| Many nav items | Sidebar | Not standard | Navigation Drawer |
| Primary action | Button in header | Button in nav/tab bar | FAB (bottom-right) |
| Short input | Single-line text field | TextField | TextField/OutlinedTextField |
| 5-15 options | Dropdown | Picker (wheel/menu) | Dropdown menu |
| 2-5 mutually exclusive | Radio buttons | Picker or segmented control | RadioButton |
| Quick confirmation | Toast (3-5 seconds) | Not standard (custom toast) | Snackbar |
| Critical decision | Modal dialog | Alert | AlertDialog |

---

## Design Review Requirements

Before submitting frontend work:
- [ ] All interactive elements have focus states
- [ ] Touch targets minimum 44x44px (mobile) / 36x36px (desktop)
- [ ] All links and CTAs point to existing features (no placeholder "#" or "TODO" links)
- [ ] External links (social media, help docs) use actual URLs provided by User
- [ ] Empty state designed
- [ ] Loading state designed
- [ ] Error state designed
- [ ] Responsive breakpoints tested (640px, 1024px, 1280px)
- [ ] Screenshots captured at required breakpoints

**Note:** The Design-Reviewer agent will verify these systematically.

---

## The 3-Second Rule

Users should understand these within 3 seconds of seeing any screen:
1. **Where am I?** (context and navigation)
2. **What can I do here?** (available actions)
3. **Why should I care?** (value proposition)

---

## Common Pitfalls

| Issue | Fix |
|-------|-----|
| Buttons not in expected location | Follow platform conventions (iOS: nav bar, Android: FAB, web: header) |
| Text not centered properly | Use CSS Grid/Flexbox alignment (web) OR native alignment (mobile) |
| Landing page cluttered | Use proven structure (hero → social proof → features → CTA) |
| Responsive breaks at odd sizes | Test exact breakpoints: 640px, 1024px, 1280px |
| Redundant components | Establish component contracts, reuse patterns |
| iOS/Android look too similar | Different navigation patterns (tab bar vs bottom nav), same colors/spacing |
| iOS/Android look too different | Share visual identity (colors, spacing, typography, corner radius) |
| Using wrong units on mobile | iOS: pt (points), Android: dp (density-independent pixels), sp (fonts) |
| Hardcoding safe area insets | iOS: Use safe area insets, Android: Use window insets |
| Tiny touch targets on mobile | Minimum: 44x44pt (iOS), 48x48dp (Android) |

---

For comprehensive design guidelines, invoke the appropriate design skill via `/design`.
