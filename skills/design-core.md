# Design Core Skill

> Foundation for all design work: tokens, component contracts, Antigravity principles, accessibility standards.

---

## Antigravity Design Principles

### Visual Excellence & Premium Feel

**Avoid Generic Design:**
- No default Bootstrap/Material themes without customization
- No stock photos or placeholder content in mockups
- No basic blue (#007bff) or default grays
- No "good enough" aesthetics - always aim for premium

**Curated Palettes:**
- Use sophisticated, intentional color combinations
- Reference established design systems (Material Design 3, Tailwind)
- Create depth through subtle gradients, shadows, and layering
- Vibrant but balanced (not oversaturated)

**Premium Typography:**
- System fonts: SF Pro (Apple), Segoe UI (Windows), Roboto (Android)
- Web-safe premium: Inter, Roboto, Work Sans, Plus Jakarta Sans
- Never use Times New Roman, Arial alone, or Comic Sans
- Type scale follows mathematical ratios (1.25x, 1.333x, 1.5x)

**Depth & Texture:**
- Subtle shadows for elevation (Material Design levels 0-5)
- Layering with z-index hierarchy
- Glass morphism where appropriate (backdrop-blur, transparency)
- Micro-gradients for richness (not flat solid colors)

### Rich Aesthetics

**Vibrant Colors:**
- Accent colors should pop (high saturation for CTAs)
- Background colors subtle but not dead gray (#fafafa, not #ffffff)
- Functional colors clear (green=success, red=error, yellow=warning)
- Use color psychology (blue=trust, green=growth, purple=creativity)

**Visual Engagement:**
- Hero sections have visual interest (illustrations, gradients, patterns)
- Empty states designed with illustrations or icons
- Loading states use skeleton screens (not just spinners)
- Error states friendly and actionable (not scary red boxes)

**No Placeholders:**
- Use realistic data in mockups (real names, amounts, dates)
- Lorem ipsum only if copying real text is impractical
- Images should be relevant (not random stock photos)
- Icons match the context (e.g., receipt icon for receipts, not generic file icon)

### Dynamic & Responsive Interaction

**Micro-Animations:**
- Button hover: scale(1.02) or brightness(1.1) with 150ms transition
- Card hover: lift with shadow increase (elevation 1 → 2)
- Input focus: ring animation with 200ms ease-out
- Page transitions: fade or slide with 300ms
- Loading: smooth skeleton shimmer or pulse

**Interactive Feedback:**
- Every clickable element has hover state
- Active state on click (scale down, darken)
- Focus indicators for keyboard navigation (2px ring, accent color)
- Disabled state clear (opacity 0.5, cursor not-allowed)
- Loading state maintains layout (no content shift)

**Liquid Layouts:**
- Responsive at all breakpoints (375px, 640px, 768px, 1024px, 1280px)
- Grid systems adapt (4-col → 2-col → 1-col)
- Typography scales (clamp() or media queries)
- Touch targets scale up on mobile (44x44px minimum)
- Horizontal scrolling only when intentional

### State-of-the-Art Execution

**Modern Frameworks:**
- React 18+ with hooks (no class components)
- TypeScript for type safety
- Tailwind CSS or CSS-in-JS (Styled Components, Emotion)
- Component libraries: Radix UI, Headless UI, shadcn/ui

**Clean Structure:**
- Component-based architecture (atomic design: atoms, molecules, organisms)
- Design tokens as CSS variables or JavaScript constants
- Separation of concerns (logic vs presentation)
- Reusable components (Button, Card, Input, etc.)

**Performance:**
- Lazy loading for images (loading="lazy")
- Code splitting for routes
- Optimized assets (WebP images, SVG icons)
- No layout shift (explicit dimensions)

---

## Mobile Adaptations

**Core Principle:** Platform conventions for structure, Antigravity for polish.

**For detailed mobile guidance, see:**
- **[iOS Native Patterns](design-mobile-ios.md)** - Apple HIG, SwiftUI/UIKit, tab bars, navigation bars
- **[Android Native Patterns](design-mobile-android.md)** - Material Design 3, Jetpack Compose, bottom nav, FAB
- **[Cross-Platform Mobile](design-mobile-crossplatform.md)** - React Native, Flutter, Expo with platform-appropriate patterns

### Native Structure + Premium Polish

Mobile apps must feel **unmistakably native** to their platform (iOS or Android) while maintaining **premium visual excellence** (Antigravity principles).

**Shared Across Platforms (Antigravity Brand Identity):**
- Color palette (same brand colors on iOS and Android)
- Spacing scale (4/8/12/16/20/24/32/48 — 1dp = 1pt)
- Typography scale (same sizes, different system fonts)
- Corner radius scale (4/8/10/12/16)
- Animation timing (150ms, 300ms, 400ms)

**Platform-Specific (Native Structure):**
- Navigation patterns (iOS tab bar vs Android bottom nav)
- Interaction gestures (iOS swipe back vs Android system back button)
- Component shapes (iOS rounded rectangles vs Material cards)
- System integration (iOS Dynamic Island vs Material You dynamic color)

**Philosophy:**
- **iOS:** Respect Human Interface Guidelines for navigation/gestures, apply Antigravity aesthetics within iOS component structure
- **Android:** Respect Material Design 3 for navigation/components, apply Antigravity brand colors/spacing/typography

**Result:** iOS and Android apps look like **the same brand** (colors, spacing, typography) but feel **native to the platform** (navigation, gestures).

---

## Design Token System

### Color Tokens

**Surfaces:**
- `--bg-page`: Main app background (light: #f3f4f6, dark: #111827)
- `--bg-card`: Content containers (light: #ffffff, dark: #1f2937)
- `--bg-sidebar`: Sidebar navigation (light: #1e293b, dark: #0f172a)

**Text Hierarchy:**
- `--text-primary`: Main headings, values (light: #111827, dark: #f9fafb)
- `--text-secondary`: Labels, meta info (light: #6b7280, dark: #9ca3af)
- `--text-tertiary`: Placeholders, disabled (light: #9ca3af, dark: #6b7280)

**Functional Colors:**
- `--accent-primary`: Main brand action (e.g., #0891b2 cyan, #6366f1 indigo)
- `--success`: Positive states (#10b981 emerald)
- `--warning`: Caution states (#f59e0b amber)
- `--error`: Negative states (#ef4444 red)
- `--info`: Informational (#3b82f6 blue)

**Interactive States:**
- `--hover`: Multiply brightness by 1.1 or add 10% white overlay
- `--active`: Multiply brightness by 0.9 or add 10% black overlay
- `--focus`: 2px ring with accent color, 4px offset

**Borders:**
- `--border-subtle`: Dividers, card edges (light: #e5e7eb, dark: #374151)
- `--border-strong`: Strong separation (light: #d1d5db, dark: #4b5563)

### Typography Scale (Shared Across All Platforms)

**Font Families:**
- **Web:** Inter, Roboto, 'SF Pro', system-ui, sans-serif
- **iOS:** San Francisco (system default) OR custom brand font
- **Android:** Roboto (system default) OR custom brand font
- **Recommendation:** Use system fonts for best platform integration

**Unified Type Scale:**

Our design system uses a **shared numeric scale** across web, iOS, and Android to ensure visual consistency:

| Semantic Token | Size | Web | iOS | Android | Usage |
|----------------|------|-----|-----|---------|-------|
| `caption` | 11 | 11px | 11pt | 11sp | Smallest labels, metadata |
| `footnote` | 12 | 12px | 12pt | 12sp | Small labels, badges, button text |
| `subheadline` | 13 | 13px | 13pt | 13sp | Secondary body text |
| `callout` | 15 | 15px | 15pt | 15sp | Emphasized body text |
| `body` | 16 | 16px | 16pt | 16sp | Default body text (primary) |
| `headline` | 17 | 17px | 17pt | 17sp | List headers, emphasized text |
| `title3` | 20 | 20px | 20pt | 20sp | Card titles, section headers |
| `title2` | 22 | 22px | 22pt | 22sp | Page section headers |
| `title` | 28 | 28px | 28pt | 28sp | Large headers |
| `largeTitle` | 34 | 34px | 34pt | 34sp | Hero text, onboarding |

**Platform Unit Equivalence:**

- **1px (web) = 1pt (iOS) = 1sp (Android)** for our token system
- This ensures the same visual rhythm across platforms
- Note: `sp` on Android (not `dp`) for text to respect user's font size settings

**Font Weights:**
- `--font-regular`: 400 (body text)
- `--font-medium`: 500 (emphasis, labels)
- `--font-semibold`: 600 (headings)
- `--font-bold`: 700 (strong emphasis, rare use)

**Line Heights:**
- `--leading-tight`: 1.25 (headings)
- `--leading-normal`: 1.5 (body text)
- `--leading-relaxed`: 1.75 (long-form content)

**Implementation Notes:**
- **Web:** Use CSS variables or design tokens
- **iOS:** Create custom `Font` extension mapping to shared scale (see design-mobile-ios.md)
- **Android:** Define custom `Typography` object in MaterialTheme (see design-mobile-android.md)
- **Accessibility:** All platforms MUST support user font size preferences (web: rem/em, iOS: Dynamic Type with shared scale, Android: font scaling with sp)

### Spacing Scale (4px base)

- `--space-0`: 0px
- `--space-1`: 4px (tight gaps, icon-text spacing)
- `--space-2`: 8px (compact padding)
- `--space-3`: 12px (standard gaps)
- `--space-4`: 16px (component padding)
- `--space-5`: 20px
- `--space-6`: 24px (card padding)
- `--space-8`: 32px (section spacing)
- `--space-10`: 40px
- `--space-12`: 48px (large section spacing)
- `--space-16`: 64px
- `--space-20`: 80px
- `--space-24`: 96px (hero spacing)

**Usage:**
- Between sections: `--space-12` or `--space-24`
- Component padding: `--space-4` or `--space-6`
- Input padding: `--space-3` horizontal, `--space-2` vertical
- Button padding: `--space-4` horizontal, `--space-2` vertical

**Mobile Token Considerations:**

For mobile apps (iOS/Android), the spacing scale is **identical** but uses platform units:
- **iOS:** `4pt, 8pt, 12pt, 16pt, 20pt, 24pt, 32pt, 48pt` (pt = point)
- **Android:** `4dp, 8dp, 12dp, 16dp, 20dp, 24dp, 32dp, 48dp` (dp = density-independent pixel)
- **Equivalence:** **1dp (Android) = 1pt (iOS) = 1px (web)** for our token system

**What This Means:**

This equivalence applies to our **design token scale's numerical values** for simplicity and cross-platform consistency. We recognize that the underlying rendering technologies differ:

- **px (web):** CSS pixels, scale with browser zoom
- **pt (iOS):** Points, logical unit that maps to physical pixels based on device density (@1x, @2x, @3x)
- **dp (Android):** Density-independent pixels, logical unit that scales with screen density (mdpi, hdpi, xxhdpi, etc.)
- **sp (Android fonts):** Scale-independent pixels, like dp but also respects user's font size preference

By using the **same base numbers** (e.g., 16 for body text, 4/8/12/16 for spacing), we ensure:
1. **Consistent visual rhythm** across platforms
2. **Easier cross-platform design handoff** (designers spec once, applies everywhere)
3. **Unified design language** (iOS and Android apps look like the same brand)

**Conversion Table:**

| Token Value | Web | iOS | Android |
|-------------|-----|-----|---------|
| Body text | 16px | 16pt | 16sp |
| Card padding | 16px | 16pt | 16dp |
| Border radius | 8px | 8pt | 8dp |
| Touch target | 44px | 44pt | 48dp* |

*Android uses 48dp minimum vs iOS 44pt due to platform guidelines. This is an exception where we respect platform requirements over strict equivalence.

### Border Radius

- `--radius-xs`: 2px (subtle rounding)
- `--radius-sm`: 4px (inputs, badges)
- `--radius-md`: 8px (buttons, standard cards)
- `--radius-lg`: 12px (large cards)
- `--radius-xl`: 16px (hero cards, modals)
- `--radius-2xl`: 24px (FABs, prominent actions)
- `--radius-full`: 9999px (pills, avatars)

### Shadows (Material Design Elevation)

- `--shadow-0`: none (flush elements)
- `--shadow-1`: 0 1px 2px rgba(0,0,0,0.05) (subtle lift)
- `--shadow-2`: 0 2px 4px rgba(0,0,0,0.1) (standard cards)
- `--shadow-3`: 0 4px 8px rgba(0,0,0,0.12) (hover cards)
- `--shadow-4`: 0 8px 16px rgba(0,0,0,0.15) (modals, dropdowns)
- `--shadow-5`: 0 16px 32px rgba(0,0,0,0.2) (high emphasis)

---

## Component Contracts

### Button Contract

**Required States:**
- **Default:** Base appearance
- **Hover:** brightness(1.1) or scale(1.02), transition 150ms
- **Active:** brightness(0.9) or scale(0.98)
- **Focus:** 2px accent ring, 4px offset
- **Disabled:** opacity 0.5, cursor not-allowed, no hover effects
- **Loading:** spinner inside button, width stable (no shift)

**Size Standards:**
- **Small:** 32px height, --space-3 horizontal padding
- **Medium:** 40px height, --space-4 horizontal padding
- **Large:** 48px height, --space-6 horizontal padding

**Touch Targets:**
- **Web (Desktop):** 36x36px minimum
- **Web (Mobile):** 44x44px minimum
- **iOS:** 44x44pt minimum (Apple HIG requirement)
- **Android:** 48x48dp minimum (Material Design requirement)

**Variants:**
- **Primary:** Accent background, white text
- **Secondary:** Gray background, dark text
- **Outline:** Transparent background, border, accent text
- **Ghost:** Transparent background, accent text, hover shows background

**Icon Buttons:**
- Use `gap` property for icon-text spacing (not margin on icon)
- Icon size: 16px (small), 20px (medium), 24px (large)

**Platform Considerations:**
- **Web:** Implements `default`, `hover`, `active`, `focus`, `disabled`, `loading` states
- **iOS:** Implements `default`, `highlighted` (on touch down), `disabled` states. No "hover" on touch devices. Focus handled by system for external keyboards.
- **Android:** Implements `enabled`, `pressed` (with ripple effect), `disabled`, `focused` states. Ripple effect is Material Design signature feedback.

### Input/Form Field Contract

**Required States:**
- **Default:** Neutral border, placeholder text
- **Focus:** Accent border, ring or glow
- **Error:** Red border, error icon, error message below
- **Disabled:** Gray background, cursor not-allowed
- **Success:** Green border (optional, for validation feedback)

**Validation:**
- Show errors on blur or submit (not on every keystroke)
- Error messages specific and actionable ("Email is required" not "Invalid input")
- Success indicators subtle (checkmark icon, green border)

**Labels:**
- Always above input (not placeholder-only)
- Required fields marked with asterisk or "(required)"
- Optional fields marked with "(optional)" if ambiguous

**Size Standards:**
- Height: 40px (medium), 48px (large)
- Padding: --space-3 horizontal, --space-2 vertical

**Platform Considerations:**
- **Web:** Standard text inputs with focus rings
- **iOS:** Use `TextField` (SwiftUI) or `UITextField` (UIKit). Label behavior: floating or above input
- **Android:** Use `TextField` or `OutlinedTextField` (Jetpack Compose). Material 3 has built-in label floating animation

### Card Contract

**Structure:**
- Background: --bg-card
- Border radius: --radius-lg or --radius-md
- Padding: --space-6 (24px) or --space-4 (16px) for compact
- Shadow: --shadow-1 (default) or --shadow-2 (elevated)

**Hover (if clickable):**
- Shadow increases (--shadow-1 → --shadow-3)
- Scale up slightly: scale(1.01)
- Transition: 200ms ease-out

**Content Hierarchy:**
- Title: --text-lg, --font-semibold
- Subtitle: --text-sm, --text-secondary
- Body: --text-base, --text-primary
- Footer actions: --text-sm

### Table Contract

**Header:**
- Background: --bg-page or slight gray tint
- Text: --text-xs or --text-sm, uppercase, --text-secondary
- Sticky top (if scrollable)
- Border bottom: --border-strong

**Rows:**
- Height: 44px (compact), 52px (standard), 64px (spacious)
- Hover: --bg-page (light gray highlight)
- Alternating rows: optional, subtle bg difference
- Border bottom: --border-subtle

**Alignment:**
- Text: Left-aligned
- Numbers: Right-aligned (use tabular-nums)
- Actions: Right-aligned
- Icons: Center-aligned

**Empty State:**
- Icon + message + optional CTA
- Centered in table area

---

## Responsive Breakpoints

**Standard Breakpoints:**
- **Mobile:** 375px - 639px (single column)
- **Tablet:** 640px - 1023px (2-column layouts, collapsible sidebar)
- **Desktop:** 1024px+ (full layout, visible sidebar)
- **Wide Desktop:** 1280px+ (max-width constraints for readability)

**Testing Requirements:**
- Test at EXACT boundaries: 375px, 640px, 768px, 1024px, 1280px
- Test intermediate sizes: 630px (just below tablet), 900px (between tablet/desktop)
- No horizontal scroll unless intentional
- Touch targets scale up on mobile

**Responsive Patterns:**

**Navigation:**
- Mobile: Hamburger menu or bottom nav
- Tablet: Collapsed sidebar (icon-only) or hamburger
- Desktop: Full sidebar visible

**Grid Systems:**
- Mobile: 1 column (stack everything)
- Tablet: 2 columns or 1 column with wider content
- Desktop: 3-4 columns or 2/3 + 1/3 split

**Typography:**
- Mobile: Smaller scale (--text-base = 14px)
- Desktop: Full scale (--text-base = 16px)
- Use `clamp()` for fluid scaling

---

## Accessibility (WCAG AA)

**Required:**
- Color contrast ratio ≥ 4.5:1 (text on background)
- Focus indicators visible on all interactive elements
- Keyboard navigation (Tab, Enter, Space, Arrows)
- ARIA labels on icon-only buttons
- Form labels associated with inputs (for attribute)
- Alt text on images
- Semantic HTML (header, nav, main, footer, article, section)

**Testing:**
- Tab through entire page (focus visible?)
- Use only keyboard (can you complete actions?)
- Run Lighthouse accessibility audit (score ≥ 90)
- Check color contrast with tools (WebAIM, Figma plugins)

---

## Anti-Patterns to Avoid

**Visual:**
- ❌ ALL CAPS text for paragraphs (only small labels/badges)
- ❌ Centered body text (only headlines)
- ❌ Too many font families (max 2: sans-serif + optional mono)
- ❌ Random colors (always use design tokens)
- ❌ Tiny touch targets on mobile (< 44x44px)

**Code:**
- ❌ Hardcoded values (use design tokens)
- ❌ Inline styles (use CSS classes or styled components)
- ❌ Magic numbers (23px padding - should be --space-6)
- ❌ Brittle breakpoints (640.5px - use standard breakpoints)

**UX:**
- ❌ Validation on every keystroke (use blur/submit)
- ❌ Unclear CTAs ("Submit" vs "Create Project")
- ❌ Missing loading states (instant → content with no feedback)
- ❌ Missing empty states (blank screen with no guidance)
- ❌ Missing error states (silent failures)

---

## Implementation Workflow

### 1. Plan & Understand
- Read design brief and acceptance criteria
- Identify context (marketing, applications, dashboards)
- Sketch layout structure (header, main, sidebar, footer)
- List required components (buttons, cards, forms, etc.)

### 2. Core Foundation
- Set up design tokens (CSS variables or JS constants)
- Create base styles (typography, colors, spacing)
- Implement component contracts (Button, Card, Input)

### 3. Component-Driven Scale
- Build atomic components first (Button, Input, Badge)
- Compose molecules (SearchBar = Input + Button)
- Build organisms (Header = Logo + Nav + SearchBar + ProfileMenu)
- Assemble pages (templates with real data)

### 4. Assemble & Polish
- Integrate components into full pages
- Add micro-animations (hover, focus, transitions)
- Test responsive behavior at all breakpoints
- Test accessibility (keyboard, screen reader, contrast)
- Polish edge cases (empty, loading, error states)

---

## Context-Specific Guidance

For detailed patterns specific to:
- **Marketing pages:** See `~/.claude/skills/design-marketing.md`
- **Applications:** See `~/.claude/skills/design-applications.md`
- **Dashboards:** See `~/.claude/skills/design-dashboards.md`

This core skill provides the foundation; context-specific skills provide specialized patterns.
