# Vendor page audit and the units pass, 25 September 2026

Four questions from the review, each of which turned out to be a defect rather
than a preference.

## Why At-Risk Vendors read 0 with a vendor scoring 37

The risk rule needed two absolute cut-offs:

```
High    utilization > 85%  AND  SLA < 90%
Medium  SLA < 90%
Low     otherwise
```

Our portfolio runs at 60% capacity utilization, so **no vendor can ever reach
the first condition**, and every vendor is under the second. All three read
Medium, and At-Risk Vendors, which counts High, read 0.

This is not our invention. `claude/PEM_Metric_Roadmap_Sep2026.md` already lists
it under naming and correctness problems: *"Vendor Score + Risk Status +
Performance Status -> Vendor Scorecard. Three verdicts; one fires on both
Util > 85% and Util <= 85%."*

Risk Status now reads the Vendor Score's own bands, which are already in
`config/thresholds.json` and already drive the badge on the card directly above
it:

| Vendor | Score | Band | Risk |
| --- | --- | --- | --- |
| PH Engineering | 71.6 | Healthy | Low |
| PH Operations | 65.2 | Watch | Medium |
| Ploceus | 37.2 | Critical | High |

One Low, one Medium, one High, and At-Risk Vendors is 1. **No data was moved to
get there.** The numbers were always these; the rule could not see them.

The level also takes the colour of its band now. All three used to print orange.

## Why the designation strip was on the vendor page

It was added in 1.4 for Cost Efficiency, where picking a designation rescales
Partner Efficiency and Leakage Breakdown, which is a real decision about where
money is going. It was switched on for every lens without asking what it did on
each one. On Vendor Performance it moves three ratios and decides nothing.

It is now `designationStrip` per lens: on for Cost Efficiency and Delivery, off
for Vendor Performance and Capacity.

## What else the vendor page needed

Audited against `PEM Metrics.xlsx` sheet `Metrics`, `PEM_Persona_Lens_Spec.docx`
and `claude/PEM_Metric_Roadmap_Sep2026.md`.

The sheet lists four `Ven - Performance` heroes: Capacity Utilization, At-Risk
Vendors, Cost at Risk, SLA Compliance. All four are on the hero strip. But the
cards were six ratios and a verdict, with **no money anywhere**, while Cost at
Risk is a listed metric for this lens. A vendor manager arguing a QBR needs the
number the argument is about.

**Cost Loss is now a vendor card**, with its own trend, sitting directly under
the verdict.

One thing considered and not built: a **Consistency Score**, `100 - coefficient
of variation`, which the roadmap asks for by name and which only became
computable in 1.5 when each vendor got an arc. It scores PH Engineering 95.1,
PH Operations 89.8 and Ploceus 88.9, which is honest but useless: a vendor in
freefall is perfectly consistent about falling. It needs a definition decision
before it goes on a page, and is flagged here rather than shipped.

## "12 points under contract"

A project's status and the line explaining it were two strings in
`config/vendors.json`:

```json
{ "name": "ERP Modernization", "status": "atRisk", "factor": 0.86,
  "risk": "Output rate 12 points under contract for three consecutive months" }
```

Two problems. The unit does not exist in the model: output rate is tasks
completed against tasks assigned, and nothing is measured in points. And because
the status was a string beside the numbers rather than derived from them, the
two could disagree.

Each project now carries a `share` of its vendor's task volume. Everything else
is derived:

| Project | Vendor | Assigned | On time | Late | On time % | |
| --- | --- | --- | --- | --- | --- | --- |
| Digital Banking Platform | PH Engineering | 16,368 | 10,503 | 5,865 | 64.2% | at risk |
| Cloud Migration Wave 2 | PH Engineering | 10,032 | 7,974 | 2,058 | 79.5% | |
| ERP Modernization | PH Operations | 10,440 | 5,930 | 4,510 | 56.8% | at risk |
| Claims Processing Automation | PH Operations | 7,656 | 5,410 | 2,246 | 70.7% | |
| Data Platform Consolidation | PH Operations | 5,104 | 3,701 | 1,403 | 72.6% | |
| Customer Portal Refresh | Ploceus | 1,680 | 385 | 1,295 | 22.9% | at risk |

A chip now reads "5,865 of 16,368 tasks late or undelivered, 64.2% on time", and
a project is at risk because its own on-time rate is under the 70% floor in
`config/vendors.json`, not because a string says so. A test asserts the two can
never disagree, and that each vendor's project tasks sum to its own task count.

## The rest of the units audit

Every number on screen was swept for a unit.

| Unit | Where | Status |
| --- | --- | --- |
| tasks | On-Time Delivery, Output Rate, project risk | consistent, and now named on every figure |
| hours | leakage, idle, capacity, overtime | consistent, `491.84K hrs` |
| money | every cost | consistent, `$132.48M` |
| people | Resources, Excess FTEs, headcount, seats | whole numbers everywhere |
| percent | every ratio | consistent |
| points | Vendor Score delta | **removed**; a weighted index has no unit, so its delta is a plain signed number |

Output Rate's two counts read "tasks assigned" and "tasks completed" rather than
"target tasks" and "completed tasks", so the same two words carry the same
meaning on both delivery cards.

## Contract Burn

"term elapsed 93%" under a fill of 96% asked the reader to hold two numbers on
one bar and work out the relationship. It is two bars on one scale now:

```
Budget spent    ████████████████████░  96%
Contract term   ███████████████████░░  93%
```

A longer budget bar is money going out faster than the contract is running down.
No mark, no key, no sentence.

## Vendor Dependency Risk

A horizontal share bar reads as a progress bar. The point of the metric is that
the three shares are one whole, which is a ring. It sits beside the number, the
way the Productive vs Non-Productive card already arranges a donut.

Cost Loss also stopped printing in green, which is the colour this build uses
for money you got something for.

## Verification

- `test:engine` green, with new assertions that project tasks sum to the vendor's
  and that no project is flagged against its own numbers.
- `test:charts` green.
- 57 Playwright tests, three new: three distinct risk levels with At-Risk
  Vendors at 1, the money on the vendor page with no designation strip, and
  every project risk reading in tasks with no "points".
- 226-state sweep clean.
- Zoom 1, no horizontal scroll, hero on one baseline, no axis label leaving a
  card at 1180 or 1520.
