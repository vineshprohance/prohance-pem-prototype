import { useCallback, useState } from 'react'
import type { HoverPoint } from './primitives.ts'

export interface HoverState {
  point: HoverPoint | null
  /** page coordinates for the floating tooltip */
  x: number
  y: number
}

/** Chart hover: a full-height band per category rather than a tiny point
 *  target, which is what makes the tooltips feel like the real product. */
export function useHover() {
  const [hover, setHover] = useState<HoverState>({ point: null, x: 0, y: 0 })

  const onEnter = useCallback((p: HoverPoint, e: React.MouseEvent | React.FocusEvent) => {
    const el = e.currentTarget as SVGElement
    const box = el.getBoundingClientRect()
    setHover({ point: p, x: box.left + box.width / 2, y: box.top })
  }, [])

  const onLeave = useCallback(() => setHover(h => ({ ...h, point: null })), [])

  return { hover, onEnter, onLeave }
}
