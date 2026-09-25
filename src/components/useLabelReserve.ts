import { useLayoutEffect, useRef } from 'react'

/** Reserve the same label height on every tile in the strip.
 *
 *  Tiles need their numbers on one baseline, and a number sits directly below
 *  its label, so every label box has to be as tall as the tallest one. A fixed
 *  two-line reserve did that until a label wrapped to three lines on an iPad,
 *  which dropped that one number 18px below the rest. CSS cannot size one
 *  tile's box from another's content: subgrid would, but a tile carries
 *  `container-type: inline-size` for its own reflow and a size container can
 *  never be a subgrid. So the strip measures instead. The inner span is what
 *  gets measured, because it wraps to the label's natural height whatever
 *  reserve is on the box around it, which keeps the read out of the loop the
 *  observer is watching. */
export function useLabelReserve(key: string, prop = '--kpi-label-h') {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      let tallest = 0
      el.querySelectorAll<HTMLElement>('.kl').forEach(s => {
        tallest = Math.max(tallest, s.getBoundingClientRect().height)
      })
      if (tallest > 0) el.style.setProperty(prop, `${Math.ceil(tallest)}px`)
    }
    read()
    // a webfont landing after first paint re-wraps the labels
    document.fonts?.ready.then(read).catch(() => {})
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', read)
      return () => window.removeEventListener('resize', read)
    }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [key, prop])

  return ref
}
