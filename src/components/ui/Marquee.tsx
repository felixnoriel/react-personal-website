import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  className?: string
  reverse?: boolean
}

/**
 * Marquee — duplicates `children` and translates the pair via the
 * `animate-scroll-x` keyframe (40s linear infinite). Two copies sit
 * side-by-side and the parent's `overflow-hidden` clips, giving an
 * endless seamless scroll.
 *
 * Off-screen pause: there are 7 marquees on the home page. Even though
 * the keyframe is GPU-composited (translateX), each one still wakes
 * the compositor every frame, and below-the-fold ones add scroll cost
 * for no visible payoff. We toggle `animationPlayState: paused` via
 * an IntersectionObserver — when the marquee scrolls out of view, the
 * compositor stops touching it; when it scrolls back in, animation
 * resumes from where it left off.
 */
export function Marquee({ children, className = '', reverse = false }: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(true) // start paused; observer flips to running on intersect

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setPaused(false) // fail-open: keep running if no observer
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setPaused(!e.isIntersecting)
      },
      { rootMargin: '120px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const trackStyle = {
    animationPlayState: paused ? 'paused' : 'running',
    ...(reverse ? { animationDirection: 'reverse' } : {}),
  } as const

  return (
    <div ref={ref} className={`relative flex overflow-hidden ${className}`}>
      <div
        className="flex shrink-0 animate-scroll-x items-center gap-12 pr-12"
        style={trackStyle}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 animate-scroll-x items-center gap-12 pr-12"
        style={trackStyle}
      >
        {children}
      </div>
    </div>
  )
}
