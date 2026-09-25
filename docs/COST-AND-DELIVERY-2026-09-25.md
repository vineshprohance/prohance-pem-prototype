# Cost and Delivery pass, 25 September 2026

What the 23 September review asked for, what was built, what was deliberately
not built, and what is still open. Scope was Cost Efficiency and a new Delivery
Performance lens. HR is out of scope. Nothing in the design system moved.

## The ground rule

There is a product in production, so the prototype may not look different from
it. Content from the Aubergine Figma file is fair game; its layout, components
and type are not. The Figma prototype the product owner sent is an old build
with no design system: only the way it structures secondary metrics under a
headline was used as a reference. Every component on these pages already exists
in production.

## The dataset is ten times what it was

The old model carried 95 contracted FTE and talked about $4M. A governance
conversation about vendor leakage does not happen at that scale, so the model
was rebuilt to 950 FTE against a $275.7M book of signed contracts, calibrated so
capacity utilization lands near 60%, which is where the product owner wanted it.

| | FTE | Rate | Tier | CU | EU | SLA | Leakage Value | Cost Loss |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PH Engineering | 300 | $74 | strategic | 68% | 60% | 77% | $14.56M | $10.28M |
| PH Operations | 580 | $53 | tactical | 58% | 55% | 76% | $21.10M | $18.68M |
| Ploceus | 70 | $90 | tactical | 42% | 45% | 30% | $4.68M | $5.29M |
| **Portfolio** | **950** | | | **60%** | **56%** | **75%** | **$40.34M** | **$34.24M** |

Three vendors, not more, at the product owner's instruction.

Leakage Value now sits above Cost Loss, which it did not in 1.3. Leakage counts
every non-productive hour inside logged time; cost loss counts only the hours
that never arrived. A portfolio saying waste is smaller than absence was a
modelling error, and `test:engine` now pins the ordering rather than only the
figures. Ploceus inverts it at vendor level, correctly: at 42% utilization most
of its loss is hours that never arrived.

Everything else follows: 550K hours not delivered, 380 FTE equivalent, 9.32%
overtime, $450K of penalty exposure across 22 SLA breaches, $44.49M of contract
value carrying an at-risk project.

## Cost Efficiency, what changed

| Item | Before | Now |
| --- | --- | --- |
| Leakage Summary | one number and a badge | **Leakage Breakdown**: idle measured, the remainder split non-core and non-billable, each row carrying its money |
| Billable Portfolio Cost | that name | **Actual Cost Incurred**, one of the names Richard called out |
| Overtime Integrity | a rate and a pill | tracked hours against **claimed** hours, the gap stated, no pill |
| Partner Efficiency | did not exist | resources, excess FTE, contract value, actual cost, cost per productive hour, hours delivered against expected |
| Productivity Comparison | skills only | **Consolidation Levers**, comparing on Skill Set, Designation, Project or Location from one control |
| Vendor card | name and score | name, score and a **tier tag**, strategic or tactical |
| Designation | did not exist | a strip of in-card buttons on every vendor column |

## Delivery Performance, new

Hero: Financial Impact, FTE equivalent, SLA Compliance, Projects at Risk,
Contract Value at Risk. Cards: Delivery Predictability, Output Rate, Contract
Burn, Penalty Exposure. Bands: Vendor Dependency Risk, Consolidation Levers,
SLA Risk Summary.

Contract Burn is the one that earns the lens. PH Engineering has burned 91% of a
$138M contract that runs to November 2026 and the budget runs out on 28 October,
so the card says so in plain warning text rather than a pill.

Six projects along the lines Richard named: Digital Banking Platform, Cloud
Migration Wave 2, ERP Modernization, Claims Processing Automation, Data Platform
Consolidation, Customer Portal Refresh. Three carry risk.

## Decisions taken, and why

| Question | Decision |
| --- | --- |
| Bands as a page dropdown, as Aubergine has them | In-card buttons, per the product owner. A page dropdown cannot compare two vendors at one designation |
| What "grade of resource" means | Designation: Associate, Senior Associate, Lead, Manager, each with a cost factor. The word "band" appears nowhere in production and does not appear here |
| Which metrics carry Healthy / Watch / Critical | Vendor Score and Leakage Summary only, which is what production badges. Audited in the live build, pinned by a test |
| Repeating FTE equivalent everywhere | Only where the number differs: excess FTE against productive hours, leakage FTE, overtime FTE. Same number, one place |
| Aubergine's four lenses | Not adopted. Our lens taxonomy stays; only the metric content was taken |
| Vendor Dependency Risk as a hero tile | A band, not a tile. It is a portfolio reading and does not belong in a vendor column |

## Not built

**Renewal Notifications and Actions (C6).** The prototype does not make
recommendations or decide actions. The product owner is handling this with
Richard and it stays open.

## Open, to raise with Richard

1. The Aubergine file's numbers are an order of magnitude below ours: 619
   resources against our 950, $47M of contract value against $275.7M. Ours is
   the scale the product owner asked for. Worth settling before the numbers go
   in front of a customer.
2. Its lens taxonomy is four lenses that are not our four. We kept ours.
3. **Which period the demo should open on.** Cost Efficiency and Capacity &
   Utilization default to Weekly, matching the live build; Vendor Performance
   and Delivery Performance default to Yearly. On Weekly the Cost page opens at
   $433K of leakage, not the $40.34M the model was rebuilt to show, because a
   three-day window is three days of a year. One line in `config/lenses.json`
   switches it. Not changed here: a default period is product behaviour and the
   rule is to ask first.

## Compatibility

One HTML file has to work on the demo iPad Air in landscape and on a desktop.
Both were measured, not assumed:

| | iPad 1180 | Desktop 1720 |
| --- | --- | --- |
| Page zoom | 1 | 1 |
| Horizontal scroll | none | none |
| Hero rows | 1 | 1 |
| Hero number baselines | 1 | 1 |
| Axis label size | 11px | 11px |
| Scaled charts | 0 | 0 |

The hero baseline was the one regression this cycle. A label that wrapped to
three lines on a 200px tile pushed its number 18px below the rest, and a tile
with a sparkline sat 2px below one without. The strip now measures its tallest
label and reserves that height on every tile, and the number's box is the
sparkline's own height. CSS alone cannot do this: subgrid would, but a tile is a
size container for its own reflow and a size container can never be a subgrid.
That was verified in the browser rather than assumed. A test asserts one
baseline per strip on all four lenses at iPad width.

## Verification

- `test:engine`: 26 figures per vendor, five portfolio targets, four identities,
  every day of 2026 walked for missing series and for utilization over 100.
- `test:charts`: axis ladder and column geometry.
- `test:ui`: 52 Playwright tests, including every point above that could
  regress.
- A 255-state sweep across four lenses, every period, every filter: no empty
  state, no NaN, no percentage over 100.
