import { DAY_MS, TODAY } from './dataset.ts'
import type { Bucket, DateState, Range } from './types.ts'

export const MMM = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const MONTH_FULL = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

export const mondayOf = (t: number): number => {
  const d = new Date(t)
  const off = (d.getUTCDay() + 6) % 7
  return t - off * DAY_MS
}

export function isoWeek(t: number): number {
  const d = new Date(t)
  const th = mondayOf(t) + 3 * DAY_MS
  const jan1 = Date.UTC(new Date(th).getUTCFullYear(), 0, 1)
  return 1 + Math.round((th - mondayOf(jan1) - 3 * DAY_MS) / (7 * DAY_MS))
}

export const fmtDay = (t: number): string => {
  const d = new Date(t)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MMM[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** The window the current filter selection means. */
export function rangeFor(st: DateState): Range {
  if (st.period === 'Yearly') return { a: Date.UTC(st.year, 0, 1), b: Date.UTC(st.year, 11, 31) }
  if (st.period === 'Quaterly') {
    const m = (st.quarter - 1) * 3
    return { a: Date.UTC(st.year, m, 1), b: Date.UTC(st.year, m + 3, 0) }
  }
  if (st.period === 'Monthly')
    return { a: Date.UTC(st.year, st.month, 1), b: Date.UTC(st.year, st.month + 1, 0) }
  return { a: Math.min(st.rangeA, st.rangeB), b: Math.max(st.rangeA, st.rangeB) }
}

/** The equivalent window one step back, used for every delta on screen. */
export function prevRange(st: DateState): Range {
  if (st.period === 'Yearly')
    return { a: Date.UTC(st.year - 1, 0, 1), b: Date.UTC(st.year - 1, 11, 31) }
  if (st.period === 'Quaterly') {
    const m = (st.quarter - 1) * 3 - 3
    return { a: Date.UTC(st.year, m, 1), b: Date.UTC(st.year, m + 3, 0) }
  }
  if (st.period === 'Monthly')
    return { a: Date.UTC(st.year, st.month - 1, 1), b: Date.UTC(st.year, st.month, 0) }
  const r = rangeFor(st)
  const span = r.b - r.a + DAY_MS
  return { a: r.a - span, b: r.a - DAY_MS }
}

/** X-axis granularity: months for a year, ISO weeks for a quarter or month,
 *  days for a custom range. Truncated at TODAY so no empty future buckets. */
export function bucketsFor(st: DateState): Bucket[] {
  const r = rangeFor(st)
  const end = Math.min(r.b, TODAY)
  const out: Bucket[] = []
  if (end < r.a) return out

  if (st.period === 'Yearly') {
    for (let m = 0; m < 12; m++) {
      const a = Date.UTC(st.year, m, 1)
      const b = Date.UTC(st.year, m + 1, 0)
      if (a > end) break
      out.push({ label: `${MMM[m]} ${st.year}`, a, b: Math.min(b, end) })
    }
    return out
  }
  if (st.period === 'Quaterly' || st.period === 'Monthly') {
    for (let mon = mondayOf(r.a); mon <= end; mon += 7 * DAY_MS) {
      out.push({ label: `W${isoWeek(mon)}`, a: Math.max(mon, r.a), b: Math.min(mon + 6 * DAY_MS, end) })
    }
    return out
  }
  for (let t = r.a; t <= end; t += DAY_MS) {
    const d = new Date(t)
    out.push({ label: `${d.getUTCDate()} ${MMM[d.getUTCMonth()]}`, a: t, b: t })
  }
  return out
}

/** Label shown on the date picker trigger. */
export function dateLabel(st: DateState): string {
  if (st.period === 'Yearly') return String(st.year)
  if (st.period === 'Quaterly') return `Q${st.quarter} ${st.year}`
  if (st.period === 'Monthly') return `${MMM[st.month]} ${st.year}`
  const a = Math.min(st.rangeA, st.rangeB)
  const b = Math.max(st.rangeA, st.rangeB)
  return `${fmtDay(a)} – ${fmtDay(b)}`
}

/** Rolling eleven weeks ending at the window, for the KPI sparklines. */
export function sparkWeeks(st: DateState): Range[] {
  const r = rangeFor(st)
  const end = Math.min(r.b, TODAY)
  const out: Range[] = []
  let mon = mondayOf(end) - 10 * 7 * DAY_MS
  for (let i = 0; i < 11; i++, mon += 7 * DAY_MS) {
    out.push({ a: mon, b: Math.min(mon + 6 * DAY_MS, end) })
  }
  return out
}

export function weekLabel(r: Range): string {
  const a = new Date(r.a)
  const b = new Date(r.b)
  return `${a.getUTCDate()} ${MMM[a.getUTCMonth()]} - ${b.getUTCDate()} ${MMM[b.getUTCMonth()]}`
}
