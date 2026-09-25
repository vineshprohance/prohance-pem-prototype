# Copy and colour pass, 25 September 2026

The third review of the day. Four things: a metric named for what it measures, a
palette cut to three families, every redundant sentence removed, and the axis
bug finally reproduced.

## On-Time Delivery

The card was called Delivery Predictability. Nothing was being predicted.

"Predictability" appears in our own sources only as a **lens** name:
`D3 Trend & Predictability` in PEM_Persona_Lens_Spec, `Del - Predictability &
Reliability` in PEM Metrics.xlsx, `D3 Predictability` in the metric roadmap. The
metrics under it are all variability measures: Delivery Variability, SLA
Reliability, Occupancy Volatility, Throughput Consistency. Predictable means does
not swing.

The sheet already carries the right name. **On-Time Delivery** is a listed hero
under `Del - Predictability & Reliability`, and the formula matches ours: tasks
delivered on time against tasks assigned.

The card now names its unit, which it did not: "26,400 tasks assigned" and
"19,251 tasks delivered on time". Output Rate uses the same two words rather than
"target tasks" and "completed tasks".

It is arithmetically Output Rate times SLA Compliance, 94.7% x 77% = 72.92%. That
is a hierarchy, the headline above its two parts, and it is not written on screen.

## Three colour families

Eight unrelated hues did data work before this pass. Teal meant "non-core
activities" on one card and "PH Operations" on the next.

| Family | Tones | Where |
| --- | --- | --- |
| Blue | `#4562EA`, `#D3E2FD` | anything measured. Every trend series, every page |
| Amber | `#DC6803`, `#EFA25B`, `#F1BB87` | only the marks that are the loss: stacked-bar segments, the gap, the high-rate locations, a contract past its term |
| Grey | `#D1D5DB`, `#E4E7EC` | the remainder of a bar |
| Vendor | `#4562EA`, `#12B5C9`, `#F1BB87` | only where vendors compete on one chart |

A trend chart of a loss ratio stays blue, because a rate over time is a
measurement. Because the vendor triple is used nowhere else, a teal anywhere on
a page now means PH Operations.

Status colours are separate and unchanged: green, amber and red on the two badged
metrics, the delta chips and the hero sparklines.

## Contract Burn

Three changes on one card.

The bar was a blue-to-orange gradient, a hue ramp implying a scale the number
does not have. It is one fill now, with a mark at the share of the contract term
already elapsed. Fill past the mark is money leaving faster than the calendar,
which is the whole reading.

The reading used to be written out three times: "budget runs out early" in red,
"budget runs out before the contract does" under the date, and "inside the
contract term" on the two vendors where it did not apply. All three are gone.

And the card contradicted itself. PH Engineering read 91% spent against 93% of
its term elapsed, which is under the run rate, while a configured date claimed
the money ran out a month early. The exhaustion date is derived from the burn and
the term now, so the two cannot disagree, and the configured date is deleted.
PH Engineering's burn is set to 96%, which is what running out five weeks early
actually looks like.

## Sentences removed

| Where | What | Why |
| --- | --- | --- |
| Contract Burn | "budget runs out early" and two sub-lines | the bar says it |
| Vendor Dependency | "Losing PH Operations would take 59.04% of delivered work with it." | restates the headline |
| Vendor Dependency | "Spreading comparable work across the other 2 would cut that exposure." | a recommendation |
| Consolidation Levers | "Widest gap is on QA Automation: ... 27.1 points apart" | restates the tallest and shortest bar |
| Consolidation Levers | "Every point of that gap is seniority you are paying for" | editorial |
| Capacity Utilization | "3.34K productive hours of 4.62K expected productive hours" | now "3.34K of 4.62K hrs"; the same pair sits in Partner Efficiency above |

## Tooltips

Re-cut against the September 2026 tooltip spec, which forbids a formula, a named
denominator, a threshold value or a second sentence.

| Metric | Was | Now |
| --- | --- | --- |
| Unused Capacity | "...Not the same as Idle Time Cost, which is idle time inside the hours that were logged." | "Contracted capacity that never became productive work." |
| Idle Time Cost | "...Not the same as Unused Capacity, which is capacity that never became work at all." | "Idle time inside logged hours, valued at your rate card." |
| Utilization at High-rate Locations | "...billing above $65 an hour." | "...at your highest-rate locations." |
| Cost per productive hour | "Contract value divided by the productive hours you actually received, not the rate card." | "What an hour of productive work actually costs." |
| Upcoming Contract Renewals | "...Tap the number for the list." | "Vendor contracts falling due in the next 90 days." |
| Overtime claimed | "...The gap against tracked overtime is the question to ask." | "Overtime the vendor billed, fed from the client's VMS." |
| Vendor Dependency Risk | "...and what stops if that vendor does." | "Share of delivered work sitting with a single vendor." |
| Consolidation Levers | "...so you can see where to consolidate." | "Efficiency on comparable work, vendor by vendor." |

Twenty-two tooltips changed. None now runs past one sentence.

## The axis, reproduced at last

Expand the rail, set Compare by to Project, and the labels tilt because the slots
narrow. A tilted label reaches down the page by its own length times sin(38
degrees): a 27-character project name reaches about 95px against an axis margin
of 40, so it hung 45px below the card. That is what the screenshot showed.

`labelFit` now tilts a label only when the tilt fits inside the margin. "Jan
2026" reaches 30px and still tilts. A project name stays flat and is cut to its
slot, with the full text on hover. `.chart` is clipped on both axes as the
backstop, which it could not be before, because tilted labels needed to hang.

Verified at 1180 and 1520, on all four lenses, on every dimension: zero labels
leave a card. A Playwright test walks the same grid.

## Verification

- `test:engine` green, including the arc, seat and high-rate assertions.
- `test:charts` green.
- 54 Playwright tests, two of them new: the burn overrun read off the bar
  geometry, and no axis label leaving a card at any width on any dimension.
- 255-state sweep clean.
- Zoom 1, no horizontal scroll, hero on one baseline at 1180 and 1720.
