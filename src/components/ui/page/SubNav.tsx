import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useScrollSpy } from '../../../hooks/useDetailPage'

export interface SubNavItem {
  /** id of the target section element on the page */
  id: string
  /** label shown in the pill */
  label: string
  /** optional icon, rendered before the label */
  icon?: ReactNode
}

interface SubNavProps {
  items: SubNavItem[]
  /** sticky offset from the top of the viewport (pixels). Default 76 —
   *  matches the site header height (65) + a small gap. */
  stickyTop?: number
  /** unique layoutId for the underline (avoids cross-page bleed if two
   *  SubNavs ever mount briefly during route transitions). */
  underlineLayoutId?: string
}

/**
 * SubNav — sticky pill row that lets visitors jump between major
 * sections of a long detail page. Tracks the active section via
 * IntersectionObserver and animates an accent underline as the user
 * scrolls. Smooth-scrolls + updates the URL hash on click so back-button
 * + share-link work.
 */
export function SubNav({
  items,
  stickyTop = 76,
  underlineLayoutId = 'subnav-underline',
}: SubNavProps) {
  const ids = items.map((it) => it.id)
  const active = useScrollSpy(ids)

  const handleJump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (history.replaceState) history.replaceState(null, '', `#${id}`)
  }

  return (
    <div
      className="sticky z-30 mb-8 -mx-1 md:mx-0"
      style={{ top: stickyTop }}
    >
      <nav
        aria-label="Section navigation"
        className="flex items-center gap-1.5 overflow-x-auto px-1 md:px-1.5 py-1.5 rounded-full border border-border bg-background/85 backdrop-blur-md shadow-[0_8px_30px_-16px_hsl(var(--ink)/0.18)] scrollbar-none"
      >
        {items.map((it) => {
          const isActive = active === it.id
          return (
            <a
              key={it.id}
              href={`#${it.id}`}
              onClick={handleJump(it.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10.5px] tracking-[0.18em] uppercase whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                isActive
                  ? 'bg-accent/12 text-ink'
                  : 'text-ink-soft hover:text-ink hover:bg-surface/70'
              }`}
            >
              {it.icon && (
                <span className={`shrink-0 ${isActive ? 'text-accent' : 'text-accent/70'}`}>
                  {it.icon}
                </span>
              )}
              <span>{it.label}</span>
              {isActive && (
                <motion.span
                  aria-hidden
                  layoutId={underlineLayoutId}
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-accent via-amber to-lime"
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                />
              )}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
