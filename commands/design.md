---
description: Invoke design skills with automatic context detection for marketing, applications, or dashboards.
---

# Design Command

> Invoke design skills with automatic context detection.

---

## How It Works

1. User invokes `/design` with or without a description
2. Analyze the request to determine context (marketing, applications, dashboards)
3. Load the appropriate design skill
4. If context is ambiguous, ask the user to choose

---

## Usage

```
/design                          # Will ask you to choose context
/design landing page for SaaS    # Auto-selects marketing skill
/design admin panel              # Auto-selects applications skill
/design analytics dashboard      # Auto-selects dashboards skill
```

---

## Context Detection Rules

Analyze the user's request for keywords:

**Marketing context:**
- Keywords: landing page, marketing site, hero section, pricing page, homepage, product page, conversion, CTA, social proof
- Auto-load: `design-marketing` skill

**Applications context:**
- Keywords: admin panel, CRUD, SaaS dashboard, settings page, form, list view, detail page, user management
- Auto-load: `design-applications` skill

**Dashboards context:**
- Keywords: analytics, dashboard, KPI, metrics, chart, data visualization, monitoring, reporting
- Auto-load: `design-dashboards` skill

**Ambiguous:**
- If no clear keywords, or multiple contexts detected
- Ask: "What are you designing? (1) Marketing/Landing page, (2) Application/SaaS interface, (3) Analytics Dashboard"

---

## Process

### Step 1: Detect Context

Read the user's request. Apply the context detection rules above.

### Step 2: Load Core + Specific Skill

**Always load both:**
1. `~/.claude/skills/design-core.md` (token pack, component contracts)
2. The specific skill based on context

Say:
> "I've loaded the [marketing/applications/dashboards] design skill. This includes the core design tokens and [specific context] patterns."

### Step 3: Execute Design Work

Follow the loaded skill's instructions. The skill will guide you through:
- Planning the layout
- Choosing components
- Handling states (empty, loading, error)
- Responsive considerations
- Completion checklist

### Step 4: Reference Design-Reviewer

Remind the user:
> "When you're ready for review, the Design-Reviewer agent will verify this against the design standards."

---

## Skill Relationships

All design skills inherit from `design-core.md`:
- **design-core.md** → Token pack, component contracts, universal rules
- **design-marketing.md** → Marketing/landing pages (inherits core)
- **design-applications.md** → SaaS/app UI (inherits core)
- **design-dashboards.md** → Dashboards/data viz (inherits core)

When you load a specific skill, you're getting core + specific context.

---

## Anti-Patterns

- Don't invoke multiple design skills simultaneously (causes confusion)
- Don't skip the core skill (specific skills assume core tokens)
- Don't use design skills for backend/API work (not relevant)

---

## Example Invocations

**User:** `/design`
**You:** "What are you designing? (1) Marketing/Landing page, (2) Application/SaaS interface, (3) Analytics Dashboard"
**User:** "2"
**You:** *Load design-core + design-applications*

**User:** `/design homepage for our new product`
**You:** *Detect "homepage" → marketing context. Auto-load design-core + design-marketing*
**You:** "I've loaded the marketing design skill. Let's plan the homepage structure..."

**User:** `/design user settings page`
**You:** *Detect "settings page" → applications context. Auto-load design-core + design-applications*
**You:** "I've loaded the applications design skill. Settings pages follow the CRUD canonical patterns..."
