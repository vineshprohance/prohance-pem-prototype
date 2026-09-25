import { ArrowDown, ArrowUp, TrendDown, TrendUp } from './Icons.tsx'
import type { Delta } from '../metrics/types.ts'

export const Badge = ({ badge }: { badge: [string, string] }) => (
  <span className={`badge ${badge[0]}`}><i className="dot" />{badge[1]}</span>
)

export function DeltaChip({ delta, suffix, trend, style }: {
  delta: Delta | null; suffix?: string; trend?: boolean; style?: React.CSSProperties
}) {
  if (!delta) return null
  const Up = trend ? TrendUp : ArrowUp
  const Dn = trend ? TrendDown : ArrowDown
  return (
    <div className={`delta ${delta.dir}`} style={style}>
      {delta.dir === 'up' ? <Up /> : <Dn />}
      <b>{delta.text}</b> {suffix}
    </div>
  )
}

export const NoData = ({ text = 'No data available' }: { text?: string }) => (
  <div className="nodata">{text}</div>
)
