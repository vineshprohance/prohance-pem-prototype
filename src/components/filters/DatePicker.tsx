import { MMM, MONTH_FULL, dateLabel } from '../../engine/ranges.ts'
import { TODAY } from '../../engine/dataset.ts'
import type { DateState } from '../../engine/types.ts'
import { PopHead, Popover } from './Popover.tsx'

type Patch = (p: Partial<DateState>) => void

/* The prototype has no future. Every control below refuses a window that starts
 * after TODAY, because an empty future window is the one reliable way to put
 * "No data available" on screen. FIRST_YEAR is where the vendor series begin. */
const FIRST_YEAR = 2016
const NOW = new Date(TODAY)
const NOW_Y = NOW.getUTCFullYear()
const NOW_M = NOW.getUTCMonth()
const NOW_Q = Math.floor(NOW_M / 3) + 1

function YearGrid({ st, patch }: { st: DateState; patch: Patch }) {
  const a = st.gridY
  return (
    <>
      <PopHead title={`${a} – ${a + 11}`}
               onPrev={() => patch({ gridY: a - 12 })}
               onNext={() => patch({ gridY: a + 12 })}
               prevDisabled={a <= FIRST_YEAR}
               nextDisabled={a + 12 > NOW_Y} />
      <div className="ygrid">
        {Array.from({ length: 12 }, (_, i) => a + i).map(y => (
          <button key={y} type="button" data-setyear={y} className={y === st.year ? 'on' : ''}
                  disabled={y > NOW_Y || y < FIRST_YEAR}
                  onClick={() => patch({ year: y })}>{y}</button>
        ))}
      </div>
    </>
  )
}

function QuarterGrid({ st, patch }: { st: DateState; patch: Patch }) {
  const qs: [string, string][] = [
    ['Q1', 'Jan – Mar'], ['Q2', 'Apr – Jun'],
    ['Q3', 'Jul – Sep'], ['Q4', 'Oct – Dec'],
  ]
  return (
    <>
      <PopHead title={String(st.year)}
               onPrev={() => patch({ year: st.year - 1 })}
               onNext={() => patch({ year: st.year + 1 })}
               prevDisabled={st.year <= FIRST_YEAR}
               nextDisabled={st.year >= NOW_Y} />
      <div className="qgrid">
        {qs.map(([q, months], i) => {
          const off = st.year > NOW_Y || (st.year === NOW_Y && i + 1 > NOW_Q)
          return (
            <button key={q} type="button" data-setq={i + 1} disabled={off}
                    className={st.quarter === i + 1 ? 'on' : ''}
                    onClick={() => patch({ quarter: i + 1 })}>
              <b>{q}</b><i>{months}</i>
            </button>
          )
        })}
      </div>
    </>
  )
}

function MonthGrid({ st, patch }: { st: DateState; patch: Patch }) {
  return (
    <>
      <PopHead title={String(st.year)}
               onPrev={() => patch({ year: st.year - 1 })}
               onNext={() => patch({ year: st.year + 1 })}
               prevDisabled={st.year <= FIRST_YEAR}
               nextDisabled={st.year >= NOW_Y} />
      <div className="ygrid">
        {MMM.map((m, i) => {
          const off = st.year > NOW_Y || (st.year === NOW_Y && i > NOW_M)
          return (
            <button key={m} type="button" data-setmonth={i} disabled={off}
                    className={st.month === i ? 'on' : ''}
                    onClick={() => patch({ month: i })}>{m}</button>
          )
        })}
      </div>
    </>
  )
}

function Calendar({ st, patch }: { st: DateState; patch: Patch }) {
  const y = st.calY
  const m = st.calM
  const firstDow = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const a = st.pick != null ? st.pick : Math.min(st.rangeA, st.rangeB)
  const b = st.pick != null ? st.pick : Math.max(st.rangeA, st.rangeB)

  const pickDay = (t: number) => {
    if (st.pick == null) patch({ pick: t })
    else patch({ rangeA: Math.min(st.pick, t), rangeB: Math.max(st.pick, t), pick: null })
  }
  const shift = (d: number) => {
    const nm = m + d
    patch({ calY: y + Math.floor(nm / 12), calM: ((nm % 12) + 12) % 12 })
  }

  return (
    <>
      <PopHead title={`${MONTH_FULL[m]} ${y}`} onPrev={() => shift(-1)} onNext={() => shift(1)}
               prevDisabled={y <= FIRST_YEAR && m === 0}
               nextDisabled={y > NOW_Y || (y === NOW_Y && m >= NOW_M)} />
      <div className="dow"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></div>
      <div className="cgrid">
        {Array.from({ length: firstDow }, (_, i) => <button key={`b${i}`} className="blank" tabIndex={-1} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1
          const t = Date.UTC(y, m, d)
          const cls = t === a || t === b ? 'sel' : t > a && t < b ? 'mid' : ''
          return (
            <button key={d} type="button" className={cls} data-day={t} disabled={t > TODAY}
                    onClick={() => pickDay(t)}>{d}</button>
          )
        })}
      </div>
    </>
  )
}

/** One trigger, four panels. Which panel shows follows the period tab, which is
 *  the behaviour the shipped build gets wrong on first load. */
export function DatePicker({ st, patch, open, onToggle }: {
  st: DateState; patch: Patch; open: boolean; onToggle: (id: string | null) => void
}) {
  const weekly = st.period === 'Weekly'
  return (
    <Popover id="date" label={dateLabel(st)} open={open} onToggle={onToggle} wide={weekly} testId="date-trigger">
      {st.period === 'Yearly' && <YearGrid st={st} patch={patch} />}
      {st.period === 'Quaterly' && <QuarterGrid st={st} patch={patch} />}
      {st.period === 'Monthly' && <MonthGrid st={st} patch={patch} />}
      {weekly && <Calendar st={st} patch={patch} />}
    </Popover>
  )
}
