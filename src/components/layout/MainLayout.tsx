import { useEffect, useRef } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from '../ui/page/BackToTop'
import { CursorAura } from '../ui/CursorAura'
import { ScrollProgress } from '../ui/ScrollProgress'

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Site-wide `g g` (vim-style) keyboard shortcut → smooth-scroll to top.
 * Skipped while focus is in a form field, when modifier keys are held,
 * and while the lightbox is open. Detail-page `useKeyboardNav` instances
 * also bind `gg`, but they share the same target action so a redundant
 * fire is harmless.
 */
function useGlobalScrollToTop() {
  const lastG = useRef<number>(0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'g' && e.key !== 'G') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return
      if (document.querySelector('.yarl__root')) return
      const now = performance.now()
      if (now - lastG.current < 500) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        lastG.current = 0
      } else {
        lastG.current = now
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function MainLayout({ children }: MainLayoutProps) {
  useGlobalScrollToTop()
  return (
    <div id="main-wrapper" className="min-h-screen flex flex-col">
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Site-wide cursor aura — comet trail + click shockwaves + soft halo.
          Fixed-position canvas above content (z-40, below header z-50),
          pointer-events: none. Desktop-only; idle-skip handles the
          common no-cursor-activity case at near-zero CPU cost. */}
      <CursorAura />
      {/* Site-wide floating "back to top" pill. Has its own scroll-tracker
          + 1500px threshold so short pages stay clean and only long-scroll
          pages (Home, Blog list, detail pages) actually surface it. */}
      <BackToTop />
    </div>
  )
}
