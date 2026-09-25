import { AreaChart } from './charts/AreaChart.tsx'
import { ColumnChart } from './charts/ColumnChart.tsx'
import { Badge, DeltaChip, NoData } from './Badge.tsx'
import { Donut, DonutParts } from './Icons.tsx'
import { InfoTip, metricLabel } from './InfoTip.tsx'
import { useState } from 'react'
import type { MetricView, RiskChipsView, Segment, StatRow } from '../metrics/types.ts'

/** The key-value block shared by Leakage Breakdown, Overtime Integrity and
 *  Partner Efficiency. A row can carry a second line under its value, for the
 *  money behind a figure in hours. */
function StatRows({ rows }: { rows: StatRow[] }) {
  return (
    <div className="kv">
      {rows.map(r => (
        <div key={r.label} className={r.strong ? 'kvstrong' : undefined}>
          <span className={r.tipId ? 'kvlabel' : undefined}>
            {r.label}{r.tipId ? <> <InfoTip id={r.tipId} scope="card" /></> : null}
          </span>
          <b className={r.tone === 'bad' ? 'bad' : undefined}>
            {r.value}
            {r.sub && <i className="kvsub">{r.sub}</i>}
          </b>
        </div>
      ))}
    </div>
  )
}

/** A stacked horizontal bar and its legend.
 *
 *  This is the shape that replaced the long label-value lists on Partner
 *  Efficiency and Leakage Breakdown: seven rows of numbers made the two tallest
 *  cards on the page, and a reader took the same split out of them in three
 *  looks rather than one. The bar is the same progress-bar idiom the location
 *  rows already use, segmented; the legend carries the numbers for anyone who
 *  wants them. A segment marked `rest` is the part that is not the story, drawn
 *  as a track and left out of the legend. */
function StackBar({ segments, foot }: { segments: Segment[]; foot?: StatRow[] }) {
  const shown = segments.filter(s => !s.rest)
  return (
    <>
      <div className="stack">
        {segments.map(s => (
          <i key={s.label} className={s.rest ? 'rest' : undefined}
             style={{ width: `${Math.max(0, Math.min(100, s.share))}%`, background: s.color }}
             title={`${s.label} ${s.value}`} />
        ))}
      </div>
      <div className="stacklg">
        {shown.map(s => (
          <div className="slg" key={s.label}>
            <i className="sw" style={{ background: s.color }} />
            <span>{s.label}</span>
            <b>{s.value}</b>
            {s.sub && <em>{s.sub}</em>}
          </div>
        ))}
        {foot?.map(r => (
          <div className={`slg foot${r.strong ? ' strong' : ''}`} key={r.label}>
            <span>{r.label}</span>
            <b className={r.tone === 'bad' ? 'bad' : undefined}>{r.value}</b>
            {r.sub && <em>{r.sub}</em>}
          </div>
        ))}
      </div>
    </>
  )
}

/** Project risk, one row per vendor, projects as chips.
 *
 *  A chip that has a reason is a button: tapping it opens the reason under the
 *  row and tapping again closes it, so the detail is one tap away instead of
 *  six paragraphs down the page. */
function RiskChips({ rows }: { rows: RiskChipsView['rows'] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="rchips">
      {rows.map(r => {
        const shown = r.chips.find(c => `${r.vendor}|${c.name}` === open)
        return (
          <div className="rcrow" key={r.vendor}>
            <div className="rcline">
              <span className="rcv">{r.vendor}</span>
              <span className={`rccount${r.atRisk ? ' bad' : ''}`}>
                {r.atRisk} of {r.total} at risk
              </span>
              <div className="rcchips">
                {r.chips.map(c => {
                  const key = `${r.vendor}|${c.name}`
                  const cls = `badge ${c.tone === 'bad' ? 'critical' : 'healthy'}`
                  return c.note ? (
                    <button type="button" key={c.name} className={`${cls} rcchip`}
                            aria-expanded={open === key} data-chip={key}
                            onClick={() => setOpen(open === key ? null : key)}>
                      <i className="dot" />{c.name}
                    </button>
                  ) : (
                    <span key={c.name} className={`${cls} rcchip flat`}>
                      <i className="dot" />{c.name}
                    </span>
                  )
                })}
              </div>
            </div>
            {shown && <p className="rcnote">{shown.name}: {shown.note}</p>}
          </div>
        )
      })}
    </div>
  )
}

/* One metric on one vendor card.
 *
 * Each branch below matches a view `kind` from src/metrics/types.ts. To add a
 * new visual shape: add the interface there, add the branch here, and return
 * it from a metric in src/metrics/registry.ts. Reusing an existing kind needs
 * no change to this file at all. */

export function MetricSection({ id, view, aside, suffix, width, style, bare }: {
  id: string
  view: MetricView | null
  aside?: string | null
  suffix?: string
  width: number
  style?: React.CSSProperties
  /** rendered inside a band, which supplies its own heading */
  bare?: boolean
}) {
  if (bare) {
    return view ? <Body id={id} view={view} suffix={suffix} width={width} /> : <NoData />
  }
  return (
    <div className="sect" style={style}>
      <div className="sect-t">
        <h3>{metricLabel(id)} <InfoTip id={id} scope="card" /></h3>
        {aside && <div className="aside">{aside}</div>}
      </div>
      {view ? <Body id={id} view={view} suffix={suffix} width={width} /> : <NoData />}
    </div>
  )
}

const captionFor = (labels: string[]): string => {
  const l = String(labels[0] ?? '')
  if (/^W\d+/.test(l)) return 'Week'
  if (/^\d{1,2} [A-Za-z]{3}$/.test(l)) return 'Day'
  return 'Month'
}

function Body({ id, view, suffix, width }: {
  id: string; view: MetricView; suffix?: string; width: number
}) {
  switch (view.kind) {
    case 'score':
      return (
        <>
          <div className="scorerow">
            <div className={`bignum ${view.tone}`}>{view.value}<span className="of100">/100</span></div>
            <div className="scoremeta">
              <Badge badge={view.badge} />
              <DeltaChip delta={view.delta} suffix={suffix} trend />
            </div>
          </div>
          <div className="trendhead">
            <div className="lt">{metricLabel('vendorScoreTrend')}</div>
            <div className="rt">{view.range}</div>
          </div>
          {view.data.length
            ? <AreaChart data={view.data} labels={view.labels} max={view.max}
                         seriesName={metricLabel(id)} width={width} />
            : <NoData />}
        </>
      )

    case 'ratioBar':
      return (
        <>
          <div className="metaline">
            <span>{view.support}</span>
            <b style={{ fontWeight: 400 }}>{view.pct}</b>
          </div>
          <div className="bar"><i style={{ width: `${view.fill}%` }} /></div>
        </>
      )

    case 'twoSeries':
      return (
        <>
          <div className="pctwrap">
            <div className="bignum k" style={{ fontSize: 36 }}>{view.pct}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="lg"><b>{view.a}</b></div>
              <div className="lg"><i className="sw" style={{ background: view.aDot }} />{view.aLabel}</div>
              <div className="lg"><b>{view.b}</b></div>
              <div className="lg"><i className="sw" style={{ background: view.bDot }} />{view.bLabel}</div>
            </div>
          </div>
          <DeltaChip delta={view.delta} suffix={suffix} style={{ marginTop: 10 }} />
          <ColumnChart
            series={[{ data: view.s1, color: view.c1, name: view.n1 },
                     { data: view.s2, color: view.c2, name: view.n2 }]}
            labels={view.labels} unit="count" width={width} caption={captionFor(view.labels)}
          />
        </>
      )

    case 'hoursPair':
      return (
        <>
          <div className="kv">
            {view.rows.map(r => (
              <div key={r.label}>
                <span className={r.tipId ? 'kvlabel' : undefined}>
                  {r.label}{r.tipId ? <> <InfoTip id={r.tipId} scope="card" /></> : null}
                </span>
                <b>{r.value}</b>
              </div>
            ))}
          </div>
          <div className="legend" style={{ justifyContent: 'flex-end' }}>
            <div className="lg"><i className="sw" style={{ background: view.c1 }} />{view.n1}</div>
            <div className="lg"><i className="sw" style={{ background: view.c2 }} />{view.n2}</div>
          </div>
          <ColumnChart
            series={[{ data: view.s1, color: view.c1, name: view.n1 },
                     { data: view.s2, color: view.c2, name: view.n2 }]}
            labels={view.labels} kind="k" unit={view.unit} width={width}
            caption={captionFor(view.labels)}
          />
        </>
      )

    case 'kvArea':
      return (
        <>
          <div className="kv">
            {view.rows.map(r => <div key={r.label}><span>{r.label}</span><b>{r.value}</b></div>)}
          </div>
          <AreaChart data={view.data} labels={view.labels} color={view.color}
                     kind={view.unit === 'pct' ? 'pct' : 'k'} unit={view.unit}
                     seriesName={metricLabel(id)} width={width} />
        </>
      )

    case 'moneyArea':
      return (
        <>
          <div className={`money${view.tone === 'loss' ? ' k' : ''}`}>{view.headline}</div>
          <div className="trendhead"><div className="lt">{view.trendLabel}</div></div>
          <AreaChart data={view.data} labels={view.labels} color={view.color}
                     kind="k" unit="money" seriesName={metricLabel(id)} width={width} />
        </>
      )

    case 'statBars':
      return (
        <>
          <div className="scorerow statrow">
            <div className="bignum k" style={{ fontSize: 36 }}>{view.pct}</div>
            <div className="statcap">{view.caption}</div>
            {/* badge and delta travel together, so the row breaks in the same
                place on every card instead of wherever the words happen to end */}
            <div className="statmeta">
              {view.badge && <Badge badge={view.badge} />}
              <DeltaChip delta={view.delta} suffix={suffix} trend />
            </div>
          </div>
          <StatRows rows={view.rows} />
          <ColumnChart series={[{ data: view.data, color: view.color, name: metricLabel(id) }]}
                       labels={view.labels} kind="pct" unit="pct" width={width}
                       caption={captionFor(view.labels)} />
        </>
      )

    case 'stackBar':
      return (
        <>
          <div className="scorerow statrow">
            <div className="bignum k" style={{ fontSize: 36 }}>{view.pct}</div>
            <div className="statcap">{view.caption}</div>
            <div className="statmeta">
              {view.badge && <Badge badge={view.badge} />}
              <DeltaChip delta={view.delta} suffix={suffix} trend />
            </div>
          </div>
          <StackBar segments={view.segments} foot={view.rows} />
          <ColumnChart series={[{ data: view.data, color: view.color, name: metricLabel(id) }]}
                       labels={view.labels} kind="pct" unit="pct" width={width}
                       caption={captionFor(view.labels)} />
        </>
      )

    case 'partner':
      return (
        <>
          <div className="pepair">
            {view.pairs.map(p => (
              <div key={p.label}>
                <span className="kvlabel">
                  {p.label}{p.tipId ? <> <InfoTip id={p.tipId} scope="card" /></> : null}
                </span>
                <b className={p.tone === 'bad' ? 'bad' : undefined}>{p.value}</b>
              </div>
            ))}
          </div>
          <StackBar segments={view.segments} foot={view.rows} />
          <div className="trendhead"><div className="lt">{view.trendLabel}</div></div>
          <AreaChart data={view.data} labels={view.labels} color={view.color}
                     kind="k" unit="money" seriesName={metricLabel(id)} />
        </>
      )

    case 'burn':
      return (
        <>
          <div className="scorerow statrow">
            <div className="bignum k" style={{ fontSize: 36 }}>{view.pct}</div>
            <div className="statcap">of the contract consumed</div>
          </div>
          {/* two bars on one scale. Longer budget bar than term bar is money
              going out faster than the calendar, and it needs no mark, no key
              and no sentence to say so. */}
          <div className="burnpair">
            <div className="burnrow">
              <span>Budget spent</span>
              <div className={`bar${view.early ? ' over' : ''}`}>
                <i style={{ width: `${view.fill}%` }} />
              </div>
              <b>{Math.round(view.fill)}%</b>
            </div>
            <div className="burnrow">
              <span>Contract term</span>
              <div className="bar term"><i style={{ width: `${view.elapsed}%` }} /></div>
              <b>{Math.round(view.elapsed)}%</b>
            </div>
          </div>
          <StatRows rows={view.rows} />
        </>
      )

    case 'concentration':
      return (
        <>
          <div className="concrow">
            <DonutParts parts={view.rows.map(r => ({ name: r.name, share: r.share, color: r.color }))} />
            <div className="concside">
              <div className="scorerow statrow">
                <div className="bignum k" style={{ fontSize: 36 }}>{view.pct}</div>
                <div className="statcap">{view.caption}</div>
                {view.badge && <Badge badge={view.badge} />}
              </div>
              <div className="legend band-legend">
                {view.rows.map(r => (
                  <div className="lg" key={r.name}>
                    <i className="sw" style={{ background: r.color }} />
                    {r.name} <b>{Math.round(r.share)}%</b> <em className="lgsub">{r.value}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {view.note && <p className="band-insight">{view.note}</p>}
        </>
      )

    case 'riskChips':
      return <RiskChips rows={view.rows} />

    case 'riskList':
      return (
        <div className="risklist">
          {view.rows.map(r => (
            <div className={`riskitem ${r.tone}`} key={r.title}>
              <div className="ri-top">
                <span className="ri-title">{r.title}</span>
                <span className="ri-meta">{r.meta}</span>
                <span className={`badge ${r.tone === 'bad' ? 'critical' : 'healthy'}`}>
                  <i className="dot" />{r.tone === 'bad' ? 'At risk' : 'On track'}
                </span>
              </div>
              {r.note && <p className="ri-note">{r.note}</p>}
            </div>
          ))}
        </div>
      )

    case 'groupedBars':
      return (
        <ColumnChart
          layout="grouped"
          series={view.series.map(sr => ({ data: sr.data, color: sr.color, name: sr.name }))}
          labels={view.categories} kind="pct" unit="pct" max={100} width={width}
        />
      )

    case 'donut':
      return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
            <Donut pct={view.productive} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="lg"><i className="sw" style={{ background: 'var(--blue-alt)' }} />
                Productive <b style={{ marginLeft: 8 }}>{view.productive}%</b></div>
              <div className="lg"><i className="sw" style={{ background: 'var(--blue-pale)' }} />
                Non-Productive <b style={{ marginLeft: 8 }}>{view.nonProductive}%</b></div>
            </div>
          </div>
          <ColumnChart
            series={[{ data: view.s1, color: 'var(--blue-alt)', name: 'Productive' },
                     { data: view.s2, color: 'var(--blue-pale)', name: 'Non-Productive' }]}
            labels={view.labels} kind="pct" unit="pct" max={100} width={width}
            caption={captionFor(view.labels)}
          />
        </>
      )

    case 'sites':
      return (
        <>
          <div className="kv">
            <div><span>{view.scope}</span><b>{view.pct}</b></div>
          </div>
          <ColumnChart series={[{ data: view.data, color: 'var(--blue-alt)', name: metricLabel(id) }]}
                       labels={view.labels} kind="pct" unit="pct" width={width}
                       caption={captionFor(view.labels)} />
          {view.sites.map(s => (
            <div className={`rolerow${s.high ? ' hi' : ''}`} key={s.name}>
              <div className="rl">
                <span>{s.name} <i className="rate">${s.usd}/hr</i></span>
                <span>{s.util}%</span>
              </div>
              <div className="bar"><i style={{ width: `${Math.min(100, s.util)}%` }} /></div>
            </div>
          ))}
        </>
      )

    case 'roles':
      return (
        <>
          {view.rows.map(r => (
            <div className="rolerow" key={r.title}>
              <div className="rl"><span>{r.title}: <b>{r.count}</b></span><span>{r.pct}%</span></div>
              <div className="bar"><i style={{ width: `${r.pct}%` }} /></div>
            </div>
          ))}
        </>
      )

    case 'kpi':
      return <div className="bignum k">{view.value}</div>
  }
}
