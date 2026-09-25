import { METRICS } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { ColumnChart } from './charts/ColumnChart.tsx'
import { MetricSection } from './MetricSection.tsx'
import { InfoTip, metricLabel } from './InfoTip.tsx'
import { NoData } from './Badge.tsx'
import type { LensState } from '../state/types.ts'
import type { Dimension } from '../engine/types.ts'

/** Full-width bands below the vendor grid.
 *
 *  A portfolio band is a metric that only means something across vendors, so it
 *  cannot live in a vendor column. A lens opts in with a `portfolioSections`
 *  array in config/lenses.json; the metric supplies a `portfolio` view in the
 *  registry. It reads the same filter bar as everything else on the page: there
 *  is no second time control. */
export function PortfolioBand({ ids, vendors, st, width, onDimension }: {
  ids: string[]; vendors: string[]; st: LensState; width: number
  onDimension: (d: Dimension) => void
}) {
  if (!ids.length || !vendors.length) return null
  return (
    <>
      {ids.map(id => {
        const def = METRICS[id]
        const view = def?.portfolio
          ? def.portfolio(buildContext(null, vendors, st,
              { dimension: st.dimension, designation: st.designation }))
          : null
        return (
          <section className="card band" key={id}>
            <div className="band-t">
              <h3>{metricLabel(id)} <InfoTip id={id} scope="card" /></h3>
              {view && view.kind === 'groupedBars' && (
                <label className="band-cmp">
                  <span>Compare by</span>
                  <select value={view.compareValue} data-testid={`${id}-compare`}
                          onChange={e => onDimension(e.target.value as Dimension)}>
                    {view.compareOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {view && view.kind !== 'groupedBars' ? (
              <MetricSection id={id} view={view} width={width} bare />
            ) : view && view.kind === 'groupedBars' ? (
              <>
                <div className="legend band-legend">
                  {view.series.map(s => (
                    <div className="lg" key={s.name}>
                      <i className="sw" style={{ background: s.color }} />{s.name}
                    </div>
                  ))}
                </div>
                <ColumnChart
                  layout="grouped"
                  series={view.series.map(s => ({ data: s.data, color: s.color, name: s.name }))}
                  labels={view.categories} kind="pct" unit="pct" max={100}
                  width={width}
                  caption={view.compareOptions.find(o => o.value === view.compareValue)?.label}
                />
                {view.insight && <p className="band-insight">{view.insight}</p>}
              </>
            ) : <NoData />}
          </section>
        )
      })}
    </>
  )
}
