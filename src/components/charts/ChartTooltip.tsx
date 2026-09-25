import { createPortal } from 'react-dom'
import type { HoverState } from './useHover.ts'

/** The floating hover card. Rendered in a portal so it is never clipped by a
 *  card's overflow. */
export function ChartTooltip({ hover }: { hover: HoverState }) {
  if (!hover.point) return null
  const p = hover.point
  return createPortal(
    <div
      className="chart-tip"
      role="tooltip"
      style={{ left: hover.x, top: hover.y, opacity: 1 }}
    >
      <div className="ct-x">{p.label}</div>
      {p.rows.map((r, i) => (
        <div className="ct-row" key={i}>
          <i className="ct-sw" style={{ background: r[0] }} />
          <span>{r[1]}</span>
          <b>{r[2]}</b>
        </div>
      ))}
    </div>,
    document.body,
  )
}
