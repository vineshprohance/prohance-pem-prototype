import { useEffect } from 'react'
import copy from '../../config/copy.json' with { type: 'json' }
import theme from '../../config/theme.json' with { type: 'json' }
import { VENDORS, aggregate, aggregateMany, byName } from '../engine/dataset.ts'
import { bucketsFor, prevRange, rangeFor, sparkWeeks, weekLabel } from '../engine/ranges.ts'
import * as F from '../engine/formulas.ts'
import { fte as fteFmt, hrs, usd } from '../engine/format.ts'
import { VERTICALS, useStore } from '../state/store.tsx'
import { moneyDelta } from '../metrics/helpers.ts'
import { AreaChart } from './charts/AreaChart.tsx'
import { Sparkline } from './charts/Sparkline.tsx'
import { DeltaChip } from './Badge.tsx'
import { Chevron, VendorLogo } from './Icons.tsx'
import { InfoTip, metricLabel, metricTip } from './InfoTip.tsx'
import { DatePicker } from './filters/DatePicker.tsx'
import type { DateState, Period } from '../engine/types.ts'

const PERIODS = copy.ui.periods as Period[]

/** The Financial Impact drilldown.
 *
 *  A replica of the slide-out the shipped build opens from the chevron on its
 *  Financial Impact tile: the headline with its own trend, the three hour figures
 *  behind it, its own period selection independent of the page, then the
 *  breakup by vertical and by vendor.
 *
 *  It reads the vendor scope from whichever page opened it, so filtering the
 *  page to one vendor filters the panel too, but its period is its own, which
 *  is what the product does. */
export function CostLossPanel({ scope, onVendor }: {
  scope: string[]
  onVendor?: (v: string) => void
}) {
  const { s, d, costLossState } = useStore()
  const st = costLossState()
  const patch = (p: Partial<DateState>) => d({ t: 'costLoss', patch: p })
  const close = () => d({ t: 'set', patch: { costLossOpen: false, openPop: null } })

  useEffect(() => {
    if (!s.costLossOpen) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  })

  if (!s.costLossOpen) return null

  const r = rangeFor(st)
  const p = prevRange(st)
  const sum = (names: string[], a: number, b: number) =>
    names.reduce((t, n) => t + F.costLoss(aggregate(n, a, b), n), 0)

  const total = sum(scope, r.a, r.b)
  const prev = sum(scope, p.a, p.b)
  const totals = aggregateMany(scope, r.a, r.b)
  const fte = F.fteEquivalent(totals)

  const buckets = bucketsFor(st)
  const trend = buckets.map(b => +sum(scope, b.a, b.b).toFixed(2))

  const spark = sparkWeeks(st).map(w => ({ l: weekLabel(w), v: sum(scope, w.a, w.b) }))

  const byVertical = VERTICALS
    .map(v => ({
      id: v.id,
      name: v.name,
      value: sum(VENDORS.filter(x => x.vertical === v.id && scope.includes(x.name)).map(x => x.name), r.a, r.b),
    }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value)

  const byVendor = scope
    .map(v => ({ name: v, value: F.costLoss(aggregate(v, r.a, r.b), v) }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value)

  const share = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)
  const palette = theme.chart.vendorSeries

  return (
    <>
      <div className="drawer-veil" onClick={close} data-act="costLossVeil" />
      <aside className="drawer" role="dialog" aria-label={metricLabel('costAtRisk')}
             data-testid="cost-loss-panel">
        <div className="drawer-head">
          <div>
            <h2>{metricLabel('costAtRisk')}</h2>
            <p>{metricTip('costAtRisk', 'card')}</p>
          </div>
          <button type="button" className="drawer-x" aria-label="Close" data-act="costLossClose"
                  onClick={close}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          <section className="dl-card">
            <div className="dl-top">
              <div className="dl-label">{metricLabel('costAtRisk')} <InfoTip id="costAtRisk" scope="hero" /></div>
              <div className="dl-row">
                <div className="dl-val" data-testid="cost-loss-total">{usd(total)}</div>
                <Sparkline labels={spark.map(x => x.l)} values={spark.map(x => usd(x.v))}
                           color={theme.color.down} name={metricLabel('costAtRisk')} />
              </div>
              <DeltaChip delta={moneyDelta(total, prev, true)} suffix={copy.ui.periodSuffix[st.period]} />
            </div>
            <div className="kv">
              <div><span>Expected productive hours</span><b>{hrs(totals.expected)}</b></div>
              <div><span>{metricLabel('hoursNotDelivered')}</span><b>{hrs(F.hoursNotDelivered(totals))}</b></div>
              <div><span>{metricLabel('fteEquivalent')}</span><b>{fteFmt(fte)}</b></div>
            </div>
          </section>

          <div className="dl-filters">
            <div className="seg">
              {PERIODS.map(x => (
                <button key={x} type="button" data-dlperiod={x} className={st.period === x ? 'on' : ''}
                        onClick={() => patch({ period: x })}>{x}</button>
              ))}
            </div>
            <DatePicker st={st} patch={patch} open={s.openPop === 'dlDate'}
                        onToggle={id => d({ t: 'set', patch: { openPop: id } })} />
          </div>

          <h3 className="dl-h">{metricLabel('costAtRisk')} Trend</h3>
          <AreaChart data={trend} labels={buckets.map(b => b.label)} color={theme.color.down}
                     kind="k" unit="money" fill={false} seriesName={metricLabel('costAtRisk')}
                     width={340} />

          <h3 className="dl-h">Vertical wise Breakup</h3>
          <BreakupDonut slices={byVertical.map((v, i) => ({
            label: v.name, value: v.value, color: palette[i % palette.length],
          }))} total={total} />

          <h3 className="dl-h">Vendor wise Breakup</h3>
          <div className="dl-vendors">
            {byVendor.map(v => (
              <button key={v.name} type="button" className="dl-vendor" data-dlvendor={v.name}
                      onClick={() => { if (onVendor) { close(); onVendor(v.name) } }}>
                <VendorLogo logo={byName[v.name]?.logo ?? 'generic'} />
                <span className="dl-vname">{v.name}</span>
                <b>{usd(v.value)}</b>
                <i className="dl-pct">{share(v.value)}%</i>
                <Chevron />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

/** A two or three segment ring with the total in the middle, the way the
 *  product draws its vertical breakup. */
function BreakupDonut({ slices, total }: {
  slices: { label: string; value: number; color: string }[]
  total: number
}) {
  const R = 54
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="dl-donut">
      <div className="dl-ring">
        <svg viewBox="0 0 140 140" width="150" height="150" aria-hidden="true">
          {slices.map(s => {
            const frac = total > 0 ? s.value / total : 0
            const dash = C * frac
            const el = (
              <circle key={s.label} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth={22}
                      strokeDasharray={`${dash.toFixed(2)} ${(C - dash).toFixed(2)}`}
                      strokeDashoffset={(-C * acc).toFixed(2)}
                      transform="rotate(-90 70 70)" className="donut-arc" />
            )
            acc += frac
            return el
          })}
        </svg>
        <div className="dl-ring-mid">
          <b>{usd(total)}</b>
          <span>Total</span>
        </div>
      </div>
      <div className="dl-legend">
        {slices.map(s => (
          <div className="dl-leg" key={s.label}>
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <b>{usd(s.value)}</b>
            <em>({total > 0 ? Math.round((s.value / total) * 100) : 0}%)</em>
          </div>
        ))}
      </div>
    </div>
  )
}
