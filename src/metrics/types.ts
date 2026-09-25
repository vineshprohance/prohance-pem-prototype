import type { Bucket, DateState, Dimension, Totals, VendorConfig } from '../engine/types.ts'

/** Everything a metric needs to compute itself. Built once per vendor per
 *  render by src/metrics/context.ts. */
export interface MetricContext {
  /** null on the hero strip, where the metric covers the whole selection */
  vendor: string | null
  cfg: VendorConfig | null
  /** vendors in scope: one vendor on a card, the whole selection on the hero */
  scope: string[]
  st: DateState
  totals: Totals
  prev: Totals
  buckets: Bucket[]
  bucketTotals: Totals[]
  labels: string[]
  /** window totals for one named vendor, for metrics that need per-vendor rates */
  totalsFor: (name: string) => Totals
  prevFor: (name: string) => Totals
  /** what Consolidation Levers is comparing across */
  dimension: Dimension
}

/** A period-on-period change chip.
 *
 *  `dir` is which way the arrow points. `tone` is whether that is good news,
 *  which is not the same thing: leakage rising is an up arrow and a red number.
 *  Colouring by direction alone had every cost metric turning green as it got
 *  worse. */
export interface Delta { text: string; dir: 'up' | 'down'; tone: 'good' | 'bad' }

/* ---- view models a metric can return ------------------------------ *
 *  One kind per visual shape on a vendor card. Add a kind here and a
 *  matching branch in src/components/MetricSection.tsx to introduce a new
 *  kind of card; reuse an existing kind and no component changes are needed.
 * -------------------------------------------------------------------- */

export interface ScoreView {
  kind: 'score'
  value: string
  tone: 'g' | 'a' | 'r'
  badge: [string, string]
  delta: Delta | null
  range: string
  data: number[]
  labels: string[]
  max: number
}

/** A support sentence with a percentage and a progress bar. */
export interface RatioBarView {
  kind: 'ratioBar'
  pct: string
  fill: number
  support: string
}

/** A big percentage beside two counted series, over grouped columns. */
export interface TwoSeriesView {
  kind: 'twoSeries'
  pct: string
  a: string; aLabel: string; aDot: string
  b: string; bLabel: string; bDot: string
  delta: Delta | null
  labels: string[]
  s1: number[]; s2: number[]
  c1: string; c2: string
  n1: string; n2: string
}

/** Logged against productive hours, as a key-value block over columns. */
export interface HoursPairView {
  kind: 'hoursPair'
  rows: { label: string; value: string; tipId?: string }[]
  labels: string[]
  s1: number[]; s2: number[]
  c1: string; c2: string
  n1: string; n2: string
  unit: 'khrs' | 'hrs'
}

/** Key-value block over an area chart. Used by Idle Cost. */
export interface KvAreaView {
  kind: 'kvArea'
  rows: { label: string; value: string }[]
  labels: string[]
  data: number[]
  color: string
  unit: 'money' | 'pct'
}

/** A headline money figure over an area chart. */
export interface MoneyAreaView {
  kind: 'moneyArea'
  /** `value` is money you got something for, which the product prints green.
   *  `loss` is money you did not, and green on a loss reads as good news. */
  tone?: 'value' | 'loss'
  headline: string
  trendLabel: string
  labels: string[]
  data: number[]
  color: string
}

/** A headline percentage with a badge, a period delta, a key-value block and a
 *  column chart underneath. Leakage Summary and Overtime Integrity both use it,
 *  which is why it carries a free-form row list rather than named fields. */
export interface StatRow {
  label: string
  value: string
  /** a second line under the value, e.g. the money behind the hours */
  sub?: string
  /** 'bad' tints the value red, for a figure that is the problem */
  tone?: 'bad'
  strong?: boolean
  tipId?: string
}

export interface StatBarsView {
  kind: 'statBars'
  pct: string
  /** the small grey words beside the big number, e.g. "effort leak" */
  caption: string
  /** Healthy / Watch / Critical, or null for no pill at all.
   *  The product badges exactly two metrics, Vendor Score and Leakage Summary.
   *  Everything else states its number and leaves the reading to the viewer. */
  badge: [string, string] | null
  delta: Delta | null
  rows: StatRow[]
  labels: string[]
  data: number[]
  color: string
}

/** Partner Efficiency: a headline pair, then the contract and the gap, over a
 *  cost trend. The pair is the whole point of the card, which is why it is
 *  separate from the rows: workforce size on the left, the part of it you are
 *  not getting on the right. */
/** One slice of a stacked horizontal bar: how much of the whole it is, what it
 *  is called, and the two numbers that go in the legend beside it. */
export interface Segment {
  label: string
  /** share of the bar, 0 to 100 */
  share: number
  value: string
  sub?: string
  color: string
  /** drawn as a track rather than a slice: the part that is not the story */
  rest?: boolean
}

export interface PartnerView {
  kind: 'partner'
  pairs: { label: string; value: string; tone?: 'bad'; tipId?: string }[]
  segments: Segment[]
  rows: StatRow[]
  labels: string[]
  data: number[]
  trendLabel: string
  color: string
}

/** A headline percentage, the same percentage drawn as a stacked bar, and the
 *  trend under it. Replaces a column of label-value rows: a reader takes the
 *  split from the bar in one look and reads the numbers off the legend only if
 *  they want them. */
export interface StackBarView {
  kind: 'stackBar'
  pct: string
  caption: string
  badge: [string, string] | null
  delta: Delta | null
  segments: Segment[]
  /** at most two summary rows under the legend */
  rows: StatRow[]
  labels: string[]
  data: number[]
  color: string
}

/** Several named series over the same categories, drawn side by side. Used by
 *  the portfolio comparison band, where the categories are skills and each
 *  series is a vendor. */
export interface GroupedBarsView {
  kind: 'groupedBars'
  categories: string[]
  series: { name: string; color: string; data: number[] }[]
  /** the "Compare by" control. One option today; the shape takes more. */
  compareOptions: { value: string; label: string }[]
  compareValue: string
  /** one computed sentence under the chart */
  insight: string
  /** per-category headcount behind each series, for the hover card */
  counts: number[][]
}

/** Contract Burn: a progress bar with the money either side of it and the
 *  dates underneath. */
export interface BurnView {
  kind: 'burn'
  pct: string
  fill: number
  /** share of the contract term already elapsed. Drawn as a second bar on the
   *  same scale, because two bars answer "is the money going faster than the
   *  calendar" without a mark, a key or a sentence to explain either. */
  elapsed: number
  /** true when the budget runs out before the contract does */
  early: boolean
  rows: StatRow[]
}

/** Vendor Dependency Risk: how concentrated the work is with one vendor.
 *  A share bar per vendor plus the reading. */
export interface ConcentrationView {
  kind: 'concentration'
  pct: string
  caption: string
  badge: [string, string] | null
  rows: { name: string; share: number; value: string; color: string }[]
  note: string
}

/** A list of rows with a status pill, for the SLA Risk Summary. */
export interface RiskListView {
  kind: 'riskList'
  rows: { title: string; meta: string; tone: 'bad' | 'ok'; note?: string }[]
}

/** Project risk as one line per vendor rather than one block per project.
 *
 *  Six stacked blocks were 437px on a page already four screens long, and the
 *  question the band answers is "which vendor is carrying the risk", which is a
 *  vendor comparison. Each row is a vendor, each chip a project; the reason
 *  opens under the row on tap, so the detail is a tap away rather than always
 *  on screen. */
export interface RiskChipsView {
  kind: 'riskChips'
  rows: {
    vendor: string
    atRisk: number
    total: number
    chips: { name: string; tone: 'bad' | 'ok'; note?: string }[]
  }[]
}

export interface DonutView {
  kind: 'donut'
  productive: number
  nonProductive: number
  labels: string[]
  s1: number[]
  s2: number[]
}

export interface SitesView {
  kind: 'sites'
  pct: string
  /** what the headline number is measured over, e.g. "2 of 4 locations" */
  scope: string
  sites: { name: string; util: number; usd: number; high: boolean }[]
  labels: string[]
  data: number[]
}

export interface RolesView {
  kind: 'roles'
  total: string
  rows: { title: string; count: number; pct: number }[]
}

export interface KpiView {
  kind: 'kpi'
  value: string
  delta: Delta | null
  /** optional list the tile reveals on tap or click, for tiles whose number is
   *  only useful alongside what it is counting */
  detail?: { title: string; rows: [string, string][] } | null
}

export type MetricView =
  | ScoreView | RatioBarView | TwoSeriesView | HoursPairView
  | KvAreaView | MoneyAreaView | StatBarsView | DonutView
  | SitesView | RolesView | KpiView | GroupedBarsView | PartnerView
  | BurnView | ConcentrationView | RiskListView | StackBarView | RiskChipsView

export type MetricScope = 'hero' | 'card' | 'profile' | 'detail' | 'portfolio'

export interface MetricDef {
  id: string
  /** where this metric may be used */
  scopes: MetricScope[]
  /** vendor-card view model, or null for "No data available" */
  card?: (ctx: MetricContext) => MetricView | null
  /** hero-tile view model */
  hero?: (ctx: MetricContext) => KpiView | null
  /** single value for the Vendor Profiles footer row */
  profile?: (ctx: MetricContext) => string | null
  /** optional heading aside, e.g. the headcount total */
  aside?: (ctx: MetricContext) => string | null
  /** a full-width band below the vendor grid, covering the whole selection */
  portfolio?: (ctx: MetricContext) => MetricView | null
  /** the slide-out this metric's hero tile opens. The product puts a chevron on
   *  exactly one tile, Cost Loss; this is the hook for any other. */
  drill?: 'costLoss'
}
