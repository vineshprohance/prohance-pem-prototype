import { useEffect } from 'react'
import theme from '../config/theme.json' with { type: 'json' }
import './styles/app.css'
import { FitBar, useFitZoom } from './components/layout/FitBar.tsx'
import { Sidebar } from './components/layout/Sidebar.tsx'
import { LensPage } from './pages/LensPage.tsx'
import { VendorDetail } from './pages/VendorDetail.tsx'
import { useStore } from './state/store.tsx'

export function App() {
  const { s, d } = useStore()
  const zoom = useFitZoom()

  /* deep link: #/<lensId> or #/<lensId>/<vendor> */
  useEffect(() => {
    const apply = () => {
      const [lens, vendor] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/')
      if (lens) d({ t: 'set', patch: { lens, detailVendor: vendor || null } })
    }
    const h = location.hash
    if (h.length > 2) apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [d])

  useEffect(() => {
    const next = s.detailVendor ? `#/${s.lens}/${encodeURIComponent(s.detailVendor)}` : `#/${s.lens}`
    if (location.hash !== next) history.replaceState(null, '', next)
  }, [s.lens, s.detailVendor])

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="sheet" style={{ minWidth: theme.sheetMinWidth, zoom }}>
          {s.detailVendor
            ? <VendorDetail vendor={s.detailVendor} />
            : <LensPage lensId={s.lens} />}
        </div>

      </main>
      <FitBar />
    </div>
  )
}
