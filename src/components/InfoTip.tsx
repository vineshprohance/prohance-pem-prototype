import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import copy from '../../config/copy.json' with { type: 'json' }
import { InfoIcon } from './Icons.tsx'
import { useTapToggle } from './usePointer.ts'
import type { MetricScope } from '../metrics/types.ts'

const METRIC_COPY = copy.metrics as Record<string, { label: string; tooltip: Record<string, string> }>

export const metricLabel = (id: string): string => METRIC_COPY[id]?.label ?? id

export function metricTip(id: string, scope: MetricScope): string | null {
  const t = METRIC_COPY[id]?.tooltip
  if (!t) return null
  return t[scope] ?? t.card ?? null
}

const TIP_W = 250
const GAP = 9

/** The info affordance beside a metric title.
 *
 *  It is a real button, so it is tab reachable, readable by a screen reader,
 *  and opens on focus as well as hover, which the metric-tooltip spec requires.
 *
 *  The bubble is rendered in a portal and positioned in viewport coordinates.
 *  Anchoring it inside the button meant any ancestor with `overflow: hidden`
 *  clipped it: the Vendor Profiles rows do exactly that, so every tooltip in
 *  the footer table was cut in half. It also flips below the icon when there is
 *  no room above, and never hangs off either edge of the window.
 *
 *  On a touch screen it toggles on tap. See useTapToggle for why hover alone
 *  does not survive the events iOS fires. */
export function InfoTip({ id, scope, label }: { id: string; scope: MetricScope; label?: string }) {
  const { open, setOpen, handlers, hover } = useTapToggle()
  const btn = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const text = metricTip(id, scope)

  useLayoutEffect(() => {
    if (!open || !btn.current) { setPos(null); return }
    const place = () => {
      const r = btn.current?.getBoundingClientRect()
      if (!r) return
      const below = r.top < 150
      setPos({
        x: Math.min(Math.max(r.left + r.width / 2, TIP_W / 2 + 8), window.innerWidth - TIP_W / 2 - 8),
        y: below ? r.bottom + GAP : r.top - GAP,
        below,
      })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  /* a tip left open by a tap closes on the next tap anywhere else */
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const t = window.setTimeout(
      () => document.addEventListener('touchstart', close, { once: true }), 0)
    return () => { window.clearTimeout(t); document.removeEventListener('touchstart', close) }
  }, [open, setOpen])

  if (!text) return null
  const name = label ?? metricLabel(id)

  return (
    <span className="info-wrap">
      <button
        ref={btn}
        type="button"
        className="info-btn"
        aria-label={`${name}. ${text}`}
        aria-expanded={open}
        {...hover}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        {...handlers}
      >
        <InfoIcon />
      </button>
      {open && pos && createPortal(
        <span className={`info-pop${pos.below ? ' below' : ''}`} role="tooltip"
              style={{ left: pos.x, top: pos.y }}>
          {text}
        </span>,
        document.body,
      )}
    </span>
  )
}
