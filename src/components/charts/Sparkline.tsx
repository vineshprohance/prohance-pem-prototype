import { useId, useState } from 'react'
import { ChartTooltip } from './ChartTooltip.tsx'
import { useHover } from './useHover.ts'

const W = 120, H = 44

/** Parse a pre-formatted display value back to a number so the line can be
 *  drawn. Values arrive formatted so the tooltip reads exactly like the tile. */
const num = (s: string): number => {
  const m = String(s).replace(/,/g, '').match(/-?[\d.]+/)
  if (!m) return 0
  let v = parseFloat(m[0])
  if (/K/i.test(s)) v *= 1e3
  if (/M/i.test(s)) v *= 1e6
  return v
}

/** The trend line inside a KPI tile. The y range fits the data rather than
 *  starting at zero, which is what the product's tile charts do. */
export function Sparkline({ labels, values, color, name }: {
  labels: string[]; values: string[]; color: string; name: string
}) {
  const id = useId().replace(/:/g, '')
  const { hover, onEnter, onLeave } = useHover()
  const [active, setActive] = useState<number | null>(null)
  if (!values.length) return null

  const nums = values.map(num)
  const lo = Math.min(...nums)
  const span = (Math.max(...nums) - lo) || 1
  const n = nums.length
  const px = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2)
  const py = (v: number) => H - 3 - ((v - lo) / span) * (H - 9)
  const pts = nums.map((v, i) => [px(i), py(v)] as const)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const slot = W / Math.max(1, n - 1)

  return (
    <>
      <svg className="kpi-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
           onMouseLeave={() => { onLeave(); setActive(null) }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        {active != null && (
          <circle className="hovermark" cx={pts[active][0]} cy={pts[active][1]} r={3}
                  fill="#fff" stroke={color} strokeWidth={2} />
        )}
        {pts.map((p, i) => (
          <rect key={i} x={p[0] - slot / 2} y={0} width={slot} height={H} fill="transparent"
                tabIndex={0} className="hotpt"
                onMouseEnter={e => { setActive(i); onEnter({ label: labels[i] ?? '', bx: 0, bw: 0, rows: [[color, name, values[i]]] }, e) }}
                onFocus={e => { setActive(i); onEnter({ label: labels[i] ?? '', bx: 0, bw: 0, rows: [[color, name, values[i]]] }, e) }}
                onBlur={() => { onLeave(); setActive(null) }} />
        ))}
      </svg>
      <ChartTooltip hover={hover} />
    </>
  )
}
