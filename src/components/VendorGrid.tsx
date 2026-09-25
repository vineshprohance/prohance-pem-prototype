import theme from '../../config/theme.json' with { type: 'json' }
import copy from '../../config/copy.json' with { type: 'json' }
import { byName } from '../engine/dataset.ts'
import { METRICS } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { MetricSection } from './MetricSection.tsx'
import { VendorLogo } from './Icons.tsx'
import type { LensState } from '../state/types.ts'

/** One CSS grid holding every vendor column, so metric sections row-align and
 *  all cards end up the same height. A full-height background cell per column
 *  paints the card behind the sections. */
export function VendorGrid({ vendors, sections, st, suffix, onDrill }: {
  vendors: string[]
  sections: string[]
  st: LensState
  suffix: string
  onDrill: (vendor: string) => void
}) {
  if (!vendors.length) {
    return <section className="card"><div className="nodata">{copy.ui.noData}</div></section>
  }

  const keys = sections.filter(k => st.applied.metric === 'All' || st.applied.metric === k)
  const n = vendors.length
  const colW = Math.round((theme.sheetMinWidth - 52 - 16 * (n - 1)) / n)
  const chartW = Math.max(320, colW - 32)
  const lastRow = keys.length + 2

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
        </div>
      ))}

      {keys.map((k, ri) =>
        vendors.map((v, ci) => {
          const def = METRICS[k]
          const ctx = buildContext(v, vendors, st)
          const view = def?.card ? def.card(ctx) : null
          return (
            <MetricSection
              key={`${k}-${v}`}
              id={k}
              view={view}
              aside={def?.aside ? def.aside(ctx) : null}
              suffix={suffix}
              width={chartW}
              style={{
                gridColumn: ci + 1,
                gridRow: ri + 2,
                ...(ri === 0 ? { borderTop: 0 } : {}),
              }}
            />
          )
        }),
      )}
    </section>
  )
}
