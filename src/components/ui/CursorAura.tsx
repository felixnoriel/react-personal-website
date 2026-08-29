import { useEffect, useRef } from 'react'

/**
 * CursorAura — a single soft accent halo that follows the cursor.
 *
 * The old comet trail (~55 saturated blurred dots/sec), white-hot head
 * dot, and 280px click rings painted directly OVER the text the reader
 * was looking at — the most reading-hostile effect on the site. One
 * quiet halo keeps the "lit surface" feel with none of the noise.
 * GPU-composited: JS only writes a transform inside rAF-coalesced
 * mousemove. Desktop-only; reduced-motion gets nothing.
 */
export function CursorAura({ className = '' }: { className?: string }) {
  const haloRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    // must agree with the element's `hidden md:block` CSS gate
    if (!window.matchMedia('(min-width: 768px)').matches) return

    const halo = haloRef.current
    if (!halo) return
    let rafId: number | null = null
    let lastX = -9999
    let lastY = -9999
    let visible = false

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        halo.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%)`
        if (!visible) {
          halo.style.opacity = '1'
          visible = true
        }
      })
    }
    const onDocLeave = (e: MouseEvent) => {
      if (e.relatedTarget == null) {
        halo.style.opacity = '0'
        visible = false
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseout', onDocLeave)
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseout', onDocLeave)
    }
  }, [])

  return (
    <div
      ref={haloRef}
      aria-hidden
      className={`cursor-aura-halo fixed top-0 left-0 pointer-events-none hidden md:block z-40 ${className}`}
      style={{ opacity: 0, transform: 'translate3d(-9999px, -9999px, 0)' }}
    />
  )
}
