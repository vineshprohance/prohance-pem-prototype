/* Calibration guard. Run with:  npm run test:engine
 * Every figure below is what the shipped ProHance PEM build prints for
 * Yearly 2026. If a change to config/vendors.json or src/engine/formulas.ts
 * moves one of them, this test tells you which. */
import { aggregate } from '../src/engine/dataset.ts'
import { rangeFor } from '../src/engine/ranges.ts'
import * as F from '../src/engine/formulas.ts'
import { hrs, pct, trimN, usd } from '../src/engine/format.ts'
import type { DateState } from '../src/engine/types.ts'

const st: DateState = {
  period: 'Yearly', year: 2026, quarter: 3, month: 8,
  rangeA: Date.UTC(2026, 8, 13), rangeB: Date.UTC(2026, 8, 15),
  calY: 2026, calM: 8, gridY: 2016, pick: null,
}
const r = rangeFor(st)

const expected: Record<string, Record<string, string>> = {
  'PH Engineering': {
    score: '86.13', cu: '113.82%', out: '100.57%', sla: '44.6%',
    logged: '106.61K hrs', productive: '81.74K hrs', gap: '23.33%',
    billable: '$5.3M', nonProductive: '24.87K hrs', leakage: '5.16%',
    idleCost: '$255.48K', idleHrs: '832.71 hrs', highRate: '76.68%',
  },
  'PH Operations': {
    score: '78.88', cu: '106.12%', out: '23.59%', sla: '38.03%',
    logged: '192.47K hrs', productive: '150.33K hrs', gap: '21.89%',
    billable: '$57.52M', nonProductive: '42.14K hrs', leakage: '12.67%',
    idleCost: '$8.46M', idleHrs: '5.63K hrs', highRate: '78.76%',
  },
  Ploceus: {
    score: '34.87', cu: '58.12%', out: '0%', sla: '0%',
    logged: '15.58K hrs', productive: '6.49K hrs', gap: '58.34%',
    billable: '$625.73K', nonProductive: '9.09K hrs', leakage: '43.38%',
    idleCost: '$444.98K', idleHrs: '1.54K hrs', highRate: '41.62%',
  },
}

let fails = 0
for (const [name, want] of Object.entries(expected)) {
  const t = aggregate(name, r.a, r.b)
  const got: Record<string, string> = {
    score: trimN(F.vendorScore(t) ?? 0),
    cu: pct(F.capacityUtilization(t)),
    out: pct(F.outputRate(t)),
    sla: pct(F.slaCompliance(t)),
    logged: hrs(t.logged),
    productive: hrs(t.productive),
    gap: pct(F.gapPct(t)),
    billable: usd(F.billableCost(t, name)),
    nonProductive: hrs(F.nonProductiveHours(t)),
    leakage: pct(F.leakagePct(t)),
    idleCost: usd(F.idleCost(t, name)),
    idleHrs: hrs(t.idle),
    highRate: pct(F.highRateUtilization(t, name)),
  }
  for (const k of Object.keys(want)) {
    const ok = got[k] === want[k]
    if (!ok) fails++
    console.log(
      `${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(15)} ${k.padEnd(14)} got ${String(got[k]).padEnd(14)} want ${want[k]}`,
    )
  }
}

console.log(fails ? `\n${fails} calibration mismatches` : '\nall calibration checks passed')
process.exit(fails ? 1 : 0)
