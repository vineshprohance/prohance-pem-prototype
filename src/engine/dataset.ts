import vendorsCfg from '../../config/vendors.json' with { type: 'json' }
import { h32 } from './noise.ts'
import { TOTAL_KEYS, zeroTotals } from './types.ts'
import type { Totals, TotalKey, VendorConfig } from './types.ts'

export const DAY_MS = 86_400_000
const utc = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** "Today" for the whole app. Nothing after this date has data. Change it in
 *  config/vendors.json to move the prototype's clock. */
export const TODAY = utc(vendorsCfg.today)
export const CALIBRATION_YEAR = vendorsCfg.calibrationYear

export const VENDORS: VendorConfig[] = vendorsCfg.vendors as VendorConfig[]
export const VENDOR_NAMES: string[] = VENDORS.map(v => v.name)
export const byName: Record<string, VendorConfig> = Object.fromEntries(
  VENDORS.map(v => [v.name, v]),
)

interface Bounds { from: number; to: number }
const bounds: Record<string, Bounds> = Object.fromEntries(
  VENDORS.map(v => [v.name, { from: utc(v.dataFrom), to: utc(v.dataTo) }]),
)

/* ------------------------------------------------------------------ *
 *  Raw daily shape, before calibration.
 *  Weekdays only, bounded by the vendor's real first and last data day,
 *  with a growth trend and a mild seasonal wave so charts are not flat.
 * ------------------------------------------------------------------ */
function dayRaw(name: string, t: number): Record<TotalKey, number> | null {
  const cfg = byName[name]
  const b = bounds[name]
  if (!cfg || t < b.from || t > b.to || t > TODAY) return null
  const d = new Date(t)
  const dow = d.getUTCDay()
  if (dow === 0 || dow === 6) return null

  const di = Math.round(t / DAY_MS)
  const growth = Math.pow(1 + cfg.growth, d.getUTCFullYear() - CALIBRATION_YEAR)
  const season =
    1 + 0.07 * Math.sin((d.getUTCMonth() + 0.5) * (Math.PI / 6)) + 0.03 * Math.cos(dow * 1.7)
  const base = growth * season
  const n = (k: number) => base * (0.8 + 0.4 * h32(cfg.seed, k, di))

  return {
    expected: n(1), productive: n(2), logged: n(3), target: n(4),
    completed: n(5), onTime: n(6), leak: n(7), idle: n(8),
  }
}

/* ------------------------------------------------------------------ *
 *  Calibration. Each key is scaled so the vendor's calibration-year sum
 *  equals the figure in config/vendors.json. Yearly 2026 therefore shows
 *  exactly those numbers; every other window is a true sum of the days.
 * ------------------------------------------------------------------ */
const SCALE: Record<string, Record<TotalKey, number>> = {}
for (const cfg of VENDORS) {
  const end = Math.min(TODAY, bounds[cfg.name].to)
  const sums = Object.fromEntries(TOTAL_KEYS.map(k => [k, 0])) as Record<TotalKey, number>
  for (let t = Date.UTC(CALIBRATION_YEAR, 0, 1); t <= end; t += DAY_MS) {
    const raw = dayRaw(cfg.name, t)
    if (!raw) continue
    for (const k of TOTAL_KEYS) sums[k] += raw[k]
  }
  SCALE[cfg.name] = Object.fromEntries(
    TOTAL_KEYS.map(k => [k, sums[k] > 0 ? (cfg.calibration[k] ?? 0) / sums[k] : 0]),
  ) as Record<TotalKey, number>
}

export function dayValues(name: string, t: number): Record<TotalKey, number> | null {
  const raw = dayRaw(name, t)
  if (!raw) return null
  const f = SCALE[name]
  return Object.fromEntries(TOTAL_KEYS.map(k => [k, raw[k] * f[k]])) as Record<TotalKey, number>
}

const cache = new Map<string, Totals>()

/** Sum one vendor's days over an inclusive range. */
export function aggregate(name: string, a: number, b: number): Totals {
  const key = `${name}|${a}|${b}`
  const hit = cache.get(key)
  if (hit) return hit
  const out = zeroTotals()
  if (a <= b) {
    for (let t = a; t <= b; t += DAY_MS) {
      const d = dayValues(name, t)
      if (!d) continue
      for (const k of TOTAL_KEYS) out[k] += d[k]
      out.days++
    }
  }
  cache.set(key, out)
  return out
}

/** Sum a set of vendors over an inclusive range. */
export function aggregateMany(names: string[], a: number, b: number): Totals {
  const out = zeroTotals()
  for (const n of names) {
    const t = aggregate(n, a, b)
    for (const k of TOTAL_KEYS) out[k] += t[k]
    out.days += t.days
  }
  return out
}

export const hasData = (t: Totals): boolean => t.days > 0 && t.logged > 0
