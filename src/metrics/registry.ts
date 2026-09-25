import { hrs, pct, ratio, signed, trimN, usd } from '../engine/format.ts'
import * as F from '../engine/formulas.ts'
import { byName } from '../engine/dataset.ts'
import copyCfg from '../../config/copy.json' with { type: 'json' }
import { C, CH, delta, moneyDelta, round2, scoreRange } from './helpers.ts'
import { niceMax } from '../components/charts/primitives.ts'
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
        delta: prev == null ? null : { text: signed(sc - prev, ' pts'), dir: sc < prev ? 'down' : 'up' },
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
        support: `${hrs(ctx.totals.productive).replace(/ hrs$/, '')} productive hours of ` +
                 `${hrs(ctx.totals.expected).replace(/ hrs$/, '')} expected productive hours`,
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
        a: String(Math.round(t.target)), aLabel: 'target tasks', aDot: CH.seriesGrey,
        b: String(Math.round(t.completed)), bLabel: 'completed tasks', bDot: CH.seriesBlue,
        delta: delta(out, F.outputRate(ctx.prev)),
        labels: ctx.labels,
        s1: ctx.bucketTotals.map(x => Math.round(x.target)),
        s2: ctx.bucketTotals.map(x => Math.round(x.completed)),
        c1: CH.seriesGrey, c2: CH.seriesBlue,
        n1: 'target tasks', n2: 'completed tasks',
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
      const mapped = cfg.roles.reduce((a, r) => a + r.count, 0)
      return { kind: 'roles', total: `${mapped} headcount`, rows: cfg.roles }
    },
    // the roster total, which is the sum of the mapped roles. Total Headcount in
    // Vendor Profiles is the configured licence count and can differ.
    aside: ctx => (ctx.cfg ? `${ctx.cfg.roles.reduce((a, r) => a + r.count, 0)} headcount` : null),
  },

  riskStatus: {
    id: 'riskStatus',
    scopes: ['card'],
    card(ctx) {
      const r = F.riskStatus(ctx.totals)
      if (!r) return NO
      return { kind: 'status', level: r.level, conds: r.conds }
    },
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
        color: CH.idle,
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
      const cfg = byName[ctx.vendor]
      const mix = cfg.sites.reduce((a, s) => a + s.factor * s.weight, 0)
      return {
        kind: 'sites',
        pct: pct(hi),
        sites: F.siteBreakdown(ctx.totals, ctx.vendor),
        labels: ctx.labels,
        data: ctx.bucketTotals.map(t => round2((F.effectiveUtilization(t) ?? 0) * mix)),
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

  billablePortfolioCost: {
    id: 'billablePortfolioCost',
    scopes: ['hero', 'card', 'detail'],
    card(ctx) {
      if (ctx.totals.productive <= 0) return NO
      const rate = ctx.cfg?.billRate ?? 0
      const cost = ctx.totals.productive * rate
      return {
        kind: 'moneyArea',
        headline: usd(cost),
        trendLabel: 'Billable Cost Trend',
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

  leakageSummary: {
    id: 'leakageSummary',
    scopes: ['card'],
    card(ctx) {
      const leak = F.leakagePct(ctx.totals)
      if (leak == null) return NO
      const prev = F.leakagePct(ctx.prev)
      return {
        kind: 'leak',
        pct: pct(leak),
        badge: F.leakageBadge(leak),
        delta: delta(leak, prev),
        hours: hrs(F.nonProductiveHours(ctx.totals)),
        labels: ctx.labels,
        data: ctx.bucketTotals.map(t => round2(F.leakagePct(t) ?? 0)),
      }
    },
  },

  /* ---------------- hero-only and detail-only ---------------- */

  costAtRisk: {
    id: 'costAtRisk',
    scopes: ['hero', 'detail'],
    hero(ctx) {
      const cur = ctx.scope.reduce((a, n) => a + F.idleCost(ctx.totalsFor(n), n), 0)
      const prev = ctx.scope.reduce((a, n) => a + F.idleCost(ctx.prevFor(n), n), 0)
      return { kind: 'kpi', value: usd(cur), delta: moneyDelta(cur, prev) }
    },
  },

  atRiskVendors: {
    id: 'atRiskVendors',
    scopes: ['hero'],
    hero(ctx) {
      const n = ctx.scope.filter(v => F.riskStatus(ctx.totalsFor(v))?.level === 'High').length
      return { kind: 'kpi', value: String(n), delta: null, spark: null }
    },
  },

  idleCapacity: {
    id: 'idleCapacity',
    scopes: ['hero', 'detail'],
    hero(ctx) {
      const cur = F.idleCapacity(ctx.totals)
      return { kind: 'kpi', value: pct(cur), delta: delta(cur, F.idleCapacity(ctx.prev)) }
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
  slaCompliance: { kind: 'sla', color: C.up },
  effectiveUtilization: { kind: 'eu', color: C.up },
  idleCapacity: { kind: 'idlecap', color: C.down },
  costAtRisk: { kind: 'cost', color: C.down },
  billablePortfolioCost: { kind: 'bill', color: C.down },
  overUtilizedEmployee: { kind: 'over', color: C.up },
  underUtilizedEmployee: { kind: 'under', color: C.up },
}

export type SparkKind = 'cu' | 'sla' | 'eu' | 'idlecap' | 'cost' | 'bill' | 'over' | 'under'

export const metricIds = (): string[] => Object.keys(METRICS)
