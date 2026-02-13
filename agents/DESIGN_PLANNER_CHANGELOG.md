# Design-Planner Agent Updates - 2026-02-12

## Problem Statement

During testing of EXP-041 (Landing Page), the design-planner agent created:
- **7 separate files** (3,134 total lines) when 1 consolidated file was needed
- **3 different designs** instead of responsive versions of the SAME design
- **Mockups that didn't match component specs** due to insufficient prompt engineering

## Changes Made

### 1. File Organization (Phase 2)

**Added CRITICAL instruction:**
> Create ONE consolidated `design-spec.md` file. Do NOT create multiple files (DESIGN_SPEC.md, MOCKUP_SPECIFICATIONS.md, COMPONENT_REFERENCE.md, DEVELOPER_HANDOFF.md, README.md, etc.).

**Impact:**
- 1 file instead of 7
- Single source of truth for Developer and Design-Reviewer
- Reduced context bloat

### 2. Responsive Design Requirements (Phase 3)

**Added CRITICAL instruction at start of Phase 3:**
> Generate THREE versions of the SAME design at different breakpoints. The layout, visual style, components, and branding must be IDENTICAL across all three mockups. Only the responsive behavior changes (columns collapse, sidebar hides, etc.). Do NOT generate three different designs.

**Updated Prompt Engineering Rules:**
- Added "SAME DESIGN at three breakpoints" as first rule
- Added "Reference the Component Specifications section" rule
- Emphasized mockups must match written component specs

**Impact:**
- Consistent visual design across all breakpoints
- Only responsive layout adjustments (columns, spacing, visibility)
- Developer implements ONE design with responsive CSS, not three separate designs

### 3. Enhanced Imagen Prompt Template (Phase 3)

**Replaced generic prompt template with:**

```
IMPORTANT: This is the [DESKTOP/TABLET/MOBILE] responsive breakpoint ([width]px) of the SAME design.

Use the EXACT SAME:
- Color palette (all #hex codes below)
- Typography (Roboto font, exact sizes below)
- Component styling (shadows, radii, padding)
- Branding and visual style
- Content and data

ONLY adjust:
- Layout columns ([desktop: 3 columns / tablet: 2 columns / mobile: 1 column])
- Sidebar visibility ([desktop: visible / tablet: collapsed / mobile: hidden])
- Spacing ([desktop: 48px / tablet: 32px / mobile: 24px] between sections)

**Component Specifications (MUST match design-spec.md):**
[Copy exact component specs from the Component Specifications section]
```

**Added verification checklist:**
- [ ] Copied exact component specs from design-spec.md into prompt
- [ ] Used identical hex codes for all breakpoints
- [ ] Used identical typography values for all breakpoints
- [ ] Used identical shadow/radius values for all breakpoints
- [ ] Only adjusted layout columns/spacing/visibility for responsiveness
- [ ] Included "SAME design" instruction at top of prompt

**Impact:**
- Mockups visually match the component specifications in design-spec.md
- Explicit component specs in prompt → better Imagen generation
- Verification checklist prevents inconsistencies

### 4. Mockup Generation Script (Phase 3)

**Updated bash script to emphasize consistency:**

```bash
# Desktop (base design)
DESKTOP_PROMPT="IMPORTANT: This is the DESKTOP responsive breakpoint..."

# Tablet (SAME design, responsive layout)
TABLET_PROMPT="IMPORTANT: This is the TABLET responsive breakpoint of the SAME design.
Use the EXACT SAME colors, typography, components, and branding as the desktop mockup.
ONLY adjust: Layout to 2 columns, sidebar collapsed, spacing reduced to 32px..."

# Mobile (SAME design, mobile responsive layout)
MOBILE_PROMPT="IMPORTANT: This is the MOBILE responsive breakpoint of the SAME design.
Use the EXACT SAME colors, typography, components, and branding as the desktop and tablet mockups.
ONLY adjust: Layout to 1 column, sidebar hidden, spacing reduced to 24px..."
```

**Impact:**
- Each prompt explicitly references previous breakpoints
- Clear instructions to maintain consistency
- Only layout/spacing changes between breakpoints

### 5. New Phase 4: Verify Mockup Consistency

**Added verification phase BEFORE presenting to User:**

**Visual comparison checklist:**
- [ ] Colors: Same hex codes in all three mockups
- [ ] Typography: Same font family and relative sizing
- [ ] Components: Same visual style (button radius, card shadows, etc.)
- [ ] Branding: Same logo, same brand colors, same visual identity
- [ ] Content: Same data/text across all mockups
- [ ] Only differences: Layout columns, spacing, sidebar visibility

**Verify mockups match component specs:**
- [ ] Button colors match design-spec.md
- [ ] Card padding matches design-spec.md
- [ ] Typography sizes match design-spec.md
- [ ] Shadows match design-spec.md
- [ ] Border radii match design-spec.md

**If mockups don't match:** Regenerate with corrected prompts BEFORE presenting to User.

**Impact:**
- Catches inconsistencies before User sees them
- Ensures mockups match component specs
- Reduces iteration rounds

### 6. Updated Best Practices Section

**Added "File Organization" subsection:**
- Why one file (easier to reference, less bloat, single source of truth)
- Explicit list of files to NOT create

**Added "Responsive Mockup Consistency" subsection:**
- Why consistency matters (ONE design, not three)
- Common mistakes to avoid (different colors, fonts, buttons across breakpoints)

**Enhanced "Prompt Engineering" subsection:**
- DO: Copy component specs from design-spec.md into prompt
- DO: Start prompt with "SAME design at [breakpoint]"
- DON'T: Generate prompts independently
- DON'T: Assume Imagen will infer consistency

**Impact:**
- Clear guidance on file organization
- Examples of what NOT to do
- Emphasis on explicit consistency instructions

## Phase Renumbering

Due to new Phase 4 (Verify Mockup Consistency):
- Old Phase 4 → Phase 5 (Present to User)
- Old Phase 5 → Phase 6 (Iteration)
- Old Phase 6 → Phase 7 (Approval Complete)

## Verification

**No breaking changes to other agents:**
- design-reviewer.md references `design-spec.md` (singular) ✓
- explorer.md references `design-spec.md` (singular) ✓
- developer.md references `design-spec.md` (singular) ✓
- em.md references `docs/design-specs/{ISSUE_ID}/` (directory, no specific files) ✓

**All references were already correct** - the issue was design-planner creating extra files not specified in the template.

## Expected Behavior After Changes

### For EXP-041-like issues (Landing Page):

**Before:**
- 7 files created (DESIGN_SPEC.md, MOCKUP_SPECIFICATIONS.md, etc.)
- 3 different designs (desktop with blue buttons, tablet with green buttons, mobile with different layout)
- Mockups didn't match component specs (button radius in spec: 8px, in mockup: 12px)

**After:**
- 1 file created (design-spec.md)
- 1 design shown at 3 responsive breakpoints (SAME colors, typography, components)
- Mockups match component specs (verified in Phase 4 before presenting to User)

## Testing Recommendation

**When design-planner is next invoked:**
1. Verify ONLY `design-spec.md` is created (no DESIGN_SPEC.md, MOCKUP_SPECIFICATIONS.md, etc.)
2. Verify mockups show SAME design at 3 breakpoints (same colors, fonts, buttons)
3. Verify mockups visually match the Component Specifications section in design-spec.md

## Related Documentation

- User's issue report: EXP-041 testing feedback (2026-02-12)
- Original agent: `~/.claude/agents/design-planner.md`
- Related agents: design-reviewer.md, em.md, explorer.md, developer.md
