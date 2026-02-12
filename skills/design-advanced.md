# Design Advanced Topics

> Archive of advanced design topics extracted from original design guide. These are valuable but not immediately needed for the 5 core design issues. Can be revived and integrated later as needed.

---

## Advanced Accessibility

### ARIA Patterns

- `aria-label` for icons without text
- `aria-describedby` for help text associations
- `aria-live` regions for dynamic content
- `aria-expanded` for collapsible sections
- `aria-current` for current page/step in navigation

### Screen Reader Optimization

- Semantic HTML first (nav, main, aside, article, section)
- Skip links for keyboard navigation
- Visually hidden text for icon-only buttons
- Table headers properly associated with data cells
- Form field groups with `fieldset` and `legend`

### Advanced Keyboard Navigation

- Roving tabindex for radio groups and toolbars
- Arrow key navigation in menus
- Escape key to close all modals/dropdowns
- Space vs Enter for activation (buttons vs links)

---

## Advanced Animation

### Motion Design Tokens

```css
--ease-in-out-back: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-in-out-circ: cubic-bezier(0.785, 0.135, 0.15, 0.86);
```

### Animation Principles

1. **Purposeful motion**: Animation should communicate state change or direct attention
2. **Respect user preferences**: Honor `prefers-reduced-motion`
3. **Performance**: Use `transform` and `opacity` only for 60fps
4. **Interruptibility**: Animations should be cancelable mid-flight

### Micro-interactions

- Button press: scale(0.98) + shadow lift on active
- Success: checkmark fade-in + scale + subtle bounce
- Error: shake animation (translate X: -10px → 10px → 0)
- Loading: spinner rotation + pulse on container
- Toast entry: slide-in from top + fade-in

---

## Advanced Chart Patterns

### Chart Type Selection Matrix

| Data Type | Relationship | Best Chart |
|-----------|--------------|------------|
| Time series, continuous | Trend | Line chart |
| Time series, discrete | Comparison | Vertical bar |
| Categorical, ranked | Comparison | Horizontal bar |
| Part-to-whole, static | Composition | Donut (≤5 slices) |
| Part-to-whole, over time | Composition change | Stacked area |
| Two numeric variables | Correlation | Scatter plot |
| Distribution | Spread | Histogram, box plot |
| Geospatial | Location | Map with markers |

### Advanced Data Viz Principles

**Data-ink ratio**: Maximize information, minimize decoration
- Remove gridlines if possible
- Remove chart borders
- Use direct labels instead of legends when practical
- Light colors for non-data elements

**Perceptual accuracy**:
- Humans are bad at: angles (pie charts), 3D depth, area comparison
- Humans are good at: position along scale, length comparison, color intensity

**Annotation and storytelling**:
- Add annotations for significant events ("Product launch")
- Highlight outliers or trends with color/callouts
- Show comparison baseline ("vs last year")

---

## Advanced Color Theory

### Color Palette Generation

**Categorical (unrelated series):**
- Use perceptually distinct hues (blue, orange, green, purple, red)
- Avoid adjacent hues (blue + teal = confusing)
- Ensure sufficient contrast between all pairs

**Sequential (magnitude):**
- Single hue, vary lightness: #E3F2FD → #1976D2
- Perceptually uniform: same visual "steps" between values

**Diverging (positive/negative):**
- Two hues meeting at neutral: Red ← Gray → Green
- Useful for: change over time, above/below baseline

### Color Accessibility Beyond Contrast

- Never use red/green as only differentiator (8% of men are colorblind)
- Pair color with shape, pattern, or icon
- Test with colorblind simulators
- Use patterns in chart fills (stripes, dots) in addition to color

---

## Advanced Responsive Patterns

### Container Queries

When component needs to adapt to its container, not viewport:

```css
@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

Use for: cards in variable-width sidebars, widgets in dashboards

### Fluid Typography

Scale font size smoothly between breakpoints:

```css
font-size: clamp(1rem, 0.875rem + 0.5vw, 1.5rem);
```

### Responsive Images

```html
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.jpg">
  <source media="(min-width: 640px)" srcset="hero-tablet.jpg">
  <img src="hero-mobile.jpg" alt="Hero image">
</picture>
```

---

## Advanced Form Patterns

### Multi-step Forms with State Persistence

- Save to localStorage on each step completion
- Restore on page reload
- Clear on final submission or explicit abandon
- Show "Resume where you left off" if state exists

### Inline Validation Patterns

- Show success checkmark on valid field (green border + icon)
- Error messages appear on blur, hide on focus
- Real-time validation only for: password strength, username availability
- Don't validate until user has finished typing (debounce 500ms)

### Complex Input Types

- Date range picker: two calendars side-by-side, highlight range
- Multi-select with search: tags + dropdown + autocomplete
- File upload with preview: drag-drop zone, show thumbnails, progress bars
- Rich text editor: minimal toolbar, keyboard shortcuts, markdown support

---

## Performance Optimization for Design

### Image Optimization

- Use next-gen formats: WebP, AVIF
- Lazy load below-the-fold images
- Responsive images with srcset
- Optimize above-the-fold images aggressively (< 100KB)

### Font Loading Strategy

```css
@font-face {
  font-family: 'Inter';
  font-display: swap; /* Show fallback immediately, swap when ready */
  src: url('/fonts/inter.woff2') format('woff2');
}
```

### CSS Performance

- Avoid expensive properties in animations: `box-shadow`, `filter`, `border-radius`
- Use `transform` and `opacity` for 60fps
- `will-change` for elements about to animate (sparingly)
- Minimize paint area: transform instead of top/left

---

## Design Tokens Management

### Token Organization

```
tokens/
  colors.json        # All color definitions
  spacing.json       # Spacing scale
  typography.json    # Font sizes, weights, families
  shadows.json       # Box shadow values
  radii.json         # Border radius values
  breakpoints.json   # Responsive breakpoints
```

### Token Naming Convention

```
--[category]-[property]-[variant]-[state]

Examples:
--color-text-primary
--color-bg-secondary
--space-component-card-padding
--typography-heading-xl-weight
```

---

This archive contains patterns and techniques that extend beyond the core design system. Integrate these as needs arise, but prioritize the fundamentals first.
