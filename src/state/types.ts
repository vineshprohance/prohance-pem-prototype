import type { DateState, Dimension } from '../engine/types.ts'

export interface LensState extends DateState {
  metric: string
  verticals: string[]
  vendors: string[]
  /** what Consolidation Levers compares across on this page */
  dimension: Dimension
  /** designation each vendor column is narrowed to, keyed by vendor name.
   *  Absent means the whole roster. */
  designation: Record<string, string>
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
  /** the Cost Loss slide-out, which carries its own period selection the way
   *  the shipped build's does */
  costLossOpen: boolean
  costLoss: DateState | null
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
