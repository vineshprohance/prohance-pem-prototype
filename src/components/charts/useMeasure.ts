import { useLayoutEffect, useRef, useState } from 'react'

/**
 * The rendered width of a chart's own container.
 *
 * Charts used to take a width computed from `theme.sheetMinWidth`, which is a
 * floor, not the real column width. On any screen wider than that floor the
 * SVG viewBox was narrower than the box it rendered into, so the browser scaled
 * the whole drawing up: a 10px axis label came out at 15px and the labels ran
 * into each other. Measuring the container instead renders the SVG one to one,
 * so a label is the size it says it is at every screen width.
 *
 * `fallback` is what the first paint uses, before the observer has measured.
 */
export function useMeasure(fallback: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(fallback)

  /* Reads after every render, not only on mount. A ResizeObserver notification
   * can be dropped for a frame when several charts resize at once, and a width
   * that is stale by a few pixels draws the axis past the card edge. Any state
   * change on the page now corrects it, which is what changing the Compare by
   * control was doing by accident. */
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const next = Math.round(el.clientWidth)
    if (next > 0 && next !== w) setW(next)
  })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const next = Math.round(el.clientWidth)
      if (next > 0) setW(next)
    }
    read()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', read)
      return () => window.removeEventListener('resize', read)
    }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    window.addEventListener('resize', read)
    return () => { ro.disconnect(); window.removeEventListener('resize', read) }
  }, [])

  return [ref, w] as const
}
