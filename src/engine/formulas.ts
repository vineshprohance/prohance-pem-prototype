import thresholds from '../../config/thresholds.json' with { type: 'json' }
import { ratio } from './format.ts'
import { h32 } from './noise.ts'
import { byName } from './dataset.ts'
import type { Totals } from './types.ts'

/* ==================================================================== *
 *  Every formula the dashboard uses, in one place.
 *
 *  These were reverse engineered from the shipped ProHance PEM build and
 *  verified against its published figures. Change one here and the whole
 *  app, including the vendor detail page and the KPI sparklines, follows.
 * ==================================================================== */

/** productive / expected. What the vendor delivered against what was contracted. */
export const capacityUtilization = (t: Totals) => ratio(t.productive, t.expected)

/** productive / logged. What the vendor delivered against the hours it booked. */
export const effectiveUtilization = (t: Totals) => ratio(t.productive, t.logged)

/** The unproductive remainder of logged hours. */
export const gapPct = (t: Totals) => {
  const eu = effectiveUtilization(t)
  return eu == null ? null : 100 - eu
}

/** completed / target. */
export const outputRate = (t: Totals) => ratio(t.completed, t.target)

/** onTime / completed. */
export const slaCompliance = (t: Totals) => ratio(t.onTime, t.completed)

/** leak / logged. The shipped build uses this same ratio for Idle Capacity. */
export const leakagePct = (t: Totals) => ratio(t.leak, t.logged)
export const idleCapacity = leakagePct

/** Hours booked that were not productive work. */
export const nonProductiveHours = (t: Totals) => t.logged - t.productive

/** The weighted headline score. Weights live in config/thresholds.json.
 *  A vendor with no deliveries scores its SLA component as zero rather than
 *  dropping out, which is what the shipped build does: Ploceus has no
 *  deliveries at all and still scores 34.87, exactly 0.6 x 58.12. */
export function vendorScore(t: Totals): number | null {
  const cu = capacityUtilization(t)
  if (cu == null) return null
  const w = thresholds.vendorScore
  return w.capacityWeight * cu + w.slaWeight * (slaCompliance(t) ?? 0)
}

export const billableCost = (t: Totals, vendorName: string) =>
  t.productive * (byName[vendorName]?.billRate ?? 0)

export const idleCost = (t: Totals, vendorName: string) =>
  t.idle * (byName[vendorName]?.idleRate ?? 0)

/** Headcount-weighted mean of the per-site utilizations. A flat average does
 *  not reproduce the product's number; the site weights do. */
export function highRateUtilization(t: Totals, vendorName: string): number | null {
  const eu = effectiveUtilization(t)
  const cfg = byName[vendorName]
  if (eu == null || !cfg) return null
  const mix = cfg.sites.reduce((a, s) => a + s.factor * s.weight, 0)
  return eu * mix
}

export function siteBreakdown(t: Totals, vendorName: string): [string, number][] {
  const eu = effectiveUtilization(t)
  const cfg = byName[vendorName]
  if (eu == null || !cfg) return []
  return cfg.sites.map(s => [s.name, +(eu * s.factor).toFixed(2)] as [string, number])
}

/* ---- badges and status ------------------------------------------- */

export type Tone = 'g' | 'a' | 'r'
export type Badge = ['healthy' | 'watch' | 'critical', 'Healthy' | 'Watch' | 'Critical']

export function scoreTone(score: number | null): [Tone, Badge] {
  const t = thresholds.vendorScore
  if (score == null) return ['r', ['critical', 'Critical']]
  if (score >= t.healthy) return ['g', ['healthy', 'Healthy']]
  if (score >= t.watch) return ['a', ['watch', 'Watch']]
  return ['r', ['critical', 'Critical']]
}

export function leakageBadge(leak: number | null): Badge {
  const t = thresholds.leakage
  if (leak == null) return ['healthy', 'Healthy']
  if (leak < t.healthy) return ['healthy', 'Healthy']
  if (leak < t.watch) return ['watch', 'Watch']
  return ['critical', 'Critical']
}

export interface RiskLevel { level: 'High' | 'Medium' | 'Low'; conds: string[] }

export function riskStatus(t: Totals): RiskLevel | null {
  const cu = capacityUtilization(t)
  const sla = slaCompliance(t)
  if (cu == null || sla == null) return null
  const r = thresholds.risk
  if (cu > r.capacityOver && sla < r.slaUnder)
    return { level: 'High', conds: [`SLA < ${r.slaUnder}%`, `Utilization > ${r.capacityOver}%`] }
  if (sla < r.slaUnder)
    return { level: 'Medium', conds: [`SLA < ${r.slaUnder}%`, `Utilization ≤ ${r.capacityOver}%`] }
  return {
    level: 'Low',
    conds: [`SLA ≥ ${r.slaUnder}%`,
      `Utilization ${cu > r.capacityOver ? '>' : '≤'} ${r.capacityOver}%`],
  }
}

/* ---- per-seat utilization ----------------------------------------- *
 *  Over and Under Utilized Employee are shares of people, not of hours.
 *  Each seat gets a deterministic draw around its vendor's effective
 *  utilization for the window; seats whose vendor has no data in the
 *  window are excluded rather than counted as under-utilized.
 * -------------------------------------------------------------------- */
export interface EmployeeSplit { over: number | null; under: number | null }

export function employeeSplit(
  vendorNames: string[],
  totalsFor: (name: string) => Totals,
): EmployeeSplit {
  const cfg = thresholds.employeeUtilization
  let over = 0, under = 0, n = 0
  for (const name of vendorNames) {
    const v = byName[name]
    if (!v) continue
    const t = totalsFor(name)
    const eu = effectiveUtilization(t)
    if (eu == null || t.logged <= 0) continue
    for (let i = 0; i < v.headcount; i++) {
      const u = eu * (cfg.spreadLow + (cfg.spreadHigh - cfg.spreadLow) * h32(v.seed, 9, i))
      if (u > cfg.overAt) over++
      if (u < cfg.underAt) under++
      n++
    }
  }
  return n ? { over: (over / n) * 100, under: (under / n) * 100 } : { over: null, under: null }
}
