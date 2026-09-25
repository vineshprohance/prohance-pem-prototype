/** Display formatters. These decide how a number reads on screen, nothing else. */

export const trimN = (n: number): string =>
  Number.isFinite(n) ? String(+n.toFixed(2)).replace(/\.0+$/, '') : '0'

export const pct = (n: number | null | undefined): string =>
  n == null || !Number.isFinite(n) ? '0%' : `${trimN(n)}%`

export const signed = (n: number, unit = '%'): string =>
  `${n >= 0 ? '+' : '-'}${trimN(Math.abs(n))}${unit}`

/** Hours read as "832.71 hrs" below 1000 and "106.61K hrs" above. */
export function hrs(n: number): string {
  if (!Number.isFinite(n)) return '0 hrs'
  return n >= 1000 ? `${trimN(n / 1000)}K hrs` : `${trimN(n)} hrs`
}

/** Money reads as $625.64K / $5.3M, matching the product. */
export function usd(n: number): string {
  if (!Number.isFinite(n)) return '$0'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}$${trimN(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}$${trimN(abs / 1e3)}K`
  return `${sign}$${trimN(abs)}`
}

export const signedUsd = (cur: number, prev: number): string =>
  `${cur - prev >= 0 ? '+' : '-'}${usd(Math.abs(cur - prev))}`

/** Safe ratio as a percentage. Returns null when the denominator is empty, which
 *  is what drives every "No data available" state. */
export const ratio = (num: number, den: number): number | null =>
  den > 0 ? (num / den) * 100 : null
