import rolesCfg from '../../../config/roles.json' with { type: 'json' }
import { ROLES, roleById, useStore } from '../../state/store.tsx'

/** Role-based views. Each role has its own default lens, its own set of
 *  visible lenses and its own hidden metrics, all set in config/roles.json.
 *  Set "showSwitcher": false there to ship a single-role build. */
export function RoleSwitcher() {
  const { s, d } = useStore()
  if (!rolesCfg.showSwitcher) return null
  return (
    <div className="roleswitch">
      <label htmlFor="roleSel">View as</label>
      <select id="roleSel" data-testid="role-switcher" value={s.role}
              onChange={e => {
                const r = roleById(e.target.value)
                d({ t: 'set', patch: { role: r.id, lens: r.defaultLens, detailVendor: null } })
              }}>
        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
    </div>
  )
}
