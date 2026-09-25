/** Every icon and vendor mark in one file, so a rebrand is a single edit.
 *  Vendor logos are keyed by the `logo` field in config/vendors.json. */

export const InfoIcon = () => (
  <svg className="info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export const ArrowUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green-2)" strokeWidth={3} strokeLinecap="round">
    <line x1="12" y1="20" x2="12" y2="5" /><polyline points="5 11 12 4 19 11" />
  </svg>
)
export const ArrowDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth={3} strokeLinecap="round">
    <line x1="12" y1="4" x2="12" y2="19" /><polyline points="5 13 12 20 19 13" />
  </svg>
)
export const TrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-2)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" />
  </svg>
)
export const TrendDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 7 9 13 13 9 21 17" /><polyline points="15 17 21 17 21 11" />
  </svg>
)
export const Chevron = () => (
  <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
export const BackArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
export const DrillIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7" /><polyline points="9 7 17 7 17 15" />
  </svg>
)

export const NAV_ICONS: Record<string, JSX.Element> = {
  bars: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="11" width="4" height="9" rx="1" /><rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="17" rx="1" />
    </svg>
  ),
  pie: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
      <path d="M21 12a9 9 0 1 1-9-9v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" fill="currentColor" stroke="none" />
    </svg>
  ),
  db: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
}

const LOGOS: Record<string, JSX.Element> = {
  jamocha: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="PH Engineering logo">
      <rect width="42" height="42" rx="4" fill="#fff" stroke="#E4E7EC" />
      <g transform="translate(4,11)">
        <path d="M3 2c1.6-1.5 4-1.6 5.4.1 1-1.4 3.2-1.5 4.3-.2" fill="none" stroke="#C0872F" strokeWidth={1.6} strokeLinecap="round" />
        <text x="0" y="11" fontFamily="Georgia,serif" fontSize="8.2" fontWeight="700" fill="#7A4E1D">Ju</text>
        <text x="10.5" y="11" fontFamily="Georgia,serif" fontSize="8.2" fontWeight="700" fill="#C0872F">Mocha</text>
        <rect x="0" y="14" width="34" height="3.4" rx="1.2" fill="#F1E4CE" />
        <text x="1" y="16.8" fontFamily="Helvetica,Arial,sans-serif" fontSize="2.6" fill="#8A7047">ENGINEERING SERVICES</text>
      </g>
    </svg>
  ),
  prohance: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="PH Operations logo">
      <rect width="42" height="42" rx="4" fill="#fff" stroke="#E4E7EC" />
      <text x="21" y="23.5" textAnchor="middle" fontFamily="Helvetica,Arial,sans-serif" fontSize="6.1" fontWeight="700" letterSpacing=".2" fill="#0B7285">
        PRO<tspan fill="#12B5C9">HANCE</tspan>
      </text>
      <rect x="9" y="25.4" width="24" height="1.1" rx=".55" fill="#12B5C9" />
    </svg>
  ),
  ploceus: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="Ploceus logo">
      <rect x="6" y="3" width="30" height="36" rx="9" fill="#1F4C8F" />
      <path d="M27.5 9.5c-6.5 2.4-10.4 7.2-12 12.6l4.6-1.2-2.6 5.2 6.6-4.1-1.8 4.6c3.6-3.3 5.9-9.3 5.2-17.1z" fill="#F4C11E" />
      <path d="M15 21.5v11.5" stroke="#F4C11E" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  ),
  generic: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="Vendor logo">
      <rect width="42" height="42" rx="4" fill="#F2F4F7" stroke="#E4E7EC" />
      <circle cx="21" cy="21" r="9" fill="none" stroke="#98A2B3" strokeWidth={2} />
    </svg>
  ),
}

export const VendorLogo = ({ logo }: { logo: string }) => LOGOS[logo] ?? LOGOS.generic

export function Donut({ pct, a = 'var(--blue-alt)', b = 'var(--blue-pale)' }: {
  pct: number; a?: string; b?: string
}) {
  const r = 26
  const c = 2 * Math.PI * r
  const on = (c * pct) / 100
  return (
    <svg width="88" height="88" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke={b} strokeWidth={15} />
      <circle cx="36" cy="36" r={r} fill="none" stroke={a} strokeWidth={15}
              strokeDasharray={`${on.toFixed(1)} ${(c - on).toFixed(1)}`}
              transform="rotate(-90 36 36)" className="donut-arc" />
    </svg>
  )
}
