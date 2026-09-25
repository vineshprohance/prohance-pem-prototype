import type { Bucket, DateState, Totals, VendorConfig } from '../engine/types.ts'

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
}

export interface Delta { text: string; dir: 'up' | 'down' }

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
  headline: string
  trendLabel: string
  labels: string[]
  data: number[]
  color: string
}

/** Leakage: percentage, badge, delta, non-productive hours, columns. */
export interface LeakView {
  kind: 'leak'
  pct: string
  badge: [string, string]
  delta: Delta | null
  hours: string
  labels: string[]
  data: number[]
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
  sites: [string, number][]
  labels: string[]
  data: number[]
}

export interface RolesView {
  kind: 'roles'
  total: string
  rows: { title: string; count: number; pct: number }[]
}

export interface StatusView {
  kind: 'status'
  level: string
  conds: string[]
}

export interface KpiView {
  kind: 'kpi'
  value: string
  delta: Delta | null
}

export type MetricView =
  | ScoreView | RatioBarView | TwoSeriesView | HoursPairView
  | KvAreaView | MoneyAreaView | LeakView | DonutView
  | SitesView | RolesView | StatusView | KpiView

export type MetricScope = 'hero' | 'card' | 'profile' | 'detail'

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
}
