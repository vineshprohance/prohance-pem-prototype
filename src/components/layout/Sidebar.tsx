import { NAV_GROUPS, LENSES, lensById, roleById, useStore } from '../../state/store.tsx'
import { GearIcon, GridIcon, HelpIcon, NAV_ICONS, SignOutIcon } from '../Icons.tsx'

/** The bottom block of the rail, exactly as the shipped build carries it:
 *  four links and the signed-in user. They do nothing in the prototype, which
 *  is why they are marked aria-disabled rather than pretending to navigate. */
const FOOT = [
  { label: 'Instances', icon: <GridIcon /> },
  { label: 'Company Settings', icon: <GearIcon /> },
  { label: 'Help', icon: <HelpIcon /> },
  { label: 'Sign out', icon: <SignOutIcon />, out: true },
]

export function Sidebar() {
  const { s, d } = useStore()
  const role = roleById(s.role)
  const visible = LENSES.filter(l => role.lenses.includes(l.id))
  const groups = NAV_GROUPS.filter(g => visible.some(l => l.navGroup === g.id))
  const activeGroup = lensById(s.lens).navGroup

  const goto = (id: string) => d({ t: 'set', patch: { lens: id, detailVendor: null } })

  return (
    <aside className={`rail${s.navExpanded ? ' open' : ''}`}>
      <div className="rail-top">
        <div className="brand">PRO<span>HANCE</span></div>
        <button type="button" className="rail-toggle" aria-label="Toggle navigation"
                onClick={() => d({ t: 'set', patch: { navExpanded: !s.navExpanded } })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points={s.navExpanded ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
          </svg>
        </button>
      </div>

      <div className="rail-icons" id="railIcons">
        {groups.map(g => (
          <button key={g.id} type="button" className={`ricon ${activeGroup === g.id ? 'on' : ''}`}
                  title={g.label}
                  onClick={() => {
                    const first = visible.find(l => l.navGroup === g.id)
                    if (first) goto(first.id)
                    d({ t: 'set', patch: { navExpanded: true, openGroup: g.id } })
                  }}>
            {NAV_ICONS[g.icon] ?? NAV_ICONS.bars}
          </button>
        ))}
      </div>

      <nav className="nav" id="nav">
        {groups.map(g => (
          <div key={g.id}>
            <button type="button" className="nav-group" aria-expanded={s.openGroup === g.id}
                    onClick={() => d({ t: 'set', patch: { openGroup: s.openGroup === g.id ? null : g.id } })}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth={1.8}>
                <path d="M3 7a2 2 0 0 1 2-2h3.6l2 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              {g.label}
              <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {s.openGroup === g.id && (
              <div className="nav-kids">
                {visible.filter(l => l.navGroup === g.id).map(l => (
                  <button key={l.id} type="button"
                          className={`nav-item ${s.lens === l.id && !s.detailVendor ? 'on' : ''}`}
                          data-route={l.id} onClick={() => goto(l.id)}>
                    {l.navLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="rail-icons-foot">
        {FOOT.map(f => (
          <button key={f.label} type="button" className={`ricon${f.out ? ' out' : ''}`}
                  title={f.label} aria-label={f.label} aria-disabled="true">
            {f.icon}
          </button>
        ))}
        <div className="avatar" title="Product Manager" aria-label="Product Manager">PM</div>
      </div>

      <div className="rail-foot">
        {FOOT.map(f => (
          <button key={f.label} type="button" className={`fl${f.out ? ' out' : ''}`}
                  aria-disabled="true">
            {f.icon}{f.label}
          </button>
        ))}
        <div className="avatar-row">
          <div className="avatar" aria-hidden="true">PM</div>
          <div className="avatar-name">Product Manager</div>
        </div>
      </div>
    </aside>
  )
}
