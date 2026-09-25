import { useCallback, useRef, useState } from 'react'

/** True when the primary input has no hover: a touch screen. */
export const COARSE: boolean =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none)').matches

/** How long after a touch we keep ignoring the mouse events the browser
 *  synthesises from it. Safari can take ~300ms to send the click. */
const AFTER_TOUCH_MS = 700

/**
 * Open-close state for a control that must work with a mouse and a finger.
 *
 * A tap on iOS produces a whole sequence: pointerdown, touchstart, mouseover,
 * mousedown, mouseup, click. A control wired naively to both hover and click
 * opens on the synthesised mouseover and closes again on the click, so it never
 * appears. `preventDefault` is not a reliable cure, because whether the click
 * still arrives varies by browser and by automation driver.
 *
 * So this deduplicates instead: the first touch toggles, and every mouse event
 * for the next moment is ignored as an echo of it. Nothing depends on a media
 * query that was evaluated once at load.
 */
export function useTapToggle(): {
  open: boolean
  setOpen: (v: boolean) => void
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void
    onClick: (e: React.MouseEvent) => void
  }
  hover: {
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }
} {
  const [open, setOpenRaw] = useState(false)
  const touched = useRef(0)
  const echo = () => Date.now() - touched.current < AFTER_TOUCH_MS

  const setOpen = useCallback((v: boolean) => setOpenRaw(v), [])

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return
      touched.current = Date.now()
      e.stopPropagation()
      setOpenRaw(o => !o)
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (echo()) return
      setOpenRaw(o => !o)
    },
  }

  const hover = COARSE ? {} : {
    onMouseEnter: () => { if (!echo()) setOpenRaw(true) },
    onMouseLeave: () => { if (!echo()) setOpenRaw(false) },
  }

  return { open, setOpen, handlers, hover }
}
