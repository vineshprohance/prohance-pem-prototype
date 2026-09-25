import { useEffect, useState } from 'react'
import theme from '../../../config/theme.json' with { type: 'json' }
import { useStore } from '../../state/store.tsx'

/** "Fit width" scales the whole desktop sheet down so it fits a narrow panel
 *  without reflowing the dashboard. It never scales up, so anything at or above
 *  the sheet width renders at 100% with type at its real size: an iPad Air in
 *  landscape has 1116px of room against a 1100px sheet, so it stays at 1.
 *  "100%" gives you the true desktop size with horizontal scroll. */
export function useFitZoom(): number | undefined {
  const { s } = useStore()
  const [z, setZ] = useState<number | undefined>(undefined)

  useEffect(() => {
    const apply = () => {
      if (!s.fitWidth) { setZ(1); return }
      const main = document.querySelector('.main') as HTMLElement | null
      if (!main) return
      setZ(Math.min(1, Math.max(0.5, (main.clientWidth - 2) / theme.sheetMinWidth)))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [s.fitWidth])

  return z
}

/** Shown only when it has something to do: the sheet fits an iPad in landscape
 *  and any desktop at 100%, and a control floating over a demo that needs no
 *  adjusting reads as debug furniture. */
export function FitBar() {
  const { s, d } = useStore()
  const zoom = useFitZoom()
  const needed = !s.fitWidth || (zoom != null && zoom < 0.999)
  if (!needed) return null
  return (
    <div className="fitbar" id="fitBar">
      <span>View</span>
      <span className="seg2">
        <button type="button" data-fit="1" className={s.fitWidth ? 'on' : ''}
                onClick={() => d({ t: 'set', patch: { fitWidth: true } })}>Fit width</button>
        <button type="button" data-fit="0" className={!s.fitWidth ? 'on' : ''}
                onClick={() => d({ t: 'set', patch: { fitWidth: false } })}>100%</button>
      </span>
    </div>
  )
}
