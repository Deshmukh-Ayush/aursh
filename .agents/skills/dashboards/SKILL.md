---
name: dashboard-design
description: Use this skill whenever building, designing, reviewing, or giving feedback on a dashboard, analytics screen, admin panel, or any UI that shows metrics/KPIs/charts/tables together. Trigger this even if the user just says "build me a dashboard for X," asks for a metrics page, an admin panel, an analytics view, or asks "does this dashboard layout make sense" — apply it proactively rather than defaulting to generic card-grid layouts. Covers information hierarchy (KPI → chart → table), chart-type selection, visual hierarchy, color usage, spacing rhythm, and the review checklist to catch common mistakes (equal-weight cards, rainbow charts, no hierarchy).
---

# Dashboard Design

A dashboard is a decision-making tool, not a metrics dump. Every screen should answer, within 5 seconds: **is this healthy, is it better or worse than before, what's the biggest problem, what's the biggest opportunity.** If it doesn't, the dashboard has failed regardless of how polished it looks.

Use this skill for the *information architecture and visual hierarchy* of dashboards — pair it with `frontend-design` for actual styling tokens/typography/color implementation once the structure below is decided.

## The core model: define user → questions → visuals

Before laying out a single component, work through this sequence out loud (briefly) or in a short plan:

1. **Who is this for?** (CEO, sales manager, support agent, developer, agency client...)
2. **What are their top 3–5 questions?** Not "what data do we have" — what do *they* need to know.
3. **Convert each question into exactly one visualization.** One question → one component. If a component can't be traced back to a specific question, cut it.
4. **Order by importance**, not by what's easiest to build.
5. **Remove anything left over.** A dashboard with 8 focused components beats one with 20 comprehensive ones.

If the user hasn't told you who the dashboard is for or what decisions it supports, ask before diving into layout — this is the one clarifying question worth asking, since it changes the entire structure.

## The Dashboard Pyramid — never reverse this order

```
Level 1 — "What is happening?"   → KPI row (top of screen, no scrolling)
Level 2 — "Why is it happening?" → Charts (trend + breakdown)
Level 3 — "What exactly?"        → Tables / lists (raw detail, drill-down)
```

Concretely, top to bottom on the page:

```
Sidebar | Header
────────────────────────────
KPI  KPI  KPI  KPI
────────────────────────────
Primary trend chart (the "hero")
────────────────────────────
Secondary breakdown chart(s)
────────────────────────────
Recent activity / table
```

Read it like a newspaper: summary → analysis → details → history. Never open with a table and never bury the KPI row below a chart.

## Every dashboard needs exactly one hero

Pick the single chart/metric the user should remember. Everything else visually supports it — don't let five charts compete at equal weight. Use size to encode importance: the hero chart or KPI should be visibly larger, not just first in DOM order.

## Chart selection — don't guess, look it up

| Data is about...     | Use          |
|-----------------------|--------------|
| Trend over time       | Line chart   |
| Comparing categories  | Bar chart    |
| Share of a whole      | Donut (≤5 slices) |
| Distribution           | Histogram    |
| Progress toward goal  | Progress bar |
| Volume over time      | Area chart   |
| Exact values needed   | Table        |

Never use a pie/donut chart with more than ~5 slices — collapse the rest into "Other." If someone needs an exact number, give them a table, not a chart with a tooltip.

## Visual hierarchy inside a component

Big number → small label → tiny delta. Not the reverse.

```
Good:                    Bad:
$54.4K                   Revenue
Revenue                  54,392.44 USD
+2.3%                    Compared to last month: +2.34%
```

Size = importance. Don't render every KPI card at identical visual weight — if revenue matters more than visitor count this week, let it read as bigger/bolder.

## Color: restrained, not decorative

Use ~5 colors, functionally:
- **Neutral/gray** — default, most of the UI
- **Blue** — informational
- **Green** — good / positive delta
- **Yellow** — warning
- **Red** — problem / negative delta

Reference points for the vibe: Stripe, Linear, Vercel, GitHub — mostly grayscale with one accent color, not "Excel 2007 rainbow." A chart with 8 different hues for 8 series is usually a sign the data should be a table instead.

## Spacing rhythm

Keep vertical spacing between cards/sections consistent (e.g. a fixed 24px rhythm) rather than ad hoc. Consistent rhythm is what makes a layout read as "designed" even when the user can't articulate why. Don't be afraid of empty space — it's what makes the important numbers *feel* important; a dense grid with zero breathing room reads as noise regardless of the data underneath.

## Review checklist — run this before shipping a dashboard

Fail any of these → go back and fix before considering it done:

- [ ] Can I identify "is it healthy / better or worse / biggest problem" in 5 seconds?
- [ ] Is there exactly one clear hero component?
- [ ] Does every component trace back to a specific user question? (if not, cut it)
- [ ] Is the KPI row visible without scrolling?
- [ ] Charts before tables, never the reverse?
- [ ] ≤5 functional colors, not decorative rainbow?
- [ ] No pie/donut with >5 slices?
- [ ] Consistent spacing rhythm across cards/sections?
- [ ] Big-number-first typographic hierarchy on KPI cards (not label-first)?
- [ ] Nothing rendered at equal visual weight that isn't equally important?

## When reviewing someone else's dashboard / mockup

Walk it against the pyramid and checklist above, and call out violations directly and specifically (e.g. "your KPI row and detail table are both above the fold competing for attention — the table should move down" rather than generic praise). Point to the *decision* the layout fails to support, not just aesthetic nitpicks.

## Further reading

`references/learning-path.md` has a 30-day structured practice plan (recreate Stripe/Linear/Vercel/GitHub dashboards, then build from scratch) for a user who wants to build the underlying design skill rather than get one dashboard built. Only pull this in if the user asks how to *get better* at this, not when they just want a dashboard built.