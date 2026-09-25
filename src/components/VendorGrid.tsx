import theme from '../../config/theme.json' with { type: 'json' }
import copy from '../../config/copy.json' with { type: 'json' }
import { byName } from '../engine/dataset.ts'
import { dimensionRows } from '../engine/formulas.ts'
import { METRICS } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { MetricSection } from './MetricSection.tsx'
import { VendorLogo } from './Icons.tsx'
import type { LensState } from '../state/types.ts'

/** One CSS grid holding every vendor column, so metric sections row-align and
 *  all cards end up the same height. A full-height background cell per column
 *  paints the card behind the sections. */
/** One CSS grid holding every vendor column.
 *
 *  Each column carries a designation strip under the vendor name, which narrows
 *  that column to one seniority level. It sits per column rather than per card
 *  because four full-word buttons do not fit inside a 275px card on an iPad,
 *  and because narrowing one metric and not its neighbours would be a lie. */
export function VendorGrid({ vendors, sections, st, suffix, designations, onDrill, onDesignation }: {
  vendors: string[]
  sections: string[]
  st: LensState
  suffix: string
  /** `designationStrip` on the lens. Off on Vendor Performance: the strip only
   *  moved three ratios there, which is a row of controls for no decision. */
  designations: boolean
  onDrill: (vendor: string) => void
  onDesignation: (vendor: string, designation: string | null) => void
}) {
  if (!vendors.length) {
    return <section className="card"><div className="nodata">{copy.ui.noData}</div></section>
  }

  const keys = sections.filter(k => st.applied.metric === 'All' || st.applied.metric === k)
  const n = vendors.length
  const colW = Math.round((theme.sheetMinWidth - 52 - 16 * (n - 1)) / n)
  const chartW = Math.max(300, colW - 32)
  const firstMetricRow = designations ? 3 : 2
  const lastRow = keys.length + firstMetricRow

  return (
    <section className="vgrid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {vendors.map((v, ci) => (
        <div key={`bg-${v}`} className="vcard-bg"
             style={{ gridColumn: ci + 1, gridRow: `1 / ${lastRow}` }} />
      ))}

      {vendors.map((v, ci) => (
        <div key={`head-${v}`} className="vhead" role="button" tabIndex={0}
             data-drill={v} title={`Open ${v} detail`}
             style={{ gridColumn: ci + 1, gridRow: 1 }}
             onClick={() => onDrill(v)}
             onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrill(v) } }}>
          <VendorLogo logo={byName[v]?.logo ?? 'generic'} />
          <div className="vname">{v}</div>
          <span className={`vtier ${byName[v]?.tier ?? ''}`}>{byName[v]?.tier}</span>
        </div>
      ))}

      {designations && vendors.map((v, ci) => {
        const picked = st.designation[v] ?? null
        return (
          <div key={`desig-${v}`} className="vdesig" style={{ gridColumn: ci + 1, gridRow: 2 }}>
            <button type="button" data-desig={`${v}|all`}
                    className={`dtab${picked === null ? ' on' : ''}`}
                    onClick={() => onDesignation(v, null)}>All</button>
            {dimensionRows(v, 'designation').map(r => (
              <button key={r.name} type="button" data-desig={`${v}|${r.name}`}
                      className={`dtab${picked === r.name ? ' on' : ''}`}
                      title={`${r.name}: ${r.count} people`}
                      onClick={() => onDesignation(v, picked === r.name ? null : r.name)}>
                {r.name}
              </button>
            ))}
          </div>
        )
      })}

      {keys.map((k, ri) =>
        vendors.map((v, ci) => {
          const def = METRICS[k]
          const ctx = buildContext(v, vendors, st,
            { dimension: st.dimension, designation: st.designation })
          const view = def?.card ? def.card(ctx) : null
          return (
            <MetricSection
              key={`${k}-${v}`}
              id={k}
              view={view}
              aside={def?.aside ? def.aside(ctx) : null}
              suffix={suffix}
              width={chartW}
              style={{ gridColumn: ci + 1, gridRow: ri + firstMetricRow }}
            />
          )
        }),
      )}
    </section>
  )
}
