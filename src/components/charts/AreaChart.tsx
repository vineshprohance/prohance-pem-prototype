import { useId, useState } from 'react'
import { fmtVal, GEO, niceMax } from './primitives.ts'
import type { TickKind, ValueUnit } from './primitives.ts'
import { Grid, XLabels, shouldRotate } from './Grid.tsx'
import { ChartTooltip } from './ChartTooltip.tsx'
import { useHover } from './useHover.ts'

export interface AreaChartProps {
  data: number[]
  labels: string[]
  color?: string
  kind?: TickKind
  unit?: ValueUnit
  seriesName?: string
  max?: number
  ticks?: number
  width?: number
  caption?: string
}

export function AreaChart({
  data, labels, color = 'var(--blue-line)', kind = 'num', unit,
  seriesName = 'Value', max, ticks, width = 520, caption,
}: AreaChartProps) {
  const id = useId().replace(/[:]/g, '')
  const { hover, onEnter, onLeave } = useHover()
  const [active, setActive] = useState<number | null>(null)

  const top = max != null ? max : niceMax(Math.max(...data, 1))
  const plotW = width - GEO.L - GEO.R
  const plotH = GEO.H - GEO.T - GEO.B
  const n = data.length
  const step = n > 1 ? plotW / (n - 1) : 0
  const px = (i: number) => GEO.L + (n > 1 ? step * i : plotW / 2)
  const py = (v: number) => GEO.H - GEO.B - (v / top) * plotH
  const pts = data.map((v, i) => [px(i), py(v)] as const)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L ${px(n - 1).toFixed(1)} ${GEO.H - GEO.B} L ${px(0).toFixed(1)} ${GEO.H - GEO.B} Z`
  const slotW = plotW / Math.max(1, n - 1)
  const rot = shouldRotate(width, labels)

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${GEO.H}`} style={{ maxWidth: '100%' }} onMouseLeave={() => { onLeave(); setActive(null) }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".30" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <Grid max={top} kind={kind} width={width} ticks={ticks} />
        <path d={area} fill={`url(#${id})`} className="area-fill" />
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
        <XLabels labels={labels} width={width} rotate={rot} />
        {pts.map((p, i) => (
          <rect
            key={i}
            x={p[0] - slotW / 2} y={GEO.T} width={slotW} height={plotH}
            fill="transparent" tabIndex={0} className="hotpt"
            onMouseEnter={e => { setActive(i); onEnter({
              label: labels[i] ?? '', bx: p[0] - slotW / 2, bw: slotW,
              cx: p[0], cy: p[1], color,
              rows: [[color, seriesName, fmtVal(data[i], kind, unit)]],
            }, e) }}
            onFocus={e => { setActive(i); onEnter({
              label: labels[i] ?? '', bx: p[0] - slotW / 2, bw: slotW,
              rows: [[color, seriesName, fmtVal(data[i], kind, unit)]],
            }, e) }}
            onBlur={() => { onLeave(); setActive(null) }}
          />
        ))}
      </svg>
      {caption && <div className="xcap">{caption}</div>}
      <ChartTooltip hover={hover} />
    </div>
  )
}
