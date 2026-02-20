# RTL & Internationalization Checklist

Use this checklist when implementing or modifying components that display text content. RTL is a cross-cutting concern — not per-component.

**Post-mortem:** `docs/post-mortem/2026-02-20-artwork-waterfall-rtl-sprint-012.md` (4 batches of RTL fixes)

---

## Before Marking a Text Component Complete

### 1. Translation

- [ ] All user-visible strings use the `translations` object (not hardcoded English)
- [ ] New translation keys added to ALL languages in `TRANSLATIONS` (not just `en` and the target language)
- [ ] Section titles, button labels, placeholders, error messages — all translated

### 2. RTL Layout

- [ ] Component receives `isRTL` prop (or derives it from language context)
- [ ] Parent `ExpandableSection` or container has `isRTL` prop set
- [ ] **Never combine `flex-row-reverse` with `dir="rtl"`** — they cancel out (double-reversal)
- [ ] `dir="rtl"` on a parent auto-reverses child flex layouts — no explicit reversal needed on children
- [ ] Border/icon positioning uses physical properties that need manual swap (e.g., `border-l` vs `border-r`)
- [ ] Text alignment inherits from `dir` attribute — don't add `text-right` on children when parent has `dir="rtl"`

### 3. CSS Direction Inheritance

When `dir="rtl"` is set on a container:

| Property | Behavior | Action |
|----------|----------|--------|
| `flex` (row) | Auto-reverses | Do NOT add `flex-row-reverse` |
| `text-align` | Defaults to right | Do NOT add `text-right` |
| `margin/padding` (logical) | `ms-*`/`me-*` auto-swap | Use logical properties |
| `margin/padding` (physical) | `ml-*`/`mr-*` do NOT swap | Must manually swap or use `isRTL` conditional |
| `border-l`/`border-r` | Do NOT swap | Must manually swap with `isRTL` conditional |
| `absolute positioning` (`left`/`right`) | Do NOT swap | Must manually swap with `isRTL` conditional |

### 4. Testing with RTL Content

- [ ] Switch to Hebrew/Arabic test content — does layout reverse correctly?
- [ ] Numbers and Latin text within RTL content — do they display LTR (bidirectional)?
- [ ] Mixed content (Hebrew title + English subtitle) — correct alignment for each?

---

## Common Patterns

### Correct: Parent handles direction

```tsx
<ExpandableSection title={translations.sectionName} isRTL={activeRTL}>
  {/* Children inherit dir="rtl" from ExpandableSection */}
  <div className="flex gap-3">
    <Icon className="w-5 h-5" />
    <span>{text}</span>
  </div>
</ExpandableSection>
```

### Wrong: Double-reversal

```tsx
// Parent sets dir="rtl" which reverses flex...
<ExpandableSection isRTL={true}>
  {/* ...then child ALSO reverses → back to LTR! */}
  <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
    <Icon />
    <span>{text}</span>
  </div>
</ExpandableSection>
```

### Correct: Physical properties need manual swap

```tsx
// border-l/border-r don't respond to dir="rtl"
<div className={cn(
  "border-l-2 pl-4",
  isRTL && "border-l-0 border-r-2 pl-0 pr-4"
)}>
```

---

## When to Apply This Checklist

- Any new component that displays text
- Any component modification that adds text or changes layout
- Any feature targeting a RTL language (Hebrew, Arabic)
- During iteration when user reports RTL issues — fix ALL components systematically, not just the reported one
