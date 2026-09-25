import type { DateState } from '../engine/types.ts'

export interface LensState extends DateState {
  metric: string
  verticals: string[]
  vendors: string[]
  /** committed selection; the prototype commits on click, see README */
  applied: { metric: string; vendors: string[] }
}

export interface DetailState extends DateState {
  locations: string[]
}

export interface AppState {
  role: string
  lens: string
  detailVendor: string | null
  openGroup: string | null
  openPop: string | null
  /** selection staged inside an open multiselect, keyed by popover id */
  staged: Record<string, string[]>
  navExpanded: boolean
  fitWidth: boolean
  hintDismissed: boolean
  lenses: Record<string, LensState>
  details: Record<string, DetailState>
}
