import { useEffect, useState } from 'react'
import theme from '../../../config/theme.json' with { type: 'json' }
import { useStore } from '../../state/store.tsx'

/** "Fit width" scales the whole desktop sheet down so it fits a narrow panel
 *  without reflowing the dashboard, which is how the product looks at 1520px.
 *  "100%" gives you the true desktop size with horizontal scroll. */
export function useFitZoom(): number | undefined {
  const { s } = useStore()
  const [z, setZ] = useState<number | undefined>(undefined)

  useEffect(() => {
    const apply = () => {
      if (!s.fitWidth) { setZ(1); return }
      const main = document.querySelector('.main') as HTMLElement | null
      if (!main) return
      setZ(Math.min(1, Math.max(0.5, (main.clientWidth - 4) / (theme.sheetMinWidth + 40))))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [s.fitWidth])

  return z
}

export function FitBar() {
  const { s, d } = useStore()
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
