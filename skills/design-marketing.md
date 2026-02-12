# Marketing & Landing Pages

> Inherits all rules from [design.md](./design.md). Read the token pack and component contracts there first. This guide covers conversion-focused pages: homepages, product pages, pricing, about pages, and launch pages.

---

## Design Paradigm: Persuasion

Marketing pages exist to **convince and convert**. Every element serves the funnel: attention → interest → trust → action. If a section doesn't serve one of these, cut it.

---

## 1. Page Structure

### The Proven Section Order

Most high-performing marketing pages follow this structure. Don't reinvent it without reason:

```
1. Navigation (sticky, minimal)
2. Hero (value prop + CTA)
3. Social proof bar (logos or metrics)
4. Problem statement or pain points
5. Solution / How it works (3-step or visual demo)
6. Features (2-3 key differentiators)
7. Testimonials or case studies
8. Pricing (if applicable)
9. FAQ
10. Final CTA (repeat hero CTA)
11. Footer
```

Not every page needs all 11. But the order matters — don't put pricing before explaining value, don't put testimonials before the product.

### Section Spacing

- Between major sections: `--space-24` (96px) on desktop, `--space-12` (48px) on mobile
- Within sections: `--space-8` to `--space-12` between elements
- Full-bleed sections can use alternating backgrounds (`--bg-primary` / `--bg-secondary`) to separate visually

---

## 2. Hero Section Contract

The hero is the most important section. Users decide in 3-5 seconds whether to scroll.

### Required Elements

| Element | Spec |
|---------|------|
| Headline | `--text-3xl` (48px) to 72px. Bold. Max 10-12 words. Benefit-oriented, not feature-oriented. |
| Subheadline | `--text-lg` (20px), `--text-secondary` color. 1-2 sentences expanding the headline. Be specific. |
| Primary CTA | One button. Verb + benefit: "Start building" > "Sign up". Prominent, high-contrast. |
| Secondary CTA (optional) | Text link or ghost button. "See demo" / "View pricing". Never competes visually with primary. |
| Visual | Real product screenshot, demo video, or mockup. Not abstract illustrations. |
| Proof row (optional) | Logo bar or metric ("50,000+ teams") immediately below CTAs. |

### Hero Anti-Patterns

- Headline longer than 12 words
- Two equally prominent CTA buttons
- No visual — just text on a color background
- Slider/carousel — pick your best message and commit
- CTA below the fold on desktop

### Reference Heroes

| Site | What They Do Well | Link |
|------|-------------------|------|
| Linear | Dark, bold headline, product screenshot, single CTA | https://linear.app |
| Stripe | Gradient text, animated product demo, clear subhead | https://stripe.com |
| Vercel | Minimal text, powerful one-liner, deploy button front and center | https://vercel.com |
| Lemon Squeezy | Playful, illustrated, clear benefit headline | https://lemonsqueezy.com |
| Arc | Full product screenshot, minimal text, bold single CTA | https://arc.net |

---

## 3. Navigation

### Marketing Nav Spec

```
┌─────────────────────────────────────────────────┐
│ [Logo]    Features  Pricing  Docs    [Sign Up]  │
└─────────────────────────────────────────────────┘
```

- **Sticky** with subtle backdrop blur + shadow on scroll
- **5-7 top-level items** max
- **CTA button**: right-aligned, visually distinct from nav links
- **Mobile**: hamburger is fine
- **Logo left, nav center or right, CTA far right** — convention users expect

### Anti-Patterns

- Mega menus on sites with < 20 pages
- Nav that disappears on scroll and doesn't return
- Transparent nav that becomes unreadable over hero images

---

## 4. Social Proof

### Types (in order of strength)

1. **Metrics**: "50,000+ teams use X" — most powerful when specific and large
2. **Logo bars**: 4-6 recognizable logos. Grayscale, evenly spaced.
3. **Testimonials**: Real quotes with name, role, company, photo. Generic praise is worthless.
4. **Case studies**: Specific results with numbers. "Company X reduced churn by 34%."
5. **Star ratings**: From real review platforms (G2, Trustpilot), not self-reported.

### Placement

- Logo bar: immediately after hero (reduces bounce)
- Testimonials: after features or before pricing (reduces objections)
- Metrics: in hero or as standalone banner

### Anti-Patterns

- "Trusted by 10+ companies" (too small to impress — remove it)
- Testimonials without concrete results
- Logo bars with unrecognizable companies

---

## 5. Feature Sections

### Layouts That Work

**Three-column grid** — 3 equal features:
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  [Icon]  │  │  [Icon]  │  │  [Icon]  │
│ Heading  │  │ Heading  │  │ Heading  │
│ 1-2 line │  │ 1-2 line │  │ 1-2 line │
│ summary  │  │ summary  │  │ summary  │
└──────────┘  └──────────┘  └──────────┘
```

**Alternating left-right** — features with screenshots:
```
┌────────────────────────────────────┐
│ [Text: heading + desc]   [Image]  │
│                                    │
│ [Image]   [Text: heading + desc]  │
└────────────────────────────────────┘
```

**Bento grid** — many features of varying importance:
```
┌────────────────┬──────────┐
│  Big feature   │ Feature  │
├────────┬───────┼──────────┤
│Feature │Feature│ Feature  │
└────────┴───────┴──────────┘
```

### Feature Copy Rules

- **Heading**: 4-8 words, benefit-oriented ("See where customers drop off" not "Analytics engine")
- **Description**: 1-2 sentences max
- **Visual**: screenshot, icon, or short animation

### References

| Site | Pattern | Link |
|------|---------|------|
| Stripe | Alternating sections with code + visuals | https://stripe.com/payments |
| Notion | Bento grid with product screenshots | https://notion.so/product |
| Linear | Feature cards, dark theme, hover interactions | https://linear.app/features |

---

## 6. Pricing Page Contract

### Layout Rules

| Rule | Spec |
|------|------|
| Tiers | 3 maximum displayed. More = decision paralysis. |
| Recommended | Highlight ONE tier with border, background, or "Most Popular" badge. |
| Feature alignment | Align features vertically for cross-tier comparison. |
| Toggle | Annual/Monthly if both offered. Pre-select annual. |
| Enterprise | "Contact us" is fine for enterprise only. All other tiers: show the price. |

```
┌──────────┐  ┌══════════════┐  ┌──────────┐
│  Free    │  ║   Pro ★      ║  │ Enterprise│
│  $0/mo   │  ║  $29/mo      ║  │ Custom    │
│ Feature  │  ║ Feature      ║  │ Feature   │
│ Feature  │  ║ Feature      ║  │ Feature   │
│ [Start]  │  ║ [Subscribe]  ║  │ [Contact] │
└──────────┘  ╚══════════════╝  └──────────┘
```

### Pricing Anti-Patterns

- Hiding prices behind "Contact us" for non-enterprise tiers (reduces trust)
- More than 3 visible tiers
- Feature lists that don't align across columns
- No indication of which tier is recommended

### References

| Site | What They Do Well | Link |
|------|-------------------|------|
| Stripe | Clean comparison, toggles, feature grid | https://stripe.com/pricing |
| Linear | Minimal tiers, clear differentiation | https://linear.app/pricing |
| Vercel | Usage-based with calculator | https://vercel.com/pricing |

---

## 7. CTAs (Calls to Action)

- **One primary CTA per viewport**
- **Verb + benefit**: "Start building" > "Sign up". "Get started free" > "Submit".
- **Repeat main CTA** at page bottom — scrollers are interested
- **Reduce friction**: "No credit card required" below the button
- **Size**: larger than surrounding text. Padding `--space-4` `--space-8` minimum.

---

## 8. Typography for Marketing

Marketing pages use bolder typography than app UI:

- **Hero headline**: 48-72px, bold. Can use serif for personality.
- **Section headings**: 32-40px, semi-bold
- **Body**: 18-20px (larger than app — marketing is read, not scanned)
- **Line-height**: 1.5 body, 1.1-1.2 headlines

Two fonts work well here: distinctive display font for headings + clean sans-serif for body.

---

## 9. Visual Polish

### Backgrounds

- Subtle gradient meshes or grain for hero sections
- Alternating `--bg-primary` / `--bg-secondary` for section rhythm
- Dark sections (navy, near-black) for emphasis — final CTA or testimonial spotlight

### Imagery

- Real product screenshots > stock illustrations. Always.
- Add browser frame, shadow, or perspective tilt to screenshots
- Optimize: hero images < 1 second load

### Motion

- Fade-in on scroll: subtle, 200-400ms, `ease-out`
- Hover on cards/buttons: `scale(1.02)` or shadow lift
- Never auto-play video with sound
- One hero animation is enough. Every section animating is exhausting.

---

## 10. Developer / Docs-Style Marketing

For developer tools marketing pages, also reference:

| Site | What to Study | Link |
|------|--------------|------|
| Stripe Docs | Technical content with marketing polish | https://stripe.com/docs |
| Tailwind CSS | Feature-rich landing with code examples | https://tailwindcss.com |
| Supabase | Developer marketing with live code demos | https://supabase.com |

Developer audiences respond to: real code snippets in the hero, terminal/CLI demos, API response examples, and "time to first result" messaging. Avoid stock illustrations and vague benefit statements.

---

## Completion Checklist

Before considering a marketing page done:

- [ ] Hero headline is under 12 words and states a benefit
- [ ] Only ONE primary CTA per viewport
- [ ] Social proof visible (logos, metrics, or testimonials)
- [ ] All spacing uses token scale from design.md
- [ ] Mobile layout tested — hero, nav, and CTA work on 375px width
- [ ] Empty/loading: not applicable for static marketing, but images must have alt text and reasonable load times
- [ ] Footer has nav links, legal, and social links
