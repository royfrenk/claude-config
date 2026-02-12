# Design Reference Guide

> Quick reference for design decisions. For active design work, use the `/design` command.

---

## When to Use Design Skills

| You're Building | Use This Skill |
|-----------------|----------------|
| Landing page, marketing site, pricing page | `/design` (will auto-select marketing) |
| Admin panel, SaaS dashboard, CRUD interface | `/design` (will auto-select applications) |
| Analytics dashboard, data viz, KPIs | `/design` (will auto-select dashboards) |
| Unsure / mixed context | `/design` (will ask you to choose) |

---

## Quick Decision Trees

### Design System Selection

| Your Situation | Use This |
|----------------|----------|
| iOS-only app | Apple HIG |
| Android-only app | Material Design 3 |
| Cross-platform web | Unstyled primitives (Radix/Headless UI) + custom layer |
| Need to ship fast | Complete system (Chakra, Ant Design, Material UI) |

### Component Selection

| Need | Pattern |
|------|---------|
| 3-5 primary destinations (mobile) | Tab bar |
| Many nav items (web) | Sidebar |
| Short input | Single-line text field |
| 5-15 options | Dropdown |
| 2-5 mutually exclusive | Radio buttons |
| Quick confirmation | Toast (3-5 seconds) |
| Critical decision | Modal dialog |

---

## Design Review Requirements

Before submitting frontend work:
- [ ] All interactive elements have focus states
- [ ] Touch targets minimum 44x44px (mobile) / 36x36px (desktop)
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
| Buttons not in expected location | Follow platform conventions (iOS: top-right, Material: FAB) |
| Text not centered properly | Use CSS Grid/Flexbox alignment, not manual positioning |
| Landing page cluttered | Use proven structure (hero → social proof → features → CTA) |
| Responsive breaks at odd sizes | Test exact breakpoints: 640px, 1024px, 1280px |
| Redundant components | Establish component contracts, reuse patterns |

---

For comprehensive design guidelines, invoke the appropriate design skill via `/design`.
