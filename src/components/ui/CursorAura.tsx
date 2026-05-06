import { useEffect, useRef } from 'react'

interface CursorAuraProps {
  className?: string
}

/**
 * CursorAura — pure-CSS desktop cursor effect, site-wide.
 *
 * Two effects, both implemented with the GPU compositor only — there is
 * NO per-frame JavaScript draw work, NO rAF loop, NO canvas:
 *
 *   1. Soft halo: a single fixed `<div>` with a static radial-gradient
 *      background. Position updates via `transform: translate3d()`,
 *      written in an rAF-coalesced mousemove handler. The browser
 *      handles the translation entirely on the compositor — no
 *      rasterization, no layout, no paint.
 *
 *   2. Click pulse: each mousedown injects a tiny `<div>` at the click
 *      coordinates. CSS `@keyframes` animation expands + fades it over
 *      600ms; once the animation ends, the element removes itself via
 *      `animationend` (or a 700ms cleanup timeout as a fallback). All
 *      animation work happens on the compositor; the main thread does
 *      one DOM insertion + one removal per click.
 *
 * Total main-thread cost per click: ~one `document.createElement` +
 * `appendChild`. Total main-thread cost per cursor frame: one
 * `style.transform` write inside an rAF (compositor handles the rest).
 *
 * Skipped on mobile (touch has no hover cursor) and on prefers-reduced-motion.
 *
 * Earlier iterations were canvas-based with a per-frame rAF + chromatic
 * trail + multi-stroke ripples — they were beautiful but they had a
 * fixed main-thread cost that competed with the page's other animations
 * and produced perceptible click hangs. This rewrite trades the
 * rainbow-comet trail for reliability: no trail, no per-frame JS work.
 */
export function CursorAura({ className = '' }: CursorAuraProps) {
  const haloRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    if (!window.matchMedia('(min-width: 768px)').matches) return

    const halo = haloRef.current
    if (!halo) return

    // ── Halo: GPU-translate-only position update ────────────────────────
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
        // translate3d hints at GPU compositing.
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

    // ── Click pulse: CSS keyframes on injected <div> ───────────────────
    const onDown = (e: MouseEvent) => {
      const ring = document.createElement('div')
      ring.className = 'cursor-aura-pulse'
      ring.style.left = `${e.clientX}px`
      ring.style.top = `${e.clientY}px`
      const cleanup = () => ring.remove()
      ring.addEventListener('animationend', cleanup, { once: true })
      // Belt-and-suspenders: if animationend never fires (e.g. tab
      // backgrounded mid-animation), still clean up the node.
      window.setTimeout(cleanup, 700)
      document.body.appendChild(ring)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown, { passive: true })
    document.documentElement.addEventListener('mouseout', onDocLeave)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
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
