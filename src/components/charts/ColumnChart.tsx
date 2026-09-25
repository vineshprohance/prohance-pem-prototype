import { useState } from 'react'
import { COLUMN, OVERLAY_POINT_PADDING, columnWidth, fmtVal, GEO, niceMax } from './primitives.ts'
import type { TickKind, ValueUnit } from './primitives.ts'
import { Grid, XLabels, shouldRotate } from './Grid.tsx'
import { ChartTooltip } from './ChartTooltip.tsx'
import { useHover } from './useHover.ts'

export interface Series { data: number[]; color: string; name: string }

/** A column with only its top corners rounded, which is how the product's
 *  columns are drawn. A plain rect with `rx` would round the base too. */
function topRounded(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  return `M${x} ${y + h} L${x} ${y + rr} Q${x} ${y} ${x + rr} ${y} ` +
         `L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} L${x + w} ${y + h} Z`
}

/** Columns.
 *
 *  `layout="overlay"` (the default, and what the product uses) draws both series
 *  centred on the same category: a wide bar behind, a narrower bar in front.
 *  `layout="grouped"` puts them side by side, which is the conventional look if
 *  you ever prefer it. */
export function ColumnChart({
  series, labels, kind = 'num', unit, max, ticks, width = 520, caption,
  layout = 'overlay',
}: {
  series: Series[]; labels: string[]; kind?: TickKind; unit?: ValueUnit
  max?: number; ticks?: number; width?: number; caption?: string
  layout?: 'overlay' | 'grouped'
}) {
  const { hover, onEnter, onLeave } = useHover()
  const [active, setActive] = useState<number | null>(null)

  const all = series.flatMap(s => s.data)
  const top = max != null ? max : niceMax(Math.max(...all, 1))
  const plotW = width - GEO.L - GEO.R
  const plotH = GEO.H - GEO.T - GEO.B
  const n = Math.max(1, labels.length)
  const slot = plotW / n
  const py = (v: number) => GEO.H - GEO.B - (v / top) * plotH
  const rot = shouldRotate(width, labels)

  /** widths and left offsets per series, for the chosen layout */
  const geom = series.map((_, j) => {
    if (layout === 'overlay') {
      const pp = OVERLAY_POINT_PADDING[Math.min(j, OVERLAY_POINT_PADDING.length - 1)]
      const w = columnWidth(slot, pp)
      return { w, dx: -w / 2 }
    }
    const group = slot * (1 - 2 * COLUMN.groupPadding)
    const w = group / series.length
    return { w: Math.max(1, w - 1.5), dx: -group / 2 + w * j }
  })

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${GEO.H}`} style={{ maxWidth: '100%' }}
           onMouseLeave={() => { onLeave(); setActive(null) }}>
        <Grid max={top} kind={kind} width={width} ticks={ticks} />
        {active != null && (
          <rect className="hoverband" x={GEO.L + slot * active} y={GEO.T}
                width={slot} height={plotH} fill="#101828" opacity={0.05} />
        )}
        {labels.map((_, i) => {
          const cx = GEO.L + slot * (i + 0.5)
          return series.map((s, j) => {
            const v = s.data[i] || 0
            const h = Math.max(0, GEO.H - GEO.B - py(v))
            if (h <= 0.5) return null
            const g = geom[j]
            return (
              <path key={`${i}-${j}`} className="col-bar"
                    d={topRounded(cx + g.dx, py(v), g.w, h, COLUMN.borderRadius)}
                    fill={s.color} />
            )
          })
        })}
        <XLabels labels={labels} width={width} rotate={rot} />
        {labels.map((lb, i) => {
          const cx = GEO.L + slot * (i + 0.5)
          const rows = series.map(s =>
            [s.color, s.name, fmtVal(s.data[i] || 0, kind, unit)] as [string, string, string])
          return (
            <rect key={i} x={cx - slot / 2} y={GEO.T} width={slot} height={plotH}
                  fill="transparent" tabIndex={0} className="hotpt"
                  onMouseEnter={e => { setActive(i); onEnter({ label: lb, bx: cx - slot / 2, bw: slot, rows }, e) }}
                  onFocus={e => { setActive(i); onEnter({ label: lb, bx: cx - slot / 2, bw: slot, rows }, e) }}
                  onBlur={() => { onLeave(); setActive(null) }} />
          )
        })}
      </svg>
      {caption && <div className="xcap">{caption}</div>}
      <ChartTooltip hover={hover} />
    </div>
  )
}
