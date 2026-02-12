# Dashboards & Data Visualization

> Inherits all rules from [design.md](./design.md). Read the token pack and component contracts there first. This guide covers analytics dashboards, monitoring screens, KPI displays, reporting views, and any interface where data density is the primary concern.

---

## Design Paradigm: Information Density

Dashboards exist to give users **answers at a glance**. Users scan, not read. Every pixel should carry information or organize information. Decoration actively hurts dashboards — it competes with data for attention.

---

## 1. Layout Structure

### The Dashboard Grid

```
┌─────────────────────────────────────────────────┐
│ Dashboard Title          [Date Range] [Filters] │
├────────────┬────────────┬────────────┬──────────┤
│   KPI 1    │   KPI 2    │   KPI 3    │  KPI 4   │
│  $42,300   │   1,284    │   68.3%    │   4.2s   │
│  ↑ 12.5%   │  ↓ 3.1%   │  ↑ 2.1%   │  ↓ 0.8s  │
├────────────┴────────────┼────────────┴──────────┤
│                         │                       │
│   Main Chart            │   Secondary Chart     │
│   (Line/Bar/Area)       │   (Donut/Bar/Table)   │
│                         │                       │
├─────────────────────────┼───────────────────────┤
│                         │                       │
│   Data Table            │   Activity Feed       │
│                         │                       │
└─────────────────────────┴───────────────────────┘
```

### Grid Specs

- CSS Grid with `gap: --space-4` (16px) or `--space-6` (24px)
- Cards: `padding: --space-6`, `border-radius: --radius-md`, 1px `--border-default`
- KPI row: 3-5 cards, equal width
- Main content: 2-column (60/40 or 50/50) or full-width
- Minimum card width: 280px before stacking

### Page-Level Controls (always above the grid)

- **Date range picker**: top-right. Most important dashboard control.
- **Filters**: next to or below date range. Dropdowns or filter chips.
- **Refresh / Last updated**: show timestamp + refresh button if not real-time.
- **Export**: CSV/PDF download. Secondary placement, not a main action.

---

## 2. KPI Cards

### KPI Card Contract

| Element | Spec |
|---------|------|
| Label | `--text-xs` or `--text-sm`, `--text-secondary`, uppercase or small-caps |
| Value | `--text-2xl` (32px) to 36px, bold, `--text-primary`. Use `font-variant-numeric: tabular-nums`. |
| Trend | `--text-sm`. Green (↑) for positive, red (↓) for negative. Include comparison: "vs last month". |
| Sparkline (optional) | Tiny inline chart below value. No axes, no labels — just the shape of the trend. |
| Info icon (optional) | Small ⓘ top-right, tooltip explains the metric on hover. |

```
┌──────────────────────┐
│ Revenue         ⓘ    │
│ $42,300              │
│ ↑ 12.5% vs last mo  │
│ ▁▂▃▂▄▅▆▅▇           │
└──────────────────────┘
```

### KPI Rules

- **3-5 KPIs** visible without scrolling. More = nothing stands out.
- **Format large numbers**: $42.3K, 1.28M. Not $42,300.00.
- **Always show context**: comparison period, target, or trend. A number alone is meaningless.
- **Neutral deltas**: not everything that goes up is good. Use gray for neutral changes, and only green/red when direction has clear positive/negative meaning.

---

## 3. Charts and Data Visualization

### Chart Chooser

| Goal | Best Chart | Avoid |
|------|-----------|-------|
| Trend over time | **Line chart** | Pie, donut |
| Compare categories | **Vertical bar chart** | Pie with > 5 slices |
| Parts of a whole | **Donut chart** (≤ 5 slices) or **stacked bar** | Pie with > 5 slices, 3D pie |
| Distribution | **Histogram** or **box plot** | Line chart |
| Correlation | **Scatter plot** | Bar chart |
| Volume over time | **Stacked area chart** | Multiple overlapping line charts |
| Progress toward goal | **Progress bar** or **gauge** | Pie chart |
| Ranking | **Horizontal bar chart** | Vertical bar (hard to read labels) |
| Composition over time | **Stacked bar** or **100% stacked bar** | Multiple pie charts |

### Data Correctness Rules

These prevent misleading visualizations:

1. **Y-axis must start at zero for bar charts.** Truncated axes exaggerate small differences. Exception: line charts can use non-zero baseline when variation matters more than absolute value — but label the baseline clearly.
2. **Always label axes with units.** "$" or "users" or "ms" — never unlabeled.
3. **Time series must use consistent intervals.** Don't mix daily and weekly points on the same axis. If data has gaps, show the gaps — don't interpolate silently.
4. **Show the time zone** if data spans multiple zones or the audience is global. "Revenue (UTC)" or "Last 7 days (PST)".
5. **Include "last updated" timestamp** for any data that isn't truly real-time.
6. **Don't use dual Y-axes.** Two separate charts are clearer. Dual axes confuse scale relationships.
7. **No 3D charts. Ever.** They distort perception and add zero information.
8. **Maximum 5-7 series per chart.** More than that: use a data table or allow filtering.

### Chart Design Specs

| Element | Spec |
|---------|------|
| Title | `--text-sm` or `--text-base`, semi-bold, above chart |
| Axis labels | `--text-xs`, `--text-secondary` |
| Gridlines | `--border-default`, dashed or dotted, 1px. Horizontal only for most charts. |
| Legend | Above or right of chart (not below). `--text-xs`. |
| Tooltips | On hover. Show exact values, formatted consistently with KPIs. Include series name + value + date. |
| Colors | Use the categorical palette. Same series = same color across all charts on the page. |

### Chart Color Palette

```
Categorical (different series):
  Blue:   #2563EB
  Green:  #16A34A
  Red:    #DC2626
  Amber:  #D97706
  Purple: #9333EA
  Teal:   #0891B2

Sequential (magnitude within one series):
  Light → Dark of single hue: #DBEAFE → #2563EB → #1E40AF

Diverging (positive/negative):
  Red ← Gray → Green: #DC2626 ← #9CA3AF → #16A34A
```

**Color rules:**
- Same metric = same color everywhere on the dashboard
- Never rely on color alone — add labels, patterns, or icons for accessibility
- Avoid red/green as only differentiator (color blindness). Pair with ↑/↓ arrows or shapes.

---

## 4. Interaction Contracts

### Tooltip

| Property | Spec |
|----------|------|
| Trigger | Hover on data point, bar, or line segment |
| Content | Series name, formatted value, date/category. Match number formatting with KPIs. |
| Style | `--bg-primary` or dark inverse, `--shadow-md`, `--radius-sm`, `--text-sm` |
| Delay | Show after 100-200ms hover. Hide immediately on mouse leave. |

### Click-Through / Drilldown

- Clicking a chart segment or table row should navigate to a filtered detail view
- Cursor: pointer on clickable chart elements
- Visual feedback: highlight on hover (opacity change or outline)
- Breadcrumb or back button to return to the overview dashboard

### Cross-Filtering

- If the dashboard supports it: clicking a segment in one chart filters all other charts on the page
- Show active filter state clearly (filter chips or highlighted segment)
- Always provide "Clear all filters" or click-again-to-deselect

### Date Range Picker

| Element | Spec |
|---------|------|
| Presets | Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Custom |
| Custom | Two date inputs with calendar popup |
| Comparison | Toggle: "Compare to previous period" |
| Position | Top-right, always visible |
| URL persistence | Date range reflected in URL params for sharing |

---

## 5. Data Tables in Dashboards

Dashboard tables emphasize readability over interaction.

### Spec

| Property | Spec |
|----------|------|
| Row height | Compact: 36-40px |
| Header | Sticky, `--text-xs`, uppercase, `--text-secondary` |
| Zebra striping | Optional, helpful for wide tables |
| Alignment | Text: left. Numbers: right. Status: left or center. |
| Sorting | Click header to sort. Arrow indicator for direction. |
| Row limit | Top 10-20 with "View all" link. Don't dump 500 rows. |
| Highlighting | Bold, color, or icon for outlier values that need attention. |

### Number Formatting in Tables

```
Currency:    $1,234.56  (2 decimals, comma separator)
Percentage:  68.3%      (1 decimal)
Large nums:  1.28M      (abbreviate > 10,000)
Dates:       Jan 15     (short, no year if current year)
Duration:    4m 23s     (human-readable, not raw seconds)
Null/missing: —         (em dash, not "null" or blank)
```

---

## 6. Real-Time / Monitoring Dashboards

For ops dashboards showing live data:

### Design Adjustments

- **Dark theme preferred** — easier on eyes for extended monitoring
- **Status colors prominent**: green healthy, yellow warning, red critical
- **Auto-refresh indicator**: "Live" badge or "Last updated: 12s ago" + countdown
- **No animation on data updates** — just swap values. Animated counters on a live dashboard are distracting.
- **Alert highlighting**: critical rows/cards get red left-border or background tint

### Status Indicators

```
● Green  — Healthy / Normal / Online
● Yellow — Warning / Degraded / Pending  
● Red    — Critical / Error / Offline
● Gray   — Unknown / Inactive / N/A
```

Always use dot + color + text label. Never color alone.

---

## 7. Dashboard Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| KPI values | 28-36px | Bold | `--text-primary` |
| KPI labels | 12-14px | Medium | `--text-secondary` |
| Chart titles | 14-16px | Semi-bold | `--text-primary` |
| Chart axis labels | 11-12px | Regular | `--text-secondary` |
| Table headers | 12-13px | Semi-bold/uppercase | `--text-secondary` |
| Table body | 13-14px | Regular | `--text-primary` |

Never below 11px. Use `font-variant-numeric: tabular-nums` on all number-heavy elements.

---

## 8. Responsive Behavior

- **> 1440px**: Full grid, 3-4 KPI columns, side-by-side charts
- **1024-1440px**: Charts may stack to full width
- **768-1024px**: KPIs in 2 columns, charts stack
- **< 768px**: Single column, KPIs as horizontal scroll strip, simplified charts

Consider making complex dashboards desktop-only and providing a simplified mobile summary instead of cramming everything into a phone screen.

---

## 9. References

| Resource | What to Study | Link |
|----------|--------------|------|
| Grafana | Monitoring layouts, dense data, dark theme | https://grafana.com |
| Stripe Dashboard | Financial data, clean charts, KPIs | https://dashboard.stripe.com |
| Vercel Analytics | Simple, clear web analytics | https://vercel.com/analytics |
| PostHog | Product analytics, insight cards | https://posthog.com |
| Plausible | Minimal analytics dashboard | https://plausible.io |
| Observable | D3 data visualization examples | https://observablehq.com |

---

## 10. Common Dashboard Mistakes

1. **Marketing aesthetics** — Gradient backgrounds, hero text, decorative elements. A dashboard is a cockpit, not a billboard.
2. **Too many KPIs** — 12 KPIs = 0 KPIs. Users can't prioritize. Pick 3-5.
3. **Charts without context** — A line going up means nothing without Y-axis labels, time period, and baseline.
4. **Pie charts for everything** — Humans are bad at comparing angles. Use bar charts.
5. **No loading state for charts** — Show skeleton or spinner, not blank space.
6. **No empty state** — "No data for this period" + suggestion to adjust filters.
7. **Filter state not in URL** — Dashboard links should preserve filter state for sharing.
8. **Mixed time zones without labels** — Always label the time zone.
9. **Auto-refresh without indication** — Show "Live" badge and last-refresh timestamp.
10. **Shadows on everything** — Flat borders or subtle background differences work better at dashboard density. Shadows add noise with 8+ cards.
11. **Truncated Y-axes on bar charts** — Makes 5% differences look like 500%. Start at zero.
12. **Unlabeled axes** — Every axis needs a unit. No exceptions.

---

## Completion Checklist

Before considering a dashboard done:

- [ ] 3-5 KPIs with values, trends, and comparison context
- [ ] All chart axes labeled with units
- [ ] Y-axis starts at zero for bar charts
- [ ] Time zone labeled if relevant
- [ ] Date range picker functional with presets
- [ ] Tooltips on all chart data points
- [ ] Empty state for "no data in this range"
- [ ] Loading state (skeleton) for async chart data
- [ ] Same metric uses same color across all charts
- [ ] Number formatting consistent (abbreviations, decimals)
- [ ] All spacing uses token scale from design.md
- [ ] Filter state persisted in URL
