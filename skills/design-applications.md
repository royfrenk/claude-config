# Applications & SaaS

> Inherits all rules from [design.md](./design.md). Read the token pack and component contracts there first. This guide covers functional application interfaces: admin panels, CRUD apps, settings, onboarding, forms, and multi-page SaaS products.

---

## Design Paradigm: Enablement

Application UI exists to help users **accomplish tasks efficiently, repeatedly, for hours**. It is not a marketing page. Restraint and consistency matter more than visual impact. The best app UIs are invisible — users focus on their work, not the interface.

---

## 1. Layout Architecture

### The Standard App Shell

Almost every SaaS app uses this layout. Don't reinvent it without reason:

```
┌──────────────────────────────────────────────┐
│ Top bar (breadcrumbs, search, user avatar)    │
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Side   │         Main Content Area           │
│ Nav    │                                     │
│        │   max-width: 1200px or fluid        │
│ 240-   │   padding: --space-6 to --space-8   │
│ 280px  │                                     │
│        │                                     │
├────────┴─────────────────────────────────────┤
│ (No footer in app UIs)                       │
└──────────────────────────────────────────────┘
```

### When to Use Sidebar vs Top Nav

| Use Sidebar | Use Top Nav |
|-------------|-------------|
| 5+ main sections | 3-4 sections max |
| Deep hierarchy (nested pages) | Flat structure |
| User spends long sessions | Quick in-and-out tasks |
| Desktop-primary app | Mobile-first or responsive-first |

Most SaaS apps: sidebar. Simple tools and utilities: top nav is fine.

### Sidebar Spec

- **Width**: 240-280px. Collapsible to 64px (icon-only) on smaller screens.
- **Top**: Logo/app name
- **Middle**: Main nav items, grouped with subtle section labels
- **Bottom**: Settings, profile, help
- **Active state**: `--bg-tertiary` background + bold text or accent left border
- **Max visible items without scrolling**: 8-10

### Top Bar Spec

- **Height**: 48-56px
- **Left**: Breadcrumbs
- **Right**: Search, notifications, user avatar + dropdown
- **Border**: `1px solid --border-default` bottom. Not shadow.

### References

| App | Layout Pattern | Link |
|-----|---------------|------|
| Linear | Sidebar + top bar, collapsible, keyboard shortcuts | https://linear.app |
| Notion | Sidebar with nested pages, clean content area | https://notion.so |
| Stripe Dashboard | Top tabs + sidebar, dense but organized | https://dashboard.stripe.com |
| GitHub | Top nav + repo sidebar, responsive collapse | https://github.com |
| Resend | Minimal sidebar, spacious content | https://resend.com |

---

## 2. CRUD Canonical Patterns

These are the three page templates that cover 80% of SaaS app views. Use these as starting points, not blank canvases.

### List Page

```
┌─────────────────────────────────────────────┐
│ Page Title                  [+ Create New]  │
├─────────────────────────────────────────────┤
│ [Search] [Filter ▾] [Filter ▾]  [Sort ▾]   │
├─────────────────────────────────────────────┤
│ ☐ │ Name            │ Status │ Date │ •••   │
│ ☐ │ Item One        │ Active │ Jan 15│ •••  │
│ ☐ │ Item Two        │ Draft  │ Jan 12│ •••  │
│ ☐ │ Item Three      │ Active │ Jan 10│ •••  │
├─────────────────────────────────────────────┤
│ Showing 1-20 of 156          [< 1 2 3 ... >]│
└─────────────────────────────────────────────┘
```

**Rules:**
- Title + primary action button (top right) on same row
- Filters above the table, not in a sidebar drawer (unless 5+ filters)
- Table follows the Table contract from design.md
- Pagination OR infinite scroll — pick one, be consistent
- Show total count always
- Bulk actions: checkbox column → sticky action bar appears on selection
- **Empty state is mandatory** — icon + message + CTA to create first item

### Detail Page

```
┌─────────────────────────────────────────────┐
│ ← Back to list    Item Name        [Edit]   │
├─────────────────┬───────────────────────────┤
│                 │                           │
│  Main Content   │  Sidebar (metadata)       │
│                 │  - Created: Jan 15        │
│  [Tab 1] [Tab 2]│  - Status: Active        │
│                 │  - Owner: Alex Kim        │
│  Content area   │                           │
│  for active tab │  Activity log             │
│                 │  - "Status changed" 2h    │
│                 │  - "Created" Jan 15       │
└─────────────────┴───────────────────────────┘
```

**Rules:**
- Back link to parent list (top left)
- Key info in header: name, status, primary action
- Use tabs for 2-5 views of the same entity
- Metadata sidebar (right) for secondary info: dates, owner, tags, activity
- If no sidebar content, go full-width

**When to use tabs vs sections:**
- Tabs: content is distinct enough that users only need one view at a time
- Sections: content is related and users benefit from scanning all at once

### Create / Edit Page

**Decision: Modal vs Full Page**

| Use Modal | Use Full Page |
|-----------|---------------|
| < 5 fields | > 5 fields |
| Quick creation (title + done) | Complex forms, multi-step |
| User shouldn't lose list context | Focused task, no distraction |

**Modal spec:**
- Max width: 480-560px
- Backdrop: dark overlay, click-outside to close
- Header: title + close (×) button
- Footer: Cancel (ghost) + Submit (primary), right-aligned

**Full page spec:**
- Title: "Create [Thing]" or "Edit [Thing Name]"
- Form layout: single column, max-width 640px
- Group related fields with section headers
- Sticky footer or inline submit button
- Unsaved changes: warn before navigation

---

## 3. Information Architecture

### Nav Grouping Rules

Group by user task, not by technical structure:

| Bad (developer thinking) | Good (user task thinking) |
|--------------------------|---------------------------|
| Models, Endpoints, Webhooks | Projects, Deployments, Settings |
| Users, Roles, Permissions | Team, Settings |
| Invoices, Payments, Subscriptions | Billing |

### Naming Rules

- Use nouns for sections: "Projects", "Settings", "Team"
- Use verbs for actions: "Create project", "Invite member"
- Be consistent: if one section is plural ("Projects"), all are ("Settings", not "Setting")
- Avoid jargon the user wouldn't use

---

## 4. Forms

### Layout Rules

- **Single column** for most forms. Two-column creates scanning confusion.
- **Label above input**. Always.
- **Group related fields** with visual proximity and optional section headers.
- **Progressive disclosure**: advanced options behind a toggle or expandable section.

### Validation

| Timing | When to Use |
|--------|-------------|
| On blur | Default for most fields. Validates when user leaves the field. |
| On submit | Fallback — shows all errors at once. Always validate on submit even if also validating on blur. |
| On keystroke | Only for real-time feedback (password strength, username availability). Never for standard fields. |

**Error display:**
- Inline below the specific field: red border + red text
- Summary at top of form: only if there are errors in fields not currently visible (long forms)
- Error text replaces help text (don't stack both)

### Multi-Step Forms (Wizards)

- Step indicator at top (numbered steps or progress bar)
- Previous / Next buttons with step labels
- Allow going back without losing data
- Summary / review step before final submission
- Don't use wizards for < 5 fields — just show the form

### Settings Pages

- Group into sections with clear headings
- Auto-save with confirmation toast, OR save button per section — pick one pattern
- Destructive settings (delete account) at the bottom, behind confirmation
- Settings should never look like a marketing page

---

## 5. States

### Permission and Access States

Not all empty states are equal. Distinguish:

| State | Display |
|-------|---------|
| Empty (no data yet) | Icon + "No [items] yet" + CTA to create first |
| Empty (filters active, no matches) | "No results match your filters" + clear filters link |
| No access (insufficient permissions) | Lock icon + "You don't have access to [feature]" + who to contact or how to upgrade |
| Disabled (feature not available on plan) | Greyed content + upgrade prompt |
| Loading | Skeleton screens matching the expected layout |
| Error | Error message + retry button + fallback content if possible |

### Loading States

- **Page load**: skeleton screens (gray shapes matching layout). Never a full-page spinner.
- **Button action**: disable button + spinner inside. Keep width stable.
- **Table data**: 3-5 skeleton rows.
- **Background saves**: subtle toast, don't block UI.

### Feedback

- **Success**: toast notification, top-right or bottom-right. Auto-dismiss 3-5 seconds. Not a modal.
- **Error**: toast with error message + retry. For form errors: inline below field.
- **Destructive confirmation**: click delete → dialog → confirm button labeled with action ("Delete project", not "OK"). Type-to-confirm for high-stakes (workspace, account deletion).
- **Undo when possible**: soft-delete + "Undo" toast is better UX than confirmation dialogs.

---

## 6. Navigation Patterns

### Breadcrumbs

- Use when hierarchy is deeper than 2 levels
- Format: `Home / Section / Current Page` (current page not linked)
- Place below top bar or at top of content area

### Tabs

- 2-5 views of the same content area
- Horizontal, below page header, above content
- Active: underline or filled style. Consistent across the app.
- Don't use tabs for navigation between unrelated pages

### Search

- **Global**: Cmd+K command palette or search in top bar
- **Page-level**: search input above the table/list it filters
- Show result count and clear button for active filters

### References

| App | Nav Pattern | Link |
|-----|------------|------|
| Linear | Cmd+K, sidebar groups, keyboard nav | https://linear.app |
| Notion | Sidebar nesting, breadcrumbs, quick find | https://notion.so |
| GitHub | Tab nav within repos, global search, breadcrumbs | https://github.com |

---

## 7. Authentication Pages

### Context

Login, registration, and OAuth pages are **exceptions** to the standard app shell. They are:
- Full-page layouts (no sidebar, minimal navigation)
- First impression of the app (design quality matters)
- Trust-critical (users enter credentials - must feel secure)

**Platforms covered:** Login, Registration, OAuth (Google), Password Reset

---

### Layout Rules

**Standard auth page structure:**

```
┌─────────────────────────────────────────┐
│          [Logo/Brand]                   │
│                                         │
│         [Heading]                       │
│         [Subheading/Description]        │
│                                         │
│    ┌──────────────────────────┐        │
│    │ [Form Fields]            │        │
│    │ [Submit Button]          │        │
│    └──────────────────────────┘        │
│                                         │
│    [Secondary action link]              │
│    (e.g., "Don't have account? Sign up")│
│                                         │
│         [Footer links - Terms, Privacy] │
└─────────────────────────────────────────┘
```

**Specs:**
- **Centered layout:** Form card/container centered vertically and horizontally
- **Max width:** Form container 400-480px max
- **Padding:** `--space-6` to `--space-8` inside form container
- **Background:** Can be `--bg-secondary` (page) with `--bg-primary` (form card), OR just `--bg-primary` full-page
- **Logo:** Top of page, centered or left-aligned
- **No sidebar:** Full-page layout only
- **No app navigation:** Login page is not part of the app shell

---

### Branding Consistency

**Critical rule: Auth pages must match the main app.**

| Element | Standard | Bad Example | Good Example |
|---------|----------|-------------|--------------|
| **Logo** | Same logo as main app | Completely different logo or wordmark | Main app logo, same size/style |
| **Theme** | Match main app theme (light/dark) | Dark login page, light main app | Both light OR both dark |
| **Colors** | Use main app's `--accent-primary` | Random blue on login, green in app | Same accent color everywhere |
| **Button styles** | Same radius, variants as main app | Pill buttons (radius-full) on login, square (radius-md) in app | All buttons use `--radius-md` |
| **Typography** | Same font family as main app | Serif on login, sans-serif in app | Inter everywhere |

**Why this matters:** Inconsistent auth pages feel like phishing. Users should recognize the brand immediately.

---

### Page-Specific Patterns

#### Login Page

**Required elements:**
- Heading: "Welcome back" or "Sign in to [App Name]"
- Email/username field
- Password field with show/hide toggle
- "Forgot password?" link below password field
- Primary submit button: "Sign in" (not "Submit" or "LOGIN")
- Secondary action: "Don't have an account? Sign up"
- OAuth buttons (if applicable): "Continue with Google" (not just Google icon)

**Layout:**
```
Welcome back
───────────────────────
Email address
[input field]

Password                [Show]
[input field]
Forgot password?

[Sign in button]

or

[Continue with Google]

───────────────────────
Don't have an account? Sign up
```

**States to design:**
- Empty (default)
- Error: "Email or password incorrect. Try again."
- Loading: Button shows spinner, disabled during submit
- Success: Brief "Signing in..." then redirect (no success page)

#### Registration Page

**Required elements:**
- Heading: "Create your account" or "Get started with [App Name]"
- Name field (optional - don't ask if not needed)
- Email field
- Password field with strength indicator
- Terms/Privacy checkbox (if legally required)
- Primary submit button: "Create account" (not "Submit" or "REGISTER")
- Secondary action: "Already have an account? Sign in"

**Password requirements:**
- Show requirements upfront: "At least 8 characters, one number"
- Live validation as user types (green checkmarks for met requirements)
- Don't hide password by default - let user see what they're typing (with hide option)

#### OAuth Page

**Required elements:**
- Heading: "Choose how to sign in"
- OAuth buttons with clear labels: "Continue with Google" (not just logo)
- Icon + text in button, left-aligned
- OR divider if also offering email/password
- Error state: "Google sign-in failed. Try again or use email."

**OAuth button spec:**
- Icon: 20px, left side with `gap: --space-2` from text
- Height: 44px minimum
- Style: Outlined (secondary button variant) OR branded colors (Google blue)
- Text: "Continue with [Provider]" or "Sign in with [Provider]"

#### Password Reset

**Flow:**
1. Request reset: Email input → "Send reset link" button
2. Email sent: "Check your email for reset link" message
3. Reset form: New password input → "Reset password" button
4. Success: "Password reset. Sign in with new password."

---

### Copy & Tone Standards

**Auth pages set the tone for your app. Use welcoming, professional language.**

| Element | Bad Copy | Good Copy |
|---------|----------|-----------|
| **Login heading** | "LOGIN TO SYSTEM" | "Welcome back" |
| **Registration heading** | "SIGN UP NOW!!!" | "Create your account" |
| **Submit button** | "SUBMIT" | "Sign in" / "Create account" |
| **Error message** | "Authentication failed" | "Email or password incorrect. Try again." |
| **Success message** | "Login successful." | "Welcome! Redirecting to your dashboard..." |
| **Password reset** | "Request reset" | "Send reset link" |

**Avoid:**
- ALL CAPS text (looks like shouting)
- Scary/gimmicky branding ("TERMINATE your session", "Annihilate bugs")
- Vague errors ("Something went wrong")
- Generic "Submit" buttons

**Use:**
- Sentence case headings
- Specific error messages with actions
- Action-oriented button text
- Welcoming, reassuring tone

---

### Form Validation

**Follow standard form contract from design-core.md, plus auth-specific rules:**

| Field | Validation Timing | Error Message Example |
|-------|-------------------|----------------------|
| **Email** | On blur | "Please enter a valid email address" |
| **Password (login)** | On submit only | "Email or password incorrect" (don't specify which) |
| **Password (registration)** | On keystroke (for strength indicator) | "Password must be at least 8 characters" |
| **Confirm password** | On blur | "Passwords don't match" |

**Security consideration:** Don't reveal whether email exists ("Email not found") vs wrong password. Use generic "Email or password incorrect" on login.

**Registration consideration:** DO show specific password requirements and live validation (not a security risk, improves UX).

---

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Mobile (< 640px)** | Form full-width with `--space-4` side padding. Stack OAuth buttons vertically. |
| **Tablet (640-1024px)** | Form container 480px max-width, centered. OAuth buttons can be side-by-side if 2 only. |
| **Desktop (> 1024px)** | Form container 480px max-width, centered. Optional: Split layout (form left, illustration/messaging right). |

---

### Common Auth Page Mistakes

1. **Inconsistent branding** — Login page looks like different app than main app
2. **Dark theme by default** — Unless main app is dark, use light theme for auth (standard convention)
3. **ALL CAPS headings** — "LOGIN" looks aggressive, "Welcome back" is friendlier
4. **Pill buttons on auth, square in app** — Button styles must match everywhere
5. **Generic "Submit" button** — Use "Sign in", "Create account", "Send reset link"
6. **Vague error messages** — "Invalid credentials" → "Email or password incorrect. Try again or reset password."
7. **No loading state** — User clicks "Sign in", nothing happens for 2 seconds
8. **OAuth button with just logo** — Must have text: "Continue with Google"
9. **Scary/gimmicky branding** — "TERMINATE your account", "Annihilate bugs" → unprofessional
10. **Form doesn't follow standard contract** — Labels beside inputs, validation on keystroke for all fields
11. **No password visibility toggle** — Users should be able to see what they type
12. **Missing "Forgot password" link** — Users will need this, place below password field

---

### References

| Site | What They Do Well | Link |
|------|-------------------|------|
| Linear | Clean, dark auth pages matching app, minimal | https://linear.app/login |
| Clerk | Modern auth UI, excellent error states | https://clerk.com |
| Stripe | Light, professional, clear CTAs | https://dashboard.stripe.com/login |
| Notion | Welcoming, smooth OAuth flow | https://notion.so/login |
| GitHub | Simple, focused, accessible | https://github.com/login |

---

### Completion Checklist for Auth Pages

Before considering auth pages done:

- [ ] Layout is full-page, centered form (no app shell sidebar)
- [ ] Logo/branding matches main app
- [ ] Theme matches main app (light/dark consistency)
- [ ] Button styles match main app (same radius, same variants)
- [ ] Typography matches main app (same font family)
- [ ] Colors use main app's `--accent-primary`
- [ ] Copy is welcoming and professional (no ALL CAPS, no scary branding)
- [ ] Form fields follow standard form contract (labels above, validation on blur/submit)
- [ ] Error messages are specific and actionable
- [ ] Loading state present (button spinner during submit)
- [ ] Password field has show/hide toggle
- [ ] "Forgot password" link present on login
- [ ] OAuth buttons clearly labeled ("Continue with Google", not just logo)
- [ ] Responsive behavior defined (mobile stacks, desktop centers)
- [ ] Secondary actions clear ("Don't have account? Sign up")

---

## 8. Colors for App UI

App UIs should be **quieter** than marketing:

- **Background**: `--bg-secondary` (#F9FAFB) for large areas. Pure white (#FFFFFF) is too harsh for full pages — use it for cards/content on top of the secondary background.
- **Sidebar**: slightly different shade from content to create depth
- **Accent**: used sparingly — active nav, primary buttons, links. One accent color only.
- **Text**: `--text-primary` for headings, `--text-secondary` for body descriptions
- **Borders**: `--border-default` — visible but not dominant

---

## 9. Responsive Behavior

- **> 1024px**: Full sidebar + content. Primary design target.
- **768-1024px**: Sidebar collapses to icon-only. Content full-width.
- **< 768px**: Sidebar becomes hamburger or bottom nav. Tables become card lists.
- **> 1440px**: Add max-width to content area to prevent ultra-wide lines.

If the app is desktop-only, say so and redirect mobile users.

---

## 10. Common App UI Mistakes

1. **Marketing aesthetics in app UI** — No hero sections, no gradient backgrounds, no decorative sidebar illustrations.
2. **Inconsistent component styles** — Buttons must use the same radius, size, and color rules everywhere.
3. **No loading states** — Users click and nothing happens for 2 seconds. Show feedback immediately.
4. **Modal overuse** — Use inline editing, slide-out panels, or full pages for complex forms.
5. **Sidebar bloat** — 15+ items = users can't find anything. Group and collapse.
6. **No keyboard navigation** — Tab, Enter, Escape must work in all forms.
7. **Toast spam** — One toast per action.
8. **"Are you sure?" for non-destructive actions** — Confirmation only for irreversible actions.
9. **Tiny click targets** — 16x16px icons for critical functions. Minimum 36x36px.
10. **No onboarding for complex features** — First-use tooltip, empty state with guidance, or quickstart checklist.
11. **Reinventing CRUD layouts per page** — Use the canonical patterns. Consistency > creativity in app UI.

---

## Completion Checklist

Before considering an app page done:

- [ ] Page follows one of the CRUD canonical patterns (list, detail, or create/edit)
- [ ] Empty state designed for zero data, no matches, and no access
- [ ] Loading state present (skeleton or spinner)
- [ ] Error state handles API failures gracefully
- [ ] All spacing and radii use token scale from design.md
- [ ] Keyboard focus ring visible on all interactive elements
- [ ] Mobile behavior defined (even if "redirect to desktop")
- [ ] Realistic data lengths used (not just "John" and perfect numbers)
