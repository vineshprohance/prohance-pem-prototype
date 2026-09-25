import copy from '../../config/copy.json' with { type: 'json' }
import { VENDORS } from '../engine/dataset.ts'
import { metricLabel } from './InfoTip.tsx'
import { DatePicker } from './filters/DatePicker.tsx'
import { MultiSelect } from './filters/MultiSelect.tsx'
import { VERTICALS, defaultLensState, useStore } from '../state/store.tsx'
import type { LensState } from '../state/types.ts'
import type { DateState, Period } from '../engine/types.ts'

const PERIODS = copy.ui.periods as Period[]

/**
 * Filter bar.
 *
 * Period tabs, the date pickers and the metric chips commit on click, because
 * they are single-choice controls and instant feedback is what you want there.
 *
 * The two multiselects stage their changes behind their own Apply, the way the
 * product does. The page-level pair then works on the whole bar:
 *
 *   Reset   restores every control on this page to its default. Disabled when
 *           the page is already at its defaults.
 *   Apply   commits anything still staged in an open popover. Disabled when
 *           there is nothing staged, so it never reads as broken.
 */
export function FilterBar({ lensId, sections }: { lensId: string; sections: string[] }) {
  const { s, d, lensState } = useStore()
  const st = lensState(lensId)
  const patch = (p: Partial<LensState>) => d({ t: 'lens', id: lensId, patch: p })
  /** opening a popover seeds its staged selection from what is applied */
  const setPop = (id: string | null, seed?: string[]) =>
    d({ t: 'set', patch: { openPop: id, staged: id && seed ? { ...s.staged, [id]: seed } : s.staged } })
  const stage = (id: string, next: string[]) =>
    d({ t: 'set', patch: { staged: { ...s.staged, [id]: next } } })

  const vendorOptions = VENDORS
    .filter(v => st.verticals.includes(v.vertical))
    .map(v => ({ value: v.name, label: v.name }))

  const appliedVendors = st.applied.vendors.filter(v => vendorOptions.some(o => o.value === v))

  const vendorLabel = (() => {
    if (!appliedVendors.length) return copy.ui.selectVendor
    if (appliedVendors.length === vendorOptions.length) return copy.ui.allVendors
    if (appliedVendors.length === 1) return appliedVendors[0]
    return `${appliedVendors[0]} + ${appliedVendors.length - 1} More`
  })()

  const verticalLabel = (() => {
    const names = VERTICALS.filter(v => st.verticals.includes(v.id)).map(v => v.name)
    if (!names.length) return copy.ui.noVertical
    if (names.length === 1) return names[0]
    return `${names[0]} + ${names.length - 1} More`
  })()

  /** commit handlers, shared by the popover buttons and the page-level pair */
  /** clearing every vertical is a real state: it empties the page, the way
   *  scoping works in the product. Clearing every vendor is not, so that one
   *  falls back to all. */
  const commitVert = (next: string[]) => {
    const allowed = VENDORS.filter(v => next.includes(v.vertical)).map(v => v.name)
    patch({ verticals: next, vendors: allowed, applied: { ...st.applied, vendors: allowed } })
    setPop(null)
  }
  const commitVend = (next: string[]) => {
    const picked = next.length ? next : vendorOptions.map(o => o.value)
    patch({ vendors: picked, applied: { ...st.applied, vendors: picked } })
    setPop(null)
  }

  const stagedFor = (id: string) =>
    id === 'vert' ? (s.staged.vert ?? st.verticals) : (s.staged.vend ?? appliedVendors)
  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every(v => b.includes(v))
  const pendingPop = s.openPop === 'vert' || s.openPop === 'vend' ? s.openPop : null
  const hasPending = !!pendingPop && !sameSet(
    stagedFor(pendingPop),
    pendingPop === 'vert' ? st.verticals : appliedVendors,
  )

  const chips = ['All', ...sections]
  const base = defaultLensState(lensId)
  const atDefaults =
    st.period === base.period &&
    st.year === base.year && st.quarter === base.quarter && st.month === base.month &&
    st.rangeA === base.rangeA && st.rangeB === base.rangeB &&
    st.applied.metric === base.applied.metric &&
    st.verticals.length === base.verticals.length &&
    st.applied.vendors.length === base.applied.vendors.length

  return (
    <section className="card filters">
      <div className="frow">
        <div className="flabel">Filters</div>
        <div className="seg" id="segPeriod">
          {PERIODS.map(p => (
            <button key={p} type="button" data-period={p} className={st.period === p ? 'on' : ''}
                    onClick={() => patch({ period: p })}>{p}</button>
          ))}
        </div>

        <DatePicker st={st as DateState} open={s.openPop === 'date'} onToggle={setPop}
                    patch={p => patch(p as Partial<LensState>)} />

        <MultiSelect
          id="vert" testId="vert-trigger" label={verticalLabel}
          options={VERTICALS.map(v => ({ value: v.id, label: v.name }))}
          applied={st.verticals}
          staged={s.staged.vert ?? st.verticals}
          onStage={next => stage('vert', next)}
          onCommit={commitVert}
          showSelectAll emptyMeansAll={false}
          open={s.openPop === 'vert'}
          onToggle={id => setPop(id, st.verticals)}
        />

        <MultiSelect
          id="vend" testId="vend-trigger" label={vendorLabel}
          options={vendorOptions}
          applied={appliedVendors}
          staged={s.staged.vend ?? appliedVendors}
          onStage={next => stage('vend', next)}
          onCommit={commitVend}
          open={s.openPop === 'vend'}
          onToggle={id => setPop(id, appliedVendors)}
        />
      </div>

      <div className="frow">
        <div className="flabel">Metrics</div>
        <div className="chips">
          {chips.map(m => (
            <button key={m} type="button" className={`chip ${st.metric === m ? 'on' : ''}`}
                    data-metric={m}
                    onClick={() => patch({ metric: m, applied: { ...st.applied, metric: m } })}>
              {m === 'All' ? 'All' : metricLabel(m)}
            </button>
          ))}
        </div>
        <div className="spacer">
          <button type="button" className="btn ghost" data-act="reset" data-keep-pop
                  disabled={atDefaults}
                  title={atDefaults ? 'Already at the default filters' : 'Restore every filter on this page'}
                  onClick={() => d({ t: 'resetLens', id: lensId })}>Reset</button>
          <button type="button" className="btn primary" data-act="apply" data-keep-pop
                  disabled={!hasPending}
                  title={hasPending ? 'Apply the staged filter selection' : 'Nothing staged to apply'}
                  onClick={() => {
                    if (!pendingPop) return
                    const next = stagedFor(pendingPop)
                    if (pendingPop === 'vert') commitVert(next)
                    else commitVend(next)
                  }}>Apply</button>
        </div>
      </div>
    </section>
  )
}
