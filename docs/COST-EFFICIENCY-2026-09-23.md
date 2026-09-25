# Cost Efficiency rebuild, 23 September 2026

What Richard's review asked for, what was built, what was deliberately not
built, and what the change moved elsewhere. Scope was the Cost Efficiency lens
only. Vendor Performance and Capacity & Utilization keep their layout.

## The page

| Slot | Before | Now |
| --- | --- | --- |
| Subtitle | the shared one | "Quantify how much vendor spend converts into productive work, and what's lost to leakage and idle capacity." |
| Hero | 4 tiles | 5: Leakage Value, Capacity Utilization, Hours not delivered, FTE equivalent, Upcoming Contract Renewals |
| Cards | Billable Portfolio Cost, Capacity Utilization, Leakage Summary, SLA Compliance | Billable Portfolio Cost, Capacity Utilization, Leakage Summary, Overtime Integrity |
| Band | none | Productivity Comparison on Similar Work, full width |

SLA Compliance left this lens entirely. It stays on Vendor Performance, which is
where delivery belongs.

## Hero layout

Five tiles in one row was chosen over four-plus-one, a second row and a slider.
The strip is a grid of `--kpi-n` columns and each tile is a CSS container: below
268px a tile drops its sparkline under the number instead of beside it, and
below 196px the number shrinks a step. So the row never wraps, at any width, for
any tile count. On an iPad Air in landscape the tiles come out at 200px each and
take the stacked layout; on a 1520px desktop they are 268px and still stacked at
the boundary; wider than that they go side by side.

Every tile's number sits at the same y whatever its label length, because the
label reserves two lines and the value row hugs its content rather than
absorbing the card's slack.

## Names

Two of the new tiles use production's own names rather than the deck's.
Production already ships this under the Cost Loss slide-out: "Hours not
delivered" and "FTE equivalent". The deck called them Hours Shortfall and Excess
FTE equivalency. Shipping two names for one number is how a demo loses an
audience, so the production names won. Both read 0 in production today, because
production's utilization is above 100% and the shortfall clamps.

## Overtime Integrity

Modelled on the Idle Time Cost card: the money and the hours side by side, not a
percentage on its own. Percentage, badge and period delta on top, then Total OT
Hours, Employees Over Threshold, OT Cost and OT Cost at Risk, over a column
chart of the same percentage per bucket.

Overtime bills at the contracted rate. No premium; confirmed.

Employees Over Threshold is per seat, not a share of the average. A vendor
averaging 8.6% overtime still has a tail of people well past 10%, and that tail
is the whole reason to look at the metric. The draw is skewed so a healthy
average does not hide the tail and does not invent one either.

Bands: healthy under 5%, watch to 10%, critical above.

## Productivity Comparison on Similar Work

Full width below the vendor grid, because a metric comparing vendors cannot live
inside one vendor's column. Four skills from the deck: Backend Dev, Frontend
Dev, QA Automation, Data Engineering. Three vendors as grouped bars. A "Compare
by" control offering Skill Set, and nothing else until asked. No time control of
its own: it follows the page filter bar, and narrows when you filter vendors.

The value plotted is effective utilization, tilted per vendor per skill by a
factor in `config/vendors.json`, so no vendor leads on everything. One computed
sentence underneath names the widest gap.

The skill-set export from Work Time was reference only. Of 216 rows, 22 were
blank and 39 distinct labels hid maybe a dozen real skills: QA appeared eight
ways (Manual QA, QA Automation, Quality Assurance, QA Manual, QA, Testing,
Automation, JAVA_SELENIUM), Support five ways, Infrastructure four, plus
`Support` and `support` as separate values and one `Marketting`. Around 16% of
rows were not skills at all. The mock data is owned here instead, with the four
skills the deck uses.

## The numbers

Recalibrated so the page reconciles and reads as real.

| | PH Engineering | PH Operations | Ploceus | Portfolio |
| --- | ---: | ---: | ---: | ---: |
| Capacity Utilization | 87% | 82% | 58% | 82.7% |
| Effective Utilization | 76.67% | 78.11% | 62% | 77.07% |
| Rate card | $65 | $58 | $96 | |
| Contract Value | $6.11M | $10.63M | $1.07M | $17.81M |
| Billable Portfolio Cost | $5.31M | $8.72M | $623.04K | $14.66M |
| Cost Loss | $793.91K | $1.91M | $451.2K | $3.16M |
| Leakage | 26.47% Watch | 22.99% Healthy | 35.55% Critical | 24.61% |
| Leakage Value | $1.62M | $2.44M | $381.89K | $4.44M |
| Overtime | 4.2% Healthy | 8.6% Watch | 12.8% Critical | 7.23% |
| Vendor Score | 83.0 Healthy | 79.59 Watch | 46.79 Critical | |
| FTE equivalent | 8.4 | 22.8 | 3.2 | 34.5 |

Contract Value minus Billable Portfolio Cost equals Cost Loss, exactly, per
vendor and across the portfolio. `npm run test:engine` asserts it.

Leakage now divides by contracted hours rather than logged hours, at the product
owner's instruction: the reference point is what you paid for. Bands moved with
it, to healthy under 25, watch to 35, critical above.

Ploceus has deliveries now, so nothing on its card reads "No data available".
It is still the critical vendor, on SLA rather than on absence.

## No empty states

Production shows "No data available" for reasons a prototype does not get to
borrow. Four things hold it shut:

1. Every calendar day carries data. Saturday is 18% of a weekday, Sunday 6%.
2. Every vendor's series runs to today.
3. The date pickers refuse the future: years, quarters, months, days and the
   paging arrows all disable past 15 Sep 2026.
4. The vertical filter will not let you clear the last selection.

Verified by sweeping 130 states across three lenses, four periods, every metric
chip, each vertical alone, each vendor alone, every drilldown and five awkward
day ranges including a single Sunday. No empty state, no NaN, no percentage over
100.

That last one needed a change to the generator. Drawing each key independently
let a single day's utilization swing from 58% to 130%. One shared volume draw
per day plus a few percent of per-key deviation keeps the daily range at
80.7-94.0 for the highest vendor, which is the point: this dashboard should
never have to narrate a number above 100%.

## iPad Air, landscape

1180 x 820 CSS px, about 1116 of it usable beside the rail.

The sheet floor came down from 1260 to 1100, so the page renders at zoom 1. The
old 1260 forced an 86% scale, which shrank every label on the page. The floating
view control now hides itself when nothing needs scaling, so it does not sit
over the first vendor card during a demo.

Touch is a first input, not a fallback. A tap on iOS fires pointerdown,
touchstart, mouseover, mousedown, mouseup and click; a control wired to both
hover and click opens on the synthesised mouseover and closes on the click, so
it never appears. `preventDefault` is not a reliable cure. `useTapToggle`
deduplicates instead: the first touch toggles, and every mouse event for the
next 700ms is ignored as an echo. Charts use pointer events throughout, and a
touch tooltip latches rather than vanishing when the finger lifts, because on a
tablet the finger is what was covering the number you came to read.

Every tap target clears 32px. The info icon keeps its 14px glyph and gets its
size from an invisible pad, so nothing on the page moved.

## Fixed along the way

- Delta chips coloured by arrow direction, so every cost metric turned green as
  it got worse. Direction and sentiment are now separate.
- Sparklines ended on a two or three day stub against ten full weeks, which read
  as a collapse that had not happened. They now end on the last complete week.
- The date panel's paging arrows had a class the stylesheet did not carry, so
  they rendered unstyled.
- A date range inside one year printed the year twice.

## Not built, deliberately

- **Value Realization Index.** It is a Hero row under Fin - Cost Efficiency in
  PEM Metrics.xlsx and it is on slide 11 of the deck as "VRI 85.00", but it is
  out of scope for this cycle.
- **Recommended Decisions and Portfolio Optimisation panels.** Not approved.
- **A Cost Loss slide-out.** Production has one; a proper replica is a separate
  piece of work.
- **Card-level filters.** Not approved.
- **Slide 14.** Not a ProHance screen.
- **The "View as" role switcher.** Removed. `config/roles.json` keeps the roles
  and `showSwitcher: false`.
- **A drilldown on the renewals tile.** The list is enough for now.

## What this moved elsewhere

The dataset is one series, so recalibrating it moves the other two lenses:

- Yearly 2026 no longer matches the live build's published figures. By design:
  those had utilization above 100% and hour totals that did not divide to the
  percentages beside them.
- Vendor Score, Risk Status, Output Rate and SLA move on Vendor Performance.
- Idle Capacity is now 100 minus utilization, the workbook definition, rather
  than the leakage ratio.
- The employee split moves on Capacity & Utilization, because effective
  utilization moved.
- The second vertical is Services and holds Ploceus, so selecting it alone now
  scopes the page to one vendor rather than emptying it.
