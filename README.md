# ProHance PEM prototype

A clickable replica of the four PEM dashboards and the vendor drilldown, built
so you can change the data, the pages, the metrics and the personas without
writing code.

Everything on screen is computed from one daily series per vendor, so every
filter really does recompute: pick a different year, quarter, month or day range
and the numbers, charts and badges all follow.

## Just looking?

Open the published page. Every page is clickable: change the period, filter to
one vendor, open a vendor, tap a number that offers a list. Nothing is a
screenshot.

The data is invented. PH Engineering, PH Operations and Ploceus are not real
vendors and the contracts, rates and locations behind them are a model built to
a target, described in `docs/DATA-MODEL.md`. It is calibrated so a governance
conversation has realistic numbers to happen over: 950 contracted FTE, 60%
capacity utilization, $40.34M of leakage value against $34.24M of cost loss.

The four pages:

| Page | The question it answers |
| --- | --- |
| Vendor Performance | Which vendor do I act on, and what is it costing me |
| Delivery Performance | Is the work landing, and what does the shortfall cost |
| Capacity & Utilization | Where is contracted capacity going instead of into work |
| Cost Efficiency | How much spend converts into productive work |

`VERSION.md` is what changed when and why. `CLAUDE.md` is the rules that keep
the numbers honest.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173 with hot reload. Change a file in `config/` and
the browser updates immediately.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | type check and production build into `dist/` |
| `npm run test:engine` | checks the numbers still match the real product, about a second |
| `npm run test:charts` | checks the axis ladder and column geometry, about a second |
| `npm run test:ui` | drives every filter on every page in a real browser |
| `npm run verify` | all of the above |
| `npm run standalone` | one self-contained HTML file you can open or publish |

## Publishing it

`.github/workflows/pages.yml` builds on every push to `main` and serves
`dist-standalone/ProHance-PEM.html` as the site's `index.html`. It runs the
engine and chart guards first, so a broken number never reaches the URL.

Turn it on once, in the repository's Settings, Pages, Source: GitHub Actions.
A private repository needs GitHub Pages on a paid plan; on a free plan the
repository has to be public for the URL to open for anyone.

For `npm run test:ui`, run `npx playwright install chromium` once first.

## Change the data

`config/vendors.json` is the whole dataset. Each vendor has a `calibration`
block, which is what its year-to-date totals must add up to:

```json
"calibration": {
  "expected": 433980,    "productive": 295106,  "logged": 491844,
  "target": 26400,       "completed": 25001,    "onTime": 19251,
  "idle": 68858,         "ot": 34429
}
```

Change `productive` to 320000 and every screen moves: capacity utilization, the
vendor score, billable cost, the gap, the charts, the badges, at every period.
Nothing else needs touching.

The other fields:

- `seed` makes this vendor's day-to-day shape different from the others. Give a
  new vendor a number no one else uses.
- `dataFrom` / `dataTo` bound when the vendor has any data at all. All three now
  run to `today`, because a vendor that goes quiet mid-window puts "No data
  available" on screen, and this build does not do that.
- `billRate` and `idleRate` are the vendor's rate card. One rate covers billable,
  idle and overtime hours alike; there is no overtime premium.
- `contract` is the signed value, the term, how much of the budget is spent and
  the date it runs out. It drives Contract Burn and the Upcoming Contract
  Renewals tile.
- `tier` is strategic or tactical, the tag on the vendor card header.
- `claimedOtMultiplier` is what the vendor invoices for overtime against what
  the tool tracked: 0.75 under-claims, 2.0 claims twice what it worked.
- `penaltyExposure` and `slaBreaches` drive the Penalty Exposure card.
- `skills` are the four skills Consolidation Levers can compare on, with the
  headcount on each and a `factor` that tilts that skill's utilization around
  the vendor's own.
- `growth` tilts the series year on year: 0.028 is a rising vendor, -0.02 a
  declining one.
- `sites` is the location mix. `factor` is that site's utilization relative to
  the vendor, `weight` is its share of headcount.
- `designations` are Associate, Senior Associate, Lead and Manager, with a
  headcount and a cost `factor` each. They drive the headcount breakdown and the
  designation strip on the vendor card.
- `projects` are the pieces of work the vendor is on, each `onTrack` or
  `atRisk`, which drive Projects at Risk and Contract Value at Risk.

`config/vendors.json` also carries `today`, which is the prototype's clock.
Nothing after that date has data.

## Add a vendor

Copy any vendor block, change `id`, `name`, `seed` and the calibration numbers.
Set `logo` to `"generic"` unless you add a mark to `src/components/Icons.tsx`.
That is the whole job: filters, columns, profiles and the drilldown all pick it
up.

## Add a page

`config/lenses.json`. A lens is a page:

```json
{
  "id": "qualityAssurance",
  "navGroup": "delivery-management",
  "navLabel": "Quality",
  "title": "Quality Assurance",
  "subtitle": "Where rework and {risk} concentrate.",
  "defaultPeriod": "Monthly",
  "hero": ["slaCompliance", "outputRate", "costAtRisk", "atRiskVendors"],
  "sections": ["slaCompliance", "outputRate", "riskStatus"]
}
```

Add the id to whichever roles should see it in `config/roles.json`. No code.

## Add a persona

`config/roles.json`. A role picks where it lands, which pages it sees and which
metrics to strip out:

```json
{
  "id": "coo", "label": "COO", "defaultLens": "vendorPerformance",
  "lenses": ["vendorPerformance", "costEfficiency"],
  "hideMetrics": ["headcountByRole"]
}
```

`"showSwitcher"` is currently `false`, so the build ships as a single role with
every page reachable from the rail. Set it `true` to put a "View as" control back
in the page header.

## Add a metric

Three steps, all small:

1. **The maths.** Add a function to `src/engine/formulas.ts`. It takes the
   window's `Totals` and returns a number or null.
2. **The card.** Add an entry to `METRICS` in `src/metrics/registry.ts`
   returning one of the shapes in `src/metrics/types.ts`, which cover a score, a
   ratio bar, two counted series, an hours pair, a money area, a stat block over
   columns, grouped bars, a donut, a site list, a role list and a status pill.
3. **The words.** Add the label and tooltip to `config/copy.json` under the same
   id, then list the id in a lens.

Only if you need a shape that does not exist yet do you touch a component: add
the interface to `src/metrics/types.ts` and a `case` to
`src/components/MetricSection.tsx`.

## Change how it looks

`config/theme.json` holds the colours, the font and the sheet width. The sheet
width is 1100, which is what lets an iPad Air in landscape render the dashboard
at 100 percent with no zoom and no horizontal scroll.
`src/styles/app.css` holds the layout, and the transitions are grouped at the
bottom of that file under "transitions". Charts are hand-drawn SVG in
`src/components/charts/`, so hover, animation and geometry are all yours.

## Publish it

```bash
npm run standalone
```

Writes two files into `dist-standalone/`:

- `ProHance-PEM.html` opens from disk in any browser and can be emailed
- `artifact-body.html` is the form the Claude Artifact tool expects, so you can
  publish it to a private URL and share the link

## How the filters behave

Period tabs, the date pickers and the metric chips apply the moment you click
them. The vertical and vendor dropdowns stage your change and apply it when you
press Apply, the way the product does.

Both Reset and Apply pairs do real work, and both grey out when there is nothing
to do rather than looking broken:

| | What it does |
| --- | --- |
| Apply in a dropdown | applies that dropdown's selection and closes it |
| Reset in a dropdown | selects everything, applies it and closes |
| Apply on the filter bar | applies whatever is staged in the open dropdown |
| Reset on the filter bar | puts every control on the page back to its default |

Clearing every vendor falls back to all vendors. Clearing every vertical empties
the page, because "nothing in scope" is a real state.

## Keep it honest

`npm run test:engine` pins every headline figure to what the shipped ProHance
build prints for Yearly 2026. `npm run test:charts` pins the axis rounding and
the column geometry. Both run in about a second with no browser.

`npm run test:ui` drives every filter on all three pages and the drilldown in a
real browser, and carries a test for every defect the September audit found, so
none of them can come back quietly.

`docs/AUDIT-2026-09-23.md` is the audit itself: what was wrong, why, how it was
found, and what is deliberately different from the live build.
`VERSION.md` is the running history.

## Working on it with Claude Code

`CLAUDE.md` in this folder tells Claude Code the conventions: where data lives,
where formulas live, why components never contain numbers, and how to add a
metric, a lens, a vendor or a role. Point it at a task and it will follow them.

Good first asks:

- "Add a Rework Rate metric to the Cost Efficiency lens"
- "Add a fourth vendor called Northwind with 40 people and a 62 percent
  utilization"
- "Add a COO persona that sees Vendor Performance and Cost Efficiency only"
- "Make the vendor score trend animate when the period changes"

## What is faithful and what is not

Faithful: layout, typography, colour, the four date pickers, column scaling,
row-aligned metric sections, chart geometry and hover, the metric tooltip spec,
and the Yearly 2026 numbers, which tie out exactly.

Deliberately different, all listed in `CLAUDE.md`: filters commit on click rather
than behind Apply, the KPI strip recomputes with the filters, and capacity
utilization is internally consistent with the hours printed beneath it. The real
build gets those three wrong.
