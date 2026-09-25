# PEM UI audit and clickable prototype, Sep 2026

Sources: `https://enhance.prohance.io/phpemwebui` and `https://qalab.prohance.io:9443/phpemwebui`, audited 16 Sep 2026.
Deliverables: a clickable prototype published as a Claude artifact ("ProHance PEM Prototype"), plus a standalone `ProHance-PEM-Prototype.html` that opens in any browser from disk.

## Figma status: blocked

The Figma MCP could not write to `Prohance-Web-App` (file `MsMP24sTSPXRRWpU7REaWd`, section `2093:77281`). Vinesh's seat is **View on the Professional plan** = 6 MCP calls per month, exhausted, and View seats are read-only regardless. Unblocking needs a **Full or Dev seat** (200 calls/day). Target section is 50790 x 45160 at (-486, -983).

## Routes and screens

| Screen | Route | Nav location |
|---|---|---|
| Vendor Performance | `/phpemwebui/vendorPerformance` | Vendor Management |
| Capacity & Utilization | `/phpemwebui/capacityUtilizationHealth` | Delivery Management |
| Cost Efficiency | `/phpemwebui/costEfficiency` | Finance Management |
| Vendor detail (all 3 vendors) | `/phpemwebui/vendorPerformance/details` | Vendor card header, or the Vendor Profiles drilldown icon |

## Period behaviour, verified across all 12 page-period combinations

Captured 16 Sep 2026 by driving the real period tabs and reading the React chart props.

- **Hero KPI cards do not change with period.** Same four values on every period; the sparklines are a rolling weekly series independent of the filter. The prototype deliberately diverges, see the inconsistencies section below.
- **Everything below the filter bar does change**: vendor scores, capacity text, output and SLA counts, charts, and the Vendor Profiles footer.
- **Default period per page**: Vendor Performance opens Yearly, the other two open Weekly. Weekly defaults to the current week, `13 Sep 2026 – 15 Sep 2026`.
- **Comparison suffix follows the period**: vs last year / vs last quarter / vs last month / vs last week.
- **Axis granularity follows the period**: months for Yearly, week numbers (W26 to W38) for Quaterly, week numbers within the month (W35 to W38) for Monthly, days for Weekly.
- **Vendor Profiles values are a function of the date range, not the page.** Yearly, Quaterly and Monthly are identical across all three lenses; Weekly matches too now that all three default to the same week.
- **Data thins out at shorter periods.** Ploceus has no Vendor Performance data at Monthly or Weekly, PH Operations none at Weekly, and on Capacity and Cost both drop out at Weekly. Headcount by Role is the exception: it persists for every vendor in every period.
- **Badge states seen**: Healthy, Watch, Critical on Vendor Score; Healthy, Watch, Critical on Leakage Summary. PH Operations hits Leakage "Watch" at Monthly on Cost Efficiency, which is the only place that state appears.

## Layout rules

- **Vendor columns scale to the selection.** Three vendors give three equal columns, two give half-width columns, one fills the row. Measured on qalab: two vendors, 1130px each.
- **Metric sections are row-aligned across columns**, and all cards share one height. A short section pads out rather than pulling the next divider up.
- KPI cards carry an info icon next to the title.

## Filter bar

- Period control: **Yearly / Quaterly / Monthly / Weekly** (the "Quaterly" spelling is what ships), each with its own picker: a 12-year grid, `‹ 2026 ›` over Q1 Jan–Mar to Q4 Oct–Dec, `‹ 2026 ›` over Jan–Dec, and a month calendar with two-click day range.
- Vertical multiselect (Select All / Healthcare) and vendor multiselect, each with their own Reset and Apply.
- Vendor trigger label: all selected reads "All Vendor", one reads the vendor name, more than one reads `PH Engineering + 1 More`.
- Metric chips select which sections render. Page-level Reset and Apply.

## Verified interaction behaviour

- **The vendor card header is a link**, same destination as the Vendor Profiles drilldown icon.
- **Metric chips are Apply-gated in the shipped build.** Clicking a chip moves the active state but does not re-render; Apply does. The prototype deliberately diverges and commits on click, at Vinesh's request after he reported filters as not applying.
- **The vendor multiselect does not filter on enhance.** It works on qalab, which is what the prototype implements.
- **Every info tooltip on enhance reads "Planned vs actual"**, a single hardcoded placeholder. Replaced in the prototype by the Sep 2026 metric-tooltip spec.

## How the chart data was recovered

The app is React with `highcharts-react-official` and no `Highcharts` global. Walking the `__reactFiber$*` chain from each `[data-highcharts-chart]` container to the props carrying `options.series` returns the exact series, including each point's `tooltipLabel` and `displayValue`. Every calibration figure in the prototype comes from that source.

## Metric sections per page

- **Vendor Performance**: Vendor Score, Capacity Utilization, Output Rate, SLA Compliance, Headcount by Role, Risk Status.
- **Capacity & Utilization**: Effective Utilization, Idle Cost, Utilization of High-rate Resources, Productive vs Non-Productive Utilization.
- **Cost Efficiency**: Billable Portfolio Cost, Capacity Utilization, Leakage Summary, SLA Compliance.

## Tooltips

The prototype implements `claude/PEM_Metric_Tooltips_Sep2026.md` in full: copy keyed by placement so hero ratio metrics carry ", all vendors in view", vendor cards say "for this vendor" where the spec does, Vendor Profiles rows carry no tail, and money, count and status tooltips carry none anywhere. The descriptive paragraph under each metric title is removed everywhere. Info affordances are buttons, so they are tab-reachable, carry an aria-label, and fire on focus as well as hover. Metrics showing "No data available" keep theirs.

Open naming question: the spec is written for "Cost Loss" and "Idle Time Cost" but the screens still say "Cost at Risk" and "Idle Cost". Tooltips applied to the current labels; labels unchanged pending a decision.

## Design tokens

- Type: **IBM Plex Sans**. Page title 24/32 600 `#181D27`; subtitle 16/400 `#535862`; card titles 14/600 `#101828`.
- Surfaces: page `#F5F5F5`, cards `#FFFFFF`, radius 14px, border 1px `rgba(0,0,0,0.12)`. Left rail 64px collapsed, about 210px expanded.
- Buttons: Apply `#005EEB`; Reset white with `#D0D5DD` border and `#344054` text.
- Metric chip active `#1570EF`, inactive `#667085`. Period tab active fill `#EEEEEE`.
- Status: Healthy `#12B86A`, Watch `#EBAA07`, Critical `#F04337`, Risk "High" `#DC6803`. Deltas up `#16A34A`, down `#DC2626`.
- Charts: score trend line `#496CEB` over a 0.35 to 0 area fade; grouped bars `#D1D5DB` and `#2563EB`; utilization bars `#4562EA` with `#D3E2FD`; idle-cost line `#F1BB87`; gridlines `#E6E6E6`; axis labels `#667085`.

## Prototype build notes

- The layout is held at a fixed minimum width inside a horizontally scrollable content area, with a "Fit width / 100%" control so the full dashboard scales into any panel width. Verified 1520px down to 400px.
- The vendor grid is one CSS grid: a full-height background cell per column plus one cell per metric per vendor, placed by explicit `grid-column` and `grid-row`. That produces the row alignment and equal card heights.
- Chart viewBox width tracks the column width, so charts keep a consistent height at one, two or three vendors.
- Chart hover uses full-height bands per category with a point marker on line charts.

## Computed dataset (replaces the period-keyed capture)

The prototype no longer reads a table of captured values. Every figure on every screen is derived from **one daily series per vendor**, so any date range, vendor selection or vertical selection recomputes from the same source.

**Generation.** Each vendor has a seeded deterministic generator (`h32`, no `Math.random`) producing weekday-only values for `expected`, `productive`, `logged`, `target`, `completed`, `onTime`, `idle` and `leak`, with a growth trend and a mild seasonal shape. Each vendor's series is bounded by its real first and last data dates, which is why PH Operations goes quiet after 13 Sep 2026 and Ploceus after 16 Aug 2026, exactly as the live build does.

**Calibration.** Each of the eight keys is scaled so the vendor's 2026 year-to-date sum equals the live product's published figure. Yearly 2026 therefore reproduces the live screens exactly; every other window is a true aggregation of the same days.

**Ranges and buckets.** Yearly buckets by month, Quaterly and Monthly by ISO week, Weekly by day, all truncated at 15 Sep 2026. Deltas compare against the equivalent previous window. Buckets with no timesheet data are dropped from the score trend and render as zero elsewhere, matching the live build.

## Formulas reverse-engineered from the live build

Verified against every captured period; Yearly 2026 ties out on all 27 checked values.

| Metric | Formula |
|---|---|
| Vendor Score | `0.6 x Capacity Utilization% + 0.4 x SLA Compliance%` (max error 0.006 over 9 cases) |
| Capacity Utilization | `productive / expected` |
| Effective Utilization | `productive / logged` |
| Gap % | `1 - Effective Utilization` |
| Productive vs Non-Productive donut | Effective Utilization rounded, and its complement |
| Non productive hours | `logged - productive` (exact for all three vendors) |
| Output Rate | `completed / target` |
| SLA Compliance | `onTime / completed` |
| Leakage Summary | `leak / logged` |
| **Idle Capacity** | **the same ratio as Leakage Summary.** Detail-page Idle Capacity reads 5.13 / 12.69 / 43.38 against Leakage 5.16 / 12.67 / 43.38 |
| Utilization of High-rate Resources | headcount-weighted mean of the per-site utilizations, not a flat average |
| Score badge | >= 80 Healthy, >= 50 Watch, else Critical |
| Leakage badge | < 20 Healthy, < 40 Watch, else Critical |
| Risk Status | High when Capacity Utilization > 85% and SLA < 90% |

Over Utilized / Under Utilized Employee are employee-count shares, not hour ratios. The prototype models a per-seat utilization drawn deterministically around the vendor's effective utilization for the selected window, counts seats above 100% and below 70%, and excludes vendors with no data in the window. Calibrated to the live 22.67% / 50.56%.

## Arithmetic inconsistencies found in the live build

These are real defects in the shipped product, surfaced by rebuilding the numbers from first principles.

1. **Capacity Utilization does not match its own supporting line.** Vendor Performance prints "81.74K productive hours of 71.01K expected productive hours" next to **113.82%**. That pair is 115.11%. Same on PH Operations (150.33K / 141.44K printed as 106.12%, actually 106.29%) and Ploceus (6.49K / 11.16K printed as 58.12%, actually 58.15%). Since Vendor Score is 60% weighted on Capacity Utilization, the error propagates into the score. The prototype resolves it by holding the **displayed percentage** and the productive-hours total fixed and raising expected hours to the value that produces them, so the sentence and the percentage agree. Expected hours therefore read 71.81K / 141.66K / 11.17K rather than 71.01K / 141.44K / 11.16K.
2. **Idle hours and Idle Capacity use different bases.** The detail page shows 824.55 idle hours against 71.01K expected (1.16%) and, on the same page, Idle Capacity 5.13%. They are two different metrics sharing a name; Idle Capacity is the leakage ratio.
3. **The hero strip is frozen.** All four hero tiles show the same values on every period and are identical between Vendor Performance and Cost Efficiency, and every one is labelled "vs last quarter" even on a page defaulting to Yearly. They also do not reconcile with the cards below: hero Cost at Risk $658.35K against $9.16M of idle cost across the three vendor cards. The prototype computes the hero from the same daily series as the cards, so it moves with every filter and ties out against them.
4. **Ploceus effective utilization rounds inconsistently.** 6.49K / 15.58K is 41.66%, displayed as 41.62% with a 58.38% gap. Left as the honest ratio in the prototype; the 0.04pp difference is not worth breaking a displayed hour total for.

## Filter coverage, verified

Every control re-derives the data on all three pages and on the vendor detail page: period tabs, year grid, quarter grid, month grid, day-range calendar, vertical multiselect (empty selection gives a "No data available" state), vendor multiselect (columns rescale to one, two or three), metric chips, page Reset and Apply, and on the detail page the period tabs and location picker. Confirmed with an automated sweep across 3 pages x 4 periods x 8 controls with no console errors.

## Known gaps

- **The vertical filter has one option.** Healthcare is the only vertical configured, so clearing it gives an empty state and selecting it gives everything. There is nothing to compare against.
- **Vendor logos are redrawn as SVG.** The originals are base64 JPEGs the browser tool would not export.
- **Location filter on the detail page changes its label only.** No per-site daily series exists; site mix is modelled as fixed weights against the vendor total.
- The standalone HTML pulls IBM Plex Sans from Google Fonts, so fully offline it falls back to the system sans stack.
- Calibration is against the enhance instance. The qalab build carries different figures.

## Local editable project, Sep 2026

The prototype now exists as a full source project on Vinesh's machine at
`Documents\PEM\PEM UI`, alongside the published artifact. It is Vite + React +
TypeScript, with hand-drawn SVG charts and no chart library, so every transition
is editable.

**What is configuration rather than code** (the `config/` folder, seven JSON files):

- `vendors.json`: the whole dataset. Each vendor's `calibration` block holds the
  eight year-to-date totals its daily series is scaled to hit. Change a number
  there and every window, chart and badge follows. Also carries headcount, bill
  and idle rates, growth, data start and end dates, the site mix and the role
  breakdown. A new vendor is a copied block with a new seed.
- `lenses.json`: the dashboard pages. A lens names its nav group, default period,
  four hero tiles and its metric sections. A new page is a new block; no code.
- `roles.json`: personas. Each has a landing lens, the lenses it may see and
  metrics to hide. A "View as" control in the page header switches between them,
  and `showSwitcher: false` ships a single-persona build.
- `copy.json`: every label and tooltip, keyed by metric id, with the placement
  variants the metric-tooltip spec requires.
- `thresholds.json`: score weights, badge cut-offs, risk rules and the per-seat
  utilization model.
- `theme.json`, `verticals.json`.

**Extension points in code**: `src/engine/formulas.ts` holds one pure function
per metric, and `src/metrics/registry.ts` holds one entry per metric describing
how it renders as a card, a hero tile and a Vendor Profiles row. Adding a metric
is a formula, a registry entry and a copy entry. Components contain no numbers.

**Guards**: `npm run test:engine` pins thirteen figures per vendor for Yearly
2026 to the shipped build's published numbers and runs in about a second with no
browser. `npm run test:ui` drives every filter on all three lenses plus the
drilldown in a real browser. Both pass.

**Publishing**: `npm run standalone` emits a single self-contained HTML file, in
two forms: one that opens from disk or attaches to an email, and one shaped for
the Claude Artifact tool so the shared link can be refreshed from the same
source.

`CLAUDE.md` in the project root carries the conventions for Claude Code, and
`docs/DATA-MODEL.md` explains the daily series, the calibration step and the
aggregation rules on one page.
