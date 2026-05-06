import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

interface BackToTopProps {
  /** Vertical scroll position (in pixels) at which the button appears.
   *  Defaults to 1500 — past the typical hero/header. */
  threshold?: number
  /** Optional extra classes. */
  className?: string
}

/**
 * BackToTop — floating pill in the bottom-right that appears once the
 * user has scrolled past `threshold`. Single click → smooth-scroll to
 * the top of the document. Particularly useful on mobile where detail
 * pages run 7-8k px tall.
 *
 * Sits at z-40 so the site header (z-50) wins; uses
 * `pointer-events: auto` implicitly via being a button, but the
 * surrounding cursor-aura canvas has `pointer-events: none` so clicks
 * land here cleanly.
 */
export function BackToTop({ threshold = 1500, className = '' }: BackToTopProps) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  if (!show) return null
  return (
    <motion.button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll back to top"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6 z-40 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-background/90 backdrop-blur-md text-ink-soft hover:text-ink hover:border-accent/50 shadow-[0_10px_30px_-12px_hsl(var(--ink)/0.4)] font-mono text-[10.5px] tracking-[0.18em] uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${className}`}
    >
      <ArrowUp className="w-3.5 h-3.5 text-accent" />
      <span className="hidden sm:inline">to top</span>
    </motion.button>
  )
}
