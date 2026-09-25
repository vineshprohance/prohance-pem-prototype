import { aggregate, aggregateMany, byName } from '../engine/dataset.ts'
import { sliceShare } from '../engine/formulas.ts'
import { bucketsFor, prevRange, rangeFor } from '../engine/ranges.ts'
import { zeroTotals } from '../engine/types.ts'
import { TOTAL_KEYS } from '../engine/types.ts'
import type { DateState, Dimension, Totals } from '../engine/types.ts'
import type { MetricContext } from './types.ts'

/** Scale a window down to one designation's share of the roster.
 *
 *  The designation strip filters a whole vendor column, and the honest way to
 *  do that in a prototype with no per-seat series is to take that slice's share
 *  of the headcount off the hours and the deliveries. Ratios are unaffected,
 *  which is right: filtering to Leads does not change the vendor's utilization
 *  by itself, it changes the size of what you are looking at. Efficiency by
 *  designation is what Consolidation Levers is for. */
function sliceTotals(t: Totals, share: number): Totals {
  if (share >= 1) return t
  const out = { ...t }
  for (const k of TOTAL_KEYS) out[k] = t[k] * share
  return out
}

/** Build the context a metric computes from. `vendor` null means the metric
 *  covers the whole selection, which is how the hero strip works. */
export function buildContext(
  vendor: string | null,
  scope: string[],
  st: DateState,
  opts: { dimension?: Dimension; designation?: Record<string, string> } = {},
): MetricContext {
  const r = rangeFor(st)
  const p = prevRange(st)
  const names = vendor ? [vendor] : scope
  const buckets = bucketsFor(st)
  const desig = opts.designation ?? {}
  const share = (name: string) =>
    desig[name] ? sliceShare(name, 'designation', desig[name]) : 1
  const many = (ns: string[], a: number, b: number): Totals => {
    if (!ns.some(n => share(n) < 1)) return aggregateMany(ns, a, b)
    const out = aggregateMany([], a, b)
    for (const n of ns) {
      const t = sliceTotals(aggregate(n, a, b), share(n))
      for (const k of TOTAL_KEYS) out[k] += t[k]
      out.days = Math.max(out.days, t.days)
      out.capDays = Math.max(out.capDays, t.capDays)
    }
    return out
  }
  return {
    dimension: opts.dimension ?? 'skillSet',
    vendor,
    cfg: vendor ? byName[vendor] ?? null : null,
    scope: names,
    st,
    totals: names.length ? many(names, r.a, r.b) : zeroTotals(),
    prev: names.length ? many(names, p.a, p.b) : zeroTotals(),
    buckets,
    bucketTotals: buckets.map(b => (names.length ? many(names, b.a, b.b) : zeroTotals())),
    labels: buckets.map(b => b.label),
    totalsFor: name => sliceTotals(aggregate(name, r.a, r.b), share(name)),
    prevFor: name => sliceTotals(aggregate(name, p.a, p.b), share(name)),
  }
}
