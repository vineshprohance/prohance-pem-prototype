import { aggregate, aggregateMany, byName } from '../engine/dataset.ts'
import { bucketsFor, prevRange, rangeFor } from '../engine/ranges.ts'
import { zeroTotals } from '../engine/types.ts'
import type { DateState } from '../engine/types.ts'
import type { MetricContext } from './types.ts'

/** Build the context a metric computes from. `vendor` null means the metric
 *  covers the whole selection, which is how the hero strip works. */
export function buildContext(
  vendor: string | null,
  scope: string[],
  st: DateState,
): MetricContext {
  const r = rangeFor(st)
  const p = prevRange(st)
  const names = vendor ? [vendor] : scope
  const buckets = bucketsFor(st)
  return {
    vendor,
    cfg: vendor ? byName[vendor] ?? null : null,
    scope: names,
    st,
    totals: names.length ? aggregateMany(names, r.a, r.b) : zeroTotals(),
    prev: names.length ? aggregateMany(names, p.a, p.b) : zeroTotals(),
    buckets,
    bucketTotals: buckets.map(b => (names.length ? aggregateMany(names, b.a, b.b) : zeroTotals())),
    labels: buckets.map(b => b.label),
    totalsFor: name => aggregate(name, r.a, r.b),
    prevFor: name => aggregate(name, p.a, p.b),
  }
}
