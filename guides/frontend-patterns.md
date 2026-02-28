# Frontend Patterns Guide

Responsive design, Figma implementation, design systems, and component architecture.

## Responsive Design (From Quo)

### Test at Exact Breakpoints

**Critical lesson:** Don't assume "works on mobile/desktop" — test intermediate sizes.

**Process:**
1. Document exact breakpoints with rationale
2. Test at boundaries (e.g., 1270px, 1269px)
3. Test intermediate sizes (e.g., 1100px, 800px, 500px)
4. Test on actual devices (iOS Safari, Android Chrome)

**Example from Quo:**

```typescript
/**
 * Responsive Breakpoints:
 * - ≥1270px: 2 columns + map (need space for both)
 * - 1000-1270px: 1 column + map (prioritize map)
 * - 900-1000px: 3 columns, no map (desktop without map)
 * - 630-900px: 2 columns, no map (tablet)
 * - <630px: 1 column, no map (mobile)
 *
 * Tested at: 1270px, 1269px, 1100px, 1000px, 999px, 900px, 899px, 800px, 630px, 629px, 500px
 */

<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-2
  gap-4
">
  {/* Content */}
</div>
```

**Budget 5-7 iteration batches for complex responsive work.**

### Testing Checklist

Before marking responsive design complete:

- [ ] Test at exact breakpoint boundaries (1270px, 1000px, 900px, 630px)
- [ ] Test intermediate sizes (1100px, 800px, 500px)
- [ ] Test on actual devices (iOS Safari, Android Chrome)
- [ ] Test touch interactions (swipe, tap, pinch)
- [ ] Document breakpoints with rationale
- [ ] Verify no layout hiccups between breakpoints

### Common Pitfalls

**1. Assuming Tailwind breakpoints match design intent:**

```typescript
// ❌ Wrong: May not match your design
<div className="md:grid-cols-2 lg:grid-cols-3">

// ✅ Better: Custom breakpoints documented
<div className="grid-cols-1 min-[630px]:grid-cols-2 min-[900px]:grid-cols-3">
```

**2. Not testing at exact boundaries:**

```typescript
// Test at 1270px (breakpoint) AND 1269px (just below)
// Layout should work at both sizes
```

**3. Card sizing issues:**

```typescript
// ❌ Wrong: Cards shrink too much at certain sizes
<div className="grid-cols-3">
  <Card className="w-full" />  // No min-width
</div>

// ✅ Better: Enforce minimum card size
<div className="grid-cols-3">
  <Card className="w-full min-w-[320px]" />
</div>
```

## Figma Implementation (From Expensinator)

### Clone Reference Designs Before Writing Code

**Process:**
1. Open Figma side-by-side with code editor
2. Match spacing, colors, typography EXACTLY
3. Use browser dev tools to measure
4. Iterate until pixel-perfect

**From Expensinator:** "Implementing side-by-side with Figma" prevents design drift.

### Common Pitfalls

**1. Implementing from memory:**
- ❌ Wrong: "I remember what the design looks like"
- ✅ Better: Figma open side-by-side with code

**2. "Close enough" syndrome:**
- ❌ Wrong: "It's close to the design, good enough"
- ✅ Better: Pixel-perfect match (or document intentional deviations)

**3. Not checking exact measurements:**
- ❌ Wrong: "Looks about 20px padding"
- ✅ Better: Inspect in Figma → 24px padding → use 24px

### Measuring in Figma

**1. Spacing:**
- Click element → Inspect panel shows margins/padding
- Hold Option (Mac) / Alt (Windows) to see distances

**2. Colors:**
- Click element → Copy fill color (hex, RGB, or HSL)
- Use exact values in code

**3. Typography:**
- Font family, size, weight, line height
- Match all properties exactly

**4. Shadows:**
- Box shadow values in Inspect panel
- Copy to Tailwind or CSS

### Design Iteration Rounds (From Quo)

**Expect 2-3 rounds after user reviews:**

**Round 1 (common issues):**
- Grid/layout wrong
- Color theme wrong
- Styling doesn't match design

**Round 2 (refinements):**
- Button placement
- Spacing adjustments
- Typography tweaks

**Round 3 (polish):**
- Edge cases
- Hover states
- Animations

**Budget time for design iterations.** Don't assume first implementation matches design.

## Design Systems

### CSS Variables vs Tailwind

**Expensinator approach:** CSS variables for design tokens

```css
:root {
  --color-primary: #3b82f6;
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* Theme switching */
[data-theme="dark"] {
  --color-bg: #1f2937;
  --color-text: #f9fafb;
}
```

**Benefits:**
- Theme switching (light/dark mode)
- Consistent spacing/colors
- Easy to update globally
- Works with vanilla CSS

**Quo approach:** Tailwind utility classes

```tsx
<div className="text-neutral-700 bg-neutral-50 p-4">
  {/* Content */}
</div>
```

**Benefits:**
- No context switching (styles inline)
- Autocomplete in editor
- Purge unused styles automatically
- Rapid prototyping

### Choose Based on Project Needs

| Project Type | Recommendation |
|--------------|----------------|
| Design system with themes | CSS variables |
| Rapid prototyping | Tailwind |
| Complex component library | Both (CSS variables for tokens, Tailwind for layout) |
| Vanilla JS/HTML | CSS variables |
| React/Vue/Svelte | Tailwind |

### Example: Using Both Together

```css
/* CSS variables for design tokens */
:root {
  --color-primary: #3b82f6;
  --color-danger: #ef4444;
}
```

```tsx
// Tailwind classes for layout, CSS variables for colors
<button className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--color-primary)' }}>
  Submit
</button>

// Or extend Tailwind config
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        danger: 'var(--color-danger)',
      },
    },
  },
}

// Use as Tailwind class
<button className="bg-primary text-white px-4 py-2 rounded">
  Submit
</button>
```

## Component Architecture

### Component Organization (From Expensinator)

**Organize by feature/domain, not by type:**

```
// ✅ Good - By feature
src/
├── property-search/
│   ├── SearchBar.tsx
│   ├── SearchResults.tsx
│   ├── PropertyCard.tsx
│   └── usePropertySearch.ts
├── bargaining-power/
│   ├── BargainingScore.tsx
│   ├── MarketSignals.tsx
│   └── useBargainingPower.ts

// ❌ Avoid - By type
src/
├── components/
│   ├── SearchBar.tsx
│   ├── PropertyCard.tsx
│   ├── BargainingScore.tsx
├── hooks/
│   ├── usePropertySearch.ts
│   ├── useBargainingPower.ts
```

**Benefits:**
- Easy to find related code
- Clear boundaries between features
- Easier to refactor/delete features
- Better for code splitting

### Component Size Guidelines

From coding-style.md:

| Guideline | Target |
|-----------|--------|
| Lines per file | 200-400 typical |
| Maximum | 800 (refactor if exceeds) |
| Functions | < 50 lines each |
| Nesting depth | < 4 levels |

**When component exceeds 800 lines:**
1. Extract sub-components
2. Move business logic to hooks
3. Split into multiple files by feature

### Fixed-Width Cards (From Quo)

**For consistent UX across devices:**

```tsx
// Fixed-width card (365px)
<div className="w-[365px] h-[265px]">
  <PropertyCard property={property} />
</div>

// Grid with fixed-width cards
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {properties.map(p => (
    <div key={p.id} className="w-[365px]">
      <PropertyCard property={p} />
    </div>
  ))}
</div>
```

**Benefits:**
- Predictable layout
- No card shrinking at breakpoints
- Consistent design

**Trade-off:**
- Less flexible than fluid design
- May not fill all space

## Touch Interactions

### Mobile-Specific Considerations

**1. Touch targets (minimum 44px):**

```tsx
// ❌ Too small: 32px
<button className="w-8 h-8">×</button>

// ✅ Good: 44px minimum
<button className="w-11 h-11">×</button>
```

**2. Swipe gestures:**

```tsx
// Use touch libraries for swipe
import { useSwipeable } from 'react-swipeable'

function ImageGallery({ images }) {
  const handlers = useSwipeable({
    onSwipedLeft: () => nextImage(),
    onSwipedRight: () => prevImage(),
  })

  return <div {...handlers}>{/* Gallery */}</div>
}
```

**3. Sticky positioning:**

```tsx
// Web-only: fixed bottom bar (works in browser)
<div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg md:relative md:bottom-auto">
  <button className="w-full">Write an Offer</button>
</div>
```

> **Capacitor/WKWebView warning:** `position: fixed` is broken in Capacitor's WKWebView.
> For iOS native shell components (TabBar, MiniPlayer), use flex column layout instead:
> ```tsx
> <div className="h-screen flex flex-col">
>   <div className="flex-1 min-h-0 overflow-y-auto">{/* content */}</div>
>   <div className="flex-shrink-0">{/* pinned bottom bar */}</div>
> </div>
> ```
> See `~/.claude/rules/stability.md` Section 8 for full constraints.

## Accessibility (WCAG 2.1)

### Keyboard Navigation

```tsx
// Ensure keyboard navigation works
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  onClick={handleClick}
>
  Click me
</div>
```

### ARIA Labels

```tsx
// Add aria-label for screen readers
<button aria-label="Close modal" onClick={onClose}>
  ×
</button>

// Autocomplete with ARIA
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-controls="suggestions-list"
  aria-activedescendant={selectedId}
/>
```

### Color Contrast

**Minimum ratios:**
- Normal text: 4.5:1
- Large text: 3:1
- UI components: 3:1

**Check with browser dev tools:**
- Chrome DevTools → Elements → Accessibility → Contrast

## Capacitor WKWebView — CSS Gotchas

Beyond layout issues (see `~/.claude/rules/stability.md` Section 8), WKWebView breaks CSS in ways that browser testing cannot catch:

### Third-Party Component Positioning

Components like Sonner, Radix, and Floating UI accept CSS string values (`offset`, `sideOffset`) and render them as **inline CSS custom properties**. In WKWebView, `calc()` + `env()` expressions silently fail when set as inline styles.

```tsx
// BROKEN in WKWebView — calc(env()) as inline --offset
<Toaster offset="calc(env(safe-area-inset-top) + 8px)" />

// WORKS — JS-computed numeric px
const safeTop = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('--native-safe-top').trim(), 10) || 54
<Toaster offset={safeTop + 80} />
```

**Rule:** When a third-party component accepts CSS positioning values, test on physical device before iterating. If it fails, compute numeric px via JS. Stop after 2 failed CSS approaches — see `stability.md` Section 14.

### Polling Loops (Backend)

Any `while True` polling loop that calls an external service (AssemblyAI, OpenAI, etc.) MUST have a `max_seconds` timeout. A stuck external service blocks the entire backend worker thread. See `stability.md` Section 7 (Anti-Pattern: Polling Loops Without Timeout).

## See Also

- Responsive design testing checklist: This file (Testing Checklist section)
- Component organization: `~/.claude/rules/coding-style.md`
- Design systems (CSS vs Tailwind): This file (Design Systems section)
- Capacitor WKWebView layout: `~/.claude/rules/stability.md` Sections 8, 14
- iOS native shell patterns: `~/.claude/rules/stability.md` Sections 11, 12
