# How the numbers are made

One page on the whole data model, for anyone changing `config/vendors.json`.

## One daily series per vendor

`src/engine/dataset.ts` generates a value for each of eight keys, for each
weekday, for each vendor:

| Key | Meaning |
| --- | --- |
| `expected` | hours of capacity contracted |
| `productive` | hours of productive work delivered |
| `logged` | hours booked on timesheets |
| `target` | tasks assigned |
| `completed` | tasks finished |
| `onTime` | tasks finished within SLA |
| `idle` | idle hours inside logged time |
| `leak` | contracted capacity that did not become productive work |

The generator is a seeded hash, not a random number, so the same date always
produces the same value in the browser, in the test runner and on anyone else's
machine. Weekends produce nothing. Days outside a vendor's `dataFrom` to `dataTo`
window produce nothing, which is what creates the "No data available" states.

The shape has three ingredients: a growth trend from `growth`, a gentle seasonal
wave so charts are not flat, and per-day noise from the seed.

## Calibration

The raw series has no units. Each key is then scaled by a single factor so that
the vendor's sum across the calibration year equals the figure in
`config/vendors.json`. That is why Yearly 2026 shows exactly the numbers you put
there, and why every other window is a real sum of real days rather than a
separate hand-written table.

Change a calibration number and the whole series rescales proportionally. This is
the only place you need to edit to change what the dashboard says.

## Aggregation

`src/engine/ranges.ts` turns a filter selection into a window and into chart
buckets:

| Period | Window | Buckets |
| --- | --- | --- |
| Yearly | 1 Jan to 31 Dec | months |
| Quaterly | the calendar quarter | ISO weeks |
| Monthly | the calendar month | ISO weeks |
| Weekly | the chosen day range | days |

Every window is truncated at `today`, so no empty future buckets appear. Deltas
compare against the same shape of window one step back.

## Formulas

`src/engine/formulas.ts`, one function per metric. These were reverse engineered
from the shipped ProHance build and verified against its published figures:

| Metric | Formula |
| --- | --- |
| Capacity Utilization | productive / expected |
| Effective Utilization | productive / logged |
| Gap | 1 minus effective utilization |
| Output Rate | completed / target |
| SLA Compliance | onTime / completed |
| Leakage, and Idle Capacity | leak / logged |
| Non productive hours | logged minus productive |
| Vendor Score | 0.6 x capacity utilization + 0.4 x SLA |
| Billable Portfolio Cost | productive x billRate |
| Idle Cost | idle x idleRate |
| Utilization of High-rate Resources | headcount-weighted mean of the site utilizations |
| Risk Status | High when utilization is over 85 and SLA under 90 |

Weights and thresholds live in `config/thresholds.json`, not in the code.

## Seats

Over and Under Utilized Employee are shares of people, not of hours. Each seat in
a vendor's headcount gets a deterministic utilization drawn around that vendor's
effective utilization for the window; seats are counted over 100 percent and
under 70 percent. Vendors with no data in the window contribute no seats rather
than counting as fully under-utilized. The spread and thresholds are in
`config/thresholds.json` under `employeeUtilization`.

## What the calibration test checks

`tests/engine.test.ts` asserts thirteen figures per vendor for Yearly 2026
against what the shipped build prints. It runs in about a second with no browser.
If you change the data on purpose, it tells you exactly which numbers moved.
