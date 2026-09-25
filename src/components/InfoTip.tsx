import { useState } from 'react'
import copy from '../../config/copy.json' with { type: 'json' }
import { InfoIcon } from './Icons.tsx'
import type { MetricScope } from '../metrics/types.ts'

type CopyMap = typeof copy.metrics
const METRIC_COPY = copy.metrics as Record<string, { label: string; tooltip: Record<string, string> }>

export const metricLabel = (id: string): string => METRIC_COPY[id]?.label ?? id

export function metricTip(id: string, scope: MetricScope): string | null {
  const t = METRIC_COPY[id]?.tooltip
  if (!t) return null
  return t[scope] ?? t.card ?? null
}

/** The info affordance beside a metric title. It is a real button, so it is
 *  tab reachable, readable by a screen reader, and opens on focus as well as
 *  hover, which the metric-tooltip spec requires. */
export function InfoTip({ id, scope, label }: { id: string; scope: MetricScope; label?: string }) {
  const [open, setOpen] = useState(false)
  const text = metricTip(id, scope)
  if (!text) return null
  const name = label ?? metricLabel(id)
  return (
    <span className="info-wrap">
      <button
        type="button"
        className="info-btn"
        aria-label={`${name}. ${text}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
      >
        <InfoIcon />
      </button>
      {open && <span className="info-pop" role="tooltip">{text}</span>}
    </span>
  )
}
