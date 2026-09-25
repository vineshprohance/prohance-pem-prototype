import { Popover } from './Popover.tsx'

export interface Option { value: string; label: string }

/**
 * Checkbox list with Reset and Apply, matching the product.
 *
 * Ticking a box stages a change; nothing reaches the page until Apply. That is
 * what gives both buttons a real job:
 *
 *   Apply   commits the staged selection and closes. Disabled while the staged
 *           selection already matches what is applied, so a click that would do
 *           nothing is visibly unavailable rather than silently ignored.
 *   Reset   selects everything, commits it and closes. Disabled when everything
 *           is already selected.
 *
 * The staged selection lives in the store rather than in this component, so the
 * page-level Apply can commit it too. Closing the popover any other way discards
 * it.
 *
 * `emptyMeansAll` decides what an empty selection commits as. Vendors fall back
 * to everything, because a vendor filter with nothing in it is meaningless.
 *
 * `minSelected` is a floor the list will not go below. Verticals set it to 1:
 * clearing the last one would empty the whole page, and an empty page is the
 * "No data available" state this prototype is not allowed to reach.
 */
export function MultiSelect({
  id, label, options, applied, staged, onStage, onCommit, open, onToggle,
  showSelectAll, testId, emptyMeansAll = true, minSelected = 0,
}: {
  id: string
  label: string
  options: Option[]
  /** the selection currently driving the page */
  applied: string[]
  /** the selection being edited inside the popover */
  staged: string[]
  onStage: (next: string[]) => void
  onCommit: (next: string[]) => void
  open: boolean
  onToggle: (id: string | null) => void
  showSelectAll?: boolean
  testId?: string
  emptyMeansAll?: boolean
  /** the list will not let you stage fewer than this many options */
  minSelected?: number
}) {
  const values = options.map(o => o.value)
  const same = (a: string[], b: string[]) => a.length === b.length && a.every(v => b.includes(v))
  const allStaged = values.length > 0 && values.every(v => staged.includes(v))
  const dirty = !same(staged, applied)
  const canReset = !same(applied, values) || !same(staged, values)

  /** the last options standing when a floor is set: ticked and not removable */
  const locked = (v: string) =>
    minSelected > 0 && staged.length <= minSelected && staged.includes(v)

  const toggle = (v: string) => {
    if (locked(v)) return
    onStage(staged.includes(v) ? staged.filter(x => x !== v) : [...staged, v])
  }

  return (
    <Popover id={id} label={label} open={open} onToggle={onToggle} testId={testId}>
      {showSelectAll && (
        <label className="opt">
          <input type="checkbox" checked={allStaged} data-testid={`${id}-all`}
                 onChange={() => onStage(allStaged ? values.slice(0, minSelected) : values.slice())} />
          {' '}Select All
        </label>
      )}
      {options.map(o => (
        <label className="opt" key={o.value}>
          <input type="checkbox" className={`${id}Opt`} value={o.value}
                 disabled={locked(o.value)}
                 title={locked(o.value) ? 'At least one must stay selected' : undefined}
                 checked={staged.includes(o.value)} onChange={() => toggle(o.value)} />
          {' '}{o.label}
        </label>
      ))}
      <div className="pop-actions">
        <button type="button" className="btn ghost sm" data-act={`${id}Reset`}
                disabled={!canReset}
                title={canReset ? 'Select every option and apply' : 'Everything is already selected'}
                onClick={() => onCommit(values.slice())}>Reset</button>
        <button type="button" className="btn primary sm" data-act={`${id}Apply`}
                disabled={!dirty}
                title={dirty ? 'Apply this selection' : 'Nothing to apply'}
                onClick={() => onCommit(staged.length || !emptyMeansAll ? staged : values.slice())}>Apply</button>
      </div>
    </Popover>
  )
}
