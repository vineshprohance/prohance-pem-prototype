/** Every icon and vendor mark in one file, so a rebrand is a single edit.
 *  Vendor logos are keyed by the `logo` field in config/vendors.json. */

export const InfoIcon = () => (
  <svg className="info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export const ArrowUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
    <line x1="12" y1="20" x2="12" y2="5" /><polyline points="5 11 12 4 19 11" />
  </svg>
)
export const ArrowDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
    <line x1="12" y1="4" x2="12" y2="19" /><polyline points="5 13 12 20 19 13" />
  </svg>
)
export const TrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" />
  </svg>
)
export const TrendDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
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

/* rail footer, matching the shipped build's bottom block */
export const GridIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {[4, 10.5, 17].map(y => [4, 10.5, 17].map(x => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
    )))}
  </svg>
)
export const GearIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
)
export const HelpIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.4" />
    <path d="M4.9 4.9 9.6 9.6M14.4 14.4l4.7 4.7M19.1 4.9l-4.7 4.7M9.6 14.4l-4.7 4.7" />
  </svg>
)
export const SignOutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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
  /* The three vendors are invented. These marks are original abstract shapes
     drawn for them, not versions of any real company's logo. */
  adventure: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="Adventure Inc logo">
      <rect width="42" height="42" rx="4" fill="#fff" stroke="#E4E7EC" />
      <path d="M10.5 27.5 19 11.5l4.4 8.2" fill="none" stroke="#2F4B7C" strokeWidth={2.3}
            strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.6 27.5 26.6 18l4.9 9.5" fill="none" stroke="#E08A3C" strokeWidth={2.3}
            strokeLinecap="round" strokeLinejoin="round" />
      <text x="21" y="35.6" textAnchor="middle" fontFamily="Helvetica,Arial,sans-serif"
            fontSize="4.5" fontWeight="700" letterSpacing=".3" fill="#2F4B7C">ADVENTURE</text>
    </svg>
  ),
  cts: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="CTS Consulting logo">
      <rect width="42" height="42" rx="4" fill="#0F3D5C" />
      <rect x="10" y="21" width="4.4" height="9" rx="1.4" fill="#5FC2E8" />
      <rect x="18.8" y="16.2" width="4.4" height="13.8" rx="1.4" fill="#8FD8F0" />
      <rect x="27.6" y="11.6" width="4.4" height="18.4" rx="1.4" fill="#FFFFFF" />
      <text x="21" y="37" textAnchor="middle" fontFamily="Helvetica,Arial,sans-serif"
            fontSize="5.2" fontWeight="700" letterSpacing=".7" fill="#CFE9F5">CTS</text>
    </svg>
  ),
  infosystems: (
    <svg className="logo" viewBox="0 0 42 42" role="img" aria-label="InfoSystems logo">
      <rect width="42" height="42" rx="4" fill="#fff" stroke="#E4E7EC" />
      <circle cx="21" cy="19" r="7.4" fill="none" stroke="#2F7D5B" strokeWidth={1.5} />
      <circle cx="21" cy="11.6" r="2.4" fill="#2F7D5B" />
      <circle cx="28.4" cy="19" r="2.4" fill="#57A97F" />
      <circle cx="21" cy="26.4" r="2.4" fill="#2F7D5B" />
      <circle cx="13.6" cy="19" r="2.4" fill="#57A97F" />
      <text x="21" y="36.2" textAnchor="middle" fontFamily="Helvetica,Arial,sans-serif"
            fontSize="4.2" fontWeight="700" letterSpacing=".15" fill="#2F7D5B">INFOSYSTEMS</text>
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

/** The same ring, with a slice per vendor. Vendor Dependency Risk used a
 *  horizontal share bar, which reads as a progress bar rather than as a split
 *  of one whole. A ring says "this is all of the work, and this much of it sits
 *  with one vendor" in one look. */
export function DonutParts({ parts, size = 132 }: {
  parts: { name: string; share: number; color: string }[]; size?: number
}) {
  const r = 26
  const c = 2 * Math.PI * r
  let at = 0
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" role="img"
         aria-label={parts.map(p => `${p.name} ${Math.round(p.share)}%`).join(', ')}>
      {parts.map(p => {
        const on = (c * Math.max(0, p.share)) / 100
        const off = -(c * at) / 100
        at += p.share
        return (
          <circle key={p.name} cx="36" cy="36" r={r} fill="none" stroke={p.color} strokeWidth={15}
                  strokeDasharray={`${on.toFixed(2)} ${(c - on).toFixed(2)}`}
                  strokeDashoffset={off.toFixed(2)}
                  transform="rotate(-90 36 36)" className="donut-arc">
            <title>{`${p.name}: ${p.share.toFixed(1)}%`}</title>
          </circle>
        )
      })}
    </svg>
  )
}

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
