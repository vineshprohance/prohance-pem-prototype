import { useEffect, useRef } from 'react'
import { METRICS, HERO_SPARK } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { heroSpark } from '../metrics/spark.ts'
import { Sparkline } from './charts/Sparkline.tsx'
import { DeltaChip } from './Badge.tsx'
import { InfoTip, metricLabel } from './InfoTip.tsx'
import { Chevron } from './Icons.tsx'
import { useTapToggle } from './usePointer.ts'
import { useLabelReserve } from './useLabelReserve.ts'
import { useStore } from '../state/store.tsx'
import type { DateState } from '../engine/types.ts'
import type { KpiView } from '../metrics/types.ts'

/** The KPI tiles.
 *
 *  Always one row, however many tiles a lens asks for: the grid is driven by
 *  the metric count, and each tile reflows internally when it gets narrow, so
 *  five tiles fit an iPad in landscape without a second row or a slider.
 *  Unlike the shipped build these recompute with every filter, so they always
 *  tie out against the cards below. */
export function HeroStrip({ metrics, scope, st, suffix, vendor }: {
  metrics: string[]
  scope: string[]
  st: DateState
  suffix: string
  vendor?: string | null
}) {
  const { d } = useStore()
  const strip = useLabelReserve(metrics.join('|'))
  return (
    <section className="kpis" ref={strip}
             style={{ '--kpi-n': metrics.length } as React.CSSProperties}>
      {metrics.map(id => {
        const def = METRICS[id]
        const ctx = buildContext(vendor ?? null, scope, st)
        const view = def?.hero ? def.hero(ctx) : null
        const sparkCfg = HERO_SPARK[id]
        const spark = sparkCfg && scope.length ? heroSpark(st, sparkCfg.kind, scope) : null
        return (
          <div className="card kpi" key={id}>
            {def?.drill === 'costLoss' && (
              <button type="button" className="kpi-drill" data-drill-metric={id}
                      aria-label={`Open the ${metricLabel(id)} detail`}
                      onClick={() => d({ t: 'set', patch: { costLossOpen: true } })}>
                <Chevron />
              </button>
            )}
            <div className="kpi-label">
              <span className="kl">{metricLabel(id)} <InfoTip id={id} scope="hero" /></span>
            </div>
            <div className="kpi-row">
              <KpiValue id={id} view={view} />
              {spark && (
                <Sparkline labels={spark.labels} values={spark.values}
                           color={sparkCfg.color} name={metricLabel(id)} />
              )}
            </div>
            <DeltaChip delta={view?.delta ?? null} suffix={suffix} />
          </div>
        )
      })}
    </section>
  )
}

/** A tile's number. When the metric carries a `detail` list the number becomes
 *  a button that reveals it: a count on its own says nothing useful, and on a
 *  touch screen there is no hover to lean on. */
function KpiValue({ id, view }: { id: string; view: KpiView | null }) {
  const { open, setOpen, handlers } = useTapToggle()
  const ref = useRef<HTMLDivElement>(null)
  const detail = view?.detail ?? null

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const value = view?.value ?? '0'
  if (!detail) return <div className="kpi-val">{value}</div>

  return (
    <div className="kpi-val-wrap" ref={ref}>
      <button type="button" className="kpi-val as-btn" data-kpi-detail={id}
              aria-expanded={open} aria-label={`${metricLabel(id)}: ${value}. Show the list.`}
              {...handlers}>
        {value}<span className="cue">{open ? 'Hide' : 'View'}</span>
      </button>
      {open && (
        <div className="kpi-pop" role="dialog" aria-label={detail.title}>
          <div className="kpi-pop-t">{detail.title}</div>
          {detail.rows.map(([a, b]) => (
            <div className="kpi-pop-r" key={a}><span>{a}</span><b>{b}</b></div>
          ))}
        </div>
      )}
    </div>
  )
}
