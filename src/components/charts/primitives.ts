/** Shared chart geometry and number formatting.
 *  The charts are hand-drawn SVG so every transition and hover state is yours
 *  to change. Nothing here depends on a charting library. */

export const GEO = { H: 190, L: 44, R: 10, T: 12, B: 40 }

/** Axis label size. The product uses 12px on a 761px-wide chart; three vendor
 *  columns on one sheet are narrower than that, so 11 is the size that still
 *  fits flat at desktop width and tilts cleanly on an iPad. */
export const LABEL_FONT = 11

export type TickKind = 'num' | 'pct' | 'k' | 'kk'
export type ValueUnit = 'pct' | 'money' | 'khrs' | 'hrs' | 'count' | undefined

function niceCount(max: number, min: number): number {
  const span = max - min
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9
  const r = (n: number) => {
    const step = span / n
    const mag = Math.pow(10, Math.floor(Math.log10(step)))
    return step / mag
  }
  for (const n of [5, 4, 3, 6, 2]) {
    const v = r(n)
    if (near(v, 1) || near(v, 2) || near(v, 5) || near(v, 10)) return n
  }
  for (const n of [5, 4, 3, 6, 2]) if (near(r(n), 2.5)) return n
  return 5
}

/** Round a value up to a readable axis maximum.
 *  The ladder below (1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10) is the one the product's
 *  charts land on. Dropping a rung shifts every bar height and area path, so
 *  change it only alongside the chart geometry test. */
export function niceMax(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const r = v / mag
  const f =
    r <= 1 ? 1 : r <= 1.5 ? 1.5 : r <= 2 ? 2 : r <= 2.5 ? 2.5 :
    r <= 3 ? 3 : r <= 4 ? 4 : r <= 5 ? 5 : r <= 7.5 ? 7.5 : 10
  return f * mag
}

export function axisTicks(max: number, min = 0, n?: number): number[] {
  const count = n || niceCount(max, min)
  const step = (max - min) / count
  return Array.from({ length: count + 1 }, (_, i) => min + step * i)
}

export function fmtTick(v: number, kind: TickKind): string {
  if (kind === 'pct') return `${Math.round(v)}%`
  if (kind === 'k') {
    if (v >= 1e6) return `${v / 1e6}M`
    if (v >= 1000) return `${v / 1000}k`
    return String(v)
  }
  if (kind === 'kk') return v >= 1e6 ? `${v / 1e6}M` : `${v / 1000}k`
  return (Math.round(v * 100) / 100).toLocaleString()
}

const trim = (x: number) => String(parseFloat(x.toFixed(2)))

/** How a value reads inside a hover tooltip. */
export function fmtVal(v: number, kind: TickKind, unit: ValueUnit): string {
  if (unit === 'pct' || kind === 'pct') return `${trim(v)}%`
  if (unit === 'money') {
    if (Math.abs(v) >= 1e6) return `$${trim(v / 1e6)}M`
    if (Math.abs(v) >= 1000) return `$${trim(v / 1000)}K`
    return `$${Math.round(v)}`
  }
  if (unit === 'khrs') return `${trim(v / 1000)} K hrs`
  if (unit === 'hrs') return `${trim(v)} hrs`
  if (unit === 'count') return String(Math.round(v))
  if (kind === 'k' || kind === 'kk') return Math.abs(v) >= 1000 ? `${trim(v / 1000)}k` : trim(v)
  return trim(v)
}

/** Column geometry.
 *
 *  The shipped product draws its paired column charts with Highcharts
 *  `grouping: false`, which overlays both series on the same x position: a wide
 *  bar behind and a narrower bar centred in front of it. Side-by-side grouping
 *  looks wrong against the real screens, so `overlay` is the default here.
 *
 *  Widths follow Highcharts: the category slot is trimmed by `groupPadding` on
 *  each side to give the group, then each series is trimmed by its own
 *  `pointPadding`. */
export const COLUMN = { groupPadding: 0.1, borderRadius: 4, maxPointWidth: 40 }
export const OVERLAY_POINT_PADDING = [0.05, 0.28]

/** Width of one column. Capped so a chart with only a handful of categories
 *  does not turn into slabs; the cap never bites at the nine-month and
 *  thirteen-week views, so those stay pixel-identical to the product. */
export function columnWidth(slot: number, pointPadding: number, groupPadding = COLUMN.groupPadding): number {
  const w = slot * (1 - 2 * groupPadding) * (1 - 2 * pointPadding)
  const widest = slot * (1 - 2 * groupPadding) * (1 - 2 * OVERLAY_POINT_PADDING[0])
  const scale = widest > COLUMN.maxPointWidth ? COLUMN.maxPointWidth / widest : 1
  return w * scale
}

export interface HoverPoint {
  label: string
  /** band geometry for the full-height hover strip */
  bx: number
  bw: number
  /** marker position on a line chart */
  cx?: number
  cy?: number
  color?: string
  rows: [string, string, string][]
}
