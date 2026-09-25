import { axisTicks, fmtTick, GEO } from './primitives.ts'
import type { TickKind } from './primitives.ts'

export function Grid({ max, min = 0, kind, width, ticks }: {
  max: number; min?: number; kind: TickKind; width: number; ticks?: number
}) {
  const plotH = GEO.H - GEO.T - GEO.B
  return (
    <>
      {axisTicks(max, min, ticks).map((t, i) => {
        const y = GEO.H - GEO.B - ((t - min) / (max - min || 1)) * plotH
        return (
          <g key={i}>
            <line x1={GEO.L} y1={y} x2={width - GEO.R} y2={y} stroke="var(--grid)" strokeWidth={1} />
            <text x={GEO.L - 8} y={y + 3.5} textAnchor="end" fontSize={10} fill="var(--muted)">
              {fmtTick(t, kind)}
            </text>
          </g>
        )
      })}
    </>
  )
}

export function XLabels({ labels, width, rotate }: {
  labels: string[]; width: number; rotate: boolean
}) {
  const plotW = width - GEO.L - GEO.R
  const step = plotW / Math.max(1, labels.length)
  return (
    <>
      {labels.map((l, i) => {
        const x = GEO.L + step * (i + 0.5)
        const y = GEO.H - GEO.B + 16
        return rotate ? (
          <text key={i} x={x} y={y} transform={`rotate(-38 ${x} ${y})`} textAnchor="end"
                fontSize={10} fill="var(--muted)">{l}</text>
        ) : (
          <text key={i} x={x} y={y} textAnchor="middle" fontSize={10} fill="var(--muted)">{l}</text>
        )
      })}
    </>
  )
}

export const shouldRotate = (width: number, labels: string[]): boolean =>
  width < 640 && labels.length > 6 && String(labels[0] ?? '').length > 6
