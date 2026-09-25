/** One day, or one aggregated window, of vendor activity. Every metric in the
 *  product is a function of these eight numbers plus a day count. */
export interface Totals {
  expected: number
  productive: number
  logged: number
  target: number
  completed: number
  onTime: number
  idle: number
  leak: number
  days: number
}

export const TOTAL_KEYS = [
  'expected', 'productive', 'logged', 'target', 'completed', 'onTime', 'idle', 'leak',
] as const
export type TotalKey = (typeof TOTAL_KEYS)[number]

export const zeroTotals = (): Totals => ({
  expected: 0, productive: 0, logged: 0, target: 0,
  completed: 0, onTime: 0, idle: 0, leak: 0, days: 0,
})

export interface Site { name: string; factor: number; weight: number }
export interface RoleRow { title: string; count: number; pct: number }

export interface VendorConfig {
  id: string
  name: string
  vertical: string
  logo: string
  seed: number
  headcount: number
  dataFrom: string
  dataTo: string
  billRate: number
  idleRate: number
  growth: number
  calibration: Record<TotalKey, number>
  sites: Site[]
  roles: RoleRow[]
}

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
