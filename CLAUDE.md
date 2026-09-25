# ProHance PEM prototype

A working replica of the ProHance PEM dashboards, rebuilt so the data, the pages,
the metrics and the roles are all configuration rather than code.

Read this file before changing anything. It explains the rules that keep the
project honest and where each kind of change belongs.

Current version is in `VERSION.md`. Add an entry there for anything that changes
behaviour, one line, newest first.

## The three rules

**1. Numbers come from the engine, never from a literal in a component.**
There is exactly one source of data: a deterministic daily series per vendor in
`src/engine/dataset.ts`. Every figure on every screen is an aggregation of those
days through a formula in `src/engine/formulas.ts`. If you find yourself typing a
percentage into a `.tsx` file, stop: the value belongs in a formula or in
`config/vendors.json`.

**2. `npm run verify` must stay green.**
`test:engine` pins every headline figure to what the shipped ProHance build
prints for Yearly 2026. `test:charts` pins the axis ladder and the column
geometry. The Playwright suite drives every filter and guards every defect the
September audit found. If a change moves one of those on purpose, update the
expectation in the same commit and say why in `VERSION.md`.

**3. Never put a CSS class on an SVG element without checking the stylesheet.**
In SVG 2 the CSS geometry properties (`height`, `width`, `x`, `y`) apply to
shapes and **override the presentation attribute**. A `.bar` rule written for the
progress bars silently collapsed every column chart to 7px, and an automated
check reading the `height` attribute could not see it. Chart classes are
prefixed `col-`, and the Playwright suite measures rendered `getBBox()`.

## Commands

```
npm install            once
npm run dev            hot-reloading dev server on :5173
npm run build          type check and production build
npm run test:engine    calibration guard, no browser, ~1s
npm run test:charts    axis ladder and column geometry, no browser, ~1s
npm run test:ui        Playwright suite (npx playwright install chromium first)
npm run verify         all of the above
npm run standalone     one self-contained HTML in dist-standalone/
```

`PW_CHROMIUM=/path/to/chromium` makes the UI tests use a browser you already have.

## Where things live

```
config/           everything a product person edits, no code
  vendors.json      vendors, headcount, rates, calibration totals, site mix, roles
  verticals.json    the vertical list
  lenses.json       the dashboard pages: hero tiles and metric sections per page
  roles.json        role-based views: landing page, visible pages, hidden metrics
  copy.json         every label and tooltip, keyed by metric id
  thresholds.json   badge cut-offs, score weights, risk rules, the seat model
  theme.json        colours, fonts, radius, sheet width

src/engine/       the dataset and the maths
  dataset.ts        daily series generation and calibration
  ranges.ts         periods, previous periods, chart buckets
  formulas.ts       every metric formula, one function each
  format.ts         how a number reads on screen
  noise.ts          the seeded hash; there is no Math.random anywhere

src/metrics/      the bridge between formulas and the screen
  registry.ts       one entry per metric: how it computes as a card, a hero
                    tile and a Vendor Profiles row
  types.ts          the view models a metric may return
  context.ts        builds the totals, previous totals and buckets a metric needs
  spark.ts          the rolling eleven-week KPI sparkline series

src/components/   presentation only, no arithmetic
src/pages/        LensPage renders every lens; VendorDetail is the drilldown
src/state/        filter state per page, role, routing
tests/            engine.test.ts (calibration), charts.test.ts (geometry),
                  ui.spec.ts (filters and audit regressions)
scripts/          build-standalone.mjs
docs/             DATA-MODEL.md, the UI audit, and the formula reference
VERSION.md        what changed in which version
```

## How to make each kind of change

### Change a number
Edit that vendor's `calibration` block in `config/vendors.json`. Those are the
totals the year-to-date window must sum to; every other window rescales with
them. Then run `npm run test:engine` and update the expectation you moved.

### Add a vendor
Copy a block in `config/vendors.json`, give it a new `id`, `name` and a `seed`
that no other vendor uses (the seed is what makes its series different). Set
`dataFrom` and `dataTo` to bound when it has data, and add a `logo` key that
exists in `src/components/Icons.tsx` (or use `"generic"`). Nothing else changes.

### Add a vertical
Add it to `config/verticals.json` and set `vertical` on the vendors that belong
to it. The filter bar and the empty state follow automatically.

### Add a metric
1. If it needs new maths, add a pure function to `src/engine/formulas.ts`.
2. Add an entry to `METRICS` in `src/metrics/registry.ts` with a `card` function
   returning one of the view shapes in `src/metrics/types.ts`, and a `hero`
   function if it should also be a KPI tile.
3. Add its label and tooltip to `config/copy.json` under the same id.
4. List the id in a lens's `sections` or `hero` array in `config/lenses.json`.

If your metric needs a visual shape that does not exist yet, add an interface to
`src/metrics/types.ts` and a matching `case` in
`src/components/MetricSection.tsx`. Reusing an existing shape needs no component
change at all.

### Add a lens (a new dashboard page)
Append a block to `lenses` in `config/lenses.json`: an `id`, a `navGroup` from
`navGroups`, a `navLabel`, `title`, `subtitle`, `defaultPeriod`, four `hero`
metric ids and the `sections` metric ids. Add it to the `lenses` array of any
role that should see it. No new file is needed; `LensPage` renders it.

### Add a role
Append to `roles` in `config/roles.json` with a `defaultLens`, the `lenses` it
may see and any `hideMetrics` to strip from its pages.

### Change copy or tooltips
`config/copy.json` only. Tooltips are keyed by placement (`hero`, `card`,
`profile`, `detail`) and fall back to `card`. The metric-tooltip spec requires
hero ratio tooltips to end with ", all vendors in view" and vendor-card ratio
tooltips to say "for this vendor"; money, count and status tooltips carry no
scope tail anywhere.

### Change transitions or chart behaviour
Charts are hand-drawn SVG in `src/components/charts/`. The transitions are CSS at
the end of `src/styles/app.css` under "transitions". There is no chart library,
so nothing is off limits. Three things there are load-bearing:

- `niceMax` in `primitives.ts` is the rounding ladder the product's axes land on.
  Every bar height and area path scales with it. `test:charts` pins it.
- `ColumnChart` defaults to `layout="overlay"`, which is how the product draws a
  pair of series: both centred on the category, wide behind and narrow in front,
  never side by side. `layout="grouped"` exists if a future chart wants it.
- Column corners are top-only rounded, drawn as a path. A rect with `rx` rounds
  the base too, which reads wrong against the axis.

### Publish it
`npm run standalone` writes `dist-standalone/artifact-body.html`. Publish that
file with the Claude Artifact tool to get a private URL you can share.
`dist-standalone/ProHance-PEM.html` is the same page as a normal document you can
open from disk or attach to an email.

### Change how a filter commits
`src/components/FilterBar.tsx` and `src/components/filters/MultiSelect.tsx`.

Period tabs, date pickers and metric chips commit on click. The two multiselects
stage their change and commit on Apply. Every Reset and Apply disables itself
when it would do nothing, which is what stops them reading as broken. The staged
selection lives in the store, not in the component, so the page-level Apply can
commit it; a button outside a popover must carry `data-keep-pop` or the popover's
outside-click handler closes it before the button's own handler runs.

`emptyMeansAll` decides what an empty selection commits as. Vendors fall back to
everything; verticals do not, because clearing them is a real state that empties
the page.

## Things that are deliberate, not bugs

See `docs/AUDIT-2026-09-23.md` for the full table with reasons.

- Metric chips commit on click rather than behind Apply, at the product owner's
  request. The multiselects do use Apply, as the product does.
- The descriptive paragraph under each metric title is removed, per the Sep 2026
  metric tooltip spec. The live build still shows it.
- The KPI hero strip recomputes with every filter. The shipped build shows the
  same four frozen values on every period and on two different pages.
- Capacity Utilization reproduces the percentage the product prints, and expected
  hours are set to the value that produces it. The shipped build prints a pair of
  hour totals that do not divide to the percentage beside them.
- Idle Capacity is the leakage ratio, because that is what the shipped build
  shows on the vendor detail page.
- Headcount by Role totals the mapped role rows (69 for PH Engineering); Total
  Headcount in Vendor Profiles is the licensed count (75). They are different
  numbers in the product too.
- "Cost Loss" and "Idle Time Cost" are the current names. Metric ids are still
  `costAtRisk` and `idleCost`, so renames stay a `config/copy.json` edit.
- Over and Under Utilized Employee are shares of seats, not of hours, modelled
  per seat in `src/engine/formulas.ts` and tuned in `config/thresholds.json`.

## Style

TypeScript, strict. Relative imports carry their extension (`./x.ts`,
`./X.tsx`) so the engine runs unchanged in Node for the calibration test.
Components do presentation; if a component is doing arithmetic, the arithmetic
belongs in `src/engine/formulas.ts` or a metric's `compute`.
