# Design Core System

> Core design tokens, component contracts, and universal rules. This skill is inherited by all context-specific design skills (marketing, applications, dashboards).

---

## 0. Design Approach

Before writing UI code, plan the layout:

1. **Identify the context** — Is this marketing, app UI, or a dashboard? Read the relevant sub-guide.
2. **Plan the structure** — What sections/regions does the page need? What components? A quick ASCII layout sketch in a comment is fine.
3. **Consider states** — What does empty, loading, error, and populated look like? Build at least empty + populated.
4. **Use the token scale below** — No custom one-off spacing, radii, or colors. Pull from the defaults.
5. **Check the sub-guide checklist** before considering the task done.

Do not jump straight to visual polish. Structure and states first, aesthetics second.

---

## 1. Default Token Pack

These are the concrete defaults. Use these values unless the user provides brand overrides.

### Spacing Scale (4px base grid)

```
--space-1:  4px     /* icon-to-label gaps */
--space-2:  8px     /* related items within a group */
--space-3:  12px    /* compact padding (badges, small buttons) */
--space-4:  16px    /* default padding, form field gaps */
--space-6:  24px    /* card padding, section padding on mobile */
--space-8:  32px    /* section gaps */
--space-12: 48px    /* major section breaks */
--space-16: 64px    /* page-level vertical rhythm */
--space-24: 96px    /* hero section padding */
```

### Type Scale

```
--text-xs:   12px   /* captions, badges */
--text-sm:   14px   /* labels, secondary text, table body */
--text-base: 16px   /* body text */
--text-lg:   20px   /* large body, card titles */
--text-xl:   24px   /* page headings */
--text-2xl:  32px   /* section headings */
--text-3xl:  48px   /* hero headlines (marketing only) */
```

### Radii

```
--radius-sm:   4px    /* subtle rounding (inputs in dense UIs) */
--radius-md:   8px    /* default — buttons, cards, inputs */
--radius-lg:   12px   /* larger cards, modals */
--radius-full: 9999px /* pills, avatars, tags */
```

Pick ONE radius for each component type and use it consistently. Do not mix 8px buttons with 12px buttons.

### Colors (Light Theme — Default)

```css
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;

  /* Brand / Accent */
  --accent-primary: #2563EB;
  --accent-hover: #1D4ED8;

  /* Semantic */
  --success: #16A34A;
  --warning: #D97706;
  --error: #DC2626;
  --info: #2563EB;

  /* Borders */
  --border-default: #E5E7EB;
  --border-strong: #D1D5DB;
}
```

### Colors (Dark Theme)

```css
:root.dark {
  --bg-primary: #0A0A0A;
  --bg-secondary: #141414;
  --bg-tertiary: #1F1F1F;

  --text-primary: #E5E5E5;
  --text-secondary: #A3A3A3;
  --text-tertiary: #737373;

  --accent-primary: #3B82F6;
  --accent-hover: #60A5FA;

  --border-default: #262626;
  --border-strong: #404040;
}
```

Dark theme: use lighter surfaces for elevation instead of shadows.

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
```

### Breakpoints

```
640px   — tablet
768px   — large tablet (use sparingly)
1024px  — desktop
1280px  — wide desktop
```

### Max Widths

| Context | Max Width |
|---------|-----------|
| Prose / reading | 680-720px |
| Marketing page content | 1100-1280px |
| App shell (sidebar + content) | 1440-1600px |
| Dashboard grid | 1440-1800px |

### Animation Timing

```css
--duration-fast: 150ms;    /* Hover, focus, small state changes */
--duration-normal: 250ms;  /* Modals, drawers, expanding */
--duration-slow: 400ms;    /* Page transitions, complex animations */
```

Easing: `ease-out` for entering, `ease-in` for exiting, `ease-in-out` for position changes. Never `linear` for UI motion.

---

## 2. Typography

### Hierarchy

Every page needs exactly 3-4 levels of typographic hierarchy. Not more.

- **Display/Hero**: 48-72px. Used once per page max. Marketing pages only.
- **Headings**: 24-32px. Section titles. Semi-bold or bold.
- **Body**: 16-18px. Regular weight. Line-height 1.5-1.6.
- **Caption/Label**: 12-14px. Secondary info, metadata. Medium weight or muted color.

### Font Selection

Use **one** font family for most projects. Two maximum (one display, one body). Never three.

| Context | Fonts | Why |
|---------|-------|-----|
| SaaS / Apps | [Inter](https://rsms.me/inter/), [IBM Plex Sans](https://www.ibm.com/plex/), [Geist](https://vercel.com/font) | Highly legible at small sizes, good tabular numbers |
| Marketing | [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif), [Fraunces](https://fonts.google.com/specimen/Fraunces), [Sora](https://fonts.google.com/specimen/Sora) | Distinctive, memorable at large sizes |
| Editorial | [Lora](https://fonts.google.com/specimen/Lora), [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) | Elegant, readable for long-form |
| Dashboards | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (data values), paired with Inter or Geist (UI) | Monospace for numbers, sans for labels |

**Anti-patterns:**
- Don't use decorative fonts for body text
- Don't mix two sans-serif fonts — the difference is too subtle and looks like a mistake
- Don't use font weights below 400 for anything smaller than 24px

### Spacing with Type

- Headings: `margin-top` at least 1.5x the space of `margin-bottom`
- Paragraphs: `margin-bottom: 1em` minimum
- Line-height for body: 1.5–1.6. For headings: 1.1–1.25

---

## 3. Component Contracts

These define the baseline behavior for the most commonly misimplemented components. Every instance must satisfy these contracts.

### Button

| Property | Spec |
|----------|------|
| Variants | Primary (solid fill, ONE per view), Secondary (outlined/muted), Tertiary (ghost/text), Danger (red, destructive only) |
| Sizes | sm: 32px height, 12px 16px padding. md: 40px height, 12px 24px padding. lg: 48px height, 16px 32px padding. |
| Radius | `--radius-md` (8px) default. Match across all buttons in the app. |
| States | **All states must be implemented:** default, hover (darken or lift, `--duration-fast`), focus (2px ring in accent color), active (slight darken or scale down), disabled (opacity 0.5, cursor not-allowed, no hover), loading (spinner inside, width stable) |
| Touch target | Minimum 44x44px on mobile, 36x36px on desktop |
| Icon spacing | Use `gap` property on button container, NOT `margin` on icon. If icon has `margin-left/right`, text will appear off-center. |
| Text alignment | Text must be visually centered. Check for padding imbalance or icon margin causing asymmetry. |

**Interactive states verification checklist:**
- [ ] Hover: Background/color changes, cursor: pointer, transition 150ms
- [ ] Active: Visual feedback (darken, scale, shadow change)
- [ ] Focus: 2px ring, accent color, visible on keyboard navigation
- [ ] Disabled: Opacity 0.5, cursor: not-allowed, hover/active disabled
- [ ] Loading: Spinner inside button, button width doesn't jump, button disabled during load

**Common button mistakes:**
- Icon has `margin-left: 8px` → text appears off-center. Fix: Use `gap: 8px` on button, remove icon margin.
- Hover too slow (>200ms) or instant (0ms) → Use `--duration-fast` (150ms).
- No focus ring → Keyboard users can't see focus.
- Loading state changes button width → Set min-width or use absolute positioning for spinner.

### Form Field

| Property | Spec |
|----------|------|
| Layout | Label above input. Always. Never beside, never placeholder-only. |
| Input height | 40-44px |
| Padding | 12px horizontal |
| Border | 1px `--border-strong` default |
| Radius | `--radius-md` |
| States | default, hover (border darkens), focus (2px accent ring), error (red border + red text below), disabled (opacity 0.5) |
| Validation | Show errors on blur or on submit. Not on every keystroke. |
| Help text | Below input, `--text-secondary`, `--text-sm` |
| Error text | Below input (replaces help text), `--error` color, `--text-sm` |

### Card

| Property | Spec |
|----------|------|
| Padding | 16-24px consistent |
| Border | 1px `--border-default` OR `--shadow-sm`. Rarely both. |
| Radius | `--radius-md` or `--radius-lg` |
| Hover (if clickable) | Border color change or subtle shadow lift. Cursor pointer. |
| Content limit | Max 5-6 pieces of information. More = reconsider layout. |

### Table

| Property | Spec |
|----------|------|
| Header | Sticky, `--text-xs` or `--text-sm`, uppercase or semi-bold, `--text-secondary` |
| Row height | Standard: 48-52px. Compact/dashboard: 36-40px. |
| Hover | Subtle `--bg-tertiary` on row hover |
| Alignment | Text: left. Numbers: right. Status: left or center. |
| Empty state | Always designed. Icon + message + CTA. |
| Bulk actions | Checkbox column, sticky action bar on selection. |

---

## 4. Content Realism

Use realistic data in all designs. Fake data that's too clean masks layout problems.

### Names and Text

- Vary lengths: "Alex Kim", "Maria", "Christopher Johansson-Williams"
- Emails: `a@b.co` and `christopher.johansson-williams@longcompany.com`
- Titles: test 3-word and 15-word versions
- Truncation: `text-overflow: ellipsis` where text might overflow

### Numbers

- Test with 1-digit, 3-digit, and 7-digit values
- Currency: $0.00, $4.99, $1,234,567.89
- Percentages: 0%, 100%, negatives if applicable

### Edge Cases to Always Include

- Empty state (zero data)
- Single item (list with one row)
- Overflow (long content that could break layout)
- Missing data (show "—", not "undefined" or blank)

---

## 5. Layout

### Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Wide desktop */ }
```

### Grid

- CSS Grid or Flexbox. Not both fighting each other.
- Marketing: 12-column on desktop, single column on mobile
- Apps: sidebar (240-280px fixed) + fluid content
- Card grids: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`

---

## 6. Icons

- Single icon library. Recommended: [Lucide](https://lucide.dev/), [Heroicons](https://heroicons.com/), [Phosphor](https://phosphoricons.com/)
- Size: match or slightly exceed adjacent text (16px with 14px text, 20px with 16px text)
- Pair icons with text labels in navigation. Icon-only for: close (×), search, menu only.
- Consistent stroke width throughout.

---

## 7. Real-World References

Default quality bar:

| Site | What to Study | Link |
|------|--------------|------|
| Linear | App UI, information density, dark theme | https://linear.app |
| Stripe | Marketing pages, technical content | https://stripe.com |
| Vercel | Developer marketing, clean app UI | https://vercel.com |
| Airbnb | Search/filter patterns, cards, responsive | https://airbnb.com |
| Apple | Typography, whitespace, product presentation | https://apple.com |
| Notion | Flexible content, clean CRUD | https://notion.so |
| Resend | Clean developer dashboard, minimal SaaS | https://resend.com |
| Clerk | Auth UI, developer experience | https://clerk.com |
| Cal.com | Open source scheduling, form patterns | https://cal.com |

---

## 8. Common Claude Failure Modes

Actively avoid these:

1. **Decorative gradients on everything** — A gradient background doesn't make a SaaS app look good. It makes it look like a template.
2. **Purple/blue gradient defaults** — Claude gravitates toward these. Break the habit. Choose colors that fit the context.
3. **Too many rounded corners** — `border-radius: 24px` on everything is toy-like. Use `--radius-md` (8px) for most elements.
4. **Centered everything** — Marketing heroes can be centered. App UIs: left-aligned. Dashboards: grid alignment.
5. **Empty state neglect** — Always design the empty/zero state.
6. **Mobile afterthought** — If the layout breaks on mobile, the design is incomplete.
7. **Fake data that's too perfect** — Use realistic data per the Content Realism section.
8. **Ignoring loading states** — Skeleton screens or spinners for async content.
9. **Overusing cards** — Not everything needs a card. Sometimes a list with dividers is cleaner.
10. **Hero sections on every page** — Only the homepage needs a hero.
11. **No focus indicators** — Every interactive element needs a visible focus ring.
12. **Custom spacing values** — Use the token scale. `margin: 23px` = something is wrong.
13. **Inconsistent component styles** — If buttons are 8px radius on one page and pill on another, it looks broken.
