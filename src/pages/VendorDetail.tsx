import copy from '../../config/copy.json' with { type: 'json' }
import { DETAIL_CFG, defaultDetailState, useStore } from '../state/store.tsx'
import { byName } from '../engine/dataset.ts'
import { METRICS, HERO_SPARK } from '../metrics/registry.ts'
import { buildContext } from '../metrics/context.ts'
import { heroSpark } from '../metrics/spark.ts'
import * as F from '../engine/formulas.ts'
import { pct, trimN, usd, hrs, signed } from '../engine/format.ts'
import { AreaChart } from '../components/charts/AreaChart.tsx'
import { ColumnChart } from '../components/charts/ColumnChart.tsx'
import { Sparkline } from '../components/charts/Sparkline.tsx'
import { Badge, DeltaChip, NoData } from '../components/Badge.tsx'
import { BackArrow, VendorLogo } from '../components/Icons.tsx'
import { InfoTip, metricLabel } from '../components/InfoTip.tsx'
import { DatePicker } from '../components/filters/DatePicker.tsx'
import { MultiSelect } from '../components/filters/MultiSelect.tsx'
import type { DetailState } from '../state/types.ts'
import type { Period } from '../engine/types.ts'

const PERIODS = copy.ui.periods as Period[]

export function VendorDetail({ vendor }: { vendor: string }) {
  const { s, d, detailState } = useStore()
  const st = detailState(vendor)
  const cfg = byName[vendor]
  const patch = (p: Partial<DetailState>) => d({ t: 'detail', vendor, patch: p })
  const setPop = (id: string | null, seed?: string[]) =>
    d({ t: 'set', patch: { openPop: id, staged: id && seed ? { ...s.staged, [id]: seed } : s.staged } })
  const commitLoc = (next: string[]) => {
    patch({ locations: next.length ? next : sites })
    setPop(null)
  }
  const ctx = buildContext(vendor, [vendor], st)
  const dbase = defaultDetailState(vendor)
  const atDetailDefaults =
    st.period === dbase.period && st.year === dbase.year && st.quarter === dbase.quarter &&
    st.month === dbase.month && st.rangeA === dbase.rangeA && st.rangeB === dbase.rangeB &&
    st.locations.length === dbase.locations.length
  const stagedLoc = s.staged.dloc ?? st.locations
  const locPending = s.openPop === 'dloc' &&
    !(stagedLoc.length === st.locations.length && stagedLoc.every(v => st.locations.includes(v)))
  const suffix = copy.ui.periodSuffix[st.period]

  const score = METRICS.vendorScore.card!(ctx)
  const sites = cfg?.sites.map(x => x.name) ?? []
  const locLabel = st.locations.length === sites.length && sites.length > 1
    ? copy.ui.allLocations
    : st.locations.length ? st.locations.join(', ') : copy.ui.selectLocation

  const billable = METRICS.billablePortfolioCost.card!(ctx)
  const idle = METRICS.idleCost.card!(ctx)
  const sla = METRICS.slaCompliance.card!(ctx)
  const eu = METRICS.effectiveUtilization.card!(ctx)

  return (
    <>
      <div className="phead">
        <button type="button" className="back" data-act="back" aria-label="Back"
                onClick={() => d({ t: 'set', patch: { detailVendor: null } })}>
          <BackArrow />
        </button>
        <div>
          <h1>{vendor}</h1>
          <p className="psub">{DETAIL_CFG.subtitle}</p>
        </div>
      </div>

      <section className="card filters">
        <div className="frow">
          <div className="flabel">Filters</div>
          <div className="seg" id="segDetail">
            {PERIODS.map(p => (
              <button key={p} type="button" data-dperiod={p} className={st.period === p ? 'on' : ''}
                      onClick={() => patch({ period: p })}>{p}</button>
            ))}
          </div>
          <DatePicker st={st} patch={p => patch(p as Partial<DetailState>)}
                      open={s.openPop === 'date'} onToggle={setPop} />
          <MultiSelect id="dloc" testId="dloc-trigger" label={locLabel}
                       options={sites.map(x => ({ value: x, label: x }))}
                       applied={st.locations}
                       staged={s.staged.dloc ?? st.locations}
                       onStage={next => d({ t: 'set', patch: { staged: { ...s.staged, dloc: next } } })}
                       onCommit={commitLoc}
                       showSelectAll={sites.length > 1}
                       open={s.openPop === 'dloc'}
                       onToggle={id => setPop(id, st.locations)} />
          <div className="spacer">
            <button type="button" className="btn ghost" data-act="dreset" data-keep-pop
                    disabled={atDetailDefaults}
                    title={atDetailDefaults ? 'Already at the default filters' : 'Restore the default filters'}
                    onClick={() => d({ t: 'resetDetail', vendor })}>Reset</button>
            <button type="button" className="btn primary" data-act="dapply" data-keep-pop
                    disabled={!locPending}
                    title={locPending ? 'Apply the staged location selection' : 'Nothing staged to apply'}
                    onClick={() => commitLoc(s.staged.dloc ?? st.locations)}>
              Apply
            </button>
          </div>
        </div>
      </section>

      <section className="dgrid-top">
        <div className="card dscore">
          <div className="logorow">
            <VendorLogo logo={cfg?.logo ?? 'generic'} />
            <span>{vendor}</span>
          </div>
          <div className="dbox">
            <div className="sect-t">
              <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>
                {metricLabel('vendorScore')} <InfoTip id="vendorScore" scope="detail" />
              </h3>
            </div>
            {score && score.kind === 'score' ? (
              <>
                <div className={`bignum ${score.tone}`} style={{ marginTop: 12 }}>
                  {score.value}<span className="of100">/100</span>
                </div>
                <div style={{ marginTop: 12 }}><Badge badge={score.badge} /></div>
                <DeltaChip delta={score.delta} suffix={suffix} trend style={{ marginTop: 10 }} />
              </>
            ) : <NoData />}
          </div>
        </div>

        <div className="card dtrend">
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-strong)' }}>
            {metricLabel('vendorScoreTrend')} <InfoTip id="vendorScoreTrend" scope="detail" />
          </h3>
          {score && score.kind === 'score' && score.data.length ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-strong)', marginTop: 12 }}>{score.range}</div>
              <AreaChart data={score.data} labels={score.labels} max={score.max}
                         seriesName={metricLabel('vendorScore')} width={920} />
            </>
          ) : <NoData />}
        </div>
      </section>

      <section className="dkpis">
        {DETAIL_CFG.kpis.map(id => {
          const def = METRICS[id]
          const view = def?.hero ? def.hero(ctx) : null
          const sparkCfg = HERO_SPARK[id]
          const spark = sparkCfg ? heroSpark(st, sparkCfg.kind, [vendor]) : null
          return (
            <div className="card dkpi" key={id}>
              <div className="t">{metricLabel(id)} <InfoTip id={id} scope="detail" /></div>
              <div className="b">
                <div className="v">{view?.value ?? '0'}</div>
                {spark && <Sparkline labels={spark.labels} values={spark.values}
                                     color={sparkCfg.color} name={metricLabel(id)} />}
              </div>
              <DeltaChip delta={view?.delta ?? null} suffix={suffix} />
            </div>
          )
        })}
      </section>

      <section className="dhalf">
        <div className="card dpanel">
          <h3>{metricLabel('billableCostTrend')} <InfoTip id="billableCostTrend" scope="detail" /></h3>
          {billable && billable.kind === 'moneyArea' && billable.data.some(x => x > 0) ? (
            <>
              <div className="money">{billable.headline}</div>
              <div className="trendhead"><div className="lt">{metricLabel('billableCostTrend')}</div></div>
              <AreaChart data={billable.data} labels={billable.labels} color={billable.color}
                         kind="k" unit="money" seriesName={metricLabel('billablePortfolioCost')} width={640} />
            </>
          ) : <NoData />}
        </div>

        <div className="card dpanel">
          <h3>{metricLabel('idleCost')} <InfoTip id="idleCost" scope="detail" /></h3>
          {idle && idle.kind === 'kvArea' && idle.data.some(x => x > 0) ? (
            <>
              <div className="kv">
                {idle.rows.map(x => <div key={x.label}><span>{x.label}</span><b>{x.value}</b></div>)}
              </div>
              <AreaChart data={idle.data} labels={idle.labels} color={idle.color}
                         kind="k" unit="money" seriesName={metricLabel('idleCost')} width={640} />
            </>
          ) : <NoData />}
        </div>
      </section>

      <section className="dhalf">
        <div className="card dpanel">
          <h3>{metricLabel('slaCompliance')} <InfoTip id="slaCompliance" scope="detail" /></h3>
          {sla && sla.kind === 'twoSeries' ? (
            <>
              <div className="pctwrap">
                <div className="bignum k" style={{ fontSize: 36 }}>{sla.pct}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div className="lg"><b>{sla.a}</b></div>
                  <div className="lg"><i className="sw" style={{ background: sla.aDot }} />{sla.aLabel}</div>
                  <div className="lg"><b>{sla.b}</b></div>
                  <div className="lg"><i className="sw" style={{ background: sla.bDot }} />{sla.bLabel}</div>
                </div>
              </div>
              <DeltaChip delta={sla.delta} suffix={suffix} style={{ marginTop: 10 }} />
              <ColumnChart series={[
                { data: sla.s1, color: sla.c1, name: sla.n1 },
                { data: sla.s2, color: sla.c2, name: sla.n2 },
              ]} labels={sla.labels} unit="count" width={640} caption="Month" />
            </>
          ) : <NoData />}
        </div>

        <div className="card dpanel">
          <h3>{metricLabel('effectiveUtilization')} <InfoTip id="effectiveUtilization" scope="detail" /></h3>
          {eu && eu.kind === 'hoursPair' ? (
            <>
              <div className="kv">
                {eu.rows.map(r => (
                  <div key={r.label}>
                    <span className={r.tipId ? 'kvlabel' : undefined}>
                      {r.label}{r.tipId ? <> <InfoTip id={r.tipId} scope="card" /></> : null}
                    </span>
                    <b>{r.value}</b>
                  </div>
                ))}
              </div>
              <div className="legend" style={{ justifyContent: 'flex-end' }}>
                <div className="lg"><i className="sw" style={{ background: eu.c1 }} />{eu.n1}</div>
                <div className="lg"><i className="sw" style={{ background: eu.c2 }} />{eu.n2}</div>
              </div>
              <ColumnChart series={[
                { data: eu.s1, color: eu.c1, name: eu.n1 },
                { data: eu.s2, color: eu.c2, name: eu.n2 },
              ]} labels={eu.labels} kind="k" unit={eu.unit} width={640} caption="Month" />
            </>
          ) : <NoData />}
        </div>
      </section>
    </>
  )
}
