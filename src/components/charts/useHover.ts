import { useCallback, useEffect, useRef, useState } from 'react'
import type { HoverPoint } from './primitives.ts'

export interface HoverState {
  point: HoverPoint | null
  /** page coordinates for the floating tooltip */
  x: number
  y: number
}

/** Chart hover: a full-height band per category rather than a tiny point
 *  target, which is what makes the tooltips feel like the real product.
 *
 *  Pointer events rather than mouse events, so one code path serves a mouse, a
 *  trackpad and a finger. A mouse tooltip follows the pointer and clears when it
 *  leaves the chart. A touch tooltip latches: lifting a finger does not dismiss
 *  it, because on a tablet the finger is what was covering the number you came
 *  to read. The next tap anywhere else clears it. */
export function useHover() {
  const [hover, setHover] = useState<HoverState>({ point: null, x: 0, y: 0 })
  const latched = useRef(false)

  const onEnter = useCallback((
    p: HoverPoint,
    e: React.PointerEvent | React.FocusEvent,
  ) => {
    const type = 'pointerType' in e ? e.pointerType : 'mouse'
    latched.current = type === 'touch' || type === 'pen'
    const box = (e.currentTarget as SVGElement).getBoundingClientRect()
    setHover({ point: p, x: box.left + box.width / 2, y: box.top })
  }, [])

  const onLeave = useCallback((e?: React.PointerEvent) => {
    // a finger lifting off the chart must not take the tooltip with it
    if (latched.current && e && e.pointerType !== 'mouse') return
    latched.current = false
    setHover(h => ({ ...h, point: null }))
  }, [])

  /* a latched tooltip clears on the next touch somewhere else */
  useEffect(() => {
    if (!hover.point || !latched.current) return
    const clear = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('.chart')) return
      latched.current = false
      setHover(h => ({ ...h, point: null }))
    }
    const id = window.setTimeout(
      () => document.addEventListener('touchstart', clear), 0)
    return () => { window.clearTimeout(id); document.removeEventListener('touchstart', clear) }
  }, [hover.point])

  return { hover, onEnter, onLeave }
}
