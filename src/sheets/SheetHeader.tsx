import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Monogram } from '../marks'
import './header.css'

/**
 * The sheet header - a slim bar of solid paper on the sheet's top border rule.
 *
 * Solid, never translucent and never blurred: separation comes from one
 * hairline, the way it does on paper. The monogram and the name start on the
 * datum, the five section labels sit at the right in page order, and the
 * Index button opens the sheet index dialog.
 *
 * The bar's bottom hairline is drawn here permanently, which is the
 * correct-looking default everywhere. src/styles/scroll-state.css removes it
 * again, in Chromium only, while the bar is still at rest.
 *
 * On a phone the five labels come off the bar (header.css) and the Index
 * button carries navigation, because five labels, the name and the button
 * cannot share a 56px row at 412px without hiding two of them past the cut.
 *
 * One departure from the spec, and it is deliberate. Section 8.0 says the
 * current-section underline is "driven by :has() with no JS". No CSS-only
 * mechanism reports which section is being read as the page scrolls: :target
 * only fires on a click, and scroll-driven timelines are banned by 7.1. So an
 * IntersectionObserver sets aria-current and CSS still does the drawing - the
 * mark is a colour change on a box that is always there, so nothing moves and
 * the motion budget is untouched.
 */

/** The five sections, in the order they are read down the page. */
const NAV = [
  { label: 'Experience', id: 'sheet-experience' },
  { label: 'Work', id: 'sheet-work' },
  { label: 'Skills', id: 'sheet-parts' },
  { label: 'Writing', id: 'field-notes-writing' },
  { label: 'Contact', id: 'sheet-contact' },
] as const

/* The invoker attributes are plain lowercase HTML that React passes straight
   through; its typings have not caught up with them yet. */
const INVOKE_INDEX = { command: 'show-modal', commandfor: 'sheet-index' } as unknown as Record<string, string>

function openSheetIndex() {
  const dialog = document.getElementById('sheet-index') as HTMLDialogElement | null
  // In a browser that understands invoker commands the dialog is already
  // opening by the time this runs, and showModal() on an open dialog throws.
  if (!dialog || dialog.open) return
  dialog.showModal?.()
}

export function SheetHeader() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [current, setCurrent] = useState<string | null>(null)

  // Which section is being read. Nothing is assumed at build time: the bar
  // renders with no mark until the browser reports what is on screen.
  useEffect(() => {
    if (!onHome || typeof IntersectionObserver === 'undefined') {
      setCurrent(null)
      return
    }
    const targets = NAV.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    const onScreen = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onScreen.set(entry.target.id, entry.isIntersecting)
        // The reading band runs from just under the bar to mid-viewport; the
        // first section in page order that reaches it is the one being read.
        setCurrent(NAV.find((n) => onScreen.get(n.id))?.id ?? null)
      },
      { rootMargin: '-72px 0px -55% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [onHome])

  return (
    <header className="sheet-header">
      <div className="sheet-header__inner">
        <div className="sheet-header__bar">
          <Link to="/" className="sheet-header__brand">
            <Monogram size={20} aria-hidden="true" />
            <span className="sheet-header__word">Felix Noriel</span>
          </Link>

          <nav className="sheet-header__nav" aria-label="Sections">
            <ul className="sheet-header__list">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    className="sheet-header__link"
                    href={onHome ? `#${item.id}` : `/#${item.id}`}
                    aria-current={current === item.id ? 'location' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <button type="button" className="sheet-header__index" onClick={openSheetIndex} {...INVOKE_INDEX}>
            Index
          </button>
        </div>
      </div>
    </header>
  )
}
