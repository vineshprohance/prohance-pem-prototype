import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Chevron } from '../Icons.tsx'

/** A trigger button with a popover panel. Closes on outside click and Escape. */
export function Popover({ id, label, open, onToggle, wide, children, testId }: {
  id: string
  label: string
  open: boolean
  onToggle: (next: string | null) => void
  wide?: boolean
  children: ReactNode
  testId?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      // the page-level Reset and Apply act on the open popover, so a click on
      // them must not close it out from under their own handler
      if (t.closest?.('[data-keep-pop]')) return
      if (ref.current && !ref.current.contains(t)) onToggle(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onToggle(null) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onToggle])

  return (
    <div className="picker" ref={ref}>
      <button
        type="button"
        className={`pick-btn${wide ? ' wide' : ''}`}
        data-pop={id}
        data-testid={testId}
        aria-expanded={open}
        onClick={() => onToggle(open ? null : id)}
      >
        <span className="cv">{label}</span>
        <Chevron />
      </button>
      <div className={`pop${open ? '' : ' hidden'}${wide ? ' cal' : ''}`} data-popbody={id}>
        {children}
      </div>
    </div>
  )
}

/** The paging header inside a date panel. The arrows disable at the ends of the
 *  data rather than paging into windows that have nothing in them. */
export const PopHead = ({ title, onPrev, onNext, prevDisabled, nextDisabled }: {
  title: string
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
}) => (
  <div className="pop-head">
    <button type="button" className="pop-nav" aria-label="Previous"
            disabled={prevDisabled} onClick={onPrev}>‹</button>
    <span>{title}</span>
    <button type="button" className="pop-nav" aria-label="Next"
            disabled={nextDisabled} onClick={onNext}>›</button>
  </div>
)
