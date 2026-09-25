import { createContext, useContext, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import lensCfg from '../../config/lenses.json' with { type: 'json' }
import rolesCfg from '../../config/roles.json' with { type: 'json' }
import verticalsCfg from '../../config/verticals.json' with { type: 'json' }
import { VENDOR_NAMES, byName } from '../engine/dataset.ts'
import type { DateState, Period } from '../engine/types.ts'
import type { AppState, DetailState, LensState } from './types.ts'

/** Default Weekly window: the current week up to today. */
const WEEK_A = Date.UTC(2026, 8, 13)
const WEEK_B = Date.UTC(2026, 8, 15)

const baseDates = (a: number, b: number) => {
  const d = new Date(a)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    quarter: Math.floor(d.getUTCMonth() / 3) + 1,
    rangeA: a, rangeB: b,
    calY: d.getUTCFullYear(), calM: d.getUTCMonth(),
    gridY: 2016, pick: null as number | null,
  }
}

export const LENSES = lensCfg.lenses
export const NAV_GROUPS = lensCfg.navGroups
export const DETAIL_CFG = lensCfg.detail
export const ROLES = rolesCfg.roles
export const VERTICALS = verticalsCfg.verticals

export const lensById = (id: string) => LENSES.find(l => l.id === id) ?? LENSES[0]
export const roleById = (id: string) => ROLES.find(r => r.id === id) ?? ROLES[0]

export function defaultLensState(lensId: string): LensState {
  const cfg = lensById(lensId)
  return {
    period: cfg.defaultPeriod as Period,
    metric: 'All',
    dimension: 'skillSet',
    designation: {},
    verticals: VERTICALS.map(v => v.id),
    vendors: VENDOR_NAMES.slice(),
    applied: { metric: 'All', vendors: VENDOR_NAMES.slice() },
    ...baseDates(WEEK_A, WEEK_B),
  }
}

export function defaultDetailState(vendor: string): DetailState {
  return {
    period: DETAIL_CFG.defaultPeriod as Period,
    locations: (byName[vendor]?.sites ?? []).map(s => s.name),
    ...baseDates(WEEK_A, WEEK_B),
  }
}

export const defaultCostLossState = (): DateState => ({
  period: 'Yearly' as Period,
  ...baseDates(WEEK_A, WEEK_B),
})

export function initialState(): AppState {
  const role = roleById(rolesCfg.defaultRole)
  return {
    role: role.id,
    lens: role.defaultLens,
    detailVendor: null,
    costLossOpen: false,
    costLoss: null,
    openGroup: lensById(role.defaultLens).navGroup,
    openPop: null,
    staged: {},
    navExpanded: false,
    fitWidth: true,
    hintDismissed: false,
    lenses: {},
    details: {},
  }
}

export type Action =
  | { t: 'set'; patch: Partial<AppState> }
  | { t: 'lens'; id: string; patch: Partial<LensState> }
  | { t: 'detail'; vendor: string; patch: Partial<DetailState> }
  | { t: 'resetLens'; id: string }
  | { t: 'resetDetail'; vendor: string }
  | { t: 'costLoss'; patch: Partial<DateState> }

function reducer(s: AppState, a: Action): AppState {
  switch (a.t) {
    case 'set': {
      const next = { ...s, ...a.patch }
      // keep the nav accordion on the group that owns the active lens
      if (a.patch.lens && a.patch.openGroup === undefined) {
        next.openGroup = lensById(a.patch.lens).navGroup
      }
      return next
    }
    case 'lens': {
      const cur = s.lenses[a.id] ?? defaultLensState(a.id)
      return { ...s, lenses: { ...s.lenses, [a.id]: { ...cur, ...a.patch } } }
    }
    case 'detail': {
      const cur = s.details[a.vendor] ?? defaultDetailState(a.vendor)
      return { ...s, details: { ...s.details, [a.vendor]: { ...cur, ...a.patch } } }
    }
    case 'resetLens': {
      const next = { ...s.lenses }
      delete next[a.id]
      return { ...s, lenses: next, openPop: null }
    }
    case 'resetDetail': {
      const next = { ...s.details }
      delete next[a.vendor]
      return { ...s, details: next, openPop: null }
    }
    case 'costLoss':
      return { ...s, costLoss: { ...(s.costLoss ?? defaultCostLossState()), ...a.patch } }
  }
}

interface Ctx {
  s: AppState
  d: React.Dispatch<Action>
  lensState: (id: string) => LensState
  detailState: (vendor: string) => DetailState
  costLossState: () => DateState
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, initialState)
  const value = useMemo<Ctx>(() => ({
    s, d,
    lensState: id => s.lenses[id] ?? defaultLensState(id),
    detailState: v => s.details[v] ?? defaultDetailState(v),
    costLossState: () => s.costLoss ?? defaultCostLossState(),
  }), [s])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore must be used inside StoreProvider')
  return c
}

/** Vendors currently in scope. An empty vertical selection empties the page,
 *  which is what the shipped build does. */
export function scopeVendors(st: LensState): string[] {
  if (!st.verticals.length) return []
  const allowed = new Set(
    VENDOR_NAMES.filter(n => st.verticals.includes(byName[n]?.vertical ?? '')),
  )
  return st.applied.vendors.filter(v => allowed.has(v))
}
