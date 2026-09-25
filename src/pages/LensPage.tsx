import copy from '../../config/copy.json' with { type: 'json' }
import { FilterBar } from '../components/FilterBar.tsx'
import { RoleSwitcher } from '../components/layout/RoleSwitcher.tsx'
import { HeroStrip } from '../components/HeroStrip.tsx'
import { VendorGrid } from '../components/VendorGrid.tsx'
import { VendorProfiles } from '../components/VendorProfiles.tsx'
import { lensById, roleById, scopeVendors, useStore } from '../state/store.tsx'

/** One component renders every lens. Adding a page is a config edit, not a
 *  new file: append a block to config/lenses.json. */
export function LensPage({ lensId }: { lensId: string }) {
  const { s, d, lensState } = useStore()
  const cfg = lensById(lensId)
  const st = lensState(lensId)
  const role = roleById(s.role)
  const vendors = scopeVendors(st)
  const suffix = copy.ui.periodSuffix[st.period]
  const sections = cfg.sections.filter(m => !role.hideMetrics.includes(m))
  const hero = cfg.hero.filter(m => !role.hideMetrics.includes(m))
  const [before, risk, after] = cfg.subtitle.split(/[{}]/)

  return (
    <>
      <div className="phead">
        <div>
          <h1>{cfg.title}</h1>
          <p className="psub">{before}<b>{risk}</b>{after}</p>
        </div>
        <RoleSwitcher />
      </div>

      <HeroStrip metrics={hero} scope={vendors} st={st} suffix={suffix} />
      <FilterBar lensId={lensId} sections={sections} />
      <VendorGrid vendors={vendors} sections={sections} st={st} suffix={suffix}
                  onDrill={v => d({ t: 'set', patch: { detailVendor: v } })} />
      <VendorProfiles vendors={vendors} st={st}
                      onDrill={v => d({ t: 'set', patch: { detailVendor: v } })} />
    </>
  )
}
