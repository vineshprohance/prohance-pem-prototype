import theme from '../../config/theme.json' with { type: 'json' }
import { signed, trimN, usd } from '../engine/format.ts'
import type { Delta } from './types.ts'

export const C = theme.color
export const CH = theme.chart

/** A delta chip, or null when there is nothing to compare against.
 *  `goodDown` flips the colour so a falling cost reads green. */
export function delta(
  cur: number | null,
  prev: number | null,
  fmt: (d: number) => string = d => signed(d),
): Delta | null {
  if (cur == null || prev == null) return null
  return { text: fmt(cur - prev), dir: cur < prev ? 'down' : 'up' }
}

export function moneyDelta(cur: number, prev: number): Delta | null {
  if (!prev) return null
  return { text: `${cur - prev >= 0 ? '+' : '-'}${usd(Math.abs(cur - prev))}`, dir: cur < prev ? 'down' : 'up' }
}

export const round2 = (n: number): number => +n.toFixed(2)

export const scoreRange = (series: number[]): string =>
  series.length ? `${trimN(series[0])} → ${trimN(series[series.length - 1])}` : '0'
