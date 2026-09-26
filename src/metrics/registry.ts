import { fte as fteFmt, hrs, pct, signed, signedFte, signedHrs, trimN, usd } from '../engine/format.ts'
import * as F from '../engine/formulas.ts'
import { byName } from '../engine/dataset.ts'
import { fmtDay } from '../engine/ranges.ts'
import copyCfg from '../../config/copy.json' with { type: 'json' }
import thresholds from '../../config/thresholds.json' with { type: 'json' }
import { C, CH, delta, moneyDelta, round2, scoreRange } from './helpers.ts'
import { niceMax } from '../components/charts/primitives.ts'
import type { Dimension } from '../engine/types.ts'
import type { MetricContext, MetricDef, MetricView } from './types.ts'

/* ==================================================================== *
 *  THE METRIC REGISTRY
 *
 *  One entry per metric. A lens in config/lenses.json refers to these ids
 *  in its `hero` and `sections` arrays; its label and tooltips come from
 *  config/copy.json under the same id.
 *
 *  To add a metric:
 *    1. add an entry here with `card` and/or `hero`
 *    2. add its label and tooltip to config/copy.json
 *    3. list its id in a lens in config/lenses.json
 *  No component changes are needed as long as the view `kind` you return
 *  is one MetricSection.tsx already renders.
 * ==================================================================== */

const NO = null

const COPY = copyCfg.metrics as Record<string, { label: string }>
const metricLabelSafe = (id: string): string => COPY[id]?.label ?? id

/** What Consolidation Levers can compare across. Skill Set and Project answer
 *  "who should I consolidate to"; Designation answers "am I paying for
 *  seniority I am not getting"; Location answers "where is it happening". */
export const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: 'skillSet', label: 'Skill Set' },
  { value: 'designation', label: 'Designation' },
  { value: 'project', label: 'Project' },
  { value: 'location', label: 'Location' },
]
const label = (id: string): string => COPY[id]?.label ?? id

/** The per-bucket score line, with empty buckets dropped the way the shipped
 *  build drops them rather than plotting a zero. */
function scoreSeries(ctx: MetricContext) {
  const live = ctx.bucketTotals
    .map((t, i) => ({ t, l: ctx.labels[i] }))
    .filter(x => x.t.days > 0 && x.t.expected > 0)
  return {
    data: live.map(x => F.vendorScore(x.t) ?? 0),
    labels: live.map(x => x.l),
  }
}

export const METRICS: Record<string, MetricDef> = {
  /* ---------------- Vendor Performance ---------------- */

  vendorScore: {
    id: 'vendorScore',
    scopes: ['card', 'detail'],
    card(ctx) {
      const sc = F.vendorScore(ctx.totals)
      if (sc == null) return NO
      const prev = F.vendorScore(ctx.prev)
      const [tone, badge] = F.scoreTone(sc)
      const s = scoreSeries(ctx)
      return {
        kind: 'score',
        value: trimN(sc),
        tone, badge,
        delta: delta(sc, prev, d => signed(d, '')),
        range: scoreRange(s.data),
        data: s.data,
        labels: s.labels,
        max: niceMax(Math.max(...s.data, 1)),
      }
    },
  },

  capacityUtilization: {
    id: 'capacityUtilization',
    scopes: ['hero', 'card', 'profile', 'detail'],
    card(ctx) {
      const cu = F.capacityUtilization(ctx.totals)
      if (cu == null) return NO
      return {
        kind: 'ratioBar',
        pct: pct(cu),
        fill: Math.min(100, cu),
        /* the two hours, not a sentence about them. On Cost Efficiency the
           same pair is already in Partner Efficiency directly above; on Vendor
           Performance this is the only place they appear. */
        support: `${hrs(ctx.totals.productive).replace(/ hrs$/, '')} of ${hrs(ctx.totals.expected)}`,
      }
    },
    hero(ctx) {
      const cu = F.capacityUtilization(ctx.totals)
      return {
        kind: 'kpi',
        value: pct(cu),
        delta: delta(cu, F.capacityUtilization(ctx.prev)),
        spark: { labels: [], values: [], color: C.up },
      }
    },
    profile: ctx => pct(F.capacityUtilization(ctx.totals)),
  },

  outputRate: {
    id: 'outputRate',
    scopes: ['card'],
    card(ctx) {
      const t = ctx.totals
      if (t.target <= 0) return NO
      const out = F.outputRate(t)
      return {
        kind: 'twoSeries',
        pct: pct(out),
        a: String(Math.round(t.target)), aLabel: 'tasks assigned', aDot: CH.seriesGrey,
        b: String(Math.round(t.completed)), bLabel: 'tasks completed', bDot: CH.seriesBlue,
        delta: delta(out, F.outputRate(ctx.prev)),
        labels: ctx.labels,
        s1: ctx.bucketTotals.map(x => Math.round(x.target)),
        s2: ctx.bucketTotals.map(x => Math.round(x.completed)),
        c1: CH.seriesGrey, c2: CH.seriesBlue,
        n1: 'tasks assigned', n2: 'tasks completed',
      }
    },
  },

  slaCompliance: {
    id: 'slaCompliance',
    scopes: ['hero', 'card', 'profile', 'detail'],
    card(ctx) {
      const t = ctx.totals
      if (t.completed <= 0) return NO
      const sla = F.slaCompliance(t)
      return {
        kind: 'twoSeries',
        pct: pct(sla),
        a: String(Math.round(t.onTime)), aLabel: 'On-time deliveries', aDot: CH.seriesBlue,
        b: String(Math.round(t.completed)), bLabel: 'Total deliveries', bDot: CH.seriesGrey,
        delta: delta(sla, F.slaCompliance(ctx.prev)),
        labels: ctx.labels,
        s1: ctx.bucketTotals.map(x => Math.round(x.completed)),
        s2: ctx.bucketTotals.map(x => Math.round(x.onTime)),
        c1: CH.seriesGrey, c2: CH.seriesBlue,
        n1: 'Total deliveries', n2: 'On-time deliveries',
      }
    },
    hero(ctx) {
      const sla = F.slaCompliance(ctx.totals)
      return { kind: 'kpi', value: pct(sla), delta: delta(sla, F.slaCompliance(ctx.prev)) }
    },
    profile: ctx => pct(F.slaCompliance(ctx.totals)),
  },

  headcountByRole: {
    id: 'headcountByRole',
    scopes: ['card'],
    card(ctx) {
      const cfg = ctx.cfg
      if (!cfg) return NO
      const total = cfg.designations.reduce((a, r) => a + r.count, 0)
      return {
        kind: 'roles',
        total: `${total} headcount`,
        rows: cfg.designations.map(r => ({
          title: r.name, count: r.count, pct: +((r.count / total) * 100).toFixed(2),
        })),
      }
    },
    aside: ctx =>
      ctx.cfg ? `${ctx.cfg.designations.reduce((a, r) => a + r.count, 0)} headcount` : null,
  },

  /* ---------------- Capacity & Utilization ---------------- */

  effectiveUtilization: {
    id: 'effectiveUtilization',
    scopes: ['hero', 'card', 'profile', 'detail'],
    card(ctx) {
      const t = ctx.totals
      if (t.logged <= 0) return NO
      return {
        kind: 'hoursPair',
        rows: [
          { label: 'Logged', value: hrs(t.logged) },
          { label: 'Productive', value: hrs(t.productive) },
          { label: 'Gap', value: pct(F.gapPct(t)), tipId: 'gap' },
        ],
        labels: ctx.labels,
        s1: ctx.bucketTotals.map(x => round2(x.logged)),
        s2: ctx.bucketTotals.map(x => round2(x.productive)),
        c1: CH.logged, c2: CH.productive,
        n1: 'Logged', n2: 'Productive',
        unit: t.logged >= 2000 ? 'khrs' : 'hrs',
      }
    },
    hero(ctx) {
      const eu = F.effectiveUtilization(ctx.totals)
      return { kind: 'kpi', value: pct(eu), delta: delta(eu, F.effectiveUtilization(ctx.prev)) }
    },
    profile: ctx => pct(F.effectiveUtilization(ctx.totals)),
  },

  idleCost: {
    id: 'idleCost',
    scopes: ['card', 'detail'],
    card(ctx) {
      const t = ctx.totals
      if (t.days <= 0 || t.idle <= 0) return NO
      const rate = ctx.cfg?.idleRate ?? 0
      const cost = t.idle * rate
      return {
        kind: 'kvArea',
        rows: [
          // the headline label follows config/copy.json, so a rename lands here too
          { label: label('idleCost'), value: usd(cost) },
          { label: 'Idle Hours', value: hrs(t.idle) },
        ],
        labels: ctx.labels,
        data: ctx.bucketTotals.map(b => round2(b.idle * rate)),
        color: CH.productive,
        unit: 'money',
      }
    },
  },

  highRateUtilization: {
    id: 'highRateUtilization',
    scopes: ['card'],
    card(ctx) {
      if (!ctx.vendor || ctx.totals.logged <= 0) return NO
      const hi = F.highRateUtilization(ctx.totals, ctx.vendor)
      if (hi == null) return NO
      const rows = F.siteRows(ctx.totals, ctx.vendor)
      const high = rows.filter(r => r.high)
      /* the trend is the high-rate sites' own utilization, not the vendor's:
         the card is about the expensive seats, and drawing the vendor line
         under a high-rate headline is what made this metric a duplicate */
      const mix = high.reduce((a, r) => a + r.weight, 0)
      const wf = mix > 0
        ? high.reduce((a, r) => a + r.weight * (byName[ctx.vendor!].sites
            .find(s => s.name === r.name)?.factor ?? 1), 0) / mix
        : 1
      return {
        kind: 'sites',
        pct: pct(hi),
        scope: `${high.length} of ${rows.length} location${rows.length === 1 ? '' : 's'} above $${F.HIGH_RATE_USD}/hr`,
        sites: rows.map(r => ({ name: r.name, util: r.util, usd: r.usd, high: r.high })),
        labels: ctx.labels,
        data: ctx.bucketTotals.map(t => round2((F.effectiveUtilization(t) ?? 0) * wf)),
      }
    },
  },

  productiveVsNonProductive: {
    id: 'productiveVsNonProductive',
    scopes: ['card'],
    card(ctx) {
      const eu = F.effectiveUtilization(ctx.totals)
      if (eu == null) return NO
      return {
        kind: 'donut',
        productive: Math.round(eu),
        nonProductive: 100 - Math.round(eu),
        labels: ctx.labels,
        s1: ctx.bucketTotals.map(t => round2(F.effectiveUtilization(t) ?? 0)),
        s2: ctx.bucketTotals.map(t => round2(100 - (F.effectiveUtilization(t) ?? 0))),
      }
    },
  },

  /* ---------------- Cost Efficiency ---------------- */

  /** Partner Efficiency.
   *
   *  Replaces Billable Portfolio Cost, which the product owner rejected outright
   *  rather than renamed: a single money figure says nothing without the
   *  workforce, the contract and the gap beside it. Excess FTEs sits directly
   *  right of the headcount, which was the specific ask: here is your workforce,
   *  and here is how much of it you are not getting. */
  partnerEfficiency: {
    id: 'partnerEfficiency',
    scopes: ['card', 'detail'],
    card(ctx) {
      const t = ctx.totals
      const v = ctx.vendor
      if (!v || t.expected <= 0) return NO
      const cfg = byName[v]
      const fte = F.fteEquivalent(t)
      const gap = F.hoursNotDelivered(t)
      const rate = cfg?.billRate ?? 0
      const contractValue = F.contractValue(t, v)
      const actual = F.billableCost(t, v)
      const gapCost = gap * rate
      return {
        kind: 'partner',
        pairs: [
          { label: label('resources'), value: String(cfg?.headcount ?? 0), tipId: 'resources' },
          { label: label('excessFtes'), value: fteFmt(fte), tone: 'bad', tipId: 'excessFtes' },
        ],
        /* Contract value splits in two and nothing else: what the work you got
           cost, and what the work you did not get cost. Seven label-value rows
           said the same thing in 200px of card. */
        segments: [
          {
            label: label('actualCost'), share: contractValue > 0 ? (actual / contractValue) * 100 : 0,
            value: usd(actual), sub: hrs(t.productive), color: CH.productive,
          },
          {
            /* The FTE figure is the Excess FTEs pair above, pulled from the same
               formula rather than typed, so the money and the people can never
               disagree. Asked for on 25 Sep. */
            label: label('costOfGap'), share: contractValue > 0 ? (gapCost / contractValue) * 100 : 0,
            value: usd(gapCost), sub: `${hrs(gap)} · ${fteFmt(fte)} FTE`, color: CH.lossStrong,
          },
        ],
        rows: [
          { label: label('contractValue'), value: usd(contractValue), sub: hrs(t.expected), strong: true },
          { label: label('costPerProductiveHour'), value: `$${trimN(+F.costPerProductiveHour(t, v).toFixed(2))}` },
        ],
        labels: ctx.labels,
        data: ctx.bucketTotals.map(b => round2(b.productive * rate)),
        trendLabel: `${label('actualCost')} Trend`,
        color: CH.money,
      }
    },
  },

  billablePortfolioCost: {
    id: 'billablePortfolioCost',
    scopes: ['hero', 'detail'],
    card(ctx) {
      if (ctx.totals.productive <= 0) return NO
      const rate = ctx.cfg?.billRate ?? 0
      const cost = ctx.totals.productive * rate
      return {
        kind: 'moneyArea',
        headline: usd(cost),
        trendLabel: `${label('actualCost')} Trend`,
        labels: ctx.labels,
        data: ctx.bucketTotals.map(t => round2(t.productive * rate)),
        color: CH.money,
      }
    },
    hero(ctx) {
      const cur = ctx.scope.reduce((a, n) => a + F.billableCost(ctx.totalsFor(n), n), 0)
      const prev = ctx.scope.reduce((a, n) => a + F.billableCost(ctx.prevFor(n), n), 0)
      return { kind: 'kpi', value: usd(cur), delta: moneyDelta(cur, prev) }
    },
  },

  /** Leakage Breakdown.
   *
   *  Replaces the old single-percentage Leakage Summary. The product owner
   *  wanted the money split by where it went rather than one ratio, because
   *  "26% effort leak" does not tell anyone what to go and fix. Keeps its badge:
   *  this and Vendor Score are the only two metrics the shipped build badges.
   *  The FTE figure here counts people tied up in non-productive work, which is
   *  a different number from the hero tile's undelivered capacity. */
  leakageSummary: {
    id: 'leakageSummary',
    scopes: ['card'],
    card(ctx) {
      const t = ctx.totals
      const v = ctx.vendor
      const leak = F.leakagePct(t)
      if (leak == null || !v) return NO
      const h = F.leakageSplit(t)
      const c = F.leakageSplitCost(t, v)
      const fte = F.leakageFteEquivalent(t)
      /* The bar spans contracted capacity, so the three leakage slices and the
         productive remainder add to the whole you are paying for: the headline
         percentage is the coloured part, which is the point of drawing it. */
      const cap = t.expected || 1
      const seg = (lab: string, hours: number, cost: number, color: string) =>
        ({ label: lab, share: (hours / cap) * 100, value: hrs(hours), sub: usd(cost), color })
      return {
        kind: 'stackBar',
        pct: pct(leak),
        caption: 'of contracted capacity',
        badge: F.leakageBadge(leak),
        delta: delta(leak, F.leakagePct(ctx.prev), undefined, true),
        segments: [
          /* one family, three tones: all three are the same kind of thing,
             capacity you paid for and did not get work out of */
          seg('Idle time', h.idle, c.idle, CH.lossStrong),
          seg('Non-core activities', h.nonCore, c.nonCore, CH.lossMid),
          seg('Non-billable work', h.nonBillable, c.nonBillable, CH.lossLight),
          {
            label: 'Productive', share: Math.max(0, 100 - (h.total / cap) * 100),
            value: hrs(Math.max(0, t.expected - h.total)), color: CH.rest, rest: true,
          },
        ],
        rows: [
          { label: 'Total leakage', value: hrs(h.total), sub: usd(c.total), strong: true },
          { label: label('leakageFtes'), value: fteFmt(fte) },
        ],
        labels: ctx.labels,
        data: ctx.bucketTotals.map(x => round2(F.leakagePct(x) ?? 0)),
        color: CH.productive,
      }
    },
  },

  /** Overtime Integrity. Mirrors the Idle Cost card's habit of putting the
   *  money and the hours side by side, so overtime reads as a cost and not
   *  only as a percentage. */
  /** Overtime Integrity.
   *
   *  The story is the gap between the two hour figures: what ProHance tracked
   *  the vendor working, against what the vendor billed. Claimed hours are an
   *  external feed from the client's VMS, which is why they can exceed what was
   *  worked. Overtime is productive time above 7.5 hours a person a day, and it
   *  bills at the contracted rate with no premium. */
  overtimeIntegrity: {
    id: 'overtimeIntegrity',
    scopes: ['card'],
    card(ctx) {
      const t = ctx.totals
      const ot = F.overtimePct(t)
      if (ot == null || !ctx.vendor) return NO
      const v = ctx.vendor
      const claimed = F.claimedOvertimeHours(t, v)
      const otFte = F.overtimeFteEquivalent(t, v)
      const over = claimed > t.ot
      return {
        kind: 'statBars',
        pct: pct(ot),
        caption: 'of logged hours',
        // no pill: the product badges only Vendor Score and Leakage Summary
        badge: null,
        delta: delta(ot, F.overtimePct(ctx.prev), undefined, true),
        rows: [
          { label: label('trackedOtHours'), value: hrs(t.ot) },
          { label: label('claimedOtHours'), value: hrs(claimed), tone: over ? 'bad' : undefined,
            sub: `${over ? '+' : ''}${trimN(+((claimed / Math.max(1, t.ot) - 1) * 100).toFixed(0))}% vs tracked` },
          { label: label('claimedOtFtes'), value: fteFmt(otFte) },
          { label: label('claimedOtCost'), value: usd(F.claimedOvertimeCost(t, v)), tone: over ? 'bad' : undefined },
          { label: label('unproductiveOtCost'), value: usd(F.unproductiveOvertimeCost(t, v)) },
        ],
        labels: ctx.labels,
        data: ctx.bucketTotals.map(x => round2(F.overtimePct(x) ?? 0)),
        color: CH.productive,
      }
    },
  },

  /** Productivity Comparison on Similar Work. A portfolio band rather than a
   *  vendor card: the whole point is comparing vendors on one skill. */
  /** Consolidation Levers.
   *
   *  Efficiency on comparable work, vendor against vendor. Two different
   *  questions live here depending on the dimension: compare the same skill or
   *  project across vendors and you are deciding who to consolidate to; compare
   *  designations inside one vendor and you are deciding whether you are paying
   *  for seniority you are not getting back. */
  consolidationLevers: {
    id: 'consolidationLevers',
    scopes: ['portfolio'],
    portfolio(ctx) {
      const vendors = ctx.scope
      const dim = ctx.dimension
      /* Locations and projects are not shared by every vendor, so the ones two
         vendors both run come first: comparable work is where a consolidation
         decision actually exists, and a reader should not have to hunt for it
         past four single-vendor columns. */
      const present = (sk: string) =>
        vendors.filter(v => F.sliceHeadcount(v, dim, sk) > 0).length
      const slices = F.sliceNames(vendors, dim)
        .slice()
        .sort((a, b) => present(b) - present(a))
      if (!vendors.length || !slices.length) return NO
      const series = vendors.map((v, i) => ({
        name: v,
        color: CH.vendorSeries[i % CH.vendorSeries.length],
        data: slices.map(sk => round2(F.sliceEfficiency(ctx.totalsFor(v), v, dim, sk) ?? 0)),
      }))
      const counts = vendors.map(v => slices.map(sk => F.sliceHeadcount(v, dim, sk)))

      /* No insight line. It restated the tallest and shortest bar, which the
         chart already says, and the designation version drew a conclusion for
         the reader. The product owner asked for both out on 25 Sep. */
      return {
        kind: 'groupedBars',
        categories: slices,
        series,
        compareValue: dim,
        compareOptions: DIMENSION_OPTIONS,
        insight: '',
        counts,
      }
    },
  },

  /* ---------------- Delivery ---------------- */
  /** Vendor Dependency Risk.
   *
   *  How much of the outsourced work sits with one vendor. The question behind
   *  it is business continuity: if the largest vendor stops, how much of the
   *  operation stops with it. Concentration is measured on productive hours,
   *  not headcount, because that is the work actually being done. */
  vendorDependency: {
    id: 'vendorDependency',
    scopes: ['portfolio'],
    portfolio(ctx) {
      const vendors = ctx.scope
      if (!vendors.length) return NO
      const hours = vendors.map(v => ({ v, h: ctx.totalsFor(v).productive }))
      const total = hours.reduce((a, x) => a + x.h, 0)
      if (total <= 0) return NO
      const sorted = [...hours].sort((a, b) => b.h - a.h)
      const top = (sorted[0].h / total) * 100
      const th = thresholds.dependency
      return {
        kind: 'concentration',
        pct: pct(top),
        caption: `of delivered work sits with ${sorted[0].v}`,
        // no pill: the product badges Vendor Score and Leakage Summary, nothing else
        badge: null,
        rows: sorted.map(x => ({
          name: x.v,
          share: (x.h / total) * 100,
          value: hrs(x.h),
          color: CH.vendorSeries[vendors.indexOf(x.v) % CH.vendorSeries.length],
        })),
        /* The bar and the caption carry it. A sentence naming the consequence
           and a second one proposing the remedy were both cut on 25 Sep. */
        note: '',
      }
    },
  },

  /** SLA Risk Summary. Every project in view, off track first, with the reason. */
  slaRiskSummary: {
    id: 'slaRiskSummary',
    scopes: ['portfolio'],
    portfolio(ctx) {
      const all = F.projectStats(ctx.scope, ctx.totalsFor)
      if (!all.length) return NO
      /* one row per vendor, worst first: the band answers which vendor is
         carrying the risk, and six stacked project blocks made the reader
         assemble that themselves. Every note is in tasks, which is the unit a
         delivery head acts in; "12 points under contract" was not. */
      const rows = ctx.scope
        .map(v => {
          const mine = all.filter(p => p.vendor === v)
          return {
            vendor: v,
            atRisk: mine.filter(p => p.atRisk).length,
            total: mine.length,
            chips: mine
              .slice()
              .sort((a, b) => a.onTimePct - b.onTimePct)
              .map(p => ({
                name: p.name,
                tone: p.atRisk ? ('bad' as const) : ('ok' as const),
                note: `${trimN(p.late)} of ${trimN(p.assigned)} tasks late or undelivered, ` +
                      `${pct(p.onTimePct)} on time`,
              })),
          }
        })
        .filter(r => r.total > 0)
        .sort((a, b) => b.atRisk / b.total - a.atRisk / a.total)
      if (!rows.length) return NO
      return { kind: 'riskChips', rows }
    },
  },


  /** Contract Burn.
   *
   *  The speed the budget is being consumed against the calendar. The mark on
   *  the bar is the share of the term already elapsed, so a fill past the mark
   *  is money going out faster than the contract is running down. That reading
   *  used to be a line of red text under the bar; the bar says it now.
   *  Contract value, start and end are client-fed; the exhaustion date is
   *  derived from the burn, so the two can never contradict each other. */
  contractBurn: {
    id: 'contractBurn',
    scopes: ['card'],
    card(ctx) {
      const v = ctx.vendor
      const c = v ? F.contractOf(v) : null
      if (!v || !c) return NO
      const out = F.contractExhausts(v)
      const early = out != null && out < Date.parse(c.to)
      return {
        kind: 'burn',
        pct: pct(c.burn * 100),
        fill: Math.min(100, c.burn * 100),
        elapsed: F.contractElapsed(v),
        early,
        rows: [
          { label: label('contractValue'), value: usd(c.value) },
          { label: 'Spend to date', value: usd(F.contractSpent(v)) },
          { label: 'Value remaining', value: usd(F.contractRemaining(v)) },
          { label: 'Contract ends', value: fmtDay(Date.parse(c.to)) },
          { label: 'Projected exhaustion', value: out == null ? '-' : fmtDay(out),
            tone: early ? 'bad' : undefined },
        ],
      }
    },
  },

  /** On-Time Delivery.
   *
   *  Tasks delivered on time against tasks assigned. It was called Delivery
   *  Predictability until 25 Sep, which was a lens name borrowed as a metric
   *  name: nothing here is predicted, and predictability in the source sheet
   *  means variability (Delivery Variability, SLA Reliability, Throughput
   *  Consistency). On-Time Delivery is the name the sheet already uses for
   *  this number, under Del - Predictability & Reliability. */
  deliveryPredictability: {
    id: 'deliveryPredictability',
    scopes: ['card'],
    card(ctx) {
      const t = ctx.totals
      if (t.target <= 0) return NO
      const dp = F.deliveryPredictability(t)
      return {
        kind: 'twoSeries',
        pct: pct(dp),
        a: String(Math.round(t.target)), aLabel: 'tasks assigned', aDot: CH.seriesGrey,
        b: String(Math.round(t.onTime)), bLabel: 'tasks delivered on time', bDot: CH.seriesBlue,
        delta: delta(dp, F.deliveryPredictability(ctx.prev)),
        labels: ctx.labels,
        s1: ctx.bucketTotals.map(x => Math.round(x.target)),
        s2: ctx.bucketTotals.map(x => Math.round(x.onTime)),
        c1: CH.seriesGrey, c2: CH.seriesBlue,
        n1: 'tasks assigned', n2: 'tasks delivered on time',
      }
    },
  },

  /** Penalty Exposure.
   *
   *  Client-fed and small on purpose. It is the only figure on the page that
   *  is not ours, and next to the leakage numbers it should read small: the
   *  contractual penalty is rarely where the money actually goes. */
  penaltyExposure: {
    id: 'penaltyExposure',
    scopes: ['card'],
    card(ctx) {
      const v = ctx.vendor
      const cfg = v ? byName[v] : null
      if (!cfg) return NO
      const sla = F.slaCompliance(ctx.totals)
      return {
        kind: 'kvArea',
        rows: [
          { label: 'Penalties triggered', value: usd(cfg.penaltyExposure) },
          { label: 'Response-time breaches', value: String(cfg.slaBreaches) },
          { label: metricLabelSafe('slaCompliance'), value: pct(sla) },
        ],
        labels: ctx.labels,
        data: ctx.bucketTotals.map(x => round2(F.slaCompliance(x) ?? 0)),
        color: CH.productive,
        unit: 'pct',
      }
    },
  },

  /* ---------------- hero-only and detail-only ---------------- */

  costAtRisk: {
    id: 'costAtRisk',
    scopes: ['hero', 'card', 'detail'],
    drill: 'costLoss',
    /* PEM Metrics.xlsx lists Cost at Risk as a Ven - Performance metric, and
       the page carried it only in the hero: six cards of ratios and a verdict,
       and nowhere the money a vendor manager is actually arguing about. */
    card(ctx) {
      const v = ctx.vendor
      if (!v || ctx.totals.expected <= 0) return NO
      return {
        kind: 'moneyArea',
        tone: 'loss',
        headline: usd(F.costLoss(ctx.totals, v)),
        trendLabel: `${label('costAtRisk')} Trend`,
        labels: ctx.labels,
        data: ctx.bucketTotals.map(t => round2(F.costLoss(t, v))),
        color: CH.money,
      }
    },
    hero(ctx) {
      const cur = ctx.scope.reduce((a, n) => a + F.costLoss(ctx.totalsFor(n), n), 0)
      const prev = ctx.scope.reduce((a, n) => a + F.costLoss(ctx.prevFor(n), n), 0)
      return { kind: 'kpi', value: usd(cur), delta: moneyDelta(cur, prev, true) }
    },
  },

  /* ---------------- Delivery hero tiles ---------------- */

  /** What the undelivered capacity costs, in the delivery head's framing.
   *  The same arithmetic as Cost Loss; a different lens asks it differently. */
  financialImpact: {
    id: 'financialImpact',
    scopes: ['hero'],
    drill: 'costLoss',
    hero(ctx) {
      const cur = ctx.scope.reduce((a, n) => a + F.costLoss(ctx.totalsFor(n), n), 0)
      const prev = ctx.scope.reduce((a, n) => a + F.costLoss(ctx.prevFor(n), n), 0)
      return { kind: 'kpi', value: usd(cur), delta: moneyDelta(cur, prev, true) }
    },
  },

  projectsAtRisk: {
    id: 'projectsAtRisk',
    scopes: ['hero'],
    hero(ctx) {
      const all = F.projectStats(ctx.scope, ctx.totalsFor)
      const risk = all.filter(p => p.atRisk)
      return {
        kind: 'kpi',
        value: `${risk.length} of ${all.length}`,
        delta: null,
        detail: risk.length
          ? {
              title: 'Off track',
              rows: risk.map(p =>
                [p.name, `${trimN(p.late)} tasks late`] as [string, string]),
            }
          : null,
      }
    },
  },

  contractValueAtRisk: {
    id: 'contractValueAtRisk',
    scopes: ['hero'],
    hero(ctx) {
      const cur = F.contractValueAtRisk(ctx.scope, ctx.totalsFor)
      const risky = new Set(
        F.projectStats(ctx.scope, ctx.totalsFor).filter(p => p.atRisk).map(p => p.vendor))
      const rows = ctx.scope
        .filter(v => risky.has(v))
        .map(v => [v, usd(F.contractRemaining(v))] as [string, string])
      return {
        kind: 'kpi',
        value: usd(cur),
        delta: null,
        detail: rows.length ? { title: 'Unspent against off-track delivery', rows } : null,
      }
    },
  },

  /* ---------------- Cost Efficiency hero tiles ---------------- */

  /** The money behind the Leakage Summary percentage. */
  leakageValue: {
    id: 'leakageValue',
    scopes: ['hero'],
    hero(ctx) {
      const cur = ctx.scope.reduce((a, n) => a + F.leakageValue(ctx.totalsFor(n), n), 0)
      const prev = ctx.scope.reduce((a, n) => a + F.leakageValue(ctx.prevFor(n), n), 0)
      return { kind: 'kpi', value: usd(cur), delta: moneyDelta(cur, prev, true) }
    },
  },

  /** Contracted productive hours the portfolio did not get. The shipped Cost
   *  Loss slide-out uses this name, so this one does too. */
  hoursNotDelivered: {
    id: 'hoursNotDelivered',
    scopes: ['hero'],
    // the shipped Cost Loss slide-out is where this number and the one below
    // actually live, so both open it
    drill: 'costLoss',
    hero(ctx) {
      const cur = F.hoursNotDelivered(ctx.totals)
      return { kind: 'kpi', value: hrs(cur), delta: delta(cur, F.hoursNotDelivered(ctx.prev), signedHrs, true) }
    },
  },

  /** The same shortfall counted in people, at 7.5 hours a working day. */
  fteEquivalent: {
    id: 'fteEquivalent',
    scopes: ['hero'],
    drill: 'costLoss',
    hero(ctx) {
      const cur = F.fteEquivalent(ctx.totals)
      const prev = F.fteEquivalent(ctx.prev)
      return {
        kind: 'kpi',
        value: fteFmt(cur),
        delta: delta(cur, prev, signedFte, true),
      }
    },
  },

  /** Contracts falling due inside the renewal window. The number alone says
   *  nothing, so the tile carries the list. */
  contractRenewals: {
    id: 'contractRenewals',
    scopes: ['hero'],
    hero(ctx) {
      const rows = F.upcomingRenewals(ctx.scope)
      return {
        kind: 'kpi',
        value: String(rows.length),
        delta: null,
        detail: rows.length
          ? {
              title: 'Due in the next 90 days',
              rows: rows.map(r => [r.vendor, `${fmtDay(r.due)} - in ${r.days} days`] as [string, string]),
            }
          : null,
      }
    },
  },

  /** At-Risk Vendors.
   *
   *  A count on its own says nothing, so the tile carries the list, the way
   *  Upcoming Contract Renewals and Projects at Risk do. It is also the only
   *  reader of the risk band now: the Risk Status card printed the Vendor
   *  Score's band a second time, in 54px, at the top of every column. */
  atRiskVendors: {
    id: 'atRiskVendors',
    scopes: ['hero'],
    hero(ctx) {
      const risky = ctx.scope
        .map(v => ({ v, t: ctx.totalsFor(v) }))
        .filter(x => F.riskStatus(x.t)?.level === 'High')
      return {
        kind: 'kpi',
        value: String(risky.length),
        delta: null,
        detail: risky.length
          ? {
              title: 'At risk',
              rows: risky.map(x =>
                [x.v, `score ${trimN(+(F.vendorScore(x.t) ?? 0).toFixed(1))}, ` +
                      `SLA ${pct(F.slaCompliance(x.t))}`] as [string, string]),
            }
          : null,
      }
    },
  },

  /** Tactical / Strategic Vendors.
   *
   *  Replaces Contract Value at Risk on the Delivery hero, per the 25 Sep
   *  review: that tile printed $37.59M next to Financial Impact's $34.24M and
   *  nothing on screen said what separated them. The tier split is how a
   *  delivery head actually sorts the portfolio, and it is already the badge on
   *  every vendor card. A tier is a contract fact, not a measurement, so the
   *  tile carries no delta; the View list names which vendor sits where. */
  vendorTiers: {
    id: 'vendorTiers',
    scopes: ['hero'],
    hero(ctx) {
      const tactical = F.vendorsByTier(ctx.scope, 'tactical')
      const strategic = F.vendorsByTier(ctx.scope, 'strategic')
      const rows: [string, string][] = [
        ...tactical.map(v => [v, 'Tactical'] as [string, string]),
        ...strategic.map(v => [v, 'Strategic'] as [string, string]),
      ]
      return {
        kind: 'kpi',
        value: `${tactical.length} / ${strategic.length}`,
        delta: null,
        detail: rows.length ? { title: 'Vendor tiers', rows } : null,
      }
    },
  },

  idleCapacity: {
    id: 'idleCapacity',
    scopes: ['hero', 'detail'],
    hero(ctx) {
      const cur = F.idleCapacity(ctx.totals)
      return { kind: 'kpi', value: pct(cur), delta: delta(cur, F.idleCapacity(ctx.prev), undefined, true) }
    },
  },

  overUtilizedEmployee: {
    id: 'overUtilizedEmployee',
    scopes: ['hero', 'detail'],
    hero(ctx) {
      // the product shows no period comparison on the two employee tiles
      return { kind: 'kpi', value: pct(F.employeeSplit(ctx.scope, ctx.totalsFor).over), delta: null }
    },
  },

  underUtilizedEmployee: {
    id: 'underUtilizedEmployee',
    scopes: ['hero', 'detail'],
    hero(ctx) {
      return { kind: 'kpi', value: pct(F.employeeSplit(ctx.scope, ctx.totalsFor).under), delta: null }
    },
  },

  totalHeadcount: {
    id: 'totalHeadcount',
    scopes: ['profile', 'detail'],
    hero: ctx => ({ kind: 'kpi', value: String(ctx.cfg?.headcount ?? 0), delta: null, spark: null }),
    profile: ctx => String(ctx.cfg?.headcount ?? 0),
  },

  billableCostTrend: {
    id: 'billableCostTrend',
    scopes: ['detail'],
    card: ctx => METRICS.billablePortfolioCost.card!(ctx),
  },
}

/** Which spark series a hero tile draws. Add an entry when you add a hero
 *  metric whose tile should carry a sparkline. */
export const HERO_SPARK: Record<string, { kind: SparkKind; color: string }> = {
  capacityUtilization: { kind: 'cu', color: C.up },
  leakageValue: { kind: 'leakval', color: C.down },
  hoursNotDelivered: { kind: 'hnd', color: C.down },
  fteEquivalent: { kind: 'fte', color: C.down },
  slaCompliance: { kind: 'sla', color: C.up },
  effectiveUtilization: { kind: 'eu', color: C.up },
  idleCapacity: { kind: 'idlecap', color: C.down },
  costAtRisk: { kind: 'cost', color: C.down },
  billablePortfolioCost: { kind: 'bill', color: C.down },
  overUtilizedEmployee: { kind: 'over', color: C.up },
  underUtilizedEmployee: { kind: 'under', color: C.up },
}

export type SparkKind =
  | 'cu' | 'sla' | 'eu' | 'idlecap' | 'cost' | 'bill' | 'over' | 'under'
  | 'leakval' | 'hnd' | 'fte'

export const metricIds = (): string[] => Object.keys(METRICS)
