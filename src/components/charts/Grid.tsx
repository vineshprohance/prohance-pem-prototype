import { axisTicks, fmtTick, GEO, LABEL_FONT } from './primitives.ts'
import type { TickKind } from './primitives.ts'

export function Grid({ max, min = 0, kind, width, ticks }: {
  max: number; min?: number; kind: TickKind; width: number; ticks?: number
}) {
  const plotH = GEO.H - GEO.T - GEO.B
  return (
    <>
      {axisTicks(max, min, ticks).map((t, i) => {
        const y = GEO.H - GEO.B - ((t - min) / (max - min || 1)) * plotH
        return (
          <g key={i}>
            <line x1={GEO.L} y1={y} x2={width - GEO.R} y2={y} stroke="var(--grid)" strokeWidth={1} />
            <text x={GEO.L - 8} y={y + 3.8} textAnchor="end" fontSize={LABEL_FONT} fill="var(--muted)">
              {fmtTick(t, kind)}
            </text>
          </g>
        )
      })}
    </>
  )
}

/** X-axis labels.
 *
 *  `fit` decides between four states, from the real width rather than from a
 *  guess about label length: print them flat, cut them to their slot, tilt
 *  them, or tilt and drop every other one. The product prints flat because its
 *  charts are 761px wide for the same twelve categories; three vendor columns
 *  on one sheet are not, so the tilt has to be geometry, not a hardcoded rule.
 *  A label is only tilted when the tilt fits inside the axis margin, because a
 *  tilted label long enough to escape the margin escapes the card with it. */
export function XLabels({ labels, width, fit }: {
  labels: string[]; width: number; fit: LabelFit
}) {
  const plotW = width - GEO.L - GEO.R
  const step = plotW / Math.max(1, labels.length)
  return (
    <>
      {labels.map((l, i) => {
        if (i % fit.every !== 0 && i !== labels.length - 1) return null
        const x = GEO.L + step * (i + 0.5)
        const y = GEO.H - GEO.B + (fit.rotate ? 14 : 16)
        const short = cutLabel(String(l), fit.maxChars)
        return fit.rotate ? (
          <text key={i} x={x} y={y} transform={`rotate(-38 ${x} ${y})`} textAnchor="end"
                fontSize={LABEL_FONT} fill="var(--muted)">{short}</text>
        ) : (
          <text key={i} x={x} y={y} textAnchor="middle" fontSize={LABEL_FONT} fill="var(--muted)">
            {short}{short !== l && <title>{l}</title>}
          </text>
        )
      })}
    </>
  )
}

export interface LabelFit {
  rotate: boolean
  every: number
  /** characters a flat label may keep before it is cut short. Infinity when
   *  nothing needs cutting. */
  maxChars: number
}

/** Will these labels fit side by side at this width, and if not, what then?
 *  Character width is measured in ems of the label font, which is close enough
 *  for a tabular sans and needs no canvas. */
export function labelFit(width: number, labels: string[], count = labels.length): LabelFit {
  const n = Math.max(1, count)
  const slot = (width - GEO.L - GEO.R) / n
  const charW = LABEL_FONT * 0.56
  const longest = labels.reduce((a, l) => Math.max(a, String(l).length), 0)
  const need = longest * charW + 6
  if (need <= slot) return { rotate: false, every: 1, maxChars: Infinity }

  /* A tilted label reaches down the page by its own length times sin(38°), and
   * the axis only has GEO.B of room. A project name is 27 characters, reaches
   * about 95px, and hung 45px below the card, which is what the product owner
   * caught on 25 Sep. So tilt only what fits the margin; anything longer stays
   * flat and gets cut to its slot, with the full text on hover. */
  const reach = longest * charW * Math.sin((38 * Math.PI) / 180)
  const roomBelowAxis = GEO.B - 6
  if (reach <= roomBelowAxis) {
    const tilted = LABEL_FONT + 3
    if (tilted <= slot) return { rotate: true, every: 1, maxChars: Infinity }
    return { rotate: true, every: Math.ceil(tilted / slot), maxChars: Infinity }
  }
  return { rotate: false, every: 1, maxChars: Math.max(4, Math.floor((slot - 8) / charW)) }
}

/** Cut a label to the characters its slot can hold. */
export const cutLabel = (s: string, maxChars: number): string =>
  s.length <= maxChars ? s : `${s.slice(0, Math.max(1, maxChars - 1)).trimEnd()}\u2026`
