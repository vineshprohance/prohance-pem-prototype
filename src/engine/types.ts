/** One day, or one aggregated window, of vendor activity. Every metric in the
 *  product is a function of these eight numbers plus a day count.
 *
 *  expected    contracted productive hours for the window
 *  productive  productive hours actually delivered
 *  logged      hours the vendor booked, productive or not
 *  target      deliveries assigned
 *  completed   deliveries finished
 *  onTime      deliveries finished inside their agreed timeline
 *  idle        booked hours spent idle, a subset of (logged - productive)
 *  ot          overtime hours inside logged
 */
export interface Totals {
  expected: number
  productive: number
  logged: number
  target: number
  completed: number
  onTime: number
  idle: number
  ot: number
  days: number
  /** full-time-equivalent days of capacity the window covers, weekends
   *  weighted down; see DAY_WEIGHT in dataset.ts */
  capDays: number
}

export const TOTAL_KEYS = [
  'expected', 'productive', 'logged', 'target', 'completed', 'onTime', 'idle', 'ot',
] as const
export type TotalKey = (typeof TOTAL_KEYS)[number]

export const zeroTotals = (): Totals => ({
  expected: 0, productive: 0, logged: 0, target: 0,
  completed: 0, onTime: 0, idle: 0, ot: 0, days: 0, capDays: 0,
})

/** A delivery location. `factor` tilts that site's utilization around the
 *  vendor's own, `weight` is its share of the roster, `rate` is a multiplier on
 *  the vendor's bill rate: the weights and rates are set so a vendor's blended
 *  rate stays its card rate. */
export interface Site { name: string; factor: number; weight: number; rate: number }

/** How a vendor moves over a year.
 *
 *  Without this every ratio is pinned to its annual value: the old generator
 *  drew one volume per day and let each key wander 4% around it, so capacity
 *  utilization travelled 1.4 points across eight months and every percentage
 *  chart drew a flat line. `swing` is how far a key travels peak to trough,
 *  signed so a positive number moves with the vendor's fortunes, and `shape`
 *  says whether those fortunes rise, dip in the middle, or fall. The year
 *  totals are untouched, because calibration scales each key to its configured
 *  sum whatever path it took to get there. */
export interface Personality {
  shape: 'improving' | 'sagging' | 'sliding'
  /** amplitude of the week-to-week jitter on top of the arc */
  wobble: number
  /** how widely this vendor's own seats scatter around its mean utilization */
  utilizationSpread: number
  swing: Partial<Record<TotalKey, number>>
}

/** One slice of a vendor's workforce, along whichever dimension you are
 *  comparing: a skill, a designation, a project or a location. `factor` tilts
 *  that slice's efficiency around the vendor's own, so Consolidation Levers has
 *  a real spread to compare rather than a flat row of identical bars. */
export interface SliceRow { name: string; count: number; factor: number }

/** A project the vendor is delivering. */
export interface ProjectRow {
  name: string
  /** tilts this project's on-time rate around its vendor's */
  factor: number
  /** its share of the vendor's task volume */
  share: number
}

/** A fixed-bid contract, for the Contract Burn widget on Delivery. */
export interface Contract {
  value: number
  from: string
  to: string
  /** share of the contract value already consumed */
  burn: number
}

export interface VendorConfig {
  id: string
  name: string
  vertical: string
  logo: string
  seed: number
  headcount: number
  dataFrom: string
  dataTo: string
  /** one rate card per vendor, used for billable, idle and overtime hours */
  billRate: number
  idleRate: number
  growth: number
  /** how the client categorises this vendor: strategic for project work,
   *  tactical for day to day. Client-assigned, no formula behind it. */
  tier: 'strategic' | 'tactical'
  /** ISO date the current contract comes up for renewal */
  contractRenewal: string
  contractOwner: string
  contract: Contract
  /** overtime the vendor bills against the overtime ProHance tracks. Above 1
   *  the vendor is claiming more than it worked. Client-fed in the product. */
  claimedOtMultiplier: number
  /** penalties the client's contract has triggered. External, client-fed, and
   *  deliberately small beside the leakage figures: it is real money but it is
   *  not where the loss is. */
  penaltyExposure: number
  slaBreaches: number
  calibration: Record<TotalKey, number>
  personality: Personality
  sites: Site[]
  designations: SliceRow[]
  skills: SliceRow[]
  projects: ProjectRow[]
}

/** The dimensions Consolidation Levers can compare across. */
export const DIMENSIONS = ['skillSet', 'designation', 'project', 'location'] as const
export type Dimension = (typeof DIMENSIONS)[number]

export type Period = 'Yearly' | 'Quaterly' | 'Monthly' | 'Weekly'

export interface DateState {
  period: Period
  year: number
  quarter: number
  month: number
  rangeA: number
  rangeB: number
  /** calendar popover paging state */
  calY: number
  calM: number
  gridY: number
  pick: number | null
}

export interface Range { a: number; b: number }
export interface Bucket { label: string; a: number; b: number }
