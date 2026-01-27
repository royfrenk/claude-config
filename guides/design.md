# Design Agent Guide

> A comprehensive design companion for PRD creation. Use this guide to ensure every feature is thoughtfully designed with best practices, delightful interactions, and smart UX.

---

## How to Use This Guide

When creating or reviewing a PRD, work through each section systematically:
1. **Design System** → Choose your foundation
2. **Principles** → Align on core design values
3. **Patterns** → Select appropriate UI components
4. **Platform** → Apply web/mobile considerations
5. **Process** → Run through the design checklist

---

## Part 1: Design System Selection

### Decision Framework

| Your Situation | Recommendation |
|----------------|----------------|
| **iOS-only app** | Apple Human Interface Guidelines (HIG) |
| **Android-only app** | Material Design 3 |
| **Cross-platform or web-first** | Material Design 3 as foundation, or hybrid approach |
| **Startup with resources** | Custom system built on unstyled primitives |
| **Enterprise with design team** | Custom design system |

### Platform-Specific Systems

**Apple Human Interface Guidelines (HIG)**
- Best for: iOS, macOS, watchOS, tvOS apps
- Strengths: Users expect native feel, excellent accessibility guidance, clear platform conventions
- Resources: developer.apple.com/design

**Material Design 3**
- Best for: Android apps, cross-platform, web applications
- Strengths: Comprehensive documentation, huge ecosystem (MUI, Vuetify, Flutter), flexible theming
- Resources: m3.material.io

### The Hybrid Approach (Recommended for Most Teams)

Rather than using a system stock, build a lightweight custom layer:

**Step 1: Choose unstyled primitives**
- Radix UI (React)
- Headless UI (React/Vue)
- Ark UI (Framework-agnostic)
- Adobe React Aria

**Step 2: Apply your visual layer**
- Colors and color modes
- Typography scale
- Spacing system
- Border radii and shadows
- Motion/animation tokens

**Step 3: Steal the thinking, own the aesthetics**
- Borrow component *behavior* specs from Material or HIG
- Borrow *accessibility* patterns from established systems
- Make the *visual design* distinctly yours

**Step 4: Document as you build**
- Don't over-engineer upfront
- Document patterns after they're proven
- Let the system emerge from real product needs

### What to Avoid

| Anti-Pattern | Why It's a Problem |
|--------------|-------------------|
| **Mixing systems visibly** | iOS switches + Material text fields = jarring UX |
| **Choosing based on trends** | Systems should match your platform and users |
| **Over-engineering early** | Build product first, systematize later |
| **Using stock everything** | Your product will feel generic |
| **Ignoring platform conventions** | Users have muscle memory; respect it |

### Team Size Considerations

| Team | Approach |
|------|----------|
| **Solo / tiny team** | Use a complete system (Material, Chakra, Ant Design) to move fast |
| **Small team (2-5)** | Hybrid approach with unstyled primitives |
| **Medium team (5-15)** | Custom system with dedicated design resource |
| **Large team (15+)** | Full design system with documentation site, component library, and governance |

### Quick Decision Tree

```
Are you building for a single platform?
├── Yes, iOS → Use HIG
├── Yes, Android → Use Material Design 3
└── No, cross-platform or web
    └── Do you have design resources?
        ├── No → Use Material Design 3 or complete system (Chakra, etc.)
        └── Yes → Hybrid approach with unstyled primitives
```

---

## Part 2: Design Principles

### The 10 Heuristics (Nielsen)

Apply these as a sanity check for every feature:

| Heuristic | Question to Ask |
|-----------|-----------------|
| **Visibility of system status** | Does the user always know what's happening? |
| **Match with real world** | Does it use familiar language and concepts? |
| **User control & freedom** | Can users easily undo, escape, or go back? |
| **Consistency & standards** | Does it follow platform conventions? |
| **Error prevention** | Does it prevent mistakes before they happen? |
| **Recognition over recall** | Are options visible rather than memorized? |
| **Flexibility & efficiency** | Does it serve both novice and expert users? |
| **Aesthetic & minimal design** | Is every element earning its place? |
| **Error recovery** | Are error messages helpful and actionable? |
| **Help & documentation** | Is guidance available when needed? |

### Delight Principles

Beyond usability, aim for these qualities:

- **Anticipatory**: Predict what users need before they ask
- **Responsive**: Feel immediate, even when processing
- **Forgiving**: Make it easy to recover from mistakes
- **Rewarding**: Celebrate progress and accomplishments
- **Personal**: Adapt to individual preferences and patterns
- **Trustworthy**: Be transparent about what's happening and why

### The 3-Second Rule

Users should understand these within 3 seconds of seeing any screen:
1. **Where am I?** (context and navigation)
2. **What can I do here?** (available actions)
3. **Why should I care?** (value proposition)

---

## Part 3: Component Patterns

### Navigation Patterns

| Pattern | Use When | Avoid When |
|---------|----------|------------|
| **Tab bar** (mobile) | 3-5 primary destinations | More than 5 items |
| **Hamburger menu** | Secondary navigation, space-constrained | Primary navigation on desktop |
| **Bottom sheet** | Contextual actions, filters | Complex multi-step flows |
| **Breadcrumbs** | Deep hierarchical content | Flat information architecture |
| **Sidebar** (web) | Many navigation items, dashboard-style apps | Simple marketing sites |

### Input Patterns

| Pattern | Use When | Best Practices |
|---------|----------|----------------|
| **Single-line text** | Short answers (name, email) | Clear placeholder, visible label |
| **Text area** | Long-form content | Show character count if limited |
| **Dropdown/Select** | 5-15 predefined options | Alphabetize or order logically |
| **Radio buttons** | 2-5 mutually exclusive options | Show all options at once |
| **Checkboxes** | Multiple selections allowed | Group related options |
| **Toggle** | Binary on/off settings | Show immediate effect |
| **Stepper** | Numeric input with small range | Include direct input option |
| **Date picker** | Date selection | Support keyboard input too |
| **Autocomplete** | Large option sets, search | Show recent/popular first |

### Feedback Patterns

| Pattern | Use When | Duration |
|---------|----------|----------|
| **Toast/Snackbar** | Non-critical confirmations | 3-5 seconds |
| **Inline validation** | Form field feedback | Immediate |
| **Modal dialog** | Critical decisions, confirmations | Until dismissed |
| **Progress indicator** | Operations > 1 second | During operation |
| **Skeleton screens** | Loading content | Until content loads |
| **Empty states** | No data available | Persistent |
| **Success animation** | Completed important actions | 1-2 seconds |

### Action Patterns

| Pattern | Use When |
|---------|----------|
| **Primary button** | One main action per screen/section |
| **Secondary button** | Alternative actions |
| **Text/Ghost button** | Tertiary actions, cancel |
| **FAB (mobile)** | Single promoted action |
| **Swipe actions** | Quick actions on list items |
| **Long press** | Secondary/power-user actions |
| **Pull to refresh** | Refreshing content lists |

---

## Part 4: Platform Considerations

### Web-Specific

**Responsive Breakpoints**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Web Best Practices**
- Support keyboard navigation throughout
- Ensure hover states for interactive elements
- Design for mouse precision (smaller tap targets OK)
- Consider right-click context menus for power users
- Support browser back/forward navigation
- Make URLs meaningful and shareable
- Design for multiple window sizes simultaneously

**Web Performance Perception**
- Show skeleton screens for content loading
- Lazy load below-the-fold content
- Optimistically update UI before server confirms

### Mobile-Specific

**Touch Targets**
- Minimum: 44x44pt (iOS) / 48x48dp (Android)
- Comfortable: 48x48pt / 56x56dp
- Spacing between targets: 8pt minimum

**Mobile Best Practices**
- Design for thumb reach (bottom navigation, FABs)
- Support both portrait and landscape where appropriate
- Account for notches, home indicators, and safe areas
- Design for one-handed use when possible
- Use native patterns (swipe, pull-to-refresh, gestures)
- Consider offline states and poor connectivity
- Respect system dark mode and text size settings

**iOS vs Android Nuances**

| Element | iOS | Android |
|---------|-----|---------|
| Navigation | Bottom tab bar, edge swipe back | Bottom nav, hardware/gesture back |
| Primary action | Top-right or centered | FAB or top-right |
| Lists | Swipe to reveal actions | Long-press for context menu |
| Modals | Sheets from bottom | Dialogs, bottom sheets |
| Typography | SF Pro | Roboto |

### Cross-Platform Strategy

- **Consistent**: Core functionality and information architecture
- **Adapted**: Interaction patterns and UI components
- **Native**: Gestures, transitions, and system integration

---

## Part 5: Accessibility Best Practices

### Visual

- **Color contrast**: 4.5:1 for normal text, 3:1 for large text
- **Don't rely on color alone**: Use icons, patterns, or text too
- **Text sizing**: Support system text size preferences
- **Focus indicators**: Visible keyboard focus states
- **Motion**: Respect "reduce motion" preferences

### Interactive

- **Touch targets**: Minimum 44x44pt
- **Labels**: All interactive elements need accessible names
- **Hierarchy**: Use proper heading levels (h1 → h2 → h3)
- **Forms**: Labels, error messages, and instructions are associated
- **Timing**: No time limits, or provide extensions

### Content

- **Alt text**: Descriptive for informative images, empty for decorative
- **Link text**: Descriptive (avoid "click here")
- **Language**: Plain language, avoid jargon
- **Structure**: Logical reading order

### Quick Checks

- [ ] Can you complete all tasks with keyboard only?
- [ ] Can you understand the UI without color?
- [ ] Do all images have appropriate alt text?
- [ ] Are form fields properly labeled?
- [ ] Do error messages explain how to fix the issue?

---

## Part 6: The Design Process

### Phase 1: Understanding

Before designing, answer these questions:

**User Questions**
- Who is the primary user? Secondary users?
- What is their current workflow/workaround?
- What devices/contexts will they use this in?
- What is their technical sophistication?

**Business Questions**
- What is the success metric for this feature?
- Are there constraints (technical, timeline, brand)?
- What existing patterns should we leverage?

**Context Questions**
- Where does this feature live in the product?
- What comes before and after this experience?
- How will users discover this feature?

### Phase 2: Designing

**State Inventory**
For every screen, design for:
- [ ] **Empty state**: First-time or no data
- [ ] **Loading state**: Data being fetched
- [ ] **Partial state**: Some data available
- [ ] **Ideal state**: Full data, happy path
- [ ] **Error state**: Something went wrong
- [ ] **Edge states**: Overflow, extremes, permissions

**Interaction Inventory**
For every interactive element, define:
- [ ] Default appearance
- [ ] Hover state (web)
- [ ] Pressed/active state
- [ ] Focused state (keyboard)
- [ ] Disabled state
- [ ] Loading state (if applicable)

**Content Inventory**
- [ ] All labels and button text
- [ ] Error messages and validation text
- [ ] Empty state messaging
- [ ] Help text and tooltips
- [ ] Confirmation dialogs

### Phase 3: Validating

**Self-Review Checklist**

*Usability*
- [ ] Can a new user complete the task without help?
- [ ] Is the most important action the most prominent?
- [ ] Can users recover from any error?
- [ ] Is feedback immediate for all actions?

*Delight*
- [ ] Does it feel fast and responsive?
- [ ] Are there moments of delight or polish?
- [ ] Does it respect the user's time?
- [ ] Would I enjoy using this?

*Consistency*
- [ ] Does it match existing product patterns?
- [ ] Are similar things styled similarly?
- [ ] Does terminology match the rest of the product?

*Edge Cases*
- [ ] What if there's no data?
- [ ] What if there's too much data?
- [ ] What if the user is offline?
- [ ] What if an operation takes too long?
- [ ] What if the user has restricted permissions?

---

## Part 7: Common Pitfalls

### Anti-Patterns to Avoid

| Anti-Pattern | Problem | Better Alternative |
|--------------|---------|-------------------|
| **Mystery meat navigation** | Icons without labels | Label icons or use tooltips |
| **Infinite scroll without markers** | Users can't return to position | Add anchors or pagination option |
| **Aggressive modals** | Interrupt user flow | Use inline or less intrusive patterns |
| **Hidden scroll** | Users don't know content exists | Show scroll indicators or partial content |
| **Disabled without explanation** | Users don't know why | Explain or hide unavailable options |
| **Wall of text** | Overwhelming, unreadable | Break up with hierarchy and spacing |
| **Unclear CTAs** | Users don't know what happens | Use specific, action-oriented labels |
| **No feedback on action** | Users unsure if it worked | Always acknowledge actions |

### Questions That Reveal Problems

- "Where did that go?" → Need better feedback
- "How do I get back?" → Need clearer navigation
- "Did it work?" → Need confirmation/feedback
- "What does this mean?" → Need clearer copy
- "Which one do I pick?" → Need better differentiation
- "Is it loading or broken?" → Need loading states

---

## Part 8: Design Documentation Template

When documenting designs in a PRD, include:

```markdown
## Feature: [Feature Name]

### User Story
As a [user type], I want to [action] so that [benefit].

### Entry Points
- How users discover/access this feature

### Core Flow
1. Step one
2. Step two
3. Step three

### UI Components
- List key components used
- Note any new patterns introduced

### States
- Empty: [description]
- Loading: [description]
- Error: [description]
- Success: [description]

### Interactions
- Key interactions and their feedback
- Animations/transitions

### Content
- Key labels and messages
- Error message copy

### Accessibility
- Keyboard navigation path
- Screen reader considerations

### Edge Cases
- [Case]: [Handling]

### Open Questions
- Design decisions that need input
```

---

## Quick Reference Card

### Before You Design
1. Choose your design system foundation
2. Who is the user?
3. What's the context?
4. What's the success metric?

### While You Design
1. Apply the 10 heuristics
2. Design all states
3. Consider both platforms
4. Check accessibility

### Before You Ship
1. Run the self-review checklist
2. Test keyboard navigation
3. Verify error handling
4. Check loading states

### The Golden Rule
> If you have to explain how it works, redesign it.

---

*This guide is a living document. Update it as you learn what works for your products and users.*
