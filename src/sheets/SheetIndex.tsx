import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { CloseMark, ExternalMark } from '../marks'
import { useReducedMotion } from '../hooks/usePointer'
import { SHEET_FIND, clearInk, inkMatches } from './highlightInk'
import './sheet-index.css'

/**
 * The sheet index - what a drawing set puts on its first sheet, and what the
 * old command palette was pretending to be.
 *
 * It is a native <dialog>. The header's Index button opens it with
 * command="show-modal", so the modal, the focus trap, Escape, the top layer
 * and making the page behind inert all come from the platform. The only
 * script here is the Cmd/Ctrl+K shortcut, the filter, the arrow keys, and one
 * observer that notices when the platform opened the dialog for us.
 *
 * The filter does two things at once: it narrows this list, and it inks every
 * matching phrase in the page showing behind the dialog (highlightInk.ts).
 *
 * Nothing is centred: the sheet is pinned to the datum, the same vertical rule
 * every heading on the page starts on.
 */

type Group = 'Navigate' | 'Jump to' | 'Contact'
type Kind = 'route' | 'anchor' | 'mail' | 'link'

type Entry = {
  id: string
  label: string
  /** what the row prints at the end: the route, the anchor, the address, or -
      for an outside link - a readable short form of its destination */
  hint: string
  group: Group
  kind: Kind
  target: string
  /** words a visitor might type for this row, never rendered */
  keywords: string
}

const GROUPS: Group[] = ['Navigate', 'Jump to', 'Contact']

const ENTRIES: Entry[] = [
  { id: 'nav-home', label: 'Home', hint: '/', group: 'Navigate', kind: 'route', target: '/', keywords: 'root index' },
  { id: 'nav-projects', label: 'Projects', hint: '/projects', group: 'Navigate', kind: 'route', target: '/projects', keywords: 'work portfolio case studies' },
  { id: 'nav-career', label: 'Career', hint: '/career', group: 'Navigate', kind: 'route', target: '/career', keywords: 'experience jobs resume' },
  { id: 'nav-about', label: 'About', hint: '/about', group: 'Navigate', kind: 'route', target: '/about', keywords: 'bio me felix' },
  { id: 'nav-blog', label: 'Blog', hint: '/blog', group: 'Navigate', kind: 'route', target: '/blog', keywords: 'writing articles posts' },

  { id: 'jump-experience', label: 'Experience', hint: '#sheet-experience', group: 'Jump to', kind: 'anchor', target: '#sheet-experience', keywords: 'jobs history timeline' },
  { id: 'jump-work', label: 'Selected work', hint: '#sheet-work', group: 'Jump to', kind: 'anchor', target: '#sheet-work', keywords: 'featured stable genopets dashify' },
  { id: 'jump-skills', label: 'Skills', hint: '#sheet-parts', group: 'Jump to', kind: 'anchor', target: '#sheet-parts', keywords: 'tech stack tools parts list' },
  { id: 'jump-writing', label: 'Writing', hint: '#field-notes-writing', group: 'Jump to', kind: 'anchor', target: '#field-notes-writing', keywords: 'field notes dispatches nomad' },
  { id: 'jump-contact', label: 'Contact', hint: '#sheet-contact', group: 'Jump to', kind: 'anchor', target: '#sheet-contact', keywords: 'email reach out get in touch' },

  { id: 'contact-email', label: 'Send an email', hint: 'norielfelixjr@gmail.com', group: 'Contact', kind: 'mail', target: 'mailto:norielfelixjr@gmail.com', keywords: 'hire message hello' },
  { id: 'contact-linkedin', label: 'LinkedIn', hint: 'linkedin.com/in/felixnoriel', group: 'Contact', kind: 'link', target: 'https://www.linkedin.com/in/felixnoriel/', keywords: 'social profile cv' },
  { id: 'contact-github', label: 'GitHub', hint: 'github.com/felixnoriel', group: 'Contact', kind: 'link', target: 'https://github.com/felixnoriel', keywords: 'social code repositories' },
  { id: 'contact-facebook', label: 'Facebook', hint: 'facebook.com/felixnoriel', group: 'Contact', kind: 'link', target: 'https://www.facebook.com/felixnoriel', keywords: 'social' },
  { id: 'contact-instagram', label: 'Instagram', hint: 'instagram.com/felixnoriel', group: 'Contact', kind: 'link', target: 'https://www.instagram.com/felixnoriel/', keywords: 'social photos' },
]

const optionId = (entry: Entry) => `sheet-index-${entry.id}`
const groupId = (group: Group) => `sheet-index-group-${group.replace(/\s+/g, '-').toLowerCase()}`

export function SheetIndex() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  /** a section asked for from another route, scrolled to once home is mounted */
  const pendingJump = useRef<string | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const navigate = useNavigate()
  const { pathname } = useLocation()
  const reduced = useReducedMotion()

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return ENTRIES
    return ENTRIES.filter((entry) => {
      const hay = `${entry.label} ${entry.hint} ${entry.group} ${entry.keywords}`.toLowerCase()
      return tokens.every((token) => hay.includes(token))
    })
  }, [query])

  // Clamped rather than reset in an effect, so the active row is always a real
  // row no matter what the filter just did.
  const activeIndex = Math.min(active, Math.max(filtered.length - 1, 0))
  const activeEntry = filtered[activeIndex]

  const scrollToSection = useCallback(
    (id: string) => {
      let frames = 0
      const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth'
      const tryScroll = () => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior, block: 'start' })
        // the home page is a lazy chunk; give it a few frames to arrive
        else if (frames++ < 30) requestAnimationFrame(tryScroll)
      }
      tryScroll()
    },
    [reduced],
  )

  const activate = useCallback(
    (entry: Entry) => {
      dialogRef.current?.close()
      if (entry.kind === 'route') {
        navigate(entry.target)
      } else if (entry.kind === 'anchor') {
        const id = entry.target.slice(1)
        if (pathname === '/') {
          scrollToSection(id)
        } else {
          pendingJump.current = id
          navigate('/')
        }
      } else if (entry.kind === 'mail') {
        window.location.href = entry.target
      } else {
        window.open(entry.target, '_blank', 'noopener,noreferrer')
      }
    },
    [navigate, pathname, scrollToSection],
  )

  // The dialog can be opened by the header's invoker button without this
  // component hearing about it, so open state is read from the element itself.
  //
  // It is read by watching the `open` attribute rather than by listening for
  // the dialog's `toggle` event: that event is recent on <dialog> and is not
  // Baseline, and where it is missing the filter would never reset, the field
  // would never take focus and the ink behind the sheet would never appear -
  // silently. showModal() and close() both write the attribute, in every
  // engine, so a MutationObserver sees every open and every close.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    let was = false
    const sync = () => {
      const isOpen = dialog.open
      if (isOpen === was) return
      was = isOpen
      setOpen(isOpen)
      if (isOpen) {
        setQuery('')
        setActive(0)
        inputRef.current?.focus()
      }
    }
    const observer = new MutationObserver(sync)
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] })
    // the invoker can fire before this component hydrates
    sync()
    return () => observer.disconnect()
  }, [])

  // The one shortcut. Escape and the focus trap are the platform's.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      const dialog = dialogRef.current
      if (!dialog) return
      event.preventDefault()
      if (dialog.open) dialog.close()
      else dialog.showModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Ink the matches in the page behind the dialog.
  useEffect(() => {
    if (open) inkMatches(SHEET_FIND, query, document.getElementById('main'))
    else clearInk(SHEET_FIND)
  }, [open, query])

  useEffect(() => () => clearInk(SHEET_FIND), [])

  useEffect(() => {
    const id = pendingJump.current
    if (!id || pathname !== '/') return
    pendingJump.current = null
    scrollToSection(id)
  }, [pathname, scrollToSection])

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(activeIndex + 1 >= filtered.length ? 0 : activeIndex + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(activeIndex - 1 < 0 ? filtered.length - 1 : activeIndex - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActive(filtered.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (activeEntry) activate(activeEntry)
    }
  }

  return (
    <dialog id="sheet-index" className="sheet-index" ref={dialogRef} aria-labelledby="sheet-index-title">
      <div className="sheet-index__head">
        <p className="meta meta--head" id="sheet-index-title">
          Index
        </p>
        <button
          type="button"
          className="sheet-index__close"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close the index"
        >
          <CloseMark />
        </button>
      </div>

      <search className="sheet-index__search">
        <label className="visually-hidden" htmlFor="sheet-index-filter">
          Filter the index
        </label>
        <input
          id="sheet-index-filter"
          ref={inputRef}
          className="sheet-index__input"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onInputKeyDown}
          role="combobox"
          /* the list below is rendered for as long as the sheet is open, so
             this is not a popup that collapses */
          aria-expanded
          aria-controls="sheet-index-list"
          aria-activedescendant={activeEntry ? optionId(activeEntry) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Type to filter"
        />
      </search>

      <div className="sheet-index__list" id="sheet-index-list" role="listbox" aria-label="Sheets and destinations">
        {GROUPS.map((group) => {
          const rows = filtered.filter((entry) => entry.group === group)
          if (rows.length === 0) return null
          return (
            <div className="sheet-index__group" key={group} role="group" aria-labelledby={groupId(group)}>
              <p className="meta meta--head sheet-index__group-head" id={groupId(group)}>
                {group}
              </p>
              {rows.map((entry) => {
                const index = filtered.indexOf(entry)
                const isActive = index === activeIndex
                return (
                  <div
                    key={entry.id}
                    id={optionId(entry)}
                    role="option"
                    aria-selected={isActive}
                    className={isActive ? 'sheet-index__row is-active' : 'sheet-index__row'}
                    onClick={() => activate(entry)}
                    onMouseEnter={() => setActive(index)}
                  >
                    <span className="sheet-index__label">{entry.label}</span>
                    {entry.kind === 'link' && <span className="visually-hidden">opens in a new tab</span>}
                    <span className="leader" aria-hidden="true" />
                    <span className="meta meta--pen sheet-index__hint">{entry.hint}</span>
                    {entry.kind === 'link' && <ExternalMark size={12} className="sheet-index__ext" />}
                  </div>
                )
              })}
            </div>
          )
        })}
        {filtered.length === 0 && <p className="meta sheet-index__empty">Nothing in the index matches that.</p>}
      </div>

      <p className="meta sheet-index__legend">Arrow keys to move, Enter to open, Escape to close.</p>
    </dialog>
  )
}
