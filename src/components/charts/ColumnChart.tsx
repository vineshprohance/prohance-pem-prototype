import { useState } from 'react'
import { COLUMN, OVERLAY_POINT_PADDING, columnWidth, fmtVal, GEO, groupedColumn, niceMax } from './primitives.ts'
import type { TickKind, ValueUnit } from './primitives.ts'
import { Grid, XLabels, labelFit } from './Grid.tsx'
import { ChartTooltip } from './ChartTooltip.tsx'
import { useHover } from './useHover.ts'
import { useMeasure } from './useMeasure.ts'

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
 *  `layout="overlay"` (the default, and what the product uses for a pair of
 *  series) draws both centred on the same category: a wide bar behind, a
 *  narrower bar in front. `layout="grouped"` puts them side by side, for a
 *  chart comparing named things rather than two measures of one thing.
 *
 *  Both layouts honour `maxPointWidth`. The product caps at 40 and renders 36px
 *  bars on a 761px chart; without the cap a four-category grouped chart on a
 *  full-width band draws 90px slabs.
 *
 *  `width` is a fallback for the first paint only. The chart then measures its
 *  own container, so the SVG renders one to one and an 11px axis label is 11px
 *  at every screen width. */
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
  const [box, W] = useMeasure(width)

  const all = series.flatMap(s => s.data)
  const top = max != null ? max : niceMax(Math.max(...all, 1))
  const plotW = W - GEO.L - GEO.R
  const plotH = GEO.H - GEO.T - GEO.B
  const n = Math.max(1, labels.length)
  const slot = plotW / n
  const py = (v: number) => GEO.H - GEO.B - (v / top) * plotH
  const fit = labelFit(W, labels)

  /** widths and left offsets per series, for the chosen layout */
  const geom = series.map((_, j) => {
    const pp = OVERLAY_POINT_PADDING[Math.min(j, OVERLAY_POINT_PADDING.length - 1)]
    const w = columnWidth(slot, pp)
    return { w, dx: -w / 2 }
  })

  /** Which series actually have a value in a category. */
  const liveIn = (i: number) => {
    const live = series.map((s, j) => ((s.data[i] || 0) > 0 ? j : -1)).filter(j => j >= 0)
    return live.length ? live : series.map((_, j) => j)
  }

  /** Grouped geometry is per category, not per series.
   *
   *  A category is only divided among the series that actually have a value in
   *  it. Dividing every category by `series.length` is right when every series
   *  has every category, which is true of designations and skills. It is wrong
   *  for projects and for most locations, where a slice belongs to exactly one
   *  vendor: the other two draw nothing, their slots stay reserved, and the one
   *  real bar sits a third of a category left or right of its own label with
   *  two thirds of the chart empty. Reported 25 Sep on Compare by = Project. */
  const groupGeom = labels.map((_, i) => {
    const live = liveIn(i)
    const g = groupedColumn(slot, live.length)
    return { w: g.w, dx: new Map(live.map((j, k) => [j, g.dxAt(k)])) }
  })

  return (
    <div className="chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${GEO.H}`} style={{ maxWidth: '100%', touchAction: 'pan-y' }}
           onPointerLeave={e => { onLeave(e); if (e.pointerType === 'mouse') setActive(null) }}>
        <Grid max={top} kind={kind} width={W} ticks={ticks} />
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
            const gg = groupGeom[i]
            const dx = layout === 'grouped' ? gg.dx.get(j) : geom[j].dx
            if (dx == null) return null
            const w = layout === 'grouped' ? gg.w : geom[j].w
            return (
              <path key={`${i}-${j}`} className="col-bar"
                    d={topRounded(cx + dx, py(v), w, h, COLUMN.borderRadius)}
                    fill={s.color} />
            )
          })
        })}
        <XLabels labels={labels} width={W} fit={fit} />
        {labels.map((lb, i) => {
          const cx = GEO.L + slot * (i + 0.5)
          /* The hover card lists what the category actually drew. A project run
             by one vendor used to report the other two at 0%. */
          const shown = layout === 'grouped' ? liveIn(i) : series.map((_, j) => j)
          const rows = shown.map(j =>
            [series[j].color, series[j].name,
             fmtVal(series[j].data[i] || 0, kind, unit)] as [string, string, string])
          const show = (e: React.PointerEvent | React.FocusEvent) => {
            setActive(i); onEnter({ label: lb, bx: cx - slot / 2, bw: slot, rows }, e)
          }
          return (
            <rect key={i} x={cx - slot / 2} y={GEO.T} width={slot} height={plotH}
                  fill="transparent" tabIndex={0} className="hotpt"
                  onPointerEnter={show} onPointerDown={show} onFocus={show}
                  onBlur={() => { onLeave(); setActive(null) }} />
          )
        })}
      </svg>
      {caption && <div className="xcap">{caption}</div>}
      <ChartTooltip hover={hover} />
    </div>
  )
}
