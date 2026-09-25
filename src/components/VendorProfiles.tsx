import { byName } from '../engine/dataset.ts'
import { METRICS } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { InfoTip, metricLabel } from './InfoTip.tsx'
import { VendorLogo } from './Icons.tsx'
import type { LensState } from '../state/types.ts'

/** Rows shown in the footer table. Any metric with a `profile` function can be
 *  listed here. */
const ROWS = ['capacityUtilization', 'slaCompliance', 'effectiveUtilization', 'totalHeadcount']

export function VendorProfiles({ vendors, st, onDrill }: {
  vendors: string[]; st: LensState; onDrill: (v: string) => void
}) {
  if (!vendors.length) return null
  return (
    <>
      <div className="vp-head">
        <h2>Vendor Profiles</h2>
        <p>Compare Vendor performance across efficiency, delivery, and scale.</p>
      </div>
      {vendors.map(v => {
        const ctx = buildContext(v, vendors, st)
        return (
          <div className="vprow" key={v}>
            <div className="vp-id" role="button" tabIndex={0} data-drill={v}
                 onClick={() => onDrill(v)}
                 onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDrill(v) } }}>
              <VendorLogo logo={byName[v]?.logo ?? 'generic'} />
              <span>{v}</span>
            </div>
            {ROWS.map(id => (
              <div className="vp-cell" key={id}>
                <small>{metricLabel(id)} <InfoTip id={id} scope="profile" /></small>
                <b>{METRICS[id]?.profile?.(ctx) ?? '0%'}</b>
              </div>
            ))}
            <div className="vp-go">
              <button type="button" data-drill={v} aria-label={`Open ${v} detail`} onClick={() => onDrill(v)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}
