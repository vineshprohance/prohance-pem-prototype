import { METRICS, HERO_SPARK } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { heroSpark } from '../metrics/spark.ts'
import { Sparkline } from './charts/Sparkline.tsx'
import { DeltaChip } from './Badge.tsx'
import { InfoTip, metricLabel } from './InfoTip.tsx'
import type { DateState } from '../engine/types.ts'

/** The four KPI tiles. Unlike the shipped build these recompute with every
 *  filter, so they always tie out against the cards below. */
export function HeroStrip({ metrics, scope, st, suffix, vendor }: {
  metrics: string[]
  scope: string[]
  st: DateState
  suffix: string
  vendor?: string | null
}) {
  return (
    <section className="kpis">
      {metrics.map(id => {
        const def = METRICS[id]
        const ctx = buildContext(vendor ?? null, scope, st)
        const view = def?.hero ? def.hero(ctx) : null
        const sparkCfg = HERO_SPARK[id]
        const spark = sparkCfg && scope.length ? heroSpark(st, sparkCfg.kind, scope) : null
        return (
          <div className="card kpi" key={id}>
            <div className="kpi-label">{metricLabel(id)} <InfoTip id={id} scope="hero" /></div>
            <div className="kpi-row">
              <div className="kpi-val">{view?.value ?? '0'}</div>
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
