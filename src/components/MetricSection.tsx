import { AreaChart } from './charts/AreaChart.tsx'
import { ColumnChart } from './charts/ColumnChart.tsx'
import { Badge, DeltaChip, NoData } from './Badge.tsx'
import { Donut } from './Icons.tsx'
import { InfoTip, metricLabel } from './InfoTip.tsx'
import type { MetricView } from '../metrics/types.ts'

/* One metric on one vendor card.
 *
 * Each branch below matches a view `kind` from src/metrics/types.ts. To add a
 * new visual shape: add the interface there, add the branch here, and return
 * it from a metric in src/metrics/registry.ts. Reusing an existing kind needs
 * no change to this file at all. */

export function MetricSection({ id, view, aside, suffix, width, style }: {
  id: string
  view: MetricView | null
  aside?: string | null
  suffix?: string
  width: number
  style?: React.CSSProperties
}) {
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
          <div className="money">{view.headline}</div>
          <div className="trendhead"><div className="lt">{view.trendLabel}</div></div>
          <AreaChart data={view.data} labels={view.labels} color={view.color}
                     kind="k" unit="money" seriesName={metricLabel(id)} width={width} />
        </>
      )

    case 'leak':
      return (
        <>
          <div className="scorerow" style={{ alignItems: 'center' }}>
            <div className="bignum k" style={{ fontSize: 36 }}>{view.pct}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mid)' }}>effort leak</div>
            <Badge badge={view.badge} />
            <DeltaChip delta={view.delta} suffix={suffix} trend />
          </div>
          <div className="kv"><div><span>Non productive hours</span><b>{view.hours}</b></div></div>
          <ColumnChart series={[{ data: view.data, color: 'var(--blue-alt)', name: metricLabel(id) }]}
                       labels={view.labels} kind="pct" unit="pct" width={width}
                       caption={captionFor(view.labels)} />
        </>
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
            <div><span>High-rate resources utilization</span><b>{view.pct}</b></div>
          </div>
          <ColumnChart series={[{ data: view.data, color: 'var(--blue-alt)', name: metricLabel(id) }]}
                       labels={view.labels} kind="pct" unit="pct" width={width}
                       caption={captionFor(view.labels)} />
          {view.sites.map(([name, v]) => (
            <div className="rolerow" key={name}>
              <div className="rl"><span>{name}</span><span>{v}%</span></div>
              <div className="bar"><i style={{ width: `${Math.min(100, v)}%` }} /></div>
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

    case 'status':
      return (
        <div className="riskrow">
          <div className="riskbig">{view.level}</div>
          <div className="riskcond">
            {view.conds.map((c, i) => (
              <span key={i}>{i > 0 && <br />}{c}</span>
            ))}
          </div>
        </div>
      )

    case 'kpi':
      return <div className="bignum k">{view.value}</div>
  }
}
