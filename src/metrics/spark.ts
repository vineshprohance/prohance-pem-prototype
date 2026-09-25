import { aggregate, aggregateMany } from '../engine/dataset.ts'
import { sparkWeeks, weekLabel } from '../engine/ranges.ts'
import { hrs, pct, trimN, usd } from '../engine/format.ts'
import * as F from '../engine/formulas.ts'
import type { DateState } from '../engine/types.ts'
import type { SparkKind } from './registry.ts'

/** The rolling eleven-week series behind every KPI tile sparkline. */
export function heroSpark(
  st: DateState,
  kind: SparkKind,
  scope: string[],
): { labels: string[]; values: string[] } {
  const weeks = sparkWeeks(st)
  const labels: string[] = []
  const values: string[] = []
  for (const w of weeks) {
    const t = aggregateMany(scope, w.a, w.b)
    let v = 0
    let fmt: (n: number) => string = pct
    switch (kind) {
      case 'cu': v = F.capacityUtilization(t) ?? 0; break
      case 'sla': v = F.slaCompliance(t) ?? 0; break
      case 'eu': v = F.effectiveUtilization(t) ?? 0; break
      case 'idlecap': v = F.idleCapacity(t) ?? 0; break
      case 'cost':
        fmt = usd
        v = scope.reduce((a, n) => a + F.costLoss(aggregate(n, w.a, w.b), n), 0)
        break
      case 'bill':
        fmt = usd
        v = scope.reduce((a, n) => a + F.billableCost(aggregate(n, w.a, w.b), n), 0)
        break
      case 'leakval':
        fmt = usd
        v = scope.reduce((a, n) => a + F.leakageValue(aggregate(n, w.a, w.b), n), 0)
        break
      case 'hnd':
        fmt = hrs
        v = F.hoursNotDelivered(t)
        break
      case 'fte':
        fmt = n => trimN(+n.toFixed(1))
        v = F.fteEquivalent(t) ?? 0
        break
      case 'over': v = F.employeeSplit(scope, n => aggregate(n, w.a, w.b)).over ?? 0; break
      case 'under': v = F.employeeSplit(scope, n => aggregate(n, w.a, w.b)).under ?? 0; break
    }
    labels.push(weekLabel(w))
    values.push(fmt(v))
  }
  return { labels, values }
}
