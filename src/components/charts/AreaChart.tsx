import { useId, useState } from 'react'
import { fmtVal, GEO, niceMax } from './primitives.ts'
import type { TickKind, ValueUnit } from './primitives.ts'
import { Grid, XLabels, labelFit } from './Grid.tsx'
import { ChartTooltip } from './ChartTooltip.tsx'
import { useHover } from './useHover.ts'
import { useMeasure } from './useMeasure.ts'

export interface AreaChartProps {
  data: number[]
  labels: string[]
  color?: string
  kind?: TickKind
  unit?: ValueUnit
  seriesName?: string
  max?: number
  ticks?: number
  /** fallback for the first paint; the chart then measures its own container */
  width?: number
  caption?: string
  /** a plain line, the way the product draws its Cost Loss trend */
  fill?: boolean
}

export function AreaChart({
  data, labels, color = 'var(--blue-line)', kind = 'num', unit,
  seriesName = 'Value', max, ticks, width = 520, caption, fill = true,
}: AreaChartProps) {
  const id = useId().replace(/[:]/g, '')
  const { hover, onEnter, onLeave } = useHover()
  const [active, setActive] = useState<number | null>(null)
  const [box, W] = useMeasure(width)

  const top = max != null ? max : niceMax(Math.max(...data, 1))
  const plotW = W - GEO.L - GEO.R
  const plotH = GEO.H - GEO.T - GEO.B
  const n = data.length
  const step = n > 1 ? plotW / (n - 1) : 0
  const px = (i: number) => GEO.L + (n > 1 ? step * i : plotW / 2)
  const py = (v: number) => GEO.H - GEO.B - (v / top) * plotH
  const pts = data.map((v, i) => [px(i), py(v)] as const)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L ${px(n - 1).toFixed(1)} ${GEO.H - GEO.B} L ${px(0).toFixed(1)} ${GEO.H - GEO.B} Z`
  const slotW = plotW / Math.max(1, n - 1)
  const fit = labelFit(W, labels)

  return (
    <div className="chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${GEO.H}`} style={{ maxWidth: '100%', touchAction: 'pan-y' }}
           onPointerLeave={e => { onLeave(e); if (e.pointerType === 'mouse') setActive(null) }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".30" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <Grid max={top} kind={kind} width={W} ticks={ticks} />
        {fill && <path d={area} fill={`url(#${id})`} className="area-fill" />}
        <path d={line} fill="none" stroke={color} strokeWidth={1.8}
              strokeLinejoin="round" strokeLinecap="round" className="area-line" />
        {active != null && (
          <>
            <rect className="hoverband" x={pts[active][0] - slotW / 2} y={GEO.T}
                  width={slotW} height={plotH} fill="#101828" opacity={0.05} />
            <circle className="hovermark" cx={pts[active][0]} cy={pts[active][1]} r={4}
                    fill="#fff" stroke={color} strokeWidth={2} />
          </>
        )}
        <XLabels labels={labels} width={W} fit={fit} />
        {pts.map((p, i) => {
          const show = (e: React.PointerEvent | React.FocusEvent) => {
            setActive(i)
            onEnter({
              label: labels[i] ?? '', bx: p[0] - slotW / 2, bw: slotW,
              cx: p[0], cy: p[1], color,
              rows: [[color, seriesName, fmtVal(data[i], kind, unit)]],
            }, e)
          }
          return (
            <rect key={i} x={p[0] - slotW / 2} y={GEO.T} width={slotW} height={plotH}
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
